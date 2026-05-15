import {NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import TenantDomainModel from "@/models/TenantDomain";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        await connectDB();

        const [sites, tenantDomain] = await Promise.all([
            UserSiteModel.find({userId: session.user.id})
                .select("siteName siteType isPublished publishedAt pages theme createdAt updatedAt")
                .sort({updatedAt: -1})
                .lean(),
            TenantDomainModel.findOne({userId: session.user.id})
                .select("subdomain customDomain")
                .lean() as Promise<{ subdomain?: string; customDomain?: string } | null>,
        ]);

        // Attach subdomain/customDomain from TenantDomain onto each site
        const enriched = sites.map(site => ({
            ...site,
            subdomain: tenantDomain?.subdomain ?? null,
            customDomain: tenantDomain?.customDomain ?? null,
        }));

        return NextResponse.json({success: true, data: enriched});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}