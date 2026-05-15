// ═══════════════════════════════════════════════════════════════════════════
// FILE: app/api/site/publish/route.ts
// POST — triggers full publish pipeline: renders HTML, writes to /public/sites
// ═══════════════════════════════════════════════════════════════════════════

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import {publishSite} from "@/lib/builder/publish";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();

        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});

        // Team member publish permission check
        if (session.user.id !== site.userId.toString()) {
            const perm = site.pagePermissions?.find(
                (p: { userId: { toString(): string }; canPublish: boolean }) =>
                    p.userId.toString() === session.user.id
            );
            if (!perm?.canPublish) {
                return NextResponse.json({success: false, error: "No publish permission"}, {status: 403});
            }
        }

        // Run full publish pipeline
        const result = await publishSite(session.user.id);

        return NextResponse.json({
            success: true,
            pagesBuilt: result.pagesBuilt,
            builtAt: result.builtAt,
            publishedAt: result.builtAt,
        });
    } catch (err) {
        console.error("[PUBLISH]", err);
        return NextResponse.json({success: false, error: "Publish failed"}, {status: 500});
    }
}
