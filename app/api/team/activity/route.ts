import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import ActivityLogModel from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {searchParams} = new URL(req.url);
        const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
        const category = searchParams.get("category"); // optional filter

        await connectDB();

        const query: Record<string, unknown> = {tenantId: session.user.id};
        if (category) query.category = category;

        const logs = await ActivityLogModel.find(query)
            .sort({createdAt: -1})
            .limit(limit)
            .populate("userId", "name email image")
            .lean();

        return NextResponse.json({success: true, data: logs});
    } catch (error) {
        console.error("[TEAM_ACTIVITY]", error);
        return NextResponse.json({success: false, error: "Failed to fetch activity"}, {status: 500});
    }
}