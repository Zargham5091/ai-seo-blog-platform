import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {getTenantByCustomDomain, TenantBlogList, buildTenantMetadata} from "@/lib/tenant-renderer";

type Props = { params: { domain: string } };

export async function generateMetadata({params}: Props): Promise<Metadata> {
    // domain param is URL-encoded e.g. "lisa.com"
    const domain = decodeURIComponent(params.domain);
    const tenant = await getTenantByCustomDomain(domain);
    if (!tenant) return {title: "Blog Not Found"};
    return buildTenantMetadata(tenant);
}

export default async function CustomDomainBlogHome({params}: Props) {
    const domain = decodeURIComponent(params.domain);
    const tenant = await getTenantByCustomDomain(domain);
    if (!tenant) notFound();
    return <TenantBlogList tenant={tenant}/>;
}
