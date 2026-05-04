// app/api/site/page/[pageId]/route.ts

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";

interface Params {
    params: { pageId: string }
}

export async function PATCH(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const body = await req.json();
        await connectDB();

        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});

        const pageIdx = site.pages.findIndex((p: { pageId: string }) => p.pageId === params.pageId);
        if (pageIdx === -1) return NextResponse.json({success: false, error: "Page not found"}, {status: 404});

        if (body.title !== undefined) site.pages[pageIdx].title = body.title;
        if (body.slug !== undefined) site.pages[pageIdx].slug = body.slug;
        if (body.isEnabled !== undefined) site.pages[pageIdx].isEnabled = body.isEnabled;
        if (body.showInNav !== undefined) site.pages[pageIdx].showInNav = body.showInNav;
        if (body.role !== undefined) site.pages[pageIdx].role = body.role;
        site.pages[pageIdx].updatedAt = new Date();

        // Sync nav links when title/slug changes
        if (body.title || body.slug) {
            site.navbar.links = site.navbar.links.map((l: { label: string; href: string; order: number }) => {
                const oldPage = site.pages[pageIdx];
                if (l.href === oldPage.slug && body.slug) l.href = body.slug;
                if (l.label === oldPage.title && body.title) l.label = body.title;
                return l;
            });
        }

        await site.save();
        return NextResponse.json({success: true, data: site.pages[pageIdx]});
    } catch (err) {
        console.error("[PAGE_PATCH]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}