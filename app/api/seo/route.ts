import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import BlogModel from "@/models/Blog";
import { z } from "zod";

const RobotsSchema = z.object({
  allow: z.array(z.string()).optional(),
  disallow: z.array(z.string()).optional(),
  crawlDelay: z.number().optional(),
});

// GET /api/seo?type=sitemap|robots|meta-check
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "sitemap";

    await connectDB();

    if (type === "sitemap") {
      const blogs = await BlogModel.find(
        { tenantId: session.user.id, status: "published" },
        "slug updatedAt title"
      ).lean();

      const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const entries = blogs.map((b) => ({
        url: `${base}/blog/${b.slug}`,
        lastmod: (b.updatedAt as Date).toISOString().split("T")[0],
        title: b.title,
      }));

      return NextResponse.json({ success: true, data: { entries, count: entries.length, base } });
    }

    if (type === "stats") {
      const [total, published, avgSEO] = await Promise.all([
        BlogModel.countDocuments({ tenantId: session.user.id }),
        BlogModel.countDocuments({ tenantId: session.user.id, status: "published" }),
        BlogModel.aggregate([
          { $match: { tenantId: session.user.id } },
          { $group: { _id: null, avg: { $avg: "$seo.seoScore" } } },
        ]),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          totalPages: total,
          publishedPages: published,
          avgSEOScore: Math.round(avgSEO[0]?.avg ?? 0),
          indexedPercent: total > 0 ? Math.round((published / total) * 100) : 0,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[SEO_API]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
