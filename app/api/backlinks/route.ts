import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {z} from "zod";
import {analyzeBacklinks} from "@/services/ai";
import {canWrite, getTenantContext} from "@/lib/tenant";


const BacklinkSchema = z.object({
    url: z.string().url("Must be a valid URL"),
    checkCompetitor: z.boolean().optional(),
});

export interface BacklinkResult {
    url: string;
    domainAuthority: number;
    spamScore: number;
    linkType: "dofollow" | "nofollow" | "unknown";
    anchorText: string;
    industry: string;
    isHighValue: boolean;
    recommendation: string;
}

export interface BacklinkAnalysis {
    targetUrl: string;
    totalEstimated: number;
    highValueCount: number;
    averageDA: number;
    topBacklinks: BacklinkResult[];
    insights: string[];
    outreachTargets: { domain: string; reason: string; contactHint: string }[];
}

// POST /api/backlinks — analyze backlinks for a URL
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }
        const tenant = await getTenantContext(session.user.id);
        if (!canWrite(tenant.role)) return NextResponse.json({
            success: false,
            error: "Only admins can write."
        }, {status: 403});

        // Feature gating — silver+ only
        if (session.user.plan === "free") {
            return NextResponse.json(
                {success: false, error: "Backlink monitoring requires Silver plan or higher."},
                {status: 403}
            );
        }

        await connectDB();
        const user = await UserModel.findById(tenant.tenantId);
        if (!user || user.aiCreditsUsed >= user.aiCreditsLimit) {
            return NextResponse.json({success: false, error: "No AI credits remaining"}, {status: 403});
        }

        const body = await req.json();
        const parsed = BacklinkSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const result = await analyzeBacklinks(parsed.data.url);

        // const result = JSON.parse(response.choices[0].message.content ?? "{}") as BacklinkAnalysis;
        await UserModel.findByIdAndUpdate(tenant.tenantId, {$inc: {aiCreditsUsed: 1}});

        return NextResponse.json({success: true, data: result});
    } catch (error) {
        console.error("[BACKLINKS]", error);
        return NextResponse.json({success: false, error: "Backlink analysis failed"}, {status: 500});
    }
}
