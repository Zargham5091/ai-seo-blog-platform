import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";
import {z} from "zod";

const ComponentSchema = z.object({
    name: z.string().min(1).max(80),
    key: z.string().min(1).max(60).regex(/^[a-z0-9_]+$/),
    category: z.enum(["section", "animation", "template", "widget", "integration"]),
    description: z.string().max(300).optional(),
    previewImage: z.string().optional(),
    previewVideo: z.string().optional(),
    cssCode: z.string().optional(),
    jsCode: z.string().optional(),
    availableTo: z.array(z.enum(["free", "silver", "gold", "diamond"])),
    isActive: z.boolean().optional(),
});

// GET /api/plan-components — list components
// Super admin sees all; users see only their plan's components
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const category = searchParams.get("category");

        const query: Record<string, unknown> = {};

        if (session.user.role !== "super_admin") {
            query.availableTo = session.user.plan ?? "free";
            query.isActive = true;
        }

        if (category) query.category = category;

        const components = await PlanComponentModel.find(query)
            .sort({category: 1, name: 1})
            .lean();

        return NextResponse.json({success: true, data: components});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/plan-components — super admin creates component
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const body = await req.json();
        const parsed = ComponentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        await connectDB();

        const existing = await PlanComponentModel.findOne({key: parsed.data.key});
        if (existing) {
            return NextResponse.json(
                {success: false, error: "A component with this key already exists"},
                {status: 409}
            );
        }

        const component = await PlanComponentModel.create(parsed.data);
        return NextResponse.json({success: true, data: component}, {status: 201});
    } catch (error) {
        console.error("[COMPONENT_CREATE]", error);
        return NextResponse.json({success: false, error: "Failed to create component"}, {status: 500});
    }
}
