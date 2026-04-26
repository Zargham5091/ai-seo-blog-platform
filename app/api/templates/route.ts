import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import SiteTemplateModel from "@/models/SiteTemplate";
import UserSiteModel from "@/models/UserSite";

const PLAN_ORDER: Record<string, number> = {
    free: 0, silver: 1, gold: 2, diamond: 3,
};

// GET /api/templates — list templates accessible to user's plan
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const theme = searchParams.get("theme");
        const style = searchParams.get("style");

        const userPlanLevel = PLAN_ORDER[session.user.plan ?? "free"] ?? 0;

        // Only return templates the user's plan can access
        const accessiblePlans = Object.entries(PLAN_ORDER)
            .filter(([, level]) => level <= userPlanLevel)
            .map(([plan]) => plan);

        const query: Record<string, unknown> = {
            isActive: true,
            minPlan: {$in: accessiblePlans},
        };
        if (theme) query.theme = theme;
        if (style) query.style = style;

        const templates = await SiteTemplateModel.find(query)
            .select("-globalCSS -sections.htmlTemplate") // Don't send full code in list
            .sort({isFeatured: -1, usageCount: -1})
            .lean();

        return NextResponse.json({success: true, data: templates});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/templates — super admin creates a template
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        await connectDB();
        const body = await req.json();
        const template = await SiteTemplateModel.create(body);
        return NextResponse.json({success: true, data: template}, {status: 201});
    } catch (error) {
        console.error("[TEMPLATE_CREATE]", error);
        return NextResponse.json({success: false, error: "Failed to create template"}, {status: 500});
    }
}
