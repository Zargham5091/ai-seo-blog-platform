// app/api/site/dashboard/route.ts
//
// COMPLETE REPLACEMENT of existing site-dashboard-route.ts
// Adds: form submissions in GET response, import of FormSubmissionModel

import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {connectDB} from '@/lib/db';
import UserSiteModel from '@/models/UserSite';
import ProductModel from '@/models/Product';
import OrderModel from '@/models/Order';
import FormSubmissionModel from '@/models/FormSubmission';

// ─────────────────────────────────────────────────────────────────────────────
// GET — dashboard overview
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        await connectDB();
        const userId = session.user.id;

        const site = await UserSiteModel.findOne({userId}).lean();
        if (!site) return NextResponse.json({success: false, error: 'Site not found'}, {status: 404});

        const isEcommerce = site.siteType === 'ecommerce';

        const [productCount, orderStats, recentOrders, recentSubmissions, unreadCount] = await Promise.all([
            isEcommerce ? ProductModel.countDocuments({userId, isActive: true}) : Promise.resolve(0),
            isEcommerce ? OrderModel.aggregate([
                {$match: {userId: site.userId}},
                {
                    $group: {
                        _id: null,
                        total: {$sum: 1},
                        revenue: {$sum: {$cond: [{$in: ['$status', ['confirmed', 'processing', 'shipped', 'delivered']]}, '$total', 0]}},
                        pending: {$sum: {$cond: [{$eq: ['$status', 'pending']}, 1, 0]}},
                    }
                },
            ]) : Promise.resolve([]),
            isEcommerce ? OrderModel.find({userId}).sort({createdAt: -1}).limit(10).lean() : Promise.resolve([]),
            FormSubmissionModel.find({userId}).sort({createdAt: -1}).limit(20).lean(),
            FormSubmissionModel.countDocuments({userId, isRead: false}),
        ]);

        const stats = orderStats[0] ?? {total: 0, revenue: 0, pending: 0};

        return NextResponse.json({
            success: true,
            data: {
                site: {
                    siteName: site.siteName,
                    siteType: site.siteType,
                    isPublished: site.isPublished,
                    publishedAt: site.publishedAt,
                    lastBuiltAt: site.lastBuiltAt,
                },
                submissions: {
                    recent: recentSubmissions,
                    unreadCount,
                },
                ecommerce: isEcommerce ? {
                    productCount,
                    orderTotal: stats.total,
                    orderPending: stats.pending,
                    revenue: stats.revenue,
                    recentOrders,
                } : null,
            },
        });
    } catch (err) {
        console.error('[SITE_DASHBOARD_GET]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — create product
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        const body = await req.json();
        const {action} = body as { action: string };

        await connectDB();

        if (action === 'create_product') {
            const {
                name,
                description,
                price,
                comparePrice,
                currency,
                images,
                category,
                tags,
                variants,
                sku,
                stock
            } = body;
            if (!name || price === undefined) {
                return NextResponse.json({success: false, error: 'name and price are required'}, {status: 400});
            }
            const product = await ProductModel.create({
                userId: session.user.id,
                name: String(name).trim().slice(0, 200),
                description: description ? String(description).slice(0, 2000) : undefined,
                price: Number(price),
                comparePrice: comparePrice ? Number(comparePrice) : undefined,
                currency: currency ?? 'USD',
                images: Array.isArray(images) ? images.slice(0, 10) : [],
                category: category ? String(category).slice(0, 100) : undefined,
                tags: Array.isArray(tags) ? tags.slice(0, 20) : [],
                variants: Array.isArray(variants) ? variants.slice(0, 10) : [],
                sku: sku ? String(sku).slice(0, 100) : undefined,
                stock: stock !== undefined ? Number(stock) : -1,
            });
            return NextResponse.json({success: true, data: product}, {status: 201});
        }

        if (action === 'mark_read') {
            const {submissionId} = body as { submissionId?: string };
            if (submissionId) {
                await FormSubmissionModel.findOneAndUpdate(
                    {_id: submissionId, userId: session.user.id},
                    {$set: {isRead: true}}
                );
            } else {
                // Mark all as read
                await FormSubmissionModel.updateMany({userId: session.user.id, isRead: false}, {$set: {isRead: true}});
            }
            return NextResponse.json({success: true});
        }

        return NextResponse.json({success: false, error: 'Unknown action'}, {status: 400});
    } catch (err) {
        console.error('[SITE_DASHBOARD_POST]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH — update product or order status
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        const body = await req.json();
        const {action} = body as { action: string };

        await connectDB();

        if (action === 'update_product') {
            const {productId, ...fields} = body;
            if (!productId) return NextResponse.json({success: false, error: 'productId required'}, {status: 400});
            const allowed: Record<string, unknown> = {};
            const allowedFields = ['name', 'description', 'price', 'comparePrice', 'images', 'category', 'tags', 'variants', 'sku', 'stock', 'isActive', 'isFeatured'];
            for (const f of allowedFields) if (fields[f] !== undefined) allowed[f] = fields[f];
            const product = await ProductModel.findOneAndUpdate(
                {_id: productId, userId: session.user.id},
                {$set: allowed},
                {new: true}
            );
            if (!product) return NextResponse.json({success: false, error: 'Product not found'}, {status: 404});
            return NextResponse.json({success: true, data: product});
        }

        if (action === 'update_order_status') {
            const {orderId, status} = body as { orderId: string; status: string };
            const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
            if (!orderId || !validStatuses.includes(status)) {
                return NextResponse.json({success: false, error: 'Invalid orderId or status'}, {status: 400});
            }
            const order = await OrderModel.findOneAndUpdate(
                {_id: orderId, userId: session.user.id},
                {$set: {status, ...(status === 'shipped' ? {shippedAt: new Date()} : {})}},
                {new: true}
            );
            if (!order) return NextResponse.json({success: false, error: 'Order not found'}, {status: 404});
            return NextResponse.json({success: true, data: order});
        }

        return NextResponse.json({success: false, error: 'Unknown action'}, {status: 400});
    } catch (err) {
        console.error('[SITE_DASHBOARD_PATCH]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — delete product
// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        const {productId} = await req.json() as { productId?: string };
        if (!productId) return NextResponse.json({success: false, error: 'productId required'}, {status: 400});

        await connectDB();
        const deleted = await ProductModel.findOneAndDelete({_id: productId, userId: session.user.id});
        if (!deleted) return NextResponse.json({success: false, error: 'Product not found'}, {status: 404});

        return NextResponse.json({success: true});
    } catch (err) {
        console.error('[SITE_DASHBOARD_DELETE]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}