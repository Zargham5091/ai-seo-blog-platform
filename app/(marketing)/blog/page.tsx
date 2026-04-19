import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import BlogModel from "@/models/Blog";
import { formatDate, calculateReadTime } from "@/lib/utils";
import { Badge } from "@/components/ui/form-elements";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Eye, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — SEO Platform",
  description: "Read our latest articles on SEO, content marketing, and AI-powered content creation.",
};

export const revalidate = 60;

export default async function BlogListPage() {
  await connectDB();
  const blogs = await BlogModel.find({ status: "published" })
    .sort({ publishedAt: -1 })
    .limit(20)
    .lean();

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SEO & Content Blog</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Expert insights on SEO, AI content generation, and digital marketing.
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No posts published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {blogs.map((blog) => (
              <Link key={String(blog._id)} href={`/blog/${blog.slug}`} className="group">
                <Card className="h-full hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  {blog.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-48 object-cover" />
                  )}
                  {!blog.coverImage && (
                    <div className="w-full h-48 bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/30 dark:to-sky-900/30 flex items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {blog.tags?.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="info" className="text-xs capitalize">{tag}</Badge>
                      ))}
                    </div>
                    <h2 className="font-bold text-lg leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h2>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{blog.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {blog.readTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> {blog.viewCount}
                      </span>
                      <span className="ml-auto">{blog.publishedAt ? formatDate(blog.publishedAt as Date, { month: "short", day: "numeric" }) : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
