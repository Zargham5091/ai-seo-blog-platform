// app/api/ai/keywords/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {researchKeywords} from "@/services/ai";
import {getTenantContext, canWrite} from "@/lib/tenant";
import {checkRateLimit, aiRatelimit} from "@/lib/ratelimit";
import {z} from "zod";

const KeywordSchema = z.object({
    keyword: z.string().min(2).max(100),
    niche: z.string().max(80).optional(),
    count: z.number().min(5).max(20).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {success: rateLimitOk} = await checkRateLimit(aiRatelimit, `keywords:${session.user.id}`);
        if (!rateLimitOk) return NextResponse.json({success: false, error: "Rate limit exceeded."}, {status: 429});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canWrite(tenant.role)) {
            return NextResponse.json({success: false, error: "You have read-only access."}, {status: 403});
        }

        // Check plan — keyword research requires silver+
        const owner = await UserModel.findById(tenant.tenantId).select("plan aiCreditsUsed aiCreditsLimit").lean() as
            { plan: string; aiCreditsUsed: number; aiCreditsLimit: number } | null;

        if (!owner) return NextResponse.json({success: false, error: "Owner not found"}, {status: 404});

        if (owner.plan === "free") {
            return NextResponse.json({
                success: false,
                error: "Keyword research requires Silver plan or higher."
            }, {status: 403});
        }

        // Credit check
        if (tenant.isOwner) {
            if (owner.aiCreditsUsed >= owner.aiCreditsLimit) {
                return NextResponse.json({success: false, error: "No AI credits remaining."}, {status: 403});
            }
        } else {
            if (tenant.aiCreditsLimit === 0 || tenant.aiCreditsUsed >= tenant.aiCreditsLimit) {
                return NextResponse.json({success: false, error: "No AI credits allocated to you."}, {status: 403});
            }
        }

        const body = await req.json();
        const parsed = KeywordSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({
            success: false,
            error: parsed.error.errors[0].message
        }, {status: 400});

        const {keyword, niche, count = 12} = parsed.data;
        const keywords = await researchKeywords(keyword, count, niche);
        const result = {seedKeyword: keyword, keywords, contentIdeas: []};

        // Deduct credit
        if (tenant.isOwner) {
            await UserModel.findByIdAndUpdate(tenant.tenantId, {$inc: {aiCreditsUsed: 1}});
        } else {
            await UserModel.findOneAndUpdate(
                {_id: tenant.tenantId, "teamMembers.userId": session.user.id},
                {$inc: {"teamMembers.$.aiCreditsUsed": 1, aiCreditsUsed: 1}}
            );
        }

        return NextResponse.json({success: true, data: result});
    } catch (error) {
        console.error("[KEYWORDS]", error);
        return NextResponse.json({success: false, error: "Keyword research failed"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
// import {checkRateLimit, aiRatelimit} from "@/lib/ratelimit";
// import {z} from "zod";
// import {researchKeywords} from "@/services/ai";
//
//
// const KeywordSchema = z.object({
//     keyword: z.string().min(2).max(100),
//     niche: z.string().max(80).optional(),
//     count: z.number().min(5).max(20).optional(),
// });
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         const {success: rateLimitOk} = await checkRateLimit(aiRatelimit, `keywords:${session.user.id}`);
//         if (!rateLimitOk) {
//             return NextResponse.json({
//                 success: false,
//                 error: "Rate limit exceeded. Please wait before researching again."
//             }, {status: 429});
//         }
//
//         await connectDB();
//         const user = await UserModel.findById(session.user.id)
//             .select("aiCreditsUsed aiCreditsLimit plan")
//             .lean() as { aiCreditsUsed: number; aiCreditsLimit: number; plan: string } | null;
//
//         if (!user) {
//             return NextResponse.json({success: false, error: "User not found"}, {status: 404});
//         }
//
//         // Keyword research requires silver+ plan
//         if (user.plan === "free") {
//             return NextResponse.json(
//                 {success: false, error: "Keyword research requires Silver plan or higher."},
//                 {status: 403}
//             );
//         }
//
//         if (user.aiCreditsUsed >= user.aiCreditsLimit) {
//             return NextResponse.json({success: false, error: "No AI credits remaining"}, {status: 403});
//         }
//
//         const body = await req.json();
//         const parsed = KeywordSchema.safeParse(body);
//         if (!parsed.success) {
//             return NextResponse.json(
//                 {success: false, error: parsed.error.errors[0].message},
//                 {status: 400}
//             );
//         }
//
//         const {keyword, niche, count = 12} = parsed.data;
//
// //         const prompt = `You are an expert SEO keyword researcher. Generate ${count} keyword variations for "${keyword}"${niche ? ` in the ${niche} niche` : ""}.
// //
// // Return ONLY a valid JSON object:
// // {
// //   "seedKeyword": "${keyword}",
// //   "keywords": [
// //     {
// //       "keyword": "exact keyword phrase",
// //       "searchVolume": number (realistic monthly searches, 0-500000),
// //       "difficulty": number (0-100, where 0=easy, 100=very hard),
// //       "cpc": number (cost per click in USD, 2 decimal places),
// //       "intent": "informational" | "commercial" | "transactional" | "navigational",
// //       "trend": "rising" | "stable" | "declining",
// //       "relatedKeywords": ["related1", "related2", "related3"]
// //     }
// //   ],
// //   "contentIdeas": [
// //     "Blog post title idea 1",
// //     "Blog post title idea 2",
// //     "Blog post title idea 3",
// //     "Blog post title idea 4",
// //     "Blog post title idea 5",
// //     "Blog post title idea 6"
// //   ]
// // }
// //
// // Rules:
// // - Include a mix of long-tail (3-6 words) and short-tail keywords
// // - Include mix of difficulties from easy (0-30) to hard (60-100)
// // - Make search volumes realistic for the niche
// // - Include keywords with commercial and transactional intent for monetization
// // - Content ideas should be specific and compelling blog post titles`;
// //
// //         const response = await openai.chat.completions.create({
// //             model: "gpt-4o-mini",
// //             messages: [{role: "user", content: prompt}],
// //             response_format: {type: "json_object"},
// //             temperature: 0.5,
// //             max_tokens: 2000,
// //         });
// //
// //         const result = JSON.parse(response.choices[0].message.content ?? "{}");
//
//         const keywords = await researchKeywords(keyword, count, niche);
//         const result = {seedKeyword: keyword, keywords, contentIdeas: []};
//         await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});
//
//         return NextResponse.json({success: true, data: result});
//     } catch (error) {
//         console.error("[KEYWORDS]", error);
//         return NextResponse.json({success: false, error: "Keyword research failed"}, {status: 500});
//     }
// }
//
//
// // import { NextRequest, NextResponse } from "next/server";
// // import { getServerSession } from "next-auth";
// // import { authOptions } from "@/lib/auth";
// // import { connectDB } from "@/lib/db";
// // import UserModel from "@/models/User";
// // import KeywordModel from "@/models/Keyword";
// // import { researchKeywords } from "@/services/ai";
// // import { checkRateLimit, aiRatelimit } from "@/lib/ratelimit";
// // import { z } from "zod";
// //
// // const KeywordSchema = z.object({
// //   seed: z.string().min(2).max(100),
// //   count: z.number().min(5).max(20).optional(),
// //   save: z.boolean().optional(),
// // });
// //
// // export async function POST(req: NextRequest) {
// //   try {
// //     const session = await getServerSession(authOptions);
// //     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
// //
// //     const { success: rateLimitOk } = await checkRateLimit(aiRatelimit, `keywords:${session.user.id}`);
// //     if (!rateLimitOk) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
// //
// //     await connectDB();
// //     const user = await UserModel.findById(session.user.id);
// //     if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
// //
// //     if (user.aiCreditsUsed >= user.aiCreditsLimit) {
// //       return NextResponse.json({ success: false, error: "No AI credits remaining. Please upgrade." }, { status: 403 });
// //     }
// //
// //     const body = await req.json();
// //     const parsed = KeywordSchema.safeParse(body);
// //     if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
// //
// //     const keywords = await researchKeywords(parsed.data.seed, parsed.data.count ?? 10);
// //
// //     await UserModel.findByIdAndUpdate(session.user.id, { $inc: { aiCreditsUsed: 1 } });
// //
// //     if (parsed.data.save) {
// //       const docs = keywords.map((k) => ({
// //         keyword: k.keyword,
// //         searchVolume: k.searchVolume,
// //         difficulty: k.difficulty,
// //         cpc: k.cpc,
// //         trend: k.trend,
// //         userId: session.user.id,
// //         tenantId: session.user.id,
// //         isSaved: true,
// //       }));
// //       await KeywordModel.insertMany(docs, { ordered: false }).catch(() => {});
// //     }
// //
// //     return NextResponse.json({ success: true, data: keywords });
// //   } catch (error) {
// //     console.error("[KEYWORD_RESEARCH]", error);
// //     return NextResponse.json({ success: false, error: "Keyword research failed" }, { status: 500 });
// //   }
// // }
// //
// // export async function GET(req: NextRequest) {
// //   try {
// //     const session = await getServerSession(authOptions);
// //     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
// //
// //     await connectDB();
// //     const keywords = await KeywordModel.find({ tenantId: session.user.id, isSaved: true }).sort({ createdAt: -1 }).lean();
// //     return NextResponse.json({ success: true, data: keywords });
// //   } catch {
// //     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
// //   }
// // }
// //
// // export async function DELETE(req: NextRequest) {
// //   try {
// //     const session = await getServerSession(authOptions);
// //     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
// //
// //     const { searchParams } = new URL(req.url);
// //     const id = searchParams.get("id");
// //     if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
// //
// //     await connectDB();
// //     await KeywordModel.findOneAndDelete({ _id: id, tenantId: session.user.id });
// //     return NextResponse.json({ success: true, message: "Keyword removed" });
// //   } catch {
// //     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
// //   }
// // }
