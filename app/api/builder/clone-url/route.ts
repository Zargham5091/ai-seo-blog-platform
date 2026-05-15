// app/api/builder/clone-url/route.ts
//
// POST /api/builder/clone-url
// Body: { url: string }
// Returns: { success: true, data: AIComponent[], siteName: string, favicon?: string }
//
// Fetches the target URL, extracts text structure (headings, CTAs, sections),
// then asks AI to map that structure to components from the library.
// Does NOT copy images or CSS — recreates the structure with your own components.
require('dns').setDefaultResultOrder('ipv4first');

import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {connectDB} from '@/lib/db';
import PlanComponentModel from '@/models/PlanComponent';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function isValidUrl(s: string): boolean {
    try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

// Extract meaningful text content from raw HTML — no external parser needed.
function extractPageContent(html: string): string {
    // Remove scripts, styles, nav, footer boilerplate
    const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Return first 3000 chars — enough for structure without burning tokens
    return cleaned.slice(0, 3000);
}

function extractFavicon(html: string, baseUrl: string): string | null {
    const match = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
        ?? html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
    if (!match) return null;
    try {
        return new URL(match[1], baseUrl).toString();
    } catch {
        return null;
    }
}

function extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].replace(/ [-|–] .*$/, '').trim() : 'Cloned Site';
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
        }

        const {url} = await req.json() as { url?: string };

        if (!url || !isValidUrl(url)) {
            return NextResponse.json({success: false, error: 'Invalid URL'}, {status: 400});
        }

        // ── 1. Fetch target page ────────────────────────────────────────────────
        let html: string;
        // try {
        //     const fetchRes = await fetch(url, {
        //         headers: {
        //             'User-Agent': 'Mozilla/5.0 (compatible; SiteCraftBot/1.0)',
        //             Accept: 'text/html',
        //         },
        //         signal: AbortSignal.timeout(8000),
        //     });
        //     if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
        //     html = await fetchRes.text();
        // } catch (err) {
        //     return NextResponse.json(
        //         {
        //             success: false,
        //             error: `Could not fetch that URL: ${err instanceof Error ? err.message : 'Network error'}`
        //         },
        //         {status: 422}
        //     );
        // }
        try {
            console.log(`[CLONE_URL] Fetching: ${url}`);
            const fetchRes = await fetch(url, {
                headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'},
                signal: AbortSignal.timeout(15000), // increase timeout
            });
            if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
            html = await fetchRes.text();
        } catch (err) {
            console.error('[FETCH ERROR]', err);   // 👈 see full error in terminal
            return NextResponse.json(
                {success: false, error: `Could not fetch that URL: ${err.message || 'Network error'}`},
                {status: 422}
            );
        }

        const pageText = extractPageContent(html);
        const siteName = extractTitle(html);
        const favicon = extractFavicon(html, url);

        if (!pageText || pageText.length < 50) {
            return NextResponse.json(
                {success: false, error: 'Could not extract meaningful content from that page.'},
                {status: 422}
            );
        }

        // ── 2. Fetch available components ───────────────────────────────────────
        await connectDB();
        const components = await PlanComponentModel.find({
            availableTo: {$in: [session.user.plan ?? 'free', 'free']},
            isActive: true,
        }).select('key name category description defaultProps').lean();

        const componentList = components
            .map(c => `- key:"${c.key}" [${c.category}] "${c.name}"`)
            .join('\n');

        // ── 3. Ask Cloudflare AI to map content → components ───────────────────
        const systemPrompt = `You are a website structure analyzer. Given the text content of a website, select the best matching components from the library to recreate that site's structure.

COMPONENT LIBRARY:
${componentList}

RULES:
1. Return ONLY valid JSON — no markdown, no backticks
2. Select 5-10 components in logical page order (navbar first, footer last)
3. Use EXACT key values from the library
4. Fill propValues with real content extracted from the page text — actual headlines, descriptions, CTAs
5. Keep text concise and professional

RESPONSE FORMAT:
{"components":[{"componentKey":"exact_key","propValues":{"headline":"Real text from page","description":"Real text"}}]}`;

        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [
                        {role: 'system', content: systemPrompt},
                        {role: 'user', content: `Recreate this website structure:\n\n${pageText}`},
                    ],
                    max_tokens: 2000,
                    temperature: 0.1,
                }),
            }
        );

        if (!cfRes.ok) {
            return NextResponse.json({success: false, error: 'AI service unavailable'}, {status: 503});
        }

        const cfData = await cfRes.json() as { result?: { response?: string } };
        const rawText = cfData?.result?.response ?? '';

        let parsed: { components: { componentKey: string; propValues: Record<string, unknown> }[] };
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON');
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            return NextResponse.json({
                success: false,
                error: 'AI returned malformed response. Try again.'
            }, {status: 422});
        }

        // ── 4. Validate + merge defaultProps ───────────────────────────────────
        const validKeys = new Map(components.map(c => [c.key, c]));
        const result = (parsed.components ?? [])
            .filter(c => validKeys.has(c.componentKey))
            .map(aiComp => {
                const dbComp = validKeys.get(aiComp.componentKey)!;
                return {
                    componentKey: aiComp.componentKey,
                    componentId: (dbComp as { _id: unknown })._id,
                    propValues: {...(dbComp.defaultProps ?? {}), ...aiComp.propValues},
                };
            });

        if (result.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'AI could not match any components to this page.'
            }, {status: 422});
        }

        return NextResponse.json({success: true, data: result, siteName, favicon});
    } catch (err) {
        console.error('[CLONE_URL]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}