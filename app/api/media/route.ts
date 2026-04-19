import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage, deleteImage } from "@/services/cloudinary";
import { checkRateLimit, uploadRatelimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { success: rateLimitOk } = await checkRateLimit(uploadRatelimit, `upload:${session.user.id}`);
    if (!rateLimitOk) return NextResponse.json({ success: false, error: "Upload rate limit exceeded" }, { status: 429 });

    const { file, name, type } = await req.json();
    if (!file) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ success: false, error: "File type not allowed" }, { status: 400 });
    }

    const folder = `seo-platform/${session.user.id}`;
    const result = await uploadImage(file, folder);

    return NextResponse.json({
      success: true,
      data: {
        id: result.publicId.replace(/\//g, "_"),
        url: result.url,
        publicId: result.publicId,
        name: name ?? result.publicId.split("/").pop(),
        size: 0,
        type,
        width: result.width,
        height: result.height,
        uploadedAt: new Date(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[MEDIA_UPLOAD]", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");
    if (!publicId) return NextResponse.json({ success: false, error: "publicId required" }, { status: 400 });

    // Ensure user can only delete their own files
    if (!publicId.includes(session.user.id) && session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await deleteImage(publicId);
    return NextResponse.json({ success: true, message: "File deleted" });
  } catch (error) {
    console.error("[MEDIA_DELETE]", error);
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
