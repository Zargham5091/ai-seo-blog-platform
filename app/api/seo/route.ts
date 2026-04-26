import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import BlogModel, {IBlogDocument} from "@/models/Blog";
import UserModel from "@/models/User";
import OpenAI from "openai";
import {z} from "zod";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const AnalyzeSchema = z.object({
    content: z.string().min(50),
    targetKeyword: z.string().min(2),
    title: z.string().optional(),
    metaDescription: z.string().optional(),
});

// GET /api/seo?type=stats|overview
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const {searchParams} = new URL(req.url);
        const type = searchParams.get("type") ?? "overview";

        if (type === "overview") {
            const blogs = await BlogModel.find({tenantId: session.user.id, status: "published"})
                .select("title slug seo publishedAt viewCount")
                .sort({publishedAt: -1})
                .limit(20)
                .lean<IBlogDocument[]>();

            const avgScore = blogs.length
                ? Math.round(blogs.reduce((sum, b) => sum + ((b.seo)?.seoScore ?? 0), 0) / blogs.length)
                : 0;

            const lowScoreCount = blogs.filter((b) => ((b.seo)?.seoScore ?? 0) < 50).length;

            return NextResponse.json({
                success: true,
                data: {blogs, avgScore, lowScoreCount, totalBlogs: blogs.length},
            });
        }

        if (type === "stats") {
            const agg = await BlogModel.aggregate([
                {$match: {tenantId: session.user.id}},
                {
                    $group: {
                        _id: null,
                        avgSEO: {$avg: "$seo.seoScore"},
                        totalPages: {$sum: 1},
                        publishedPages: {$sum: {$cond: [{$eq: ["$status", "published"]}, 1, 0]}},
                    },
                },
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    avgSEOScore: Math.round(agg[0]?.avgSEO ?? 0),
                    totalPages: agg[0]?.totalPages ?? 0,
                    publishedPages: agg[0]?.publishedPages ?? 0,
                    indexedPercent: agg[0]?.publishedPages ? Math.round((agg[0].publishedPages / agg[0].totalPages) * 100) : 0,
                },
            });
        }

        if (type === "sitemap") {
            const blogs = await BlogModel.find({tenantId: session.user.id, status: "published"})
                .select("title slug updatedAt")
                .sort({updatedAt: -1})
                .lean();

            const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
            const entries = blogs.map((b) => ({
                url: `${APP_URL}/blog/${b.slug}`,
                title: b.title,
                lastmod: new Date(b.updatedAt as Date).toISOString().split("T")[0],
            }));

            return NextResponse.json({success: true, data: {entries}});
        }

        return NextResponse.json({success: false, error: "Invalid type"}, {status: 400});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/seo — analyze content for SEO score
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const user = await UserModel.findById(session.user.id);
        if (!user || user.aiCreditsUsed >= user.aiCreditsLimit) {
            return NextResponse.json({success: false, error: "No AI credits remaining"}, {status: 403});
        }

        const body = await req.json();
        const parsed = AnalyzeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {content, targetKeyword, title, metaDescription} = parsed.data;
        const strippedContent = content.replace(/<[^>]*>/g, "").slice(0, 3000);
        const wordCount = strippedContent.split(/\s+/).length;

        const prompt = `Analyze this content for SEO. Target keyword: "${targetKeyword}"

Title: ${title ?? "not provided"}
Meta Description: ${metaDescription ?? "not provided"}
Word Count: ${wordCount}
Content: ${strippedContent}

Return JSON:
{
  "score": 0-100,
  "readabilityScore": 0-100,
  "analysis": {
    "keywordInTitle": boolean,
    "keywordInFirstParagraph": boolean,
    "keywordDensity": number (percentage),
    "wordCount": ${wordCount},
    "hasMetaDescription": boolean,
    "metaDescriptionLength": number,
    "hasHeadings": boolean,
    "headingCount": number,
    "hasInternalLinks": boolean,
    "hasImages": boolean,
    "readingTime": number (minutes)
  },
  "issues": [{"type":"error|warning|info","message":"string","fix":"string"}],
  "positives": ["things done well"],
  "suggestions": ["top 3 improvements"]
}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role: "user", content: prompt}],
            response_format: {type: "json_object"},
            temperature: 0.2,
            max_tokens: 1000,
        });

        const result = JSON.parse(response.choices[0].message.content ?? "{}") as Record<string, unknown>;
        await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});

        return NextResponse.json({success: true, data: result});
    } catch (error) {
        console.error("[SEO_ANALYZE]", error);
        return NextResponse.json({success: false, error: "Analysis failed"}, {status: 500});
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import BlogModel from "@/models/Blog";
// import { z } from "zod";
//
// const RobotsSchema = z.object({
//   allow: z.array(z.string()).optional(),
//   disallow: z.array(z.string()).optional(),
//   crawlDelay: z.number().optional(),
// });
//
// // GET /api/seo?type=sitemap|robots|meta-check
// export async function GET(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     const { searchParams } = new URL(req.url);
//     const type = searchParams.get("type") ?? "sitemap";
//
//     await connectDB();
//
//     if (type === "sitemap") {
//       const blogs = await BlogModel.find(
//         { tenantId: session.user.id, status: "published" },
//         "slug updatedAt title"
//       ).lean();
//
//       const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
//       const entries = blogs.map((b) => ({
//         url: `${base}/blog/${b.slug}`,
//         lastmod: (b.updatedAt as Date).toISOString().split("T")[0],
//         title: b.title,
//       }));
//
//       return NextResponse.json({ success: true, data: { entries, count: entries.length, base } });
//     }
//
//     if (type === "stats") {
//       const [total, published, avgSEO] = await Promise.all([
//         BlogModel.countDocuments({ tenantId: session.user.id }),
//         BlogModel.countDocuments({ tenantId: session.user.id, status: "published" }),
//         BlogModel.aggregate([
//           { $match: { tenantId: session.user.id } },
//           { $group: { _id: null, avg: { $avg: "$seo.seoScore" } } },
//         ]),
//       ]);
//
//       return NextResponse.json({
//         success: true,
//         data: {
//           totalPages: total,
//           publishedPages: published,
//           avgSEOScore: Math.round(avgSEO[0]?.avg ?? 0),
//           indexedPercent: total > 0 ? Math.round((published / total) * 100) : 0,
//         },
//       });
//     }
//
//     return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
//   } catch (error) {
//     console.error("[SEO_API]", error);
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
