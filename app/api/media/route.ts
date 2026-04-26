import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_MB = 10;

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {searchParams} = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const folder = `seo-platform/${session.user.id}`;

        const result = await cloudinary.api.resources({
            type: "upload",
            prefix: folder,
            max_results: 24,
            next_cursor: cursor ?? undefined,
            resource_type: "image",
        }) as {
            resources: {
                public_id: string;
                secure_url: string;
                width: number;
                height: number;
                bytes: number;
                created_at: string;
                format: string
            }[];
            next_cursor?: string;
        };

        const media = result.resources.map((r) => ({
            id: r.public_id,
            url: r.secure_url,
            width: r.width,
            height: r.height,
            size: r.bytes,
            createdAt: r.created_at,
            format: r.format,
            name: r.public_id.split("/").pop() ?? "",
        }));

        return NextResponse.json({
            success: true,
            data: {media, nextCursor: result.next_cursor ?? null},
        });
    } catch (error) {
        console.error("[MEDIA_GET]", error);
        return NextResponse.json({success: false, error: "Failed to fetch media"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) return NextResponse.json({success: false, error: "No file provided"}, {status: 400});
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: "File type not allowed. Use JPEG, PNG, WebP, GIF, or SVG."
            }, {status: 400});
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                error: `File too large. Max size is ${MAX_SIZE_MB}MB.`
            }, {status: 400});
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const folder = `seo-platform/${session.user.id}`;

        const result = await new Promise<{
            secure_url: string;
            public_id: string;
            width: number;
            height: number;
            bytes: number
        }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {folder, resource_type: "image", quality: "auto", fetch_format: "auto"},
                (err, res) => {
                    if (err || !res) reject(err); else resolve(res as typeof result);
                }
            ).end(buffer);
        });

        return NextResponse.json({
            success: true,
            data: {
                url: result.secure_url,
                id: result.public_id,
                width: result.width,
                height: result.height,
                size: result.bytes,
            },
        }, {status: 201});
    } catch (error) {
        console.error("[MEDIA_UPLOAD]", error);
        return NextResponse.json({success: false, error: "Upload failed"}, {status: 500});
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {id} = await req.json() as { id: string };
        if (!id) return NextResponse.json({success: false, error: "Media ID required"}, {status: 400});

        // Ensure user can only delete their own media
        if (!id.startsWith(`seo-platform/${session.user.id}/`)) {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        await cloudinary.uploader.destroy(id);
        return NextResponse.json({success: true, message: "Media deleted"});
    } catch {
        return NextResponse.json({success: false, error: "Delete failed"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {uploadImage, deleteImage, cloudinary} from "@/services/cloudinary";
// import {checkRateLimit, uploadRatelimit} from "@/lib/ratelimit";
//
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session)
//             return NextResponse.json(
//                 {success: false, error: "Unauthorized"},
//                 {status: 401}
//             );
//
//         const folder = `seo-platform/${session.user.id}`;
//
//         const result = await cloudinary.search
//             .expression(`folder:${folder}`)
//             .sort_by("created_at", "desc")
//             .max_results(100)
//             .execute();
//
//         const files = result.resources.map((file: any) => ({
//             id: file.public_id.replace(/\//g, "_"),
//             url: file.secure_url,
//             publicId: file.public_id,
//             name: file.filename || file.public_id.split("/").pop(),
//             size: file.bytes,
//             type: file.resource_type === "image" ? `image/${file.format}` : file.format,
//             uploadedAt: file.created_at,
//             width: file.width,
//             height: file.height,
//         }));
//
//         return NextResponse.json({
//             success: true,
//             data: files,
//         });
//     } catch (error) {
//         console.error("[MEDIA_GET]", error);
//         return NextResponse.json(
//             {success: false, error: "Failed to fetch media"},
//             {status: 500}
//         );
//     }
// }
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const {success: rateLimitOk} = await checkRateLimit(uploadRatelimit, `upload:${session.user.id}`);
//         if (!rateLimitOk) return NextResponse.json({
//             success: false,
//             error: "Upload rate limit exceeded"
//         }, {status: 429});
//
//         const {file, name, type} = await req.json();
//         if (!file) return NextResponse.json({success: false, error: "No file provided"}, {status: 400});
//
//         // Check file type
//         const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "application/pdf"];
//         if (!allowedTypes.includes(type)) {
//             return NextResponse.json({success: false, error: "File type not allowed"}, {status: 400});
//         }
//
//         const folder = `seo-platform/${session.user.id}`;
//         const result = await uploadImage(file, folder);
//
//         return NextResponse.json({
//             success: true,
//             data: {
//                 id: result.publicId.replace(/\//g, "_"),
//                 url: result.url,
//                 publicId: result.publicId,
//                 name: name ?? result.publicId.split("/").pop(),
//                 size: 0,
//                 type,
//                 width: result.width,
//                 height: result.height,
//                 uploadedAt: new Date(),
//             },
//         }, {status: 201});
//     } catch (error) {
//         console.error("[MEDIA_UPLOAD]", error);
//         return NextResponse.json({success: false, error: "Upload failed"}, {status: 500});
//     }
// }
//
// export async function DELETE(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const {searchParams} = new URL(req.url);
//         const publicId = searchParams.get("publicId");
//         if (!publicId) return NextResponse.json({success: false, error: "publicId required"}, {status: 400});
//
//         // Ensure user can only delete their own files
//         if (!publicId.includes(session.user.id) && session.user.role !== "super_admin") {
//             return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
//         }
//
//         await deleteImage(publicId);
//         return NextResponse.json({success: true, message: "File deleted"});
//     } catch (error) {
//         console.error("[MEDIA_DELETE]", error);
//         return NextResponse.json({success: false, error: "Delete failed"}, {status: 500});
//     }
// }
