// app/api/auth/gdpr-export/route.ts
import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import BlogModel from "@/models/Blog";
import ActivityLogModel from "@/models/ActivityLog";

// GET /api/auth/gdpr-export — download all user data as JSON
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();

        const [user, blogs, activityLogs] = await Promise.all([
            UserModel.findById(session.user.id)
                .select("-password -resetPasswordToken -resetPasswordExpires -gscAccessToken -gscRefreshToken")
                .lean(),
            BlogModel.find({authorId: session.user.id})
                .select("title slug status createdAt updatedAt viewCount seo.seoScore")
                .lean(),
            ActivityLogModel.find({userId: session.user.id})
                .select("action category metadata ip createdAt")
                .sort({createdAt: -1})
                .limit(500)
                .lean(),
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedFor: session.user.email,
            notice: "This is all personal data SEO Platform holds about you. Sensitive fields like passwords and tokens are excluded.",
            account: user,
            content: {
                totalBlogs: blogs.length,
                blogs,
            },
            activityLog: {
                note: "Last 500 activity records",
                records: activityLogs,
            },
        };

        const json = JSON.stringify(exportData, null, 2);

        return new NextResponse(json, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="seo-platform-data-export-${Date.now()}.json"`,
            },
        });
    } catch (error) {
        console.error("[GDPR_EXPORT]", error);
        return NextResponse.json({success: false, error: "Export failed"}, {status: 500});
    }
}