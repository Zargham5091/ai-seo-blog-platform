// app/api/site/vibe-check/route.ts
//
// POST /api/site/vibe-check
// Body: { description: string, siteType: string }
// Returns: { success: true, suggestion: { vibe, palette, reason } }
//
// Calls Cloudflare Workers AI to map an audience description to
// a vibe + palette pair. The client then calls /api/site/personality
// to actually apply the theme — this route only returns the suggestion.

import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';

const VALID_VIBES = ['bold', 'minimal', 'playful', 'professional', 'creative', 'warm'];
const VALID_PALETTES = ['indigo', 'rose', 'emerald', 'amber', 'sky', 'violet', 'slate', 'pink'];

const SYSTEM_PROMPT = `You are a brand design expert. Given a description of a target audience and site type, select the best visual vibe and color palette for their website.

AVAILABLE VIBES: bold, minimal, playful, professional, creative, warm
AVAILABLE PALETTES: indigo, rose, emerald, amber, sky, violet, slate, pink

Rules:
- Return ONLY valid JSON, no markdown, no explanation outside JSON
- vibe and palette must be exact values from the lists above
- reason must be 1-2 sentences explaining why this choice fits the audience
- Be specific and confident

Response format:
{"vibe":"<vibe>","palette":"<palette>","reason":"<reason>"}`;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
        }

        const {description, siteType} = await req.json() as {
            description?: string;
            siteType?: string;
        };

        if (!description?.trim() || description.trim().length < 10) {
            return NextResponse.json(
                {success: false, error: 'Please provide a description of at least 10 characters'},
                {status: 400}
            );
        }

        const prompt = `Audience: "${description.trim()}"\nSite type: ${siteType ?? 'general'}\n\nSelect the best vibe and palette.`;

        // Call Cloudflare Workers AI
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
                        {role: 'system', content: SYSTEM_PROMPT},
                        {role: 'user', content: prompt},
                    ],
                    max_tokens: 200,
                    temperature: 0.4,
                }),
                signal: AbortSignal.timeout(15_000),
            }
        );

        if (!cfRes.ok) {
            return NextResponse.json({success: false, error: 'AI service unavailable'}, {status: 503});
        }

        const cfData = await cfRes.json() as { result?: { response?: string } };
        const rawText = cfData?.result?.response ?? '';

        let suggestion: { vibe: string; palette: string; reason: string };

        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON in response');
            const parsed = JSON.parse(jsonMatch[0]);

            // Validate AI output — fall back to safe defaults if invalid
            const vibe = VALID_VIBES.includes(parsed.vibe) ? parsed.vibe : 'professional';
            const palette = VALID_PALETTES.includes(parsed.palette) ? parsed.palette : 'indigo';
            const reason = typeof parsed.reason === 'string' && parsed.reason.length > 5
                ? parsed.reason
                : `A ${vibe} style with ${palette} tones suits this audience well.`;

            suggestion = {vibe, palette, reason};
        } catch {
            // If AI returns garbage, use a sensible default rather than erroring
            suggestion = {
                vibe: 'professional',
                palette: 'indigo',
                reason: 'A professional style with indigo tones is a safe, versatile choice for most audiences.',
            };
        }

        return NextResponse.json({success: true, suggestion});
    } catch (err) {
        console.error('[VIBE_CHECK]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}