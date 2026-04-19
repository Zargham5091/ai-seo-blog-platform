"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal, FileText, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useBlogs } from "@/hooks/useBlogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-elements";
import { Badge } from "@/components/ui/form-elements";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_COLORS: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  published: "success",
  draft: "warning",
  scheduled: "info" as "success",
  archived: "secondary",
};

export default function BlogsPage() {
  const { blogs, total, isLoading, fetchBlogs, deleteBlog, updateBlogStatus } = useBlogs();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBlogs({ page, search, status: statusFilter });
  }, [page, search, statusFilter, fetchBlogs]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post? This cannot be undone.")) return;
    await deleteBlog(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground text-sm">{total} posts total</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/admin/blogs/new?ai=true"><Sparkles className="h-4 w-4" /> AI Generate</Link>
          </Button>
          <Button asChild variant="gradient" className="gap-2">
            <Link href="/dashboard/admin/blogs/new"><Plus className="h-4 w-4" /> New Post</Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["", "published", "draft", "scheduled", "archived"].map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s || "All"}
            </Button>
          ))}
        </div>
      </div>

      {/* Blog list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl skeleton" />)}
        </div>
      ) : blogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first post manually or use AI to generate one.</p>
            <div className="flex gap-2">
              <Button asChild variant="outline"><Link href="/dashboard/admin/blogs/new?ai=true"><Sparkles className="h-4 w-4 mr-2" />AI Generate</Link></Button>
              <Button asChild variant="gradient"><Link href="/dashboard/admin/blogs/new"><Plus className="h-4 w-4 mr-2" />Write Post</Link></Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {blogs.map((blog) => (
            <Card key={blog._id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                {/* Cover thumbnail */}
                <div className="hidden sm:flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-100 to-sky-100 dark:from-indigo-900/30 dark:to-sky-900/30 overflow-hidden">
                  {blog.coverImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={blog.coverImage} alt="" className="h-full w-full object-cover" />
                    : <FileText className="h-6 w-6 text-indigo-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm truncate">{blog.title}</h3>
                    <Badge variant={STATUS_COLORS[blog.status] ?? "secondary"} className="capitalize shrink-0">{blog.status}</Badge>
                    {blog.isAIGenerated && <Badge variant="info" className="shrink-0"><Sparkles className="h-2.5 w-2.5 mr-1" />AI</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(blog.createdAt)} · {blog.readTime} min read · {blog.viewCount} views · SEO: {blog.seo?.seoScore ?? 0}/100
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href={`/blog/${blog.slug}`} target="_blank"><Eye className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                    <Link href={`/dashboard/admin/blogs/${blog._id}`}><Edit className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => updateBlogStatus(blog._id, blog.status === "published" ? "draft" : "published")}>
                        {blog.status === "published" ? "Unpublish" : "Publish"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(blog._id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
