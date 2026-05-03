// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/site/page/[pageId]/components/route.ts
// ════════════════════════════════════════════════════════════════════════════

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";

export async function PATCH(req: NextRequest, {params}: { params: { pageId: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const {components} = await req.json();
        await connectDB();
        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});
        // Team member page permission check
        if (site.pagePermissions.length > 0) {
            const perm = site.pagePermissions.find((p) => p.userId.toString() === session.user.id);
            if (perm && perm.pageIds.length > 0 && !perm.pageIds.includes(params.pageId))
                return NextResponse.json({success: false, error: "No access to this page"}, {status: 403});
        }
        const pageIdx = site.pages.findIndex((p) => p.pageId === params.pageId);
        if (pageIdx === -1) return NextResponse.json({success: false, error: "Page not found"}, {status: 404});
        site.pages[pageIdx].components = components;
        site.pages[pageIdx].updatedAt = new Date();
        await site.save();
        return NextResponse.json({success: true});
    } catch (err) {
        console.error("[SAVE_PAGE_COMPONENTS]", err);
        return NextResponse.json({success: false, error: "Failed to save"}, {status: 500});
    }
}

