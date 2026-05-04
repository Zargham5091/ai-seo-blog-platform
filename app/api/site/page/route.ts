// app/api/site/page/route.ts

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import {v4 as uuid} from "uuid";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {title, slug, role} = await req.json();
        if (!title?.trim()) return NextResponse.json({success: false, error: "Title required"}, {status: 400});

        await connectDB();
        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});

        const cleanSlug = slug?.trim() || "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

        if (site.pages.some((p: { slug: string }) => p.slug === cleanSlug)) {
            return NextResponse.json({success: false, error: "Slug already in use"}, {status: 409});
        }

        const newPage = {
            pageId: uuid(), slug: cleanSlug, title: title.trim(),
            role: role ?? "custom", isEnabled: true, isHomePage: false,
            showInNav: true, components: [], seo: {},
            customCSS: "", createdAt: new Date(), updatedAt: new Date(),
        };

        site.pages.push(newPage as never);

        if (newPage.showInNav) {
            site.navbar.links.push({label: newPage.title, href: newPage.slug, order: site.navbar.links.length});
        }

        await site.save();
        return NextResponse.json({success: true, data: newPage}, {status: 201});
    } catch (err) {
        console.error("[PAGE_POST]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {pageId} = await req.json();
        await connectDB();

        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});

        const page = site.pages.find((p: { pageId: string }) => p.pageId === pageId);
        if (!page) return NextResponse.json({success: false, error: "Page not found"}, {status: 404});
        if (page.isHomePage) return NextResponse.json({
            success: false,
            error: "Cannot delete home page"
        }, {status: 400});

        site.pages = site.pages.filter((p: { pageId: string }) => p.pageId !== pageId) as never;
        site.navbar.links = site.navbar.links.filter((l: { href: string }) => l.href !== page.slug);

        await site.save();
        return NextResponse.json({success: true});
    } catch (err) {
        console.error("[PAGE_DELETE]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}