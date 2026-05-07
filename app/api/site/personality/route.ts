// app/api/site/personality/route.ts
//
// POST /api/site/personality
// Body: { vibe, palette, audience, siteType }
// Returns: { success: true, data: updatedSite }
//
// Maps vibe + palette to concrete theme tokens, then saves to DB.
// No AI call needed — we use deterministic mapping for reliability and speed.

import {NextRequest, NextResponse} from 'next/server';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {connectDB} from '@/lib/db';
import UserSiteModel from '@/models/UserSite';

// ─────────────────────────────────────────────────────────────────────────────
// Palette → color tokens
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE_MAP: Record<string, { primaryColor: string; secondaryColor: string; accentColor: string }> = {
    indigo: {primaryColor: '#4F46E5', secondaryColor: '#818CF8', accentColor: '#E0E7FF'},
    rose: {primaryColor: '#E11D48', secondaryColor: '#FB7185', accentColor: '#FFF1F2'},
    emerald: {primaryColor: '#059669', secondaryColor: '#34D399', accentColor: '#D1FAE5'},
    amber: {primaryColor: '#D97706', secondaryColor: '#FCD34D', accentColor: '#FEF3C7'},
    sky: {primaryColor: '#0284C7', secondaryColor: '#38BDF8', accentColor: '#E0F2FE'},
    violet: {primaryColor: '#7C3AED', secondaryColor: '#A78BFA', accentColor: '#EDE9FE'},
    slate: {primaryColor: '#0F172A', secondaryColor: '#475569', accentColor: '#F1F5F9'},
    pink: {primaryColor: '#BE185D', secondaryColor: '#F472B6', accentColor: '#FCE7F3'},
};

// ─────────────────────────────────────────────────────────────────────────────
// Vibe → typography + style tokens
// ─────────────────────────────────────────────────────────────────────────────

const VIBE_MAP: Record<string, {
    fontHeading: string;
    fontBody: string;
    borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadowStyle: 'none' | 'sm' | 'md' | 'lg';
}> = {
    bold: {fontHeading: 'Plus Jakarta Sans', fontBody: 'Inter', borderRadius: 'md', shadowStyle: 'lg'},
    minimal: {fontHeading: 'DM Sans', fontBody: 'DM Sans', borderRadius: 'none', shadowStyle: 'none'},
    playful: {fontHeading: 'Nunito', fontBody: 'Nunito', borderRadius: 'full', shadowStyle: 'md'},
    professional: {fontHeading: 'Inter', fontBody: 'Inter', borderRadius: 'sm', shadowStyle: 'sm'},
    creative: {fontHeading: 'Syne', fontBody: 'Outfit', borderRadius: 'lg', shadowStyle: 'md'},
    warm: {fontHeading: 'Fraunces', fontBody: 'Source Serif 4', borderRadius: 'lg', shadowStyle: 'sm'},
};

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: 'Unauthorized'}, {status: 401});
        }

        const {vibe, palette} = await req.json() as {
            vibe?: string;
            palette?: string;
            audience?: string;
            siteType?: string;
        };

        if (!vibe || !palette) {
            return NextResponse.json({success: false, error: 'vibe and palette are required'}, {status: 400});
        }

        const paletteTokens = PALETTE_MAP[palette] ?? PALETTE_MAP.indigo;
        const vibeTokens = VIBE_MAP[vibe] ?? VIBE_MAP.professional;

        await connectDB();

        const site = await UserSiteModel.findOneAndUpdate(
            {userId: session.user.id},
            {
                $set: {
                    'theme.primaryColor': paletteTokens.primaryColor,
                    'theme.secondaryColor': paletteTokens.secondaryColor,
                    'theme.accentColor': paletteTokens.accentColor,
                    'theme.fontHeading': vibeTokens.fontHeading,
                    'theme.fontBody': vibeTokens.fontBody,
                    'theme.borderRadius': vibeTokens.borderRadius,
                    'theme.shadowStyle': vibeTokens.shadowStyle,
                },
            },
            {new: true}
        );

        if (!site) {
            return NextResponse.json({success: false, error: 'Site not found'}, {status: 404});
        }

        return NextResponse.json({success: true, data: site});
    } catch (err) {
        console.error('[PERSONALITY]', err);
        return NextResponse.json({success: false, error: 'Failed to apply personality'}, {status: 500});
    }
}