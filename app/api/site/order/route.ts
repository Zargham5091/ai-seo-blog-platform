// app/api/site/order/route.ts
//
// POST /api/site/order
// Public endpoint — called from published ecommerce site components.
// No auth. Handles Phase 1 orders (WhatsApp-initiated + email notification).
//
// Body: {
//   siteId: string,
//   channel: 'whatsapp' | 'email' | 'manual',
//   customer: { name, email?, phone? },
//   items: [{ productId, productName, price, quantity, variant? }],
//   notes?: string
// }
// Returns: { success: true, orderNumber: string }

import {NextRequest, NextResponse} from 'next/server';
import {connectDB} from '@/lib/db';
import UserSiteModel from '@/models/UserSite';
import ProductModel from '@/models/Product';
import OrderModel from '@/models/Order';
import {sendOrderNotificationEmail, sendOrderConfirmationEmail} from '@/services/email';

// Same in-memory rate limiter pattern as contact route
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetAt) {
        rateLimitMap.set(ip, {count: 1, resetAt: now + RATE_WINDOW});
        return true;
    }
    if (record.count >= RATE_LIMIT) return false;
    record.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json({success: false, error: 'Too many requests'}, {status: 429});
        }

        const body = await req.json() as {
            siteId?: string;
            channel?: string;
            customer?: { name?: string; email?: string; phone?: string; address?: string };
            items?: Array<{
                productId: string;
                productName: string;
                price: number;
                quantity: number;
                variant?: string
            }>;
            notes?: string;
        };

        const {siteId, channel = 'manual', customer, items, notes} = body;

        // ── Validation ──────────────────────────────────────────────────────────
        if (!siteId) return NextResponse.json({success: false, error: 'siteId required'}, {status: 400});
        if (!customer?.name?.trim()) return NextResponse.json({
            success: false,
            error: 'Customer name required'
        }, {status: 400});
        if (!Array.isArray(items) || items.length === 0) return NextResponse.json({
            success: false,
            error: 'At least one item required'
        }, {status: 400});

        const validChannels = ['whatsapp', 'email', 'manual'];
        if (!validChannels.includes(channel)) return NextResponse.json({
            success: false,
            error: 'Invalid channel'
        }, {status: 400});

        await connectDB();

        // ── Verify site exists and is published ─────────────────────────────────
        const site = await UserSiteModel.findById(siteId).select('userId siteName isPublished siteType').lean();
        if (!site || !site.isPublished) {
            return NextResponse.json({success: false, error: 'Site not found'}, {status: 404});
        }
        if (site.siteType !== 'ecommerce') {
            return NextResponse.json({success: false, error: 'This site does not accept orders'}, {status: 400});
        }

        // ── Validate items + check stock ────────────────────────────────────────
        const productIds = items.map(i => i.productId).filter(Boolean);
        const products = await ProductModel.find({
            _id: {$in: productIds},
            userId: site.userId,
            isActive: true,
        }).lean();

        const productMap = new Map(products.map(p => [String(p._id), p]));

        const validatedItems: Array<{
            productId: unknown; productName: string; price: number;
            quantity: number; variant?: string; image?: string;
        }> = [];
        let subtotal = 0;

        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                return NextResponse.json({
                    success: false,
                    error: `Product not found: ${item.productName}`
                }, {status: 400});
            }
            if (product.stock !== -1 && product.stock < item.quantity) {
                return NextResponse.json({
                    success: false,
                    error: `Insufficient stock for ${product.name}`
                }, {status: 400});
            }

            const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
            const price = product.price; // always use DB price, not client-submitted

            validatedItems.push({
                productId: product._id,
                productName: product.name,
                price,
                quantity: qty,
                variant: item.variant ? String(item.variant).slice(0, 100) : undefined,
                image: product.images?.[0],
            });
            subtotal += price * qty;
        }

        const total = subtotal; // Phase 1: no tax/shipping calculation

        // ── Create order ────────────────────────────────────────────────────────
        const order = await OrderModel.create({
            userId: site.userId,
            channel,
            status: 'pending',
            items: validatedItems,
            subtotal,
            total,
            currency: products[0]?.currency ?? 'USD',
            customer: {
                name: String(customer.name).trim().slice(0, 200),
                email: customer.email ? String(customer.email).trim().toLowerCase() : undefined,
                phone: customer.phone ? String(customer.phone).trim().slice(0, 30) : undefined,
                address: customer.address ? String(customer.address).trim().slice(0, 500) : undefined,
            },
            notes: notes ? String(notes).trim().slice(0, 1000) : undefined,
        });

        // ── Decrement stock (non-unlimited products) ────────────────────────────
        for (const item of validatedItems) {
            const product = productMap.get(String(item.productId));
            if (product && product.stock !== -1) {
                await ProductModel.findByIdAndUpdate(item.productId, {
                    $inc: {stock: -item.quantity},
                });
            }
        }

        // ── Send notifications (best-effort) ───────────────────────────────────
        try {
            await sendOrderNotificationEmail(site.userId.toString(), site.siteName as string, order);
        } catch (e) {
            console.error('[ORDER] Owner notification failed (non-fatal):', e);
        }

        if (customer.email) {
            try {
                await sendOrderConfirmationEmail(customer.email, customer.name!, order);
            } catch (e) {
                console.error('[ORDER] Customer confirmation failed (non-fatal):', e);
            }
        }

        return NextResponse.json({
            success: true,
            orderNumber: order.orderNumber,
        }, {status: 201});

    } catch (err) {
        console.error('[ORDER]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}