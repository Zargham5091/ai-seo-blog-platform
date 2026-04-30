// app/api/blog/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import BlogModel from "@/models/Blog";
import UserModel from "@/models/User";
import {getTenantContext, canWrite} from "@/lib/tenant";
import {z} from "zod";
import {slugify, calculateReadTime} from "@/lib/utils";

const BlogSchema = z.object({
    title: z.string().min(1).max(200),
    slug: z.string().optional(),
    excerpt: z.string().max(500).optional(),
    content: z.string().optional(),
    blocks: z.array(z.any()).optional(),
    coverImage: z.string().optional(),
    status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    scheduledAt: z.string().optional(),
    seo: z.object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        ogImage: z.string().optional(),
    }).optional(),
});

// GET /api/blog — list blogs for tenant
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        const {searchParams} = new URL(req.url);
        const page = parseInt(searchParams.get("page") ?? "1");
        const limit = parseInt(searchParams.get("limit") ?? "10");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const query: Record<string, unknown> = {tenantId: tenant.tenantId}; // ← tenantId not userId
        if (status) query.status = status;
        if (search) query.$text = {$search: search};

        const skip = (page - 1) * limit;
        const [blogs, total] = await Promise.all([
            BlogModel.find(query).sort({createdAt: -1}).skip(skip).limit(limit).lean(),
            BlogModel.countDocuments(query),
        ]);

        return NextResponse.json({
            success: true,
            data: blogs,
            pagination: {page, limit, total, pages: Math.ceil(total / limit)},
        });
    } catch (error) {
        console.error("[BLOG_GET]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/blog — create blog
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        // Role check — members (read-only) cannot create blogs
        if (!canWrite(tenant.role)) {
            return NextResponse.json({
                success: false,
                error: "You have read-only access. Ask your team admin to change your role.",
            }, {status: 403});
        }

        // Check plan limits against owner's account
        const owner = await UserModel.findById(tenant.tenantId);
        if (!owner) return NextResponse.json({success: false, error: "Owner not found"}, {status: 404});

        const planLimits: Record<string, number> = {free: 3, silver: 25, gold: 100, diamond: Infinity};
        const maxBlogs = planLimits[owner.plan] ?? 3;
        const blogCount = await BlogModel.countDocuments({tenantId: tenant.tenantId});

        if (blogCount >= maxBlogs) {
            return NextResponse.json({
                success: false,
                error: `The ${owner.plan} plan allows a maximum of ${maxBlogs} blogs. Please upgrade to create more.`,
            }, {status: 403});
        }

        const body = await req.json();
        const parsed = BlogSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const data = parsed.data;
        const slug = data.slug ? slugify(data.slug) : slugify(data.title);
        const slugExists = await BlogModel.findOne({slug, tenantId: tenant.tenantId});
        const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

        const blog = await BlogModel.create({
            ...data,
            slug: finalSlug,
            authorId: session.user.id,       // who actually wrote it
            tenantId: tenant.tenantId,        // owner's account it belongs to
            readTime: calculateReadTime(data.content ?? ""),
            publishedAt: data.status === "published" ? new Date() : undefined,
        });

        return NextResponse.json({success: true, data: blog}, {status: 201});
    } catch (error) {
        console.error("[BLOG_POST]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import BlogModel from "@/models/Blog";
// import UserModel from "@/models/User";
// import { z } from "zod";
// import { slugify, calculateReadTime } from "@/lib/utils";
//
// const BlogSchema = z.object({
//   title: z.string().min(1).max(200),
//   slug: z.string().optional(),
//   excerpt: z.string().max(500).optional(),
//   content: z.string().optional(),
//   blocks: z.array(z.any()).optional(),
//   coverImage: z.string().optional(),
//   status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
//   tags: z.array(z.string()).optional(),
//   categories: z.array(z.string()).optional(),
//   scheduledAt: z.string().optional(),
//   seo: z.object({
//     metaTitle: z.string().optional(),
//     metaDescription: z.string().optional(),
//     keywords: z.array(z.string()).optional(),
//     ogImage: z.string().optional(),
//   }).optional(),
// });
//
// // GET /api/blog — list blogs for tenant
// export async function GET(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//     const { searchParams } = new URL(req.url);
//     const page = parseInt(searchParams.get("page") ?? "1");
//     const limit = parseInt(searchParams.get("limit") ?? "10");
//     const status = searchParams.get("status");
//     const search = searchParams.get("search");
//
//     const query: Record<string, unknown> = { tenantId: session.user.id };
//     if (status) query.status = status;
//     if (search) query.$text = { $search: search };
//
//     const skip = (page - 1) * limit;
//     const [blogs, total] = await Promise.all([
//       BlogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
//       BlogModel.countDocuments(query),
//     ]);
//
//     return NextResponse.json({
//       success: true,
//       data: blogs,
//       pagination: { page, limit, total, pages: Math.ceil(total / limit) },
//     });
//   } catch (error) {
//     console.error("[BLOG_GET]", error);
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
//
// // POST /api/blog — create blog
// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//
//     // Check plan limits
//     const user = await UserModel.findById(session.user.id);
//     if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
//
//     const planLimits: Record<string, number> = { free: 3, silver: 25, gold: 100, diamond: Infinity };
//     const maxBlogs = planLimits[user.plan] ?? 3;
//     const blogCount = await BlogModel.countDocuments({ tenantId: session.user.id });
//
//     if (blogCount >= maxBlogs) {
//       return NextResponse.json({
//         success: false,
//         error: `Your ${user.plan} plan allows a maximum of ${maxBlogs} blogs. Please upgrade to create more.`,
//       }, { status: 403 });
//     }
//
//     const body = await req.json();
//     const parsed = BlogSchema.safeParse(body);
//     if (!parsed.success) {
//       return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
//     }
//
//     const data = parsed.data;
//     const slug = data.slug ? slugify(data.slug) : slugify(data.title);
//
//     // Ensure unique slug within tenant
//     const slugExists = await BlogModel.findOne({ slug, tenantId: session.user.id });
//     const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;
//
//     const blog = await BlogModel.create({
//       ...data,
//       slug: finalSlug,
//       authorId: session.user.id,
//       tenantId: session.user.id,
//       readTime: calculateReadTime(data.content ?? ""),
//       publishedAt: data.status === "published" ? new Date() : undefined,
//     });
//
//     return NextResponse.json({ success: true, data: blog }, { status: 201 });
//   } catch (error) {
//     console.error("[BLOG_POST]", error);
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
