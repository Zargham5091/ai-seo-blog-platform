import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import CategoryModel from "@/models/Category";
import BlogModel from "@/models/Blog";
import {slugify} from "@/lib/utils";
import {z} from "zod";

type Params = { params: { id: string } };

const UpdateSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    description: z.string().max(200).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// PUT /api/categories/[id]
export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const body = await req.json();
        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        await connectDB();

        const update: Record<string, unknown> = {...parsed.data};
        if (parsed.data.name) update.slug = slugify(parsed.data.name);

        const category = await CategoryModel.findOneAndUpdate(
            {_id: params.id, tenantId: session.user.id},
            {$set: update},
            {new: true, runValidators: true}
        );

        if (!category) return NextResponse.json({success: false, error: "Category not found"}, {status: 404});
        return NextResponse.json({success: true, data: category});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// DELETE /api/categories/[id]
export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();

        const category = await CategoryModel.findOne({_id: params.id, tenantId: session.user.id});
        if (!category) return NextResponse.json({success: false, error: "Category not found"}, {status: 404});

        // Remove this category from all blogs that use it
        await BlogModel.updateMany(
            {tenantId: session.user.id, categories: category.name},
            {$pull: {categories: category.name}}
        );

        await CategoryModel.findByIdAndDelete(params.id);
        return NextResponse.json({success: true, message: "Category deleted"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
