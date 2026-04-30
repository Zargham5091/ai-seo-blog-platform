import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import BlogModel from "@/models/Blog";
import UserModel, {IUserDocument} from "@/models/User";
import RankTrackingModel from "@/models/RankTracking";
import TenantDomainModel from "@/models/TenantDomain";
import type {IBlogDocument} from "@/models/Blog";
import type {IRankTrackingDocument} from "@/models/RankTracking";
import type {ITenantDomainDocument} from "@/models/TenantDomain";
import {canWrite, getTenantContext} from "@/lib/tenant";

// GET /api/reports — get report data for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }
        const tenant = await getTenantContext(session.user.id);

        await connectDB();

        const [blogs, rankTracking, domain, user] = await Promise.all([
            BlogModel.find({tenantId: tenant.tenantId})
                .select("title slug status viewCount readTime seo publishedAt createdAt")
                .sort({publishedAt: -1})
                .lean<IBlogDocument[]>(),
            RankTrackingModel.find({tenantId: tenant.tenantId, isActive: true})
                .select("keyword currentPosition previousPosition bestPosition snapshots")
                .lean<IRankTrackingDocument[]>(),
            TenantDomainModel.findOne({userId: tenant.tenantId})
                .lean<ITenantDomainDocument>(),
            UserModel.findById(tenant.tenantId)
                .select("name email plan aiCreditsUsed aiCreditsLimit createdAt")
                .lean<IUserDocument>(),
        ]);

        const published = blogs.filter((b) => b.status === "published");
        const totalViews = published.reduce((sum, b) => sum + ((b.viewCount as number) ?? 0), 0);
        const avgSEO = published.length > 0
            ? Math.round(published.reduce((sum, b) => sum + ((b.seo)?.seoScore ?? 0), 0) / published.length)
            : 0;

        const topRankingKws = rankTracking
            .filter((r) => r.currentPosition !== null)
            .sort((a, b) => (a.currentPosition ?? 999) - (b.currentPosition ?? 999))
            .slice(0, 10);

        const improvedKws = rankTracking.filter(
            (r) => r.currentPosition !== null && r.previousPosition !== null && r.currentPosition < r.previousPosition
        ).length;

        return NextResponse.json({
            success: true,
            data: {
                generatedAt: new Date().toISOString(),
                period: "Last 30 days",
                // Site info
                siteName: (domain?.siteName as string) ?? (user)?.name ?? "My Blog",
                subdomain: domain?.subdomain,
                plan: session.user.plan,
                // Summary metrics
                summary: {
                    totalPosts: blogs.length,
                    publishedPosts: published.length,
                    draftPosts: blogs.length - published.length,
                    totalViews,
                    avgSEOScore: avgSEO,
                    trackedKeywords: rankTracking.length,
                    improvedKeywords: improvedKws,
                },
                // Top posts
                topPosts: published
                    .sort((a, b) => ((b.viewCount as number) ?? 0) - ((a.viewCount as number) ?? 0))
                    .slice(0, 5)
                    .map((b) => ({
                        title: b.title,
                        slug: b.slug,
                        views: b.viewCount,
                        seoScore: (b.seo)?.seoScore ?? 0,
                        publishedAt: b.publishedAt,
                    })),
                // Keyword rankings
                topKeywords: topRankingKws.map((r) => ({
                    keyword: r.keyword,
                    position: r.currentPosition,
                    previousPosition: r.previousPosition,
                    bestPosition: r.bestPosition,
                })),
                // Recent posts
                recentPosts: blogs.slice(0, 10).map((b) => ({
                    title: b.title,
                    status: b.status,
                    views: b.viewCount,
                    createdAt: b.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("[REPORTS_GET]", error);
        return NextResponse.json({success: false, error: "Failed to generate report"}, {status: 500});
    }
}
