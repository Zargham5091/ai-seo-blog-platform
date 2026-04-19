import {notFound} from "next/navigation";
import Link from "next/link";
import {connectDB} from "@/lib/db";
import TenantDomainModel, {ITenantDomainDocument} from "@/models/TenantDomain";
import UserModel from "@/models/User";
import BlogModel, {IBlogDocument} from "@/models/Blog";
import {formatDate} from "@/lib/utils";
import {Clock, Eye} from "lucide-react";
import type {Metadata} from "next";

// ─── Shared lookup ────────────────────────────────────────────────────────────

export async function getTenantBySubdomain(subdomain: string) {
    await connectDB();
    return TenantDomainModel.findOne({subdomain, isActive: true}).lean() as Promise<ITenantDomainDocument | null>;
}

export async function getTenantByCustomDomain(domain: string) {
    await connectDB();
    return TenantDomainModel.findOne({
        customDomain: domain,
        customDomainVerified: true,
        isActive: true,
    }).lean() as Promise<ITenantDomainDocument | null>;
}

export async function buildTenantMetadata(
    tenant: ITenantDomainDocument,
    overrides?: Partial<Metadata>
): Promise<Metadata> {
    return {
        title: tenant.defaultMetaTitle || tenant.siteName || "Blog",
        description: tenant.defaultMetaDescription || tenant.siteDescription,
        openGraph: {
            images: tenant.defaultOgImage ? [tenant.defaultOgImage] : [],
            siteName: tenant.siteName,
        },
        ...overrides,
    };
}

// ─── Blog list renderer ───────────────────────────────────────────────────────

interface TenantBlogListProps {
    tenant: ITenantDomainDocument;
    baseHref?: string; // prefix for blog post links e.g. "" or "/blog"
}

export async function TenantBlogList({tenant, baseHref = ""}: TenantBlogListProps) {
    const owner = await UserModel.findById(tenant.userId).select("name image").lean() as Record<string, unknown> | null;
    if (!owner) notFound();

    const blogs = await BlogModel.find({tenantId: tenant.userId, status: "published"})
        .sort({publishedAt: -1})
        .limit(12)
        .lean();

    const primaryColor = tenant.primaryColor || "#4F46E5";
    const siteName = tenant.siteName || "Blog";

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        {tenant.siteLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={tenant.siteLogo} alt={siteName} className="h-8 w-auto"/>
                        ) : (
                            <div
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{background: primaryColor}}
                            >
                                {siteName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span className="font-bold text-lg">{siteName}</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        {(tenant.navLinks || []).map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section
                className="py-20 text-center"
                style={{background: `linear-gradient(135deg, ${primaryColor}15, transparent)`}}
            >
                <div className="container mx-auto px-4">
                    <div className="flex justify-center mb-4">
                        {owner.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={owner.image as string}
                                alt={owner.name as string}
                                className="h-16 w-16 rounded-full object-cover border-4 border-background shadow-lg"
                            />
                        ) : (
                            <div
                                className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                style={{background: primaryColor}}
                            >
                                {(owner.name as string)?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{siteName}</h1>
                    {tenant.siteDescription && (
                        <p className="text-muted-foreground text-lg max-w-xl mx-auto">{tenant.siteDescription}</p>
                    )}
                </div>
            </section>

            {/* Blog grid */}
            <main className="container mx-auto px-4 py-16">
                {blogs.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-lg">No posts published yet.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((blog) => (
                            <Link key={String(blog._id)} href={`${baseHref}/blog/${blog.slug}`} className="group block">
                                <article
                                    className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                                    {blog.coverImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={blog.coverImage} alt={blog.title}
                                             className="w-full h-48 object-cover"/>
                                    ) : (
                                        <div
                                            className="w-full h-48 flex items-center justify-center text-4xl"
                                            style={{background: `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}20)`}}
                                        >
                                            📝
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {(blog.tags as string[])?.slice(0, 2).map((tag: string) => (
                                                <span
                                                    key={tag}
                                                    className="text-xs px-2.5 py-1 rounded-full capitalize font-medium"
                                                    style={{background: `${primaryColor}20`, color: primaryColor}}
                                                >
                          {tag}
                        </span>
                                            ))}
                                        </div>
                                        <h2 className="font-bold text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
                                            {blog.title}
                                        </h2>
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{blog.excerpt}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5"/> {blog.readTime} min
                      </span>
                                            <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5"/> {blog.viewCount}
                      </span>
                                            <span className="ml-auto">
                        {blog.publishedAt
                            ? formatDate(blog.publishedAt as Date, {month: "short", day: "numeric"})
                            : ""}
                      </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <footer className="border-t py-8 text-center text-sm text-muted-foreground">
                <p>
                    {siteName} · Powered by{" "}
                    <a
                        href={process.env.NEXT_PUBLIC_APP_URL ?? "/"}
                        style={{color: primaryColor}}
                        className="hover:opacity-80 transition-opacity"
                    >
                        SEO Platform
                    </a>
                </p>
            </footer>
        </div>
    );
}

// ─── Single post renderer ─────────────────────────────────────────────────────

interface TenantPostProps {
    tenant: ITenantDomainDocument;
    slug: string;
    backHref?: string;
}

export async function TenantPost({tenant, slug, backHref = "/"}: TenantPostProps) {
    const blog = await BlogModel.findOneAndUpdate(
        {slug, tenantId: tenant.userId, status: "published"},
        {$inc: {viewCount: 1}},
        {new: true}
    ).lean<IBlogDocument>();

    if (!blog) notFound();

    const primaryColor = tenant.primaryColor || "#4F46E5";
    const siteName = tenant.siteName || "Blog";
    const seo = blog.seo as Record<string, unknown> | undefined;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        datePublished: (blog.publishedAt as Date)?.toISOString(),
        dateModified: (blog.updatedAt as Date)?.toISOString(),
        image: blog.coverImage,
        author: {"@type": "Organization", name: siteName},
        keywords: (seo?.keywords as string[])?.join(", "),
    };

    return (
        <div className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
            />

            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{background: primaryColor}}
                        >
                            {siteName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-lg">{siteName}</span>
                    </Link>
                    <Link
                        href={backHref}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← All Posts
                    </Link>
                </div>
            </header>

            <article className="py-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(blog.tags as string[])?.map((tag: string) => (
                            <span
                                key={tag}
                                className="text-xs px-2.5 py-1 rounded-full capitalize font-medium"
                                style={{background: `${primaryColor}20`, color: primaryColor}}
                            >
                {tag}
              </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">{blog.title as string}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
                        {blog.publishedAt && (
                            <span>{formatDate(blog.publishedAt as Date)}</span>
                        )}
                        <span className="flex items-center gap-1"><Clock
                            className="h-4 w-4"/> {blog.readTime as number} min</span>
                        <span className="flex items-center gap-1"><Eye
                            className="h-4 w-4"/> {blog.viewCount as number} views</span>
                    </div>

                    {blog.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={blog.coverImage as string}
                            alt={blog.title as string}
                            className="w-full rounded-2xl mb-8 object-cover max-h-96"
                        />
                    )}

                    <div
                        className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-img:rounded-xl prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-pre:bg-zinc-950 prose-blockquote:border-l-4"
                        dangerouslySetInnerHTML={{__html: blog.content as string}}
                    />

                    {(blog.tags as string[])?.length > 0 && (
                        <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
                            {(blog.tags as string[]).map((tag: string) => (
                                <span key={tag}
                                      className="text-xs px-3 py-1.5 rounded-full capitalize border">#{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </article>

            <footer className="border-t py-8 text-center text-sm text-muted-foreground">
                <p>
                    {siteName} · Powered by{" "}
                    <a href={process.env.NEXT_PUBLIC_APP_URL ?? "/"} style={{color: primaryColor}}>
                        SEO Platform
                    </a>
                </p>
            </footer>
        </div>
    );
}

// ─── Post metadata builder ────────────────────────────────────────────────────

export async function buildPostMetadata(
    tenant: ITenantDomainDocument,
    slug: string
): Promise<Metadata> {
    await connectDB();
    const blog = await BlogModel.findOne({
        slug,
        tenantId: tenant.userId,
        status: "published",
    }).lean<IBlogDocument>();

    if (!blog) return {title: "Post Not Found"};

    const seo = blog.seo;

    return {
        title: (seo?.metaTitle as string) || (blog.title as string),
        description: (seo?.metaDescription as string) || (blog.excerpt as string),
        keywords: seo?.keywords as string[],
        openGraph: {
            title: (seo?.ogTitle as string) || (blog.title as string),
            description: (seo?.ogDescription as string) || (blog.excerpt as string),
            images: (seo?.ogImage as string)
                ? [(seo.ogImage as string)]
                : (blog.coverImage as string)
                    ? [(blog.coverImage as string)]
                    : [],
            type: "article",
            publishedTime: (blog.publishedAt as Date)?.toISOString(),
        },
    };
}
