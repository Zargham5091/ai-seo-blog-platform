import { useState, useCallback } from "react";
import { IBlog } from "@/types";

interface UseBlogsReturn {
  blogs: IBlog[];
  total: number;
  pages: number;
  isLoading: boolean;
  error: string | null;
  fetchBlogs: (params?: { page?: number; limit?: number; status?: string; search?: string }) => Promise<void>;
  deleteBlog: (id: string) => Promise<boolean>;
  updateBlogStatus: (id: string, status: string) => Promise<boolean>;
}

export function useBlogs(): UseBlogsReturn {
  const [blogs, setBlogs] = useState<IBlog[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = useCallback(async (params: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params.page) qs.set("page", String(params.page));
      if (params.limit) qs.set("limit", String(params.limit));
      if (params.status) qs.set("status", params.status);
      if (params.search) qs.set("search", params.search);

      const res = await fetch(`/api/blog?${qs}`);
      const data = await res.json();
      if (data.success) {
        setBlogs(data.data);
        setTotal(data.pagination?.total ?? 0);
        setPages(data.pagination?.pages ?? 1);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to fetch blogs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBlog = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== id));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const updateBlogStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.map((b) => (b._id === id ? { ...b, status: status as IBlog["status"] } : b)));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return { blogs, total, pages, isLoading, error, fetchBlogs, deleteBlog, updateBlogStatus };
}
