import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import RankTrackingModel from "@/models/RankTracking";
import {getTenantContext} from "@/lib/tenant";
import OpenAI from "openai";
import {z} from "zod";
import UserModel from "@/models/User";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const AddKeywordSchema = z.object({
    keyword: z.string().min(2).max(200),
    targetUrl: z.string().optional(),
    targetPosition: z.number().min(1).max(100).optional(),
    searchEngine: z.enum(["google", "bing"]).optional(),
    location: z.string().optional(),
});

// Simulate rank checking via AI (real implementation would use SerpAPI/DataForSEO)
async function checkKeywordRank(keyword: string, targetUrl?: string): Promise<number | null> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: `Estimate the Google search ranking position for the keyword "${keyword}"${targetUrl ? ` for the URL ${targetUrl}` : ""}. 
        Return ONLY a JSON: {"position": number|null, "confidence": "low"|"medium"|"high"}
        If you cannot estimate, return {"position": null, "confidence": "low"}.
        Position should be between 1-100, or null if not ranking.`,
            }],
            response_format: {type: "json_object"},
            temperature: 0.2,
            max_tokens: 60,
        });
        const result = JSON.parse(response.choices[0].message.content ?? "{}") as { position: number | null };
        return result.position ?? null;
    } catch {
        return null;
    }
}

// GET /api/rank-tracking — list tracked keywords
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const tenant = await getTenantContext(session.user.id);
        const keywords = await RankTrackingModel.find({tenantId: tenant.tenantId, isActive: true})
            .sort({createdAt: -1})
            .lean();

        return NextResponse.json({success: true, data: keywords});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/rank-tracking — add keyword to track
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();

        const tenant = await getTenantContext(session.user.id);
        const owner = await UserModel.findById(tenant.tenantId).select("plan").lean() as { plan: string } | null;
        const planLimits: Record<string, number> = {free: 5, silver: 25, gold: 100, diamond: 500};
        const maxKeywords = planLimits[owner?.plan ?? "free"] ?? 5;
        const currentCount = await RankTrackingModel.countDocuments({tenantId: tenant.tenantId, isActive: true});
        if (currentCount >= maxKeywords) {
            return NextResponse.json({
                success: false,
                error: `Your ${session.user.plan} plan allows tracking ${maxKeywords} keywords. Upgrade for more.`,
            }, {status: 403});
        }

        const body = await req.json();
        const parsed = AddKeywordSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        // Check for duplicate
        const existing = await RankTrackingModel.findOne({
            tenantId: session.user.id,
            keyword: parsed.data.keyword.toLowerCase(),
        });
        if (existing) {
            return NextResponse.json({success: false, error: "This keyword is already being tracked"}, {status: 409});
        }

        // Get initial position estimate
        const position = await checkKeywordRank(parsed.data.keyword, parsed.data.targetUrl);

        const tracked = await RankTrackingModel.create({
            userId: session.user.id,
            tenantId: session.user.id,
            keyword: parsed.data.keyword.toLowerCase(),
            targetUrl: parsed.data.targetUrl,
            targetPosition: parsed.data.targetPosition,
            currentPosition: position,
            previousPosition: null,
            bestPosition: position,
            searchEngine: parsed.data.searchEngine ?? "google",
            location: parsed.data.location ?? "us",
            isActive: true,
            lastCheckedAt: new Date(),
            snapshots: position !== null ? [{
                date: new Date(),
                position,
                searchEngine: parsed.data.searchEngine ?? "google",
                location: parsed.data.location ?? "us",
            }] : [],
        });

        return NextResponse.json({success: true, data: tracked}, {status: 201});
    } catch (error) {
        console.error("[RANK_TRACKING_ADD]", error);
        return NextResponse.json({success: false, error: "Failed to add keyword"}, {status: 500});
    }
}

// DELETE /api/rank-tracking?id=xxx — stop tracking a keyword
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        const {searchParams} = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({success: false, error: "id required"}, {status: 400});
        }

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        await RankTrackingModel.findOneAndUpdate(
            {_id: id, tenantId: tenant.tenantId},
            {$set: {isActive: false}}
        );

        return NextResponse.json({success: true, message: "Keyword removed from tracking"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}


// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import RankTrackingModel from "@/models/RankTracking";
// import UserModel from "@/models/User";
// import OpenAI from "openai";
// import {z} from "zod";
//
// const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
//
// const AddKeywordSchema = z.object({
//     keyword: z.string().min(2).max(200),
//     targetUrl: z.string().optional(),
//     targetPosition: z.number().min(1).max(100).optional(),
//     searchEngine: z.enum(["google", "bing"]).optional(),
//     location: z.string().optional(),
// });
//
// // Simulate rank checking via AI (real implementation would use SerpAPI/DataForSEO)
// async function checkKeywordRank(keyword: string, targetUrl?: string): Promise<number | null> {
//     try {
//         const response = await openai.chat.completions.create({
//             model: "gpt-4o-mini",
//             messages: [{
//                 role: "user",
//                 content: `Estimate the Google search ranking position for the keyword "${keyword}"${targetUrl ? ` for the URL ${targetUrl}` : ""}.
//         Return ONLY a JSON: {"position": number|null, "confidence": "low"|"medium"|"high"}
//         If you cannot estimate, return {"position": null, "confidence": "low"}.
//         Position should be between 1-100, or null if not ranking.`,
//             }],
//             response_format: {type: "json_object"},
//             temperature: 0.2,
//             max_tokens: 60,
//         });
//         const result = JSON.parse(response.choices[0].message.content ?? "{}") as { position: number | null };
//         return result.position ?? null;
//     } catch {
//         return null;
//     }
// }
//
// // GET /api/rank-tracking — list tracked keywords
// export async function GET() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         await connectDB();
//         const keywords = await RankTrackingModel.find({tenantId: session.user.id, isActive: true})
//             .sort({createdAt: -1})
//             .lean();
//
//         return NextResponse.json({success: true, data: keywords});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // POST /api/rank-tracking — add keyword to track
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         await connectDB();
//
//         // Check plan limits
//         const planLimits: Record<string, number> = {free: 5, silver: 25, gold: 100, diamond: 500};
//         const maxKeywords = planLimits[session.user.plan ?? "free"] ?? 5;
//         const currentCount = await RankTrackingModel.countDocuments({tenantId: session.user.id, isActive: true});
//
//         if (currentCount >= maxKeywords) {
//             return NextResponse.json({
//                 success: false,
//                 error: `Your ${session.user.plan} plan allows tracking ${maxKeywords} keywords. Upgrade for more.`,
//             }, {status: 403});
//         }
//
//         const body = await req.json();
//         const parsed = AddKeywordSchema.safeParse(body);
//         if (!parsed.success) {
//             return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
//         }
//
//         // Check for duplicate
//         const existing = await RankTrackingModel.findOne({
//             tenantId: session.user.id,
//             keyword: parsed.data.keyword.toLowerCase(),
//         });
//         if (existing) {
//             return NextResponse.json({success: false, error: "This keyword is already being tracked"}, {status: 409});
//         }
//
//         // Get initial position estimate
//         const position = await checkKeywordRank(parsed.data.keyword, parsed.data.targetUrl);
//
//         const tracked = await RankTrackingModel.create({
//             userId: session.user.id,
//             tenantId: session.user.id,
//             keyword: parsed.data.keyword.toLowerCase(),
//             targetUrl: parsed.data.targetUrl,
//             targetPosition: parsed.data.targetPosition,
//             currentPosition: position,
//             previousPosition: null,
//             bestPosition: position,
//             searchEngine: parsed.data.searchEngine ?? "google",
//             location: parsed.data.location ?? "us",
//             isActive: true,
//             lastCheckedAt: new Date(),
//             snapshots: position !== null ? [{
//                 date: new Date(),
//                 position,
//                 searchEngine: parsed.data.searchEngine ?? "google",
//                 location: parsed.data.location ?? "us",
//             }] : [],
//         });
//
//         return NextResponse.json({success: true, data: tracked}, {status: 201});
//     } catch (error) {
//         console.error("[RANK_TRACKING_ADD]", error);
//         return NextResponse.json({success: false, error: "Failed to add keyword"}, {status: 500});
//     }
// }
//
// // DELETE /api/rank-tracking?id=xxx — stop tracking a keyword
// export async function DELETE(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) {
//             return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//         }
//
//         const {searchParams} = new URL(req.url);
//         const id = searchParams.get("id");
//         if (!id) {
//             return NextResponse.json({success: false, error: "id required"}, {status: 400});
//         }
//
//         await connectDB();
//         await RankTrackingModel.findOneAndUpdate(
//             {_id: id, tenantId: session.user.id},
//             {$set: {isActive: false}}
//         );
//
//         return NextResponse.json({success: true, message: "Keyword removed from tracking"});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }