import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import FeaturedPostRequestModel from "@/models/FeaturedPostRequest";
import BlogModel from "@/models/Blog";
import {z} from "zod";

const ReviewSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    adminNote: z.string().max(500).optional(),
});

interface Params {
    params: { id: string }
}

// PUT /api/featured/[id] — super admin approves or rejects
export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const body = await req.json();
        const parsed = ReviewSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        await connectDB();

        const request = await FeaturedPostRequestModel.findByIdAndUpdate(
            params.id,
            {
                $set: {
                    status: parsed.data.status,
                    adminNote: parsed.data.adminNote,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date(),
                },
            },
            {new: true}
        );

        if (!request) {
            return NextResponse.json({success: false, error: "Request not found"}, {status: 404});
        }

        // If approved, mark the blog as featured so it shows on main /blog
        if (parsed.data.status === "approved") {
            await BlogModel.findByIdAndUpdate(request.blogId, {
                $set: {isFeatured: true, featuredAt: new Date()},
            });
        } else if (parsed.data.status === "rejected") {
            await BlogModel.findByIdAndUpdate(request.blogId, {
                $set: {isFeatured: false},
            });
        }

        return NextResponse.json({success: true, data: request});
    } catch (error) {
        console.error("[FEATURED_REVIEW]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
