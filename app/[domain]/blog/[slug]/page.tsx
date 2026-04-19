import {notFound} from "next/navigation";
import type {Metadata} from "next";
import Link from "next/link";
import {connectDB} from "@/lib/db";
import TenantDomainModel, {ITenantDomainDocument} from "@/models/TenantDomain";
import BlogModel, {IBlogDocument} from "@/models/Blog";
import {formatDate} from "@/lib/utils";
import {ArrowLeft, Clock, Eye, Calendar} from "lucide-react";

type Props = { params: { domain: string; slug: string } };

export async function generateMetadata({params}: Props): Promise<Metadata> {
    await connectDB();
    const tenant = await TenantDomainModel.findOne({
        subdomain: params.domain,
        isActive: true
    }).lean<ITenantDomainDocument>();
    if (!tenant) return {title: "Not Found"};

    const blog = await BlogModel.findOne({
        slug: params.slug,
        tenantId: tenant.userId,
        status: "published",
    }).lean<IBlogDocument>();
    if (!blog) return {title: "Post Not Found"};

    const siteName = (tenant.siteName as string) || "Blog";
    const seo = blog.seo;

    return {
        title: (seo?.metaTitle as string) || (blog.title as string),
        description: (seo?.metaDescription as string) || (blog.excerpt as string),
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
            siteName,
        },
    };
}

export default async function TenantBlogPost({params}: Props) {
    await connectDB();

    const tenant = await TenantDomainModel.findOne({
        subdomain: params.domain,
        isActive: true,
    }).lean() as Record<string, unknown> | null;

    if (!tenant) notFound();

    // Increment view count and get blog
    const blog = await BlogModel.findOneAndUpdate(
        {slug: params.slug, tenantId: tenant.userId, status: "published"},
        {$inc: {viewCount: 1}},
        {new: true}
    ).lean<IBlogDocument>();

    if (!blog) notFound();

    const siteName = (tenant.siteName as string) || "Blog";
    const primaryColor = (tenant.primaryColor as string) || "#4F46E5";
    const seo = blog.seo as Record<string, unknown> | undefined;

    // JSON-LD
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        datePublished: (blog.publishedAt as Date)?.toISOString(),
        dateModified: (blog.updatedAt as Date)?.toISOString(),
        image: blog.coverImage,
        author: {"@type": "Person", name: tenant.siteName},
        publisher: {
            "@type": "Organization",
            name: siteName,
            url: `https://${params.domain}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000"}`,
        },
        keywords: (seo?.keywords as string[])?.join(", "),
        ...(seo?.structuredData as object ?? {}),
    };

    return (
        <div className="min-h-screen bg-background">
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
            />

            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                            style={{background: primaryColor}}
                        >
                            {siteName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-lg group-hover:opacity-80 transition-opacity">
              {siteName}
            </span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4"/> All Posts
                    </Link>
                </div>
            </header>

            {/* Article */}
            <article className="py-16">
                <div className="container mx-auto px-4 max-w-3xl">
                    {/* Tags */}
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

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
                        {blog.title as string}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
                        {blog.publishedAt && (
                            <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4"/>
                                {formatDate(blog.publishedAt as Date)}
              </span>
                        )}
                        <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4"/> {blog.readTime as number} min read
            </span>
                        <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4"/> {blog.viewCount as number} views
            </span>
                    </div>

                    {/* Cover image */}
                    {blog.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={blog.coverImage as string}
                            alt={blog.title as string}
                            className="w-full rounded-2xl mb-8 object-cover max-h-96"
                        />
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-img:rounded-xl prose-code:bg-muted prose-code:rounded prose-code:px-1
              prose-pre:bg-zinc-950 prose-blockquote:border-l-4"
                        style={
                            {
                                "--tw-prose-links": primaryColor,
                                "prose-a:color": primaryColor,
                            } as React.CSSProperties
                        }
                        dangerouslySetInnerHTML={{__html: blog.content as string}}
                    />

                    {/* Tags footer */}
                    {(blog.tags as string[])?.length > 0 && (
                        <div className="mt-12 pt-8 border-t flex flex-wrap gap-2">
                            {(blog.tags as string[]).map((tag: string) => (
                                <span
                                    key={tag}
                                    className="text-xs px-3 py-1.5 rounded-full capitalize border"
                                >
                  #{tag}
                </span>
                            ))}
                        </div>
                    )}
                </div>
            </article>

            {/* Footer */}
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
