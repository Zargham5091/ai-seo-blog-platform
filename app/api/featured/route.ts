import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import FeaturedPostRequestModel from "@/models/FeaturedPostRequest";
import BlogModel from "@/models/Blog";
import {z} from "zod";

const SubmitSchema = z.object({
    blogId: z.string().min(1),
    note: z.string().max(500).optional(),
});

const ReviewSchema = z.object({
    status: z.enum(["approved", "rejected"]),
    adminNote: z.string().max(500).optional(),
});

// POST /api/featured — user submits a blog for featuring on main homepage
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        const body = await req.json();
        const parsed = SubmitSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        await connectDB();

        // Verify the blog belongs to this user and is published
        const blog = await BlogModel.findOne({
            _id: parsed.data.blogId,
            tenantId: session.user.id,
            status: "published",
        });

        if (!blog) {
            return NextResponse.json(
                {success: false, error: "Blog not found or not published"},
                {status: 404}
            );
        }

        // Check if already requested
        const existing = await FeaturedPostRequestModel.findOne({
            blogId: parsed.data.blogId,
            status: {$in: ["pending", "approved"]},
        });

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: existing.status === "approved" ? "This post is already featured" : "You already have a pending request for this post"
                },
                {status: 409}
            );
        }

        const request = await FeaturedPostRequestModel.create({
            blogId: parsed.data.blogId,
            tenantId: session.user.id,
            requestedBy: session.user.id,
            note: parsed.data.note,
        });

        return NextResponse.json({success: true, data: request}, {status: 201});
    } catch (error) {
        console.error("[FEATURED_POST]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// GET /api/featured — list requests
// ?status=pending|approved|rejected for super admin
// ?mine=true for current user's requests
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const mine = searchParams.get("mine") === "true";
        const status = searchParams.get("status");

        const query: Record<string, unknown> = {};

        if (mine) {
            query.tenantId = session.user.id;
        } else if (session.user.role !== "super_admin") {
            // Non-admins can only see their own
            query.tenantId = session.user.id;
        }

        if (status) query.status = status;

        const requests = await FeaturedPostRequestModel.find(query)
            .populate("blogId", "title slug coverImage excerpt")
            .populate("requestedBy", "name email image")
            .sort({createdAt: -1})
            .lean();

        return NextResponse.json({success: true, data: requests});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
