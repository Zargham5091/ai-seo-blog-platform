import type {Metadata} from "next";
import Link from "next/link";
import {connectDB} from "@/lib/db";
import BlogModel from "@/models/Blog";
import {formatDate} from "@/lib/utils";
import {Badge} from "@/components/ui/form-elements";
import {Clock, Eye, Star} from "lucide-react";
import type {IBlogDocument} from "@/models/Blog";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";

export const metadata: Metadata = {
    title: "Blog — SEO Platform",
    description: "Expert insights on SEO, AI content generation, and digital marketing.",
};

export const revalidate = 60;

export default async function BlogListPage() {
    await connectDB();
    const session = await getServerSession(authOptions);


    // Show ONLY:
    // 1. Posts that are featured (approved by super admin from user requests)
    // 2. Posts published by super_admin users directly (platform blog)
    const blogs = await BlogModel.find({
        status: "published",
        $or: [
            {isFeatured: true},
        ],
    })
        .sort({featuredAt: -1, publishedAt: -1})
        .limit(24)
        .lean<IBlogDocument[]>();

    return (
        <div className="py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                        Expert insights on SEO, AI content generation, and digital marketing.
                    </p>
                    {!session && (
                        <p className="text-sm text-muted-foreground mt-3">
                            Have great content?{" "}
                            <Link href="/login" className="text-indigo-600 hover:underline">
                                Log in and submit your post for featuring →
                            </Link>
                        </p>)}
                </div>

                {blogs.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-lg">No featured posts yet.</p>
                        <p className="text-sm mt-2">
                            Content published by subscribers appears here after admin approval.
                        </p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {blogs.map((blog) => (
                            <Link key={String(blog._id)} href={`/blog/${blog.slug}`} className="group">
                                <article
                                    className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                                    {blog.coverImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={blog.coverImage} alt={blog.title}
                                             className="w-full h-48 object-cover"/>
                                    ) : (
                                        <div
                                            className="w-full h-48 bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/30 dark:to-sky-900/30 flex items-center justify-center text-4xl">
                                            📝
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {(blog.tags as string[])?.slice(0, 2).map((tag: string) => (
                                                <Badge key={tag} variant="info"
                                                       className="text-xs capitalize">{tag}</Badge>
                                            ))}
                                            {blog.isFeatured && (
                                                <Badge variant="success" className="text-xs gap-1">
                                                    <Star className="h-2.5 w-2.5"/> Featured
                                                </Badge>
                                            )}
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
                        {blog.publishedAt ? formatDate(blog.publishedAt, {month: "short", day: "numeric"}) : ""}
                      </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


// import type { Metadata } from "next";
// import Link from "next/link";
// import { connectDB } from "@/lib/db";
// import BlogModel from "@/models/Blog";
// import { formatDate, calculateReadTime } from "@/lib/utils";
// import { Badge } from "@/components/ui/form-elements";
// import { Card, CardContent } from "@/components/ui/card";
// import { Clock, Eye, Tag } from "lucide-react";
//
// export const metadata: Metadata = {
//   title: "Blog — SEO Platform",
//   description: "Read our latest articles on SEO, content marketing, and AI-powered content creation.",
// };
//
// export const revalidate = 60;
//
// export default async function BlogListPage() {
//   await connectDB();
//   const blogs = await BlogModel.find({ status: "published" })
//     .sort({ publishedAt: -1 })
//     .limit(20)
//     .lean();
//
//   return (
//     <div className="py-16">
//       <div className="container mx-auto px-4">
//         <div className="text-center mb-12">
//           <h1 className="text-4xl md:text-5xl font-bold mb-4">SEO & Content Blog</h1>
//           <p className="text-muted-foreground text-lg max-w-xl mx-auto">
//             Expert insights on SEO, AI content generation, and digital marketing.
//           </p>
//         </div>
//
//         {blogs.length === 0 ? (
//           <div className="text-center py-20 text-muted-foreground">
//             <p className="text-lg">No posts published yet. Check back soon!</p>
//           </div>
//         ) : (
//           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
//             {blogs.map((blog) => (
//               <Link key={String(blog._id)} href={`/blog/${blog.slug}`} className="group">
//                 <Card className="h-full hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden">
//                   {blog.coverImage && (
//                     // eslint-disable-next-line @next/next/no-img-element
//                     <img src={blog.coverImage} alt={blog.title} className="w-full h-48 object-cover" />
//                   )}
//                   {!blog.coverImage && (
//                     <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/30 dark:to-sky-900/30 flex items-center justify-center">
//                       <span className="text-4xl">📝</span>
//                     </div>
//                   )}
//                   <CardContent className="p-5">
//                     <div className="flex flex-wrap gap-1.5 mb-3">
//                       {blog.tags?.slice(0, 2).map((tag: string) => (
//                         <Badge key={tag} variant="info" className="text-xs capitalize">{tag}</Badge>
//                       ))}
//                     </div>
//                     <h2 className="font-bold text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
//                       {blog.title}
//                     </h2>
//                     <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{blog.excerpt}</p>
//                     <div className="flex items-center gap-4 text-xs text-muted-foreground">
//                       <span className="flex items-center gap-1">
//                         <Clock className="h-3.5 w-3.5" /> {blog.readTime} min
//                       </span>
//                       <span className="flex items-center gap-1">
//                         <Eye className="h-3.5 w-3.5" /> {blog.viewCount}
//                       </span>
//                       <span className="ml-auto">{blog.publishedAt ? formatDate(blog.publishedAt as Date, { month: "short", day: "numeric" }) : ""}</span>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
