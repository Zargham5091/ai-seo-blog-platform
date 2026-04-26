import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {connectDB} from "@/lib/db";
import TenantDomainModel from "@/models/TenantDomain";
import type {ITenantDomainDocument} from "@/models/TenantDomain";
import {TenantBlogList, buildTenantMetadata} from "@/lib/tenant-renderer";

interface Props {
    params: { subdomain: string };
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
    await connectDB();
    const tenant = await TenantDomainModel.findOne({
        subdomain: params.subdomain,
        isActive: true,
    }).lean() as ITenantDomainDocument | null;

    if (!tenant) return {title: "Blog Not Found"};
    return buildTenantMetadata(tenant);
}

export default async function SubdomainBlogHome({params}: Props) {
    await connectDB();
    const tenant = await TenantDomainModel.findOne({
        subdomain: params.subdomain,
        isActive: true,
    }).lean() as ITenantDomainDocument | null;

    if (!tenant) notFound();
    return <TenantBlogList tenant={tenant}/>;
}


// import {notFound} from "next/navigation";
// import type {Metadata} from "next";
// import {getTenantBySubdomain, TenantBlogList, buildTenantMetadata} from "@/lib/tenant-renderer";
//
// type Props = { params: { subdomain: string } };
//
// export async function generateMetadata({params}: Props): Promise<Metadata> {
//     const tenant = await getTenantBySubdomain(params.subdomain);
//     if (!tenant) return {title: "Blog Not Found"};
//     return buildTenantMetadata(tenant);
// }
//
// export default async function SubdomainBlogHome({params}: Props) {
//     const tenant = await getTenantBySubdomain(params.subdomain);
//     if (!tenant) notFound();
//     return <TenantBlogList tenant={tenant}/>;
// }
