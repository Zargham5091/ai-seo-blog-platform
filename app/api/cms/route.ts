import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import CMSPageModel from "@/models/CMSPage";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const page = await CMSPageModel.findOne({ slug, isPublished: true }).lean();
      if (!page) return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
      return NextResponse.json({ success: true, data: page });
    }

    const pages = await CMSPageModel.find().sort({ slug: 1 }).lean();
    return NextResponse.json({ success: true, data: pages });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const page = await CMSPageModel.findOneAndUpdate(
      { slug: body.slug },
      { $set: { ...body, lastEditedBy: session.user.id } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error("[CMS_POST]", error);
    return NextResponse.json({ success: false, error: "Failed to save page" }, { status: 500 });
  }
}
