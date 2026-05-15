import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {connectDB} from "@/lib/db";
import TenantDomainModel from "@/models/TenantDomain";
import UserSiteModel from "@/models/UserSite";
import type {ITenantDomainDocument} from "@/models/TenantDomain";
import {TenantBlogList, buildTenantMetadata} from "@/lib/tenant-renderer";
import path from "path";
import fs from "fs/promises";

interface Props {
    params: Promise<{ subdomain: string }>;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const {subdomain} = await params;
    await connectDB();
    const tenant = await TenantDomainModel.findOne({
        subdomain,
        isActive: true,
    }).lean() as ITenantDomainDocument | null;
    if (!tenant) return {title: "Not Found"};
    return buildTenantMetadata(tenant);
}

export default async function SubdomainHome({params}: Props) {
    const {subdomain} = await params;
    await connectDB();

    const tenant = await TenantDomainModel.findOne({
        subdomain,
        isActive: true,
    }).lean() as ITenantDomainDocument | null;

    if (!tenant) notFound();

    const userId = tenant.userId.toString();

    // Check if user has a published site builder site
    const site = await (UserSiteModel as any).findOne({userId, isPublished: true})
        .select("_id isPublished").lean() as { _id: unknown; isPublished: boolean } | null;

    if (site) {
        // Try to serve the static HTML file
        const filePath = path.join(process.cwd(), "public", "sites", userId, "index.html");
        try {
            const html = await fs.readFile(filePath, "utf-8");
            // Return raw HTML response — Next.js allows this from a server component via Response
            return new Response(html, {
                headers: {"Content-Type": "text/html; charset=utf-8"},
            }) as unknown as React.ReactElement;
        } catch {
            // File not found — fall through to blog
        }
    }

    // Fallback: show blog list
    return <TenantBlogList tenant={tenant}/>;
}
// import {notFound} from "next/navigation";
// import type {Metadata} from "next";
// import {connectDB} from "@/lib/db";
// import TenantDomainModel from "@/models/TenantDomain";
// import type {ITenantDomainDocument} from "@/models/TenantDomain";
// import {TenantBlogList, buildTenantMetadata} from "@/lib/tenant-renderer";
//
// interface Props {
//     params: { subdomain: string };
// }
//
// export async function generateMetadata({params}: Props): Promise<Metadata> {
//     await connectDB();
//     const tenant = await TenantDomainModel.findOne({
//         subdomain: params.subdomain,
//         isActive: true,
//     }).lean() as ITenantDomainDocument | null;
//
//     if (!tenant) return {title: "Blog Not Found"};
//     return buildTenantMetadata(tenant);
// }
//
// export default async function SubdomainBlogHome({params}: Props) {
//     await connectDB();
//     const tenant = await TenantDomainModel.findOne({
//         subdomain: params.subdomain,
//         isActive: true,
//     }).lean() as ITenantDomainDocument | null;
//
//     if (!tenant) notFound();
//     return <TenantBlogList tenant={tenant}/>;
// }
//
