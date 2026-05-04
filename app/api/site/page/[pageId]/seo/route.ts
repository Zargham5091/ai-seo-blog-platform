// app/api/site/page/[pageId]/seo/route.ts

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

        const {seo, customCSS} = await req.json();
        await connectDB();

        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});

        const pageIdx = site.pages.findIndex((p: { pageId: string }) => p.pageId === params.pageId);
        if (pageIdx === -1) return NextResponse.json({success: false, error: "Page not found"}, {status: 404});

        if (seo) site.pages[pageIdx].seo = seo;
        if (customCSS !== undefined) site.pages[pageIdx].customCSS = customCSS;
        site.pages[pageIdx].updatedAt = new Date();

        await site.save();
        return NextResponse.json({success: true});
    } catch (err) {
        console.error("[PAGE_SEO_PATCH]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}