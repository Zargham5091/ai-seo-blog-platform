// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/site/route.ts
// ════════════════════════════════════════════════════════════════════════════

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        await connectDB();
        const site = await UserSiteModel.findOne({userId: session.user.id})
            .populate("templateId", "name theme previewImage").lean();
        return NextResponse.json({success: true, data: site ?? null});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const body = await req.json();
        await connectDB();
        const allowed = ["siteName", "siteTagline", "siteLogo", "favicon", "globalCSS", "navbar", "footer", "integrations", "builderState"];
        const update: Record<string, unknown> = {};
        for (const key of allowed) if (body[key] !== undefined) update[key] = body[key];
        const site = await UserSiteModel.findOneAndUpdate(
            {userId: session.user.id}, {$set: update}, {new: true}
        );
        return NextResponse.json({success: true, data: site});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
