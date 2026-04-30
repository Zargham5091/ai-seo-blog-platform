import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import PlanComponentModel from "@/models/PlanComponent";
import {canWrite, getTenantContext} from "@/lib/tenant";

// GET /api/site — get current user's site config
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }
        const tenant = await getTenantContext(session.user.id);
        await connectDB();

        const [site, availableAnimations] = await Promise.all([
            UserSiteModel.findOne({userId: tenant.tenantId})
                .populate("templateId", "name theme style colors previewImage")
                .lean(),
            PlanComponentModel.find({
                category: "animation",
                isActive: true,
                availableTo: session.user.plan ?? "free",
            }).select("key name description previewImage cssCode").lean(),
        ]);

        return NextResponse.json({
            success: true,
            data: site ?? null,
            availableAnimations,
        });
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// PUT /api/site — update user's site config
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }
        const tenant = await getTenantContext(session.user.id);
        if (!canWrite(tenant.role)) return NextResponse.json({
            success: false,
            error: "Only admins can write."
        }, {status: 403});

        await connectDB();
        const body = await req.json();

        // Only allow updating these fields — never let users set templateId directly
        const allowed = [
            "primaryColor", "fontFamily", "navStyle",
            "navLinks", "footerEnabled", "footerContent", "pages",
        ];

        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) update[key] = body[key];
        }

        const site = await UserSiteModel.findOneAndUpdate(
            {userId: tenant.tenantId},
            {$set: update},
            {new: true, upsert: true}
        );

        return NextResponse.json({success: true, data: site});
    } catch (error) {
        console.error("[SITE_PUT]", error);
        return NextResponse.json({success: false, error: "Failed to save site"}, {status: 500});
    }
}
