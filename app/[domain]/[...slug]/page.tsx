// app/[domain]/[...slug]/page.tsx
// Serves inner pages like /about, /pricing for tenant sites.

import {NextResponse} from "next/server";
import {NextRequest} from "next/server";
import path from "path";
import fs from "fs/promises";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import UserModel from "@/models/User";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "yourdomain.com").replace(/:\d+$/, "");
const SITES_DIR = path.join(process.cwd(), "public", "sites");

async function resolveUserId(hostname: string): Promise<string | null> {
    await connectDB();
    const host = hostname.replace(/:\d+$/, "");

    if (host.endsWith("." + ROOT_DOMAIN)) {
        const subdomain = host.split(".")[0];
        if (!subdomain || subdomain === "www") return null;
        const user = await UserModel.findOne({siteSubdomain: subdomain}).select("_id").lean();
        return user ? user._id.toString() : null;
    }

    const site = await UserSiteModel.findOne({customDomain: host, customDomainVerified: true}).select("userId").lean();
    return site ? site.userId.toString() : null;
}

function errorPage(title: string, message: string, status = 404): NextResponse {
    return new NextResponse(
        `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}.c{text-align:center}h1{font-size:2rem;color:#1e293b}p{color:#64748b}a{display:inline-block;margin-top:1.5rem;padding:.75rem 2rem;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none}</style></head><body><div class="c"><h1>${title}</h1><p>${message}</p><a href="/">Go Home</a></div></body></html>`,
        {status, headers: {"Content-Type": "text/html"}}
    );
}

// Required default export for Next.js App Router page files
export default function TenantInnerPage() {
    return null;
}

export async function GET(
    req: NextRequest,
    {params}: { params: { domain: string; slug: string[] } }
) {
    const slug = "/" + params.slug.join("/");

    try {
        const userId = await resolveUserId(params.domain);
        if (!userId) return errorPage("Site Not Found", "This site has not been set up yet.");

        const site = await UserSiteModel.findOne({userId, isPublished: true}).select("_id").lean();
        if (!site) return errorPage("Coming Soon", "This site is not published yet.");

        const relPath = `${slug.replace(/^\//, "")}/index.html`;
        const filePath = path.join(SITES_DIR, userId, relPath);

        try {
            const html = await fs.readFile(filePath, "utf-8");
            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                    "X-Content-Type-Options": "nosniff",
                },
            });
        } catch {
            return errorPage("Page Not Found", `"${slug}" doesn't exist on this site.`);
        }
    } catch (err) {
        console.error("[TENANT_INNER]", err);
        return errorPage("Server Error", "Something went wrong.", 500);
    }
}