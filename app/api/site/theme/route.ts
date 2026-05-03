// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/site/theme/route.ts
// ════════════════════════════════════════════════════════════════════════════
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const {theme, globalCSS} = await req.json();
        await connectDB();
        const site = await UserSiteModel.findOneAndUpdate(
            {userId: session.user.id},
            {$set: {theme, globalCSS}},
            {new: true}
        );
        return NextResponse.json({success: true, data: site});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
