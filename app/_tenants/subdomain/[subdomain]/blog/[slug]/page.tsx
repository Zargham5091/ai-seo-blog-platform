import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {connectDB} from "@/lib/db";
import TenantDomainModel from "@/models/TenantDomain";
import type {ITenantDomainDocument} from "@/models/TenantDomain";
import {TenantPost, buildPostMetadata} from "@/lib/tenant-renderer";

interface Props {
    params: { subdomain: string; slug: string };
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    await connectDB();
    const tenant = await TenantDomainModel.findOne({
        subdomain: params.subdomain,
        isActive: true,
    }).lean() as ITenantDomainDocument | null;

    if (!tenant) return {title: "Not Found"};
    return buildPostMetadata(tenant, params.slug);
}

export default async function SubdomainBlogPost({params}: Props) {
    await connectDB();
    const tenant = await TenantDomainModel.findOne({
        subdomain: params.subdomain,
        isActive: true,
    }).lean() as ITenantDomainDocument | null;

    if (!tenant) notFound();
    return <TenantPost tenant={tenant} slug={params.slug}/>;
}

// import {notFound} from "next/navigation";
// import type {Metadata} from "next";
// import {getTenantBySubdomain, TenantPost, buildPostMetadata} from "@/lib/tenant-renderer";
//
// type Props = { params: { subdomain: string; slug: string } };
//
// export async function generateMetadata({params}: Props): Promise<Metadata> {
//     const tenant = await getTenantBySubdomain(params.subdomain);
//     if (!tenant) return {title: "Not Found"};
//     return buildPostMetadata(tenant, params.slug);
// }
//
// export default async function SubdomainBlogPost({params}: Props) {
//     const tenant = await getTenantBySubdomain(params.subdomain);
//     if (!tenant) notFound();
//     return <TenantPost tenant={tenant} slug={params.slug}/>;
// }
