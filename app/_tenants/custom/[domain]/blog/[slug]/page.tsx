import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {getTenantByCustomDomain, TenantPost, buildPostMetadata} from "@/lib/tenant-renderer";

type Props = { params: { domain: string; slug: string } };

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const domain = decodeURIComponent(params.domain);
    const tenant = await getTenantByCustomDomain(domain);
    if (!tenant) return {title: "Not Found"};
    return buildPostMetadata(tenant, params.slug);
}

export default async function CustomDomainBlogPost({params}: Props) {
    const domain = decodeURIComponent(params.domain);
    const tenant = await getTenantByCustomDomain(domain);
    if (!tenant) notFound();
    return <TenantPost tenant={tenant} slug={params.slug}/>;
}
