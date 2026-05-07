// app/api/site/checkout/route.ts
//
// POST /api/site/checkout
// Public endpoint — called from published ecommerce site to start Stripe checkout.
// Body: { siteId, items: [{ productId, quantity, variant? }], customer: { name, email } }
// Returns: { success: true, checkoutUrl: string }

import {NextRequest, NextResponse} from 'next/server';
import {connectDB} from '@/lib/db';
import UserSiteModel from '@/models/UserSite';
import ProductModel from '@/models/Product';
import OrderModel from '@/models/Order';
import {stripe} from '@/services/stripe';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            siteId?: string;
            items?: Array<{ productId: string; quantity: number; variant?: string }>;
            customer?: { name?: string; email?: string };
            successUrl?: string;
            cancelUrl?: string;
        };

        const {siteId, items, customer, successUrl, cancelUrl} = body;

        if (!siteId || !items?.length || !customer?.name || !customer?.email) {
            return NextResponse.json({
                success: false,
                error: 'siteId, items, customer name and email are required'
            }, {status: 400});
        }

        await connectDB();

        // Verify site
        const site = await UserSiteModel.findById(siteId).select('userId siteName isPublished siteType').lean();
        if (!site?.isPublished || site.siteType !== 'ecommerce') {
            return NextResponse.json({success: false, error: 'Site not found or not an ecommerce site'}, {status: 404});
        }

        // Fetch and validate products
        const productIds = items.map(i => i.productId);
        const products = await ProductModel.find({
            _id: {$in: productIds},
            userId: site.userId,
            isActive: true,
        }).lean();

        const productMap = new Map(products.map(p => [String(p._id), p]));

        const lineItems: {
            price_data: {
                currency: string;
                product_data: { name: string; images?: string[] };
                unit_amount: number;
            };
            quantity: number;
        }[] = [];

        const orderItems: Array<{
            productId: unknown;
            productName: string;
            price: number;
            quantity: number;
            variant?: string;
            image?: string;
        }> = [];

        let subtotal = 0;

        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                return NextResponse.json({
                    success: false,
                    error: `Product not found: ${item.productId}`
                }, {status: 400});
            }
            if (product.stock !== -1 && product.stock < item.quantity) {
                return NextResponse.json({
                    success: false,
                    error: `Insufficient stock for ${product.name}`
                }, {status: 400});
            }

            const qty = Math.max(1, Math.floor(item.quantity));
            // Stripe expects amount in smallest currency unit (cents for USD)
            // Your product.price is already stored in cents — if you store in dollars, multiply by 100
            const unitAmount = product.price;

            lineItems.push({
                price_data: {
                    currency: (product.currency ?? 'USD').toLowerCase(),
                    product_data: {
                        name: item.variant ? `${product.name} (${item.variant})` : product.name,
                        ...(product.images?.[0] ? {images: [product.images[0]]} : {}),
                    },
                    unit_amount: unitAmount,
                },
                quantity: qty,
            });

            orderItems.push({
                productId: product._id,
                productName: product.name,
                price: unitAmount,
                quantity: qty,
                variant: item.variant,
                image: product.images?.[0],
            });

            subtotal += unitAmount * qty;
        }

        // Create a pending order in DB first — we'll mark it paid in the webhook
        const order = await OrderModel.create({
            userId: site.userId,
            channel: 'stripe',
            status: 'pending',
            items: orderItems,
            subtotal,
            total: subtotal,
            currency: products[0]?.currency ?? 'USD',
            customer: {
                name: customer.name.trim().slice(0, 200),
                email: customer.email.trim().toLowerCase(),
            },
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            customer_email: customer.email,
            line_items: lineItems,
            metadata: {
                orderId: String(order._id),
                siteId: String(siteId),
                siteUserId: String(site.userId),
            },
            success_url: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/order-success?order=${order.orderNumber}`,
            cancel_url: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/shop`,
        });

        // Store session ID on order for webhook lookup
        await OrderModel.findByIdAndUpdate(order._id, {stripeSessionId: session.id});

        return NextResponse.json({success: true, checkoutUrl: session.url});
    } catch (err) {
        console.error('[CHECKOUT]', err);
        return NextResponse.json({success: false, error: 'Checkout failed'}, {status: 500});
    }
}