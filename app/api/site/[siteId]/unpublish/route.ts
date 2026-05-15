import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import {unpublishSite} from "@/lib/builder/publish";

export async function POST(
    _req: NextRequest,
    {params}: { params: { siteId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const site = await UserSiteModel.findOne({_id: params.siteId, userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Not found"}, {status: 404});

        await unpublishSite(session.user.id);
        return NextResponse.json({success: true});
    } catch (err) {
        console.error("[SITE_UNPUBLISH]", err);
        return NextResponse.json({success: false, error: "Failed to unpublish"}, {status: 500});
    }
}