// app/api/assets/unsplash/route.ts
//
// GET /api/assets/unsplash?q=query&page=1
// Returns: { success: true, results: UnsplashPhoto[], hasMore: boolean }
//
// Proxies Unsplash API calls server-side to keep the API key secret.
// Add UNSPLASH_ACCESS_KEY to your .env file.
// Get a free key at https://unsplash.com/developers (free tier: 50 req/hr)

import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';

const PER_PAGE = 12;

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
        }

        const {searchParams} = new URL(req.url);
        const query = searchParams.get('q')?.trim();
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

        if (!query) {
            return NextResponse.json({success: false, error: 'Query required'}, {status: 400});
        }

        const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        if (!accessKey) {
            // Graceful degradation — return empty rather than crash
            console.warn('[UNSPLASH] UNSPLASH_ACCESS_KEY not set');
            return NextResponse.json({success: true, results: [], hasMore: false});
        }

        const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${PER_PAGE}&orientation=landscape`;

        const res = await fetch(apiUrl, {
            headers: {Authorization: `Client-ID ${accessKey}`},
            next: {revalidate: 3600}, // cache for 1 hour
        });

        if (!res.ok) {
            if (res.status === 403) {
                return NextResponse.json({
                    success: false,
                    error: 'Unsplash rate limit reached. Try again later.'
                }, {status: 429});
            }
            throw new Error(`Unsplash API error: ${res.status}`);
        }

        const data = await res.json() as {
            results: Array<{
                id: string;
                urls: { small: string; regular: string; full: string };
                alt_description: string | null;
                user: { name: string; links: { html: string } };
            }>;
            total_pages: number;
        };

        return NextResponse.json({
            success: true,
            results: data.results ?? [],
            hasMore: page < (data.total_pages ?? 1),
        });
    } catch (err) {
        console.error('[UNSPLASH]', err);
        return NextResponse.json({success: false, error: 'Image search failed'}, {status: 500});
    }
}