import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {connectDB} from "@/lib/db";
import BlogModel from "@/models/Blog";
import {formatDate} from "@/lib/utils";
import {Badge} from "@/components/ui/form-elements";
import {Clock, Eye, Calendar, Tag, User} from "lucide-react";
import {BlocksRenderer} from "@/components/blog/BlocksRenderer";
import {TableOfContents, injectHeadingIds} from "@/components/blog/TableOfContents";

type Props = { params: { slug: string } };

export async function generateMetadata({params}: Props): Promise<Metadata> {
    await connectDB();
    const blog = await BlogModel.findOne({
        slug: params.slug,
        status: "published"
    }).lean() as Record<string, unknown> | null;
    if (!blog) return {title: "Post Not Found"};

    const seo = blog.seo as Record<string, unknown> | undefined;
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
        twitter: {
            card: "summary_large_image",
            title: (seo?.metaTitle as string) || (blog.title as string),
            description: (seo?.metaDescription as string) || (blog.excerpt as string),
        },
    };
}

export default async function BlogPostPage({params}: Props) {
    await connectDB();

    const blog = await BlogModel.findOneAndUpdate(
        {slug: params.slug, status: "published"},
        {$inc: {viewCount: 1}},
        {new: true}
    ).lean() as Record<string, unknown> | null;

    if (!blog) notFound();

    const seo = blog.seo as Record<string, unknown> | undefined;
    const blocks = (blog.blocks as {
        id: string;
        type: string;
        content: Record<string, unknown>;
        order: number
    }[]) ?? [];
    const tags = (blog.tags as string[]) ?? [];
    const categories = (blog.categories as string[]) ?? [];

    // Inject IDs into headings for table of contents anchor links
    const contentWithIds = injectHeadingIds((blog.content as string) ?? "");

    // Determine if we have rich content to show
    const hasHtmlContent = contentWithIds && contentWithIds.trim().length > 0;
    const hasBlocks = blocks.length > 0;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: blog.title,
        description: blog.excerpt,
        datePublished: (blog.publishedAt as Date)?.toISOString(),
        dateModified: (blog.updatedAt as Date)?.toISOString(),
        image: blog.coverImage,
        author: {"@type": "Organization", name: "SEO Platform"},
        keywords: seo?.keywords ? (seo.keywords as string[]).join(", ") : undefined,
        ...(seo?.structuredData as object ?? {}),
    };

    return (
        <article className="py-10 md:py-16">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{__html: JSON.stringify(structuredData)}}
            />

            {/* Cover image — full width hero */}
            {blog.coverImage && (
                <div className="container mx-auto px-4 max-w-4xl mb-8">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={blog.coverImage as string}
                        alt={blog.title as string}
                        className="w-full rounded-2xl object-cover max-h-[480px] shadow-lg"
                    />
                </div>
            )}

            <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid lg:grid-cols-4 gap-10">

                    {/* ── Main content ────────────────────────────────────────────── */}
                    <div className="lg:col-span-3">
                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {categories.map((cat) => (
                                    <span
                                        key={cat}
                                        className="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                                    >
                    {cat}
                  </span>
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="capitalize text-xs">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-5">
                            {blog.title as string}
                        </h1>

                        {/* Excerpt */}
                        {blog.excerpt && (
                            <p className="text-lg text-muted-foreground leading-relaxed mb-5">
                                {blog.excerpt as string}
                            </p>
                        )}

                        {/* Meta row */}
                        <div
                            className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b mb-8">
                            {blog.publishedAt && (
                                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4"/>
                                    {formatDate(blog.publishedAt as Date)}
                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4"/>
                                {blog.readTime as number} min read
              </span>
                            <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4"/>
                                {blog.viewCount as number} views
              </span>
                            {(blog.isAIGenerated as boolean) && (
                                <Badge variant="info" className="text-xs gap-1">
                                    🤖 AI Generated
                                </Badge>
                            )}
                        </div>

                        {/* Table of contents (client component — scrollspy) */}
                        <TableOfContents
                            htmlContent={contentWithIds}
                            blocks={blocks}
                        />

                        {/* ── Content: HTML (rich text) ─────────────────────────────── */}
                        {hasHtmlContent && (
                            <div
                                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-2xl prose-h3:text-xl
                  prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:shadow-md
                  prose-code:bg-muted prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono
                  prose-pre:bg-zinc-950 prose-pre:rounded-xl prose-pre:shadow-lg
                  prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50/40 dark:prose-blockquote:bg-indigo-950/20 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                  prose-table:text-sm prose-th:bg-muted/50
                  prose-li:my-1"
                                dangerouslySetInnerHTML={{__html: contentWithIds}}
                            />
                        )}

                        {/* ── Content: Blocks ───────────────────────────────────────── */}
                        {hasBlocks && (
                            <div className={hasHtmlContent ? "mt-8 pt-8 border-t" : ""}>
                                <BlocksRenderer blocks={blocks}/>
                            </div>
                        )}

                        {/* Nothing to show */}
                        {!hasHtmlContent && !hasBlocks && (
                            <div className="text-muted-foreground text-center py-16 border-2 border-dashed rounded-xl">
                                <p>No content available for this post.</p>
                            </div>
                        )}

                        {/* Tags footer */}
                        {tags.length > 0 && (
                            <div className="mt-12 pt-8 border-t flex items-center gap-3 flex-wrap">
                                <Tag className="h-4 w-4 text-muted-foreground"/>
                                {tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="capitalize">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ─────────────────────────────────────────────────── */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-6">
                            {/* Post info card */}
                            <div className="rounded-xl border bg-card p-4 space-y-3">
                                <h3 className="text-sm font-semibold">Post Details</h3>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {blog.publishedAt && (
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 shrink-0"/>
                                            <span>{formatDate(blog.publishedAt as Date, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric"
                                            })}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 shrink-0"/>
                                        <span>{blog.readTime as number} min read</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-3.5 w-3.5 shrink-0"/>
                                        <span>{blog.viewCount as number} views</span>
                                    </div>
                                    {categories.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <Tag className="h-3.5 w-3.5 shrink-0 mt-0.5"/>
                                            <span>{categories.join(", ")}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SEO score if available */}
                            {(seo?.seoScore as number) > 0 && (
                                <div className="rounded-xl border bg-card p-4">
                                    <h3 className="text-sm font-semibold mb-2">SEO Score</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                                                style={{width: `${seo.seoScore as number}%`}}
                                            />
                                        </div>
                                        <span className="text-sm font-bold">{seo.seoScore as number}/100</span>
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {tags.length > 0 && (
                                <div className="rounded-xl border bg-card p-4">
                                    <h3 className="text-sm font-semibold mb-3">Tags</h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 transition-colors cursor-pointer"
                                            >
                        #{tag}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </article>
    );
}


// import type { Metadata } from "next";
// import { notFound } from "next/navigation";
// import { connectDB } from "@/lib/db";
// import BlogModel from "@/models/Blog";
// import { formatDate } from "@/lib/utils";
// import { Badge } from "@/components/ui/form-elements";
// import { Clock, Eye, Calendar, Tag } from "lucide-react";
//
// type Props = { params: { slug: string } };
//
// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   await connectDB();
//   const blog = await BlogModel.findOne({ slug: params.slug, status: "published" }).lean();
//   if (!blog) return { title: "Post Not Found" };
//
//   return {
//     title: blog.seo?.metaTitle || blog.title,
//     description: blog.seo?.metaDescription || blog.excerpt,
//     keywords: blog.seo?.keywords,
//     openGraph: {
//       title: blog.seo?.ogTitle || blog.title,
//       description: blog.seo?.ogDescription || blog.excerpt,
//       images: blog.seo?.ogImage ? [blog.seo.ogImage] : blog.coverImage ? [blog.coverImage] : [],
//       type: "article",
//       publishedTime: blog.publishedAt?.toISOString(),
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: blog.seo?.metaTitle || blog.title,
//       description: blog.seo?.metaDescription || blog.excerpt,
//     },
//   };
// }
//
// export default async function BlogPostPage({ params }: Props) {
//   await connectDB();
//   const blog = await BlogModel.findOneAndUpdate(
//     { slug: params.slug, status: "published" },
//     { $inc: { viewCount: 1 } },
//     { new: true }
//   ).lean();
//
//   if (!blog) notFound();
//
//   const structuredData = {
//     "@context": "https://schema.org",
//     "@type": "BlogPosting",
//     headline: blog.title,
//     description: blog.excerpt,
//     datePublished: blog.publishedAt,
//     dateModified: blog.updatedAt,
//     image: blog.coverImage,
//     author: { "@type": "Organization", name: "SEO Platform" },
//     keywords: blog.seo?.keywords?.join(", "),
//     ...(blog.seo?.structuredData ?? {}),
//   };
//
//   return (
//     <article className="py-16">
//       {/* JSON-LD */}
//       <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
//
//       <div className="container mx-auto px-4 max-w-3xl">
//         {/* Tags */}
//         <div className="flex flex-wrap gap-2 mb-4">
//           {blog.tags?.map((tag: string) => (
//             <Badge key={tag} variant="info" className="capitalize">{tag}</Badge>
//           ))}
//         </div>
//
//         {/* Title */}
//         <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">{blog.title}</h1>
//
//         {/* Meta */}
//         <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
//           {blog.publishedAt && (
//             <span className="flex items-center gap-1.5">
//               <Calendar className="h-4 w-4" />
//               {formatDate(blog.publishedAt as Date)}
//             </span>
//           )}
//           <span className="flex items-center gap-1.5">
//             <Clock className="h-4 w-4" /> {blog.readTime} min read
//           </span>
//           <span className="flex items-center gap-1.5">
//             <Eye className="h-4 w-4" /> {blog.viewCount} views
//           </span>
//         </div>
//
//         {/* Cover image */}
//         {blog.coverImage && (
//           // eslint-disable-next-line @next/next/no-img-element
//           <img src={blog.coverImage} alt={blog.title} className="w-full rounded-xl mb-8 object-cover max-h-96" />
//         )}
//
//         {/* Content */}
//         <div
//           className="prose prose-lg dark:prose-invert max-w-none
//             prose-headings:font-bold prose-headings:tracking-tight
//             prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
//             prose-img:rounded-xl prose-code:bg-muted prose-code:rounded prose-code:px-1
//             prose-pre:bg-zinc-950 prose-blockquote:border-l-indigo-500"
//           dangerouslySetInnerHTML={{ __html: blog.content }}
//         />
//
//         {/* Tags footer */}
//         {blog.tags?.length > 0 && (
//           <div className="mt-12 pt-8 border-t flex items-center gap-3 flex-wrap">
//             <Tag className="h-4 w-4 text-muted-foreground" />
//             {blog.tags.map((tag: string) => (
//               <Badge key={tag} variant="outline" className="capitalize">{tag}</Badge>
//             ))}
//           </div>
//         )}
//       </div>
//     </article>
//   );
// }
