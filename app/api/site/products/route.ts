// app/api/site/products/route.ts
// GET /api/site/products — list all products for the logged-in user's site

import {NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {connectDB} from '@/lib/db';
import ProductModel from '@/models/Product';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});

        await connectDB();
        const products = await ProductModel
            .find({userId: session.user.id})
            .sort({createdAt: -1})
            .lean();

        return NextResponse.json({success: true, data: products});
    } catch (err) {
        console.error('[PRODUCTS_GET]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}