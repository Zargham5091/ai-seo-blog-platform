// app/api/auth/sessions/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSessionModel from "@/models/UserSession";
import {parseUserAgent} from "@/app/api/super-admin/activity/route";

// GET /api/auth/sessions — list active sessions for current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const sessions = await UserSessionModel.find({
            userId: session.user.id,
            isRevoked: false,
        }).sort({lastActiveAt: -1}).lean();

        return NextResponse.json({success: true, data: sessions});
    } catch (error) {
        console.error("[SESSIONS_GET]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/auth/sessions — record a new session (called on login)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
        const ua = req.headers.get("user-agent") ?? "unknown";
        const parsed = parseUserAgent(ua);

        await connectDB();

        // Upsert — avoid duplicate sessions per IP+UA combo
        await UserSessionModel.findOneAndUpdate(
            {userId: session.user.id, ip, userAgent: ua, isRevoked: false},
            {
                $set: {
                    browser: parsed.browser,
                    os: parsed.os,
                    device: parsed.device,
                    lastActiveAt: new Date(),
                },
                $setOnInsert: {
                    userId: session.user.id,
                    sessionToken: `${session.user.id}_${Date.now()}`,
                    ip,
                    userAgent: ua,
                },
            },
            {upsert: true}
        );

        return NextResponse.json({success: true});
    } catch (error) {
        console.error("[SESSIONS_POST]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// DELETE /api/auth/sessions?id=xxx — revoke a session
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {searchParams} = new URL(req.url);
        const id = searchParams.get("id");
        const revokeAll = searchParams.get("all") === "true";

        await connectDB();

        if (revokeAll) {
            await UserSessionModel.updateMany(
                {userId: session.user.id},
                {$set: {isRevoked: true}}
            );
            return NextResponse.json({success: true, message: "All sessions revoked"});
        }

        if (!id) return NextResponse.json({success: false, error: "id required"}, {status: 400});

        await UserSessionModel.findOneAndUpdate(
            {_id: id, userId: session.user.id},
            {$set: {isRevoked: true}}
        );

        return NextResponse.json({success: true, message: "Session revoked"});
    } catch (error) {
        console.error("[SESSIONS_DELETE]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}