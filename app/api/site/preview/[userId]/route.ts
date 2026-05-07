// app/api/site/preview/[userId]/route.ts
// Local dev only — previews the published static HTML without needing real subdomains.
// Usage: GET /api/site/preview/[userId]?slug=/about

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

const SITES_DIR = path.join(process.cwd(), "public", "sites");

interface Params {
    params: { userId: string }
}

export async function GET(req: NextRequest, {params}: Params) {
    const session = await getServerSession(authOptions);
    let {userId} = params;
    const User = (await import("@/models/User")).default;
    const bySubdomain = await User.findOne({siteSubdomain: userId}).select("_id").lean();
    if (bySubdomain) userId = bySubdomain._id.toString();

    if (!session || session.user.role !== "super_admin") {
        // Only allow the site owner or super_admin
        if (!session || session.user.id !== params.userId) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }
    }

    const slug = new URL(req.url).searchParams.get("slug") ?? "/";
    console.log("slug", slug);
    const relPath = slug === "/" ? "index.html" : `${slug.replace(/^\//, "")}/index.html`;
    const filePath = path.join(SITES_DIR, params.userId, relPath);

    try {
        const html = await fs.readFile(filePath, "utf-8");
        return new NextResponse(html, {
            status: 200,
            headers: {"Content-Type": "text/html; charset=utf-8"},
        });
    } catch {
        return new NextResponse(
            `<h1>Not built yet</h1><p>Publish your site first. Looking for: ${filePath}</p>`,
            {status: 404, headers: {"Content-Type": "text/html"}}
        );
    }
}