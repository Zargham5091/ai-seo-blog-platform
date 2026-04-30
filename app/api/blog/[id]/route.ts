// app/api/blog/[id]/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import BlogModel from "@/models/Blog";
import {getTenantContext, canWrite, canDelete} from "@/lib/tenant";
import {calculateReadTime, slugify} from "@/lib/utils";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        const blog = await BlogModel.findOne({_id: params.id, tenantId: tenant.tenantId}).lean();
        if (!blog) return NextResponse.json({success: false, error: "Blog not found"}, {status: 404});

        return NextResponse.json({success: true, data: blog});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canWrite(tenant.role)) {
            return NextResponse.json({success: false, error: "You have read-only access."}, {status: 403});
        }

        const body = await req.json();
        const blog = await BlogModel.findOne({_id: params.id, tenantId: tenant.tenantId});
        if (!blog) return NextResponse.json({success: false, error: "Blog not found"}, {status: 404});

        if (body.content && body.content !== blog.content) {
            blog.versions.push({
                version: blog.version,
                content: blog.content,
                blocks: blog.blocks,
                savedAt: new Date(),
                savedBy: session.user.id
            });
            blog.version += 1;
        }

        if (body.title) blog.title = body.title;
        if (body.slug) blog.slug = slugify(body.slug);
        if (body.content !== undefined) {
            blog.content = body.content;
            blog.readTime = calculateReadTime(body.content);
        }
        if (body.blocks) blog.blocks = body.blocks;
        if (body.excerpt !== undefined) blog.excerpt = body.excerpt;
        if (body.coverImage !== undefined) blog.coverImage = body.coverImage;
        if (body.tags) blog.tags = body.tags;
        if (body.categories) blog.categories = body.categories;
        if (body.seo) blog.seo = {...blog.seo, ...body.seo};
        if (body.scheduledAt) blog.scheduledAt = new Date(body.scheduledAt);
        if (body.status) {
            blog.status = body.status;
            if (body.status === "published" && !blog.publishedAt) blog.publishedAt = new Date();
        }

        await blog.save();
        return NextResponse.json({success: true, data: blog});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canDelete(tenant.role)) {
            return NextResponse.json({success: false, error: "Only admins can delete content."}, {status: 403});
        }

        const blog = await BlogModel.findOneAndDelete({_id: params.id, tenantId: tenant.tenantId});
        if (!blog) return NextResponse.json({success: false, error: "Blog not found"}, {status: 404});

        return NextResponse.json({success: true, message: "Blog deleted successfully"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import BlogModel from "@/models/Blog";
// import { calculateReadTime, slugify } from "@/lib/utils";
//
// type Params = { params: { id: string } };
//
// export async function GET(_req: NextRequest, { params }: Params) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//     const blog = await BlogModel.findOne({ _id: params.id, tenantId: session.user.id }).lean();
//     if (!blog) return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
//
//     return NextResponse.json({ success: true, data: blog });
//   } catch {
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
//
// export async function PUT(req: NextRequest, { params }: Params) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//     const body = await req.json();
//
//     const blog = await BlogModel.findOne({ _id: params.id, tenantId: session.user.id });
//     if (!blog) return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
//
//     // Save version snapshot before update
//     if (body.content && body.content !== blog.content) {
//       blog.versions.push({
//         version: blog.version,
//         content: blog.content,
//         blocks: blog.blocks,
//         savedAt: new Date(),
//         savedBy: session.user.id,
//       });
//       blog.version += 1;
//     }
//
//     // Update fields
//     if (body.title) blog.title = body.title;
//     if (body.slug) blog.slug = slugify(body.slug);
//     if (body.content !== undefined) {
//       blog.content = body.content;
//       blog.readTime = calculateReadTime(body.content);
//     }
//     if (body.blocks) blog.blocks = body.blocks;
//     if (body.excerpt !== undefined) blog.excerpt = body.excerpt;
//     if (body.coverImage !== undefined) blog.coverImage = body.coverImage;
//     if (body.tags) blog.tags = body.tags;
//     if (body.categories) blog.categories = body.categories;
//     if (body.seo) blog.seo = { ...blog.seo, ...body.seo };
//     if (body.scheduledAt) blog.scheduledAt = new Date(body.scheduledAt);
//
//     if (body.status) {
//       blog.status = body.status;
//       if (body.status === "published" && !blog.publishedAt) {
//         blog.publishedAt = new Date();
//       }
//     }
//
//     await blog.save();
//     return NextResponse.json({ success: true, data: blog });
//   } catch {
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
//
// export async function DELETE(_req: NextRequest, { params }: Params) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//     const blog = await BlogModel.findOneAndDelete({ _id: params.id, tenantId: session.user.id });
//     if (!blog) return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
//
//     return NextResponse.json({ success: true, message: "Blog deleted successfully" });
//   } catch {
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
