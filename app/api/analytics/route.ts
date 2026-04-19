import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import BlogModel from "@/models/Blog";
import UserModel, {IUserDocument} from "@/models/User";
import SubscriptionModel from "@/models/Subscription";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const type = searchParams.get("type") ?? "dashboard";

        // ── Admin dashboard stats ─────────────────────────────────────────────
        if (type === "dashboard") {
            const [totalBlogs, publishedBlogs, draftBlogs, user, viewAgg] = await Promise.all([
                BlogModel.countDocuments({tenantId: session.user.id}),
                BlogModel.countDocuments({tenantId: session.user.id, status: "published"}),
                BlogModel.countDocuments({tenantId: session.user.id, status: "draft"}),
                UserModel.findById(session.user.id).lean<IUserDocument>(),
                BlogModel.aggregate([
                    {$match: {tenantId: session.user.id}},
                    {
                        $group: {
                            _id: null,
                            totalViews: {$sum: "$viewCount"},
                            avgSEOScore: {$avg: "$seo.seoScore"},
                        },
                    },
                ]),
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    totalBlogs,
                    publishedBlogs,
                    draftBlogs,
                    totalViews: viewAgg[0]?.totalViews ?? 0,
                    avgSEOScore: Math.round(viewAgg[0]?.avgSEOScore ?? 0),
                    aiCreditsUsed: user?.aiCreditsUsed ?? 0,
                    aiCreditsLimit: user?.aiCreditsLimit ?? 10,
                },
            });
        }

        // ── Views per published post (for chart) ──────────────────────────────
        if (type === "views") {
            const blogs = await BlogModel.find(
                {tenantId: session.user.id, status: "published"},
                "title viewCount publishedAt"
            )
                .sort({publishedAt: -1})
                .limit(10)
                .lean();

            const data = blogs.map((b) => ({
                date: (b.title as string)?.slice(0, 18) ?? "Post",
                views: (b.viewCount as number) ?? 0,
            }));

            return NextResponse.json({success: true, data});
        }

        // ── Top posts by views ────────────────────────────────────────────────
        if (type === "top_posts") {
            const posts = await BlogModel.find(
                {tenantId: session.user.id, status: "published"},
                "title slug viewCount seo"
            )
                .sort({viewCount: -1})
                .limit(5)
                .lean();

            return NextResponse.json({success: true, data: posts});
        }

        // ── Super admin: platform stats ───────────────────────────────────────
        if (type === "super_admin") {
            if (session.user.role !== "super_admin") {
                return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const [totalUsers, activeSubscriptions, newUsersThisMonth, planDist, revenueAgg] =
                await Promise.all([
                    UserModel.countDocuments(),
                    SubscriptionModel.countDocuments({status: "active"}),
                    UserModel.countDocuments({createdAt: {$gte: startOfMonth}}),
                    UserModel.aggregate([{$group: {_id: "$plan", count: {$sum: 1}}}]),
                    SubscriptionModel.aggregate([
                        {$match: {status: "active"}},
                        {$group: {_id: null, total: {$sum: "$amount"}}},
                    ]),
                ]);

            const planDistribution = planDist.reduce(
                (acc: Record<string, number>, p: { _id: string; count: number }) => ({
                    ...acc,
                    [p._id]: p.count,
                }),
                {}
            );

            return NextResponse.json({
                success: true,
                data: {
                    totalUsers,
                    activeSubscriptions,
                    newUsersThisMonth,
                    totalRevenue: revenueAgg[0]?.total ?? 0,
                    planDistribution,
                },
            });
        }

        // ── Super admin: MRR trend last 6 months ──────────────────────────────
        if (type === "mrr_trend") {
            if (session.user.role !== "super_admin") {
                return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
            }

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const trend = await SubscriptionModel.aggregate([
                {$match: {status: "active", createdAt: {$gte: sixMonthsAgo}}},
                {
                    $group: {
                        _id: {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                        },
                        mrr: {$sum: "$amount"},
                        newSubs: {$sum: 1},
                    },
                },
                {$sort: {"_id.year": 1, "_id.month": 1}},
            ]);

            const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const data = trend.map((t: { _id: { year: number; month: number }; mrr: number; newSubs: number }) => ({
                month: MONTHS[t._id.month - 1],
                mrr: Math.round(t.mrr),
                newSubs: t.newSubs,
            }));

            return NextResponse.json({success: true, data});
        }

        // ── Super admin: user growth last 6 months ────────────────────────────
        if (type === "user_growth") {
            if (session.user.role !== "super_admin") {
                return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
            }

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const growth = await UserModel.aggregate([
                {$match: {createdAt: {$gte: sixMonthsAgo}}},
                {
                    $group: {
                        _id: {
                            year: {$year: "$createdAt"},
                            month: {$month: "$createdAt"},
                        },
                        users: {$sum: 1},
                    },
                },
                {$sort: {"_id.year": 1, "_id.month": 1}},
            ]);

            const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const data = growth.map((g: { _id: { year: number; month: number }; users: number }) => ({
                month: MONTHS[g._id.month - 1],
                users: g.users,
            }));

            return NextResponse.json({success: true, data});
        }

        return NextResponse.json({success: false, error: "Invalid analytics type"}, {status: 400});
    } catch (error) {
        console.error("[ANALYTICS]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import BlogModel from "@/models/Blog";
// import UserModel from "@/models/User";
// import SubscriptionModel from "@/models/Subscription";
//
// export async function GET(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//     const { searchParams } = new URL(req.url);
//     const type = searchParams.get("type") ?? "dashboard";
//
//     if (type === "dashboard") {
//       const [totalBlogs, publishedBlogs, draftBlogs, user] = await Promise.all([
//         BlogModel.countDocuments({ tenantId: session.user.id }),
//         BlogModel.countDocuments({ tenantId: session.user.id, status: "published" }),
//         BlogModel.countDocuments({ tenantId: session.user.id, status: "draft" }),
//         UserModel.findById(session.user.id).lean(),
//       ]);
//
//       const viewAgg = await BlogModel.aggregate([
//         { $match: { tenantId: session.user.id } },
//         { $group: { _id: null, totalViews: { $sum: "$viewCount" }, avgSEOScore: { $avg: "$seo.seoScore" } } },
//       ]);
//
//       return NextResponse.json({
//         success: true,
//         data: {
//           totalBlogs,
//           publishedBlogs,
//           draftBlogs,
//           totalViews: viewAgg[0]?.totalViews ?? 0,
//           avgSEOScore: Math.round(viewAgg[0]?.avgSEOScore ?? 0),
//           aiCreditsUsed: user?.aiCreditsUsed ?? 0,
//           aiCreditsLimit: user?.aiCreditsLimit ?? 10,
//         },
//       });
//     }
//
//     if (type === "super_admin" && session.user.role === "super_admin") {
//       const now = new Date();
//       const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//
//       const [totalUsers, activeSubscriptions, newUsersThisMonth, planDist] = await Promise.all([
//         UserModel.countDocuments(),
//         SubscriptionModel.countDocuments({ status: "active" }),
//         UserModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
//         UserModel.aggregate([{ $group: { _id: "$plan", count: { $sum: 1 } } }]),
//       ]);
//
//       const revenueAgg = await SubscriptionModel.aggregate([
//         { $match: { status: "active" } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]);
//
//       const planDistribution = planDist.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {});
//
//       return NextResponse.json({
//         success: true,
//         data: {
//           totalUsers,
//           activeSubscriptions,
//           newUsersThisMonth,
//           totalRevenue: revenueAgg[0]?.total ?? 0,
//           planDistribution,
//         },
//       });
//     }
//
//     return NextResponse.json({ success: false, error: "Invalid analytics type" }, { status: 400 });
//   } catch (error) {
//     console.error("[ANALYTICS]", error);
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
