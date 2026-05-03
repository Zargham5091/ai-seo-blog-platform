import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/site/init/route.ts
// ════════════════════════════════════════════════════════════════════════════

import {getPreset, SITE_PRESETS} from "@/lib/builder/presets";
import {v4 as uuid} from "uuid";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const {siteType, siteName} = await req.json();
        await connectDB();
        const existing = await UserSiteModel.findOne({userId: session.user.id});
        if (existing) return NextResponse.json({success: false, error: "Site already exists"}, {status: 409});
        const preset = getPreset(siteType) ?? SITE_PRESETS[0];
        const pages = preset.pages.map((p) => ({
            ...p,
            components: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
        const site = await UserSiteModel.create({
            userId: session.user.id,
            siteName: siteName || preset.suggestedSiteName,
            siteType: preset.siteType,
            theme: preset.defaultTheme,
            navbar: {
                componentKey: preset.navbarComponentKey,
                style: "sticky", isTransparent: false,
                links: pages.filter((p) => p.showInNav).map((p, i) => ({label: p.title, href: p.slug, order: i})),
                showThemeToggle: false,
            },
            footer: {
                componentKey: preset.footerComponentKey,
                isEnabled: true,
                columns: [],
                bottomText: `© ${new Date().getFullYear()} ${siteName || preset.suggestedSiteName}. All rights reserved.`,
                socialLinks: []
            },
            pages,
            builderState: {
                activePageId: pages.find((p) => p.isHomePage)?.pageId,
                zoom: 100,
                devicePreview: "desktop",
                aiSuggestionsEnabled: true
            },
        });
        return NextResponse.json({success: true, data: site}, {status: 201});
    } catch (err) {
        console.error("[SITE_INIT]", err);
        return NextResponse.json({success: false, error: "Failed to initialize site"}, {status: 500});
    }
}

