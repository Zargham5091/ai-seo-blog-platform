import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import SiteTemplateModel from "@/models/SiteTemplate";
import UserSiteModel from "@/models/UserSite";
import type {ISiteTemplateDocument} from "@/models/SiteTemplate";

const PLAN_ORDER: Record<string, number> = {
    free: 0, silver: 1, gold: 2, diamond: 3,
};

interface Params {
    params: { id: string }
}

// POST /api/templates/[id]/apply — user applies this template to their site
export async function POST(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();

        const template = await SiteTemplateModel.findById(params.id).lean() as ISiteTemplateDocument | null;
        if (!template || !template.isActive) {
            return NextResponse.json({success: false, error: "Template not found"}, {status: 404});
        }

        // Check plan access
        const userPlanLevel = PLAN_ORDER[session.user.plan ?? "free"] ?? 0;
        const requiredLevel = PLAN_ORDER[template.minPlan] ?? 1;
        if (userPlanLevel < requiredLevel) {
            return NextResponse.json(
                {success: false, error: `This template requires the ${template.minPlan} plan or higher.`},
                {status: 403}
            );
        }

        // Apply template to user site — seed default pages and sections from template
        const defaultPages = template.sections.length > 0
            ? [{
                slug: "home",
                title: "Home",
                isEnabled: true,
                sections: template.sections.map((s, i) => ({
                    id: s.id,
                    type: s.type,
                    order: i,
                    isVisible: true,
                    content: {...s.defaultContent},
                })),
                seo: {},
            }]
            : [];

        const userSite = await UserSiteModel.findOneAndUpdate(
            {userId: session.user.id},
            {
                $set: {
                    templateId: template._id,
                    primaryColor: template.colors.primary,
                    pages: defaultPages,
                },
            },
            {new: true, upsert: true}
        );

        // Increment template usage count
        await SiteTemplateModel.findByIdAndUpdate(params.id, {$inc: {usageCount: 1}});

        return NextResponse.json({success: true, data: userSite});
    } catch (error) {
        console.error("[TEMPLATE_APPLY]", error);
        return NextResponse.json({success: false, error: "Failed to apply template"}, {status: 500});
    }
}
