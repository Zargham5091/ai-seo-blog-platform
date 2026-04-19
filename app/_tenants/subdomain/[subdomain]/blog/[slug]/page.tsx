import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {getTenantBySubdomain, TenantPost, buildPostMetadata} from "@/lib/tenant-renderer";

type Props = { params: { subdomain: string; slug: string } };

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const tenant = await getTenantBySubdomain(params.subdomain);
    if (!tenant) return {title: "Not Found"};
    return buildPostMetadata(tenant, params.slug);
}

export default async function SubdomainBlogPost({params}: Props) {
    const tenant = await getTenantBySubdomain(params.subdomain);
    if (!tenant) notFound();
    return <TenantPost tenant={tenant} slug={params.slug}/>;
}
