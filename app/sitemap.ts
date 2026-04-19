import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import BlogModel from "@/models/Blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/features`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    await connectDB();
    const blogs = await BlogModel.find({ status: "published" }).select("slug updatedAt").lean();
    const blogRoutes: MetadataRoute.Sitemap = blogs.map((b) => ({
      url: `${base}/blog/${b.slug}`,
      lastModified: b.updatedAt as Date,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
