import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import CMSPageModel from "@/models/CMSPage";

type Params = { params: { slug: string } };

// GET /api/cms/[slug] — fetch single CMS page (public)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const page = await CMSPageModel.findOne({ slug: params.slug }).lean();
    if (!page) return NextResponse.json({ success: false, error: "Page not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: page });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/cms/[slug] — update CMS page (super admin only)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const page = await CMSPageModel.findOneAndUpdate(
      { slug: params.slug },
      { $set: { ...body, lastEditedBy: session.user.id } },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: page });
  } catch (error) {
    console.error("[CMS_PUT]", error);
    return NextResponse.json({ success: false, error: "Failed to update page" }, { status: 500 });
  }
}

// DELETE /api/cms/[slug] — delete CMS page (super admin only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    await CMSPageModel.findOneAndDelete({ slug: params.slug });
    return NextResponse.json({ success: true, message: "Page deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
