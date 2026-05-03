// app/api/demo/route.ts
// Real AI for the demo page — 3 credits per IP address, strictly enforced.
// Uses the existing in-memory ratelimiter (no Redis needed).
// No DB writes — purely stateless demo experience.

import {NextRequest, NextResponse} from "next/server";
import {generateBlogPost, researchKeywords, analyzeSEOContent} from "@/services/ai";
import {z} from "zod";

// ── Per-IP credit tracker (in-memory, resets on server restart) ───────────────
// For production with multiple instances, swap this Map for Redis.
const ipCredits = new Map<string, { used: number; resetAt: number }>();
const DEMO_CREDITS = 3;
const RESET_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkDemoCredit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    let entry = ipCredits.get(ip);

    // Reset if window expired
    if (!entry || now > entry.resetAt) {
        entry = {used: 0, resetAt: now + RESET_WINDOW_MS};
        ipCredits.set(ip, entry);
    }

    if (entry.used >= DEMO_CREDITS) {
        return {allowed: false, remaining: 0};
    }

    entry.used++;
    return {allowed: true, remaining: DEMO_CREDITS - entry.used};
}

function getClientIP(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown"
    );
}

const DemoSchema = z.object({
    type: z.enum(["blog", "keywords", "analyze"]),
    topic: z.string().min(3).max(200).optional(),
    keyword: z.string().min(2).max(100).optional(),
    content: z.string().min(50).max(2000).optional(),
});

// POST /api/demo
export async function POST(req: NextRequest) {
    try {
        const ip = getClientIP(req);
        const {allowed, remaining} = checkDemoCredit(ip);

        if (!allowed) {
            return NextResponse.json({
                success: false,
                error: "You've used all 3 free demo credits. Create a free account for 10 more AI credits.",
                upgradeRequired: true,
            }, {status: 429});
        }

        const body = await req.json();
        const parsed = DemoSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {type} = parsed.data;
        let result: unknown;

        if (type === "blog") {
            if (!parsed.data.topic) {
                return NextResponse.json({success: false, error: "topic required for blog generation"}, {status: 400});
            }
            result = await generateBlogPost({
                topic: parsed.data.topic,
                keywords: [parsed.data.topic.split(" ").slice(0, 2).join(" ")],
                tone: "professional",
                wordCount: 600, // shorter for demo to save tokens
            });
        } else if (type === "keywords") {
            if (!parsed.data.keyword) {
                return NextResponse.json({success: false, error: "keyword required"}, {status: 400});
            }
            const keywords = await researchKeywords(parsed.data.keyword, 8);
            result = {seedKeyword: parsed.data.keyword, keywords, contentIdeas: []};
        } else if (type === "analyze") {
            if (!parsed.data.content || !parsed.data.keyword) {
                return NextResponse.json({
                    success: false,
                    error: "content and keyword required for analysis"
                }, {status: 400});
            }
            result = await analyzeSEOContent(parsed.data.content, parsed.data.keyword);
        }

        return NextResponse.json({
            success: true,
            data: result,
            meta: {creditsRemaining: remaining, isDemo: true},
        });
    } catch (error) {
        console.error("[DEMO_AI]", error);
        return NextResponse.json({success: false, error: "AI generation failed. Please try again."}, {status: 500});
    }
}

// GET /api/demo — check remaining credits for this IP
export async function GET(req: NextRequest) {
    const ip = getClientIP(req);
    const now = Date.now();
    const entry = ipCredits.get(ip);

    const remaining = entry && now < entry.resetAt
        ? Math.max(0, DEMO_CREDITS - entry.used)
        : DEMO_CREDITS;

    return NextResponse.json({success: true, data: {remaining, total: DEMO_CREDITS}});
}