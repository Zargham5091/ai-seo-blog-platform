// app/api/upload/route.ts
//
// POST /api/upload
// Accepts: multipart/form-data with field "file" (image)
// Returns: { success: true, url: string, publicId: string, width: number, height: number }
//
// Uses the existing services/cloudinary.ts — no new dependencies needed.
// Max file size: 5MB. Allowed types: jpg, png, gif, webp, svg.

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {uploadImage} from "@/services/cloudinary";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        // Parse multipart form data
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({success: false, error: "No file provided"}, {status: 400});
        }

        // Validate type
        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                {success: false, error: "Invalid file type. Allowed: jpg, png, gif, webp, svg"},
                {status: 400}
            );
        }

        // Validate size
        if (file.size > MAX_BYTES) {
            return NextResponse.json(
                {success: false, error: "File too large. Maximum size is 5MB"},
                {status: 400}
            );
        }

        // Convert to base64 data URI (Cloudinary uploadImage expects this)
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const dataUri = `data:${file.type};base64,${base64}`;

        // Upload to Cloudinary under the site-builder folder
        const result = await uploadImage(dataUri, `sitecraft/${session.user.id}`);

        return NextResponse.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
        });
    } catch (err) {
        console.error("[UPLOAD]", err);
        return NextResponse.json(
            {success: false, error: "Upload failed. Please try again."},
            {status: 500}
        );
    }
}