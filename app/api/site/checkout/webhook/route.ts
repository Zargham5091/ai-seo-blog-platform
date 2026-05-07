// app/api/site/checkout/webhook/route.ts
//
// POST /api/site/checkout/webhook
// Stripe webhook — processes payment confirmation for ecommerce orders.
// Add this URL in your Stripe dashboard → Webhooks.
// Event: checkout.session.completed

import {NextRequest, NextResponse} from 'next/server';
import {connectDB} from '@/lib/db';
import OrderModel from '@/models/Order';
import ProductModel from '@/models/Product';
import {constructWebhookEvent} from '@/services/stripe';
import {sendOrderNotificationEmail, sendOrderConfirmationEmail} from '@/services/email';

export const config = {api: {bodyParser: false}};

export async function POST(req: NextRequest) {
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        return NextResponse.json({error: 'Missing stripe-signature header'}, {status: 400});
    }

    let event;
    try {
        const body = Buffer.from(await req.arrayBuffer());
        event = constructWebhookEvent(body, sig);
    } catch (err) {
        console.error('[WEBHOOK] Signature verification failed:', err);
        return NextResponse.json({error: 'Invalid signature'}, {status: 400});
    }

    if (event.type !== 'checkout.session.completed') {
        // Acknowledge other events without processing
        return NextResponse.json({received: true});
    }

    const session = event.data.object as {
        id: string;
        metadata?: { orderId?: string; siteUserId?: string; siteId?: string };
        payment_intent?: string;
        customer_details?: { email?: string; name?: string };
        amount_total?: number;
    };

    const orderId = session.metadata?.orderId;
    const siteUserId = session.metadata?.siteUserId;

    if (!orderId || !siteUserId) {
        console.error('[WEBHOOK] Missing metadata on session:', session.id);
        return NextResponse.json({received: true});
    }

    try {
        await connectDB();

        // Mark order as paid
        const order = await OrderModel.findByIdAndUpdate(
            orderId,
            {
                $set: {
                    status: 'confirmed',
                    paidAt: new Date(),
                    stripePaymentIntentId: session.payment_intent ?? undefined,
                },
            },
            {new: true}
        );

        if (!order) {
            console.error('[WEBHOOK] Order not found:', orderId);
            return NextResponse.json({received: true});
        }

        // Decrement stock for each item
        for (const item of order.items) {
            const product = await ProductModel.findById(item.productId).select('stock').lean();
            if (product && product.stock !== -1) {
                await ProductModel.findByIdAndUpdate(item.productId, {
                    $inc: {stock: -item.quantity},
                });
            }
        }

        // Send notifications (best-effort)
        const siteName = 'Your Store'; // Could fetch from UserSite but keeping it simple
        try {
            await sendOrderNotificationEmail(siteUserId, siteName, order);
        } catch (e) {
            console.error('[WEBHOOK] Owner notification failed:', e);
        }

        if (order.customer.email) {
            try {
                await sendOrderConfirmationEmail(order.customer.email, order.customer.name, order);
            } catch (e) {
                console.error('[WEBHOOK] Customer confirmation failed:', e);
            }
        }

        return NextResponse.json({received: true});
    } catch (err) {
        console.error('[WEBHOOK] Processing error:', err);
        // Return 200 so Stripe doesn't keep retrying for our internal errors
        return NextResponse.json({received: true});
    }
}