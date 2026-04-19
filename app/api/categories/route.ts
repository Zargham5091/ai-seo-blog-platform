import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import CategoryModel from "@/models/Category";
import {slugify} from "@/lib/utils";
import {z} from "zod";

const CategorySchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().max(200).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// GET /api/categories — list all categories for current tenant
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const categories = await CategoryModel.find({tenantId: session.user.id})
            .sort({name: 1})
            .lean();

        return NextResponse.json({success: true, data: categories});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/categories — create category
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        const body = await req.json();
        const parsed = CategorySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        await connectDB();
        const slug = slugify(parsed.data.name);

        // Check uniqueness within tenant
        const existing = await CategoryModel.findOne({slug, tenantId: session.user.id});
        if (existing) {
            return NextResponse.json(
                {success: false, error: "A category with this name already exists"},
                {status: 409}
            );
        }

        const category = await CategoryModel.create({
            ...parsed.data,
            slug,
            tenantId: session.user.id,
        });

        return NextResponse.json({success: true, data: category}, {status: 201});
    } catch (error) {
        console.error("[CATEGORY_POST]", error);
        return NextResponse.json({success: false, error: "Failed to create category"}, {status: 500});
    }
}
