import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import {uuid} from "zod/v4";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const {title, slug, role} = await req.json();
        await connectDB();
        const site = await UserSiteModel.findOne({userId: session.user.id});
        if (!site) return NextResponse.json({success: false, error: "Site not found"}, {status: 404});
        const slugExists = site.pages.some((p) => p.slug === slug);
        if (slugExists) return NextResponse.json({success: false, error: "Slug already in use"}, {status: 409});
        const newPage = {
            pageId: uuid(), slug, title, role: role ?? "custom",
            isEnabled: true, isHomePage: false, showInNav: true,
            components: [], seo: {},
            createdAt: new Date(), updatedAt: new Date(),
        };
        site.pages.push(newPage as never);
        await site.save();
        return NextResponse.json({success: true, data: newPage}, {status: 201});
    } catch {
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
        const page = site.pages.find((p) => p.pageId === pageId);
        if (page?.isHomePage) return NextResponse.json({
            success: false,
            error: "Cannot delete home page"
        }, {status: 400});
        site.pages = site.pages.filter((p) => p.pageId !== pageId) as never;
        await site.save();
        return NextResponse.json({success: true});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
