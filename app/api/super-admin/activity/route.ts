// app/api/super-admin/activity/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import ActivityLogModel, {IActivityLog} from "@/models/ActivityLog";
import UserModel, {IUserDocument} from "@/models/User";

// ── Lightweight UA parser (no external dep) ───────────────────────────────────
export function parseUserAgent(ua: string): {
    browser: string; os: string; device: string; deviceIcon: string;
} {
    if (!ua || ua === "unknown") {
        return {browser: "Unknown", os: "Unknown", device: "desktop", deviceIcon: "🖥️"};
    }
    const uaLower = ua.toLowerCase();

    const isMobile = /mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua);
    const isTablet = /tablet|ipad/i.test(ua);
    const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
    const deviceIcon = isTablet ? "📱" : isMobile ? "📱" : "🖥️";

    let browser = "Unknown";
    if (uaLower.includes("edg/") || uaLower.includes("edge/")) browser = "Edge";
    else if (uaLower.includes("opr/") || uaLower.includes("opera")) browser = "Opera";
    else if (uaLower.includes("chrome") && !uaLower.includes("chromium")) browser = "Chrome";
    else if (uaLower.includes("firefox")) browser = "Firefox";
    else if (uaLower.includes("safari") && !uaLower.includes("chrome")) browser = "Safari";
    else if (uaLower.includes("msie") || uaLower.includes("trident")) browser = "IE";
    else if (uaLower.includes("chromium")) browser = "Chromium";

    let os = "Unknown";
    if (uaLower.includes("windows nt 10")) os = "Windows 10/11";
    else if (uaLower.includes("windows nt 6.3")) os = "Windows 8.1";
    else if (uaLower.includes("windows")) os = "Windows";
    else if (uaLower.includes("mac os x") || uaLower.includes("macos")) os = "macOS";
    else if (uaLower.includes("iphone os")) os = "iOS";
    else if (uaLower.includes("ipad")) os = "iPadOS";
    else if (uaLower.includes("android")) os = "Android";
    else if (uaLower.includes("linux")) os = "Linux";
    else if (uaLower.includes("ubuntu")) os = "Ubuntu";

    return {browser, os, device, deviceIcon};
}

// ── GET /api/super-admin/activity ─────────────────────────────────────────────
// Params: userId, category, action, ip, from, to, limit, statsOnly, userDetail
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const {searchParams} = new URL(req.url);
        const userId = searchParams.get("userId");
        const category = searchParams.get("category");
        const action = searchParams.get("action");
        const ip = searchParams.get("ip");
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
        const statsOnly = searchParams.get("statsOnly") === "true";
        const userDetail = searchParams.get("userDetail");

        await connectDB();

        // ── User detail drill-down ────────────────────────────────────────────────
        if (userDetail) {
            const [userLogs, user, loginStats] = await Promise.all([
                ActivityLogModel.find({userId: userDetail})
                    .sort({createdAt: -1})
                    .limit(50)
                    .lean<IActivityLog[]>(),
                UserModel.findById(userDetail)
                    .select("name email image role plan createdAt isActive aiCreditsUsed aiCreditsLimit")
                    .lean<IUserDocument>(),
                ActivityLogModel.aggregate([
                    {
                        $match: {
                            userId: userDetail,
                            action: "user.login",
                            createdAt: {$gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)},
                        },
                    },
                    {
                        $group: {
                            _id: {$dateToString: {format: "%Y-%m-%d", date: "$createdAt"}},
                            count: {$sum: 1},
                            ips: {$addToSet: "$ip"},
                        },
                    },
                    {$sort: {_id: 1}},
                ]),
            ]);

            const ips = userLogs.map((l) => l.ip).filter((ip): ip is string => Boolean(ip));
            const uniqueIPs = Array.from(new Set(ips));
            const enrichedLogs = userLogs.map((log) => ({
                ...log,
                parsedUA: parseUserAgent(log.userAgent ?? ""),
            }));
            // const uniqueIPs = [...new Set(userLogs.map((l) => (l as Record<string, unknown>).ip as string).filter(Boolean))];
            // const enrichedLogs = userLogs.map((log) => ({
            //     ...log,
            //     parsedUA: parseUserAgent((log as Record<string, unknown>).userAgent as string ?? ""),
            // }));

            return NextResponse.json({
                success: true,
                data: {user, logs: enrichedLogs, loginStats, uniqueIPs, totalActions: userLogs.length},
            });
        }

        // ── Stats only ────────────────────────────────────────────────────────────
        if (statsOnly) {
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const [total24h, logins24h, uniqueUsers24h, topActions, activityByHour] = await Promise.all([
                ActivityLogModel.countDocuments({createdAt: {$gte: last24h}}),
                ActivityLogModel.countDocuments({action: "user.login", createdAt: {$gte: last24h}}),
                ActivityLogModel.distinct("userId", {createdAt: {$gte: last24h}}),
                ActivityLogModel.aggregate([
                    {$match: {createdAt: {$gte: last7d}}},
                    {$group: {_id: "$action", count: {$sum: 1}}},
                    {$sort: {count: -1}},
                    {$limit: 5},
                ]),
                ActivityLogModel.aggregate([
                    {$match: {createdAt: {$gte: last24h}}},
                    {$group: {_id: {$hour: "$createdAt"}, count: {$sum: 1}}},
                    {$sort: {_id: 1}},
                ]),
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    total24h,
                    logins24h,
                    uniqueUsers24h: uniqueUsers24h.length,
                    topActions,
                    activityByHour,
                },
            });
        }

        // ── Main feed ─────────────────────────────────────────────────────────────
        const query: Record<string, unknown> = {};
        if (userId) query.userId = userId;
        if (category) query.category = category;
        if (action) query.action = action;
        if (ip) query.ip = ip;
        if (from || to) {
            query.createdAt = {
                ...(from && {$gte: new Date(from)}),
                ...(to && {$lte: new Date(to)}),
            };
        }

        const [logs, total, suspiciousUsers] = await Promise.all([
            ActivityLogModel.find(query)
                .sort({createdAt: -1})
                .limit(limit)
                .populate("userId", "name email image role plan")
                .lean(),
            ActivityLogModel.countDocuments(query),
            ActivityLogModel.aggregate([
                {
                    $match: {
                        action: "user.login",
                        createdAt: {$gte: new Date(Date.now() - 60 * 60 * 1000)},
                    },
                },
                {$group: {_id: {userId: "$userId", ip: "$ip"}, count: {$sum: 1}}},
                {$match: {count: {$gte: 5}}},
            ]),
        ]);

        // Enrich with parsed UA
        const enrichedLogs = logs.map((log) => ({
            ...log,
            parsedUA: parseUserAgent((log as Record<string, unknown>).userAgent as string ?? ""),
        }));

        // Top IPs in result set
        const ipCounts: Record<string, number> = {};
        enrichedLogs.forEach((log) => {
            const logIp = (log as Record<string, unknown>).ip as string;
            if (logIp && logIp !== "unknown") ipCounts[logIp] = (ipCounts[logIp] ?? 0) + 1;
        });
        const topIPs = Object.entries(ipCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ip, count]) => ({ip, count}));

        return NextResponse.json({
            success: true,
            data: enrichedLogs,
            suspicious: suspiciousUsers,
            topIPs,
            total,
        });
    } catch (error) {
        console.error("[SUPER_ADMIN_ACTIVITY]", error);
        return NextResponse.json({success: false, error: "Failed to fetch activity"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import ActivityLogModel from "@/models/ActivityLog";
//
// // GET /api/super-admin/activity?userId=&category=&limit=50
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session || session.user.role !== "super_admin") {
//             return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//         }
//
//         const {searchParams} = new URL(req.url);
//         const userId = searchParams.get("userId");
//         const category = searchParams.get("category");
//         const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
//
//         await connectDB();
//
//         const query: Record<string, unknown> = {};
//         if (userId) query.userId = userId;
//         if (category) query.category = category;
//
//         const logs = await ActivityLogModel.find(query)
//             .sort({createdAt: -1})
//             .limit(limit)
//             .populate("userId", "name email image role plan")
//             .lean();
//
//         // Detect suspicious activity: >10 logins in last hour from same IP
//         const suspiciousUsers = await ActivityLogModel.aggregate([
//             {
//                 $match: {
//                     action: "user.login",
//                     createdAt: {$gte: new Date(Date.now() - 60 * 60 * 1000)},
//                 },
//             },
//             {$group: {_id: {userId: "$userId", ip: "$ip"}, count: {$sum: 1}}},
//             {$match: {count: {$gte: 10}}},
//         ]);
//
//         return NextResponse.json({success: true, data: logs, suspicious: suspiciousUsers});
//     } catch (error) {
//         console.error("[SUPER_ADMIN_ACTIVITY]", error);
//         return NextResponse.json({success: false, error: "Failed to fetch activity"}, {status: 500});
//     }
// }