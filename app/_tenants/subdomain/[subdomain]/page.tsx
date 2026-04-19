import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {getTenantBySubdomain, TenantBlogList, buildTenantMetadata} from "@/lib/tenant-renderer";

type Props = { params: { subdomain: string } };

export async function generateMetadata({params}: Props): Promise<Metadata> {
    const tenant = await getTenantBySubdomain(params.subdomain);
    if (!tenant) return {title: "Blog Not Found"};
    return buildTenantMetadata(tenant);
}

export default async function SubdomainBlogHome({params}: Props) {
    const tenant = await getTenantBySubdomain(params.subdomain);
    if (!tenant) notFound();
    return <TenantBlogList tenant={tenant}/>;
}
