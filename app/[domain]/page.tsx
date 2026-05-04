// app/[domain]/page.tsx
// Serves the published root "/" page for a user's subdomain or custom domain.

import {NextResponse} from "next/server";
import {NextRequest} from "next/server";
import path from "path";
import fs from "fs/promises";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import UserModel from "@/models/User";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "yourdomain.com").replace(/:\d+$/, "");
const SITES_DIR = path.join(process.cwd(), "public", "sites");

async function resolveUserId(hostname: string): Promise<string | null> {
    await connectDB();
    const host = hostname.replace(/:\d+$/, "");

    if (host.endsWith("." + ROOT_DOMAIN)) {
        const subdomain = host.split(".")[0];
        if (!subdomain || subdomain === "www") return null;
        const user = await UserModel.findOne({siteSubdomain: subdomain}).select("_id").lean();
        return user ? user._id.toString() : null;
    }

    const site = await UserSiteModel.findOne({customDomain: host, customDomainVerified: true}).select("userId").lean();
    return site ? site.userId.toString() : null;
}

function errorPage(title: string, message: string): NextResponse {
    return new NextResponse(
        `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}.c{text-align:center}h1{font-size:2rem;color:#1e293b}p{color:#64748b}</style></head><body><div class="c"><h1>${title}</h1><p>${message}</p></div></body></html>`,
        {status: 404, headers: {"Content-Type": "text/html"}}
    );
}

export async function GET(
    req: NextRequest,
    {params}: { params: { domain: string } }
) {
    try {
        const userId = await resolveUserId(params.domain);
        if (!userId) return errorPage("Site Not Found", "This site has not been set up yet.");

        const site = await UserSiteModel.findOne({userId, isPublished: true}).select("_id").lean();
        if (!site) return errorPage("Coming Soon", "This site is not published yet.");

        const filePath = path.join(SITES_DIR, userId, "index.html");
        try {
            const html = await fs.readFile(filePath, "utf-8");
            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                    "X-Content-Type-Options": "nosniff",
                },
            });
        } catch {
            return errorPage("Not Built", "Publish the site to see it here.");
        }
    } catch (err) {
        console.error("[TENANT_ROOT]", err);
        return errorPage("Server Error", "Something went wrong.");
    }
}

// import {notFound} from "next/navigation";
// import type {Metadata} from "next";
// import Link from "next/link";
// import {connectDB} from "@/lib/db";
// import TenantDomainModel, {ITenantDomainDocument} from "@/models/TenantDomain";
// import UserModel, {IUserDocument} from "@/models/User";
// import BlogModel, {IBlogDocument} from "@/models/Blog";
// import {formatDate} from "@/lib/utils";
// import {Clock, Eye} from "lucide-react";
//
// type Props = { params: Promise<{ domain: string }> };
//
// export async function generateMetadata({params}: Props): Promise<Metadata> {
//     await connectDB();
//     const {domain} = await params;
//     const tenant = await TenantDomainModel.findOne({subdomain: domain, isActive: true}).lean<ITenantDomainDocument>();
//     if (!tenant) return {title: "Blog Not Found"};
//     return {
//         title: (tenant as { siteName?: string; defaultMetaTitle?: string }).defaultMetaTitle || (tenant as {
//             siteName?: string
//         }).siteName || "Blog",
//         description: (tenant as { defaultMetaDescription?: string }).defaultMetaDescription || (tenant as {
//             siteDescription?: string
//         }).siteDescription,
//         openGraph: {
//             images: (tenant as { defaultOgImage?: string }).defaultOgImage ? [(tenant as {
//                 defaultOgImage?: string
//             }).defaultOgImage!] : [],
//         },
//     };
// }
//
// export default async function TenantBlogHome({params}: Props) {
//     await connectDB();
//     const {domain} = await params;
//
//     const tenant = await TenantDomainModel.findOne({
//         subdomain: domain,
//         isActive: true,
//     }).lean<ITenantDomainDocument>();
//
//     if (!tenant) notFound();
//
//     const owner = await UserModel.findById(tenant.userId).select("name email image").lean<IUserDocument>();
//     if (!owner) notFound();
//
//     const blogs = await BlogModel.find({
//         tenantId: tenant.userId,
//         status: "published",
//     })
//         .sort({publishedAt: -1})
//         .limit(12)
//         .lean<IBlogDocument[]>();
//
//     const siteName = (tenant.siteName as string) || "Blog";
//     const siteDescription = (tenant.siteDescription as string) || "";
//     const primaryColor = (tenant.primaryColor as string) || "#4F46E5";
//
//     return (
//         <div className="min-h-screen bg-background">
//             {/* Header */}
//             <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
//                 <div className="container mx-auto px-4 h-16 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                         {tenant.siteLogo ? (
//                             // eslint-disable-next-line @next/next/no-img-element
//                             <img src={tenant.siteLogo as string} alt={siteName} className="h-8 w-auto"/>
//                         ) : (
//                             <div
//                                 className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
//                                 style={{background: primaryColor}}
//                             >
//                                 {siteName.charAt(0).toUpperCase()}
//                             </div>
//                         )}
//                         <span className="font-bold text-lg">{siteName}</span>
//                     </div>
//
//                     {/* Custom nav links */}
//                     <nav className="hidden md:flex items-center gap-6">
//                         {((tenant.navLinks as { label: string; href: string }[]) || []).map((link) => (
//                             <a
//                                 key={link.href}
//                                 href={link.href}
//                                 className="text-sm text-muted-foreground hover:text-foreground transition-colors"
//                             >
//                                 {link.label}
//                             </a>
//                         ))}
//                     </nav>
//                 </div>
//             </header>
//
//             {/* Hero */}
//             <section
//                 className="py-20 text-center"
//                 style={{background: `linear-gradient(135deg, ${primaryColor}15, transparent)`}}
//             >
//                 <div className="container mx-auto px-4">
//                     {/* Author avatar */}
//                     <div className="flex justify-center mb-4">
//                         {owner.image ? (
//                             // eslint-disable-next-line @next/next/no-img-element
//                             <img
//                                 src={owner.image as string}
//                                 alt={owner.name as string}
//                                 className="h-16 w-16 rounded-full object-cover border-4 border-background shadow-lg"
//                             />
//                         ) : (
//                             <div
//                                 className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 border-background shadow-lg"
//                                 style={{background: primaryColor}}
//                             >
//                                 {(owner.name as string)?.charAt(0).toUpperCase()}
//                             </div>
//                         )}
//                     </div>
//                     <h1 className="text-4xl md:text-5xl font-bold mb-4">{siteName}</h1>
//                     {siteDescription && (
//                         <p className="text-muted-foreground text-lg max-w-xl mx-auto">{siteDescription}</p>
//                     )}
//                     {/* Social links */}
//                     {tenant.social && Object.values(tenant.social as Record<string, string>).some(Boolean) && (
//                         <div className="flex items-center justify-center gap-4 mt-6">
//                             {Object.entries(tenant.social as Record<string, string>).map(([key, val]) =>
//                                 val ? (
//                                     <a
//                                         key={key}
//                                         href={val}
//                                         target="_blank"
//                                         rel="noreferrer"
//                                         className="text-sm text-muted-foreground hover:text-foreground transition-colors capitalize"
//                                     >
//                                         {key}
//                                     </a>
//                                 ) : null
//                             )}
//                         </div>
//                     )}
//                 </div>
//             </section>
//
//             {/* Blog grid */}
//             <main className="container mx-auto px-4 py-16">
//                 {blogs.length === 0 ? (
//                     <div className="text-center py-20 text-muted-foreground">
//                         <p className="text-lg">No posts published yet.</p>
//                     </div>
//                 ) : (
//                     <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//                         {blogs.map((blog) => (
//                             <Link
//                                 key={String(blog._id)}
//                                 href={`/blog/${blog.slug}`}
//                                 className="group block"
//                             >
//                                 <article
//                                     className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
//                                     {blog.coverImage ? (
//                                         // eslint-disable-next-line @next/next/no-img-element
//                                         <img
//                                             src={blog.coverImage}
//                                             alt={blog.title}
//                                             className="w-full h-48 object-cover"
//                                         />
//                                     ) : (
//                                         <div
//                                             className="w-full h-48 flex items-center justify-center text-white text-4xl"
//                                             style={{background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)`}}
//                                         >
//                                             📝
//                                         </div>
//                                     )}
//                                     <div className="p-5 flex flex-col flex-1">
//                                         <div className="flex flex-wrap gap-1.5 mb-3">
//                                             {(blog.tags as string[])?.slice(0, 2).map((tag: string) => (
//                                                 <span
//                                                     key={tag}
//                                                     className="text-xs px-2.5 py-1 rounded-full capitalize font-medium"
//                                                     style={{
//                                                         background: `${primaryColor}20`,
//                                                         color: primaryColor,
//                                                     }}
//                                                 >
//                           {tag}
//                         </span>
//                                             ))}
//                                         </div>
//                                         <h2 className="font-bold text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
//                                             {blog.title}
//                                         </h2>
//                                         <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
//                                             {blog.excerpt}
//                                         </p>
//                                         <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
//                       <span className="flex items-center gap-1">
//                         <Clock className="h-3.5 w-3.5"/> {blog.readTime} min
//                       </span>
//                                             <span className="flex items-center gap-1">
//                         <Eye className="h-3.5 w-3.5"/> {blog.viewCount}
//                       </span>
//                                             <span className="ml-auto">
//                         {blog.publishedAt
//                             ? formatDate(blog.publishedAt as Date, {month: "short", day: "numeric"})
//                             : ""}
//                       </span>
//                                         </div>
//                                     </div>
//                                 </article>
//                             </Link>
//                         ))}
//                     </div>
//                 )}
//             </main>
//
//             {/* Footer */}
//             <footer className="border-t py-8 text-center text-sm text-muted-foreground">
//                 <p>
//                     {siteName} · Powered by{" "}
//                     <a
//                         href={process.env.NEXT_PUBLIC_APP_URL ?? "/"}
//                         className="hover:text-foreground transition-colors"
//                         style={{color: primaryColor}}
//                     >
//                         SEO Platform
//                     </a>
//                 </p>
//             </footer>
//         </div>
//     );
// }
