// app/api/contact/route.ts
//
// POST /api/contact
// Public endpoint — called from published site contact form components.
// No auth. Identifies site owner by siteId or domain header.
//
// Body: { siteId, name, email, message, formType?, ...extraFields }
// Returns: { success: true }

import {NextRequest, NextResponse} from 'next/server';
import {connectDB} from '@/lib/db';
import UserSiteModel from '@/models/UserSite';
import FormSubmissionModel from '@/models/FormSubmission';
import {sendContactNotificationEmail} from '@/services/email';

// Rate limit: simple in-memory store (per-IP, resets on server restart)
// For production use Upstash Redis instead
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;        // max submissions per window
const RATE_WINDOW = 60_000;  // 1 minute window

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
        // Rate limit by IP
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                {success: false, error: 'Too many submissions. Please wait a minute.'},
                {status: 429}
            );
        }

        const body = await req.json() as Record<string, string>;
        const {siteId, name, email, message, formType, ...extraFields} = body;

        // Validate required fields
        if (!siteId || typeof siteId !== 'string') {
            return NextResponse.json({success: false, error: 'siteId required'}, {status: 400});
        }
        if (!name?.trim() || !email?.trim()) {
            return NextResponse.json({success: false, error: 'name and email are required'}, {status: 400});
        }

        // Basic email format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({success: false, error: 'Invalid email address'}, {status: 400});
        }

        await connectDB();

        // Look up the site to get owner userId
        const site = await UserSiteModel.findById(siteId).select('userId siteName isPublished').lean();
        if (!site || !site.isPublished) {
            return NextResponse.json({success: false, error: 'Site not found'}, {status: 404});
        }

        // Sanitize fields — strip any HTML to prevent stored XSS
        const sanitize = (s: string) => String(s ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 2000);

        const fields: Record<string, string> = {
            name: sanitize(name),
            email: sanitize(email),
            ...(message ? {message: sanitize(message)} : {}),
            ...Object.fromEntries(
                Object.entries(extraFields)
                    .filter(([k]) => !['siteId', 'formType'].includes(k))
                    .map(([k, v]) => [sanitize(k), sanitize(String(v))])
            ),
        };

        // Save to DB
        await FormSubmissionModel.create({
            userId: site.userId,
            siteId: site._id,
            formType: formType ?? 'contact',
            fields,
            ipAddress: ip,
        });

        // Email notification to site owner (best-effort — don't fail if email fails)
        try {
            await sendContactNotificationEmail(site.userId.toString(), site.siteName as string, fields);
        } catch (emailErr) {
            console.error('[CONTACT] Email notification failed (non-fatal):', emailErr);
        }

        return NextResponse.json({success: true});
    } catch (err) {
        console.error('[CONTACT]', err);
        return NextResponse.json({success: false, error: 'Internal server error'}, {status: 500});
    }
}