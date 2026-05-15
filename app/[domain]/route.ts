// app/[domain]/route.ts  ← MUST be route.ts not page.tsx
// Serves published site HTML for custom domains AND subdomain previews on localhost.

import {NextResponse, NextRequest} from "next/server";
import path from "path";
import fs from "fs/promises";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import TenantDomainModel from "@/models/TenantDomain";

const SITES_DIR = path.join(process.cwd(), "public", "sites");

// These are real Next.js app routes — never treat them as domains
const RESERVED = new Set([
    "preview", "dashboard", "api", "login", "register", "invite",
    "auth", "_next", "favicon.ico", "robots.txt", "sitemap.xml",
]);

function errorPage(title: string, message: string, status = 404): NextResponse {
    return new NextResponse(
        `<!DOCTYPE html><html><head><title>${title}</title>
        <style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}.c{text-align:center;padding:2rem}h1{font-size:2rem;color:#1e293b}p{color:#64748b}a{display:inline-block;margin-top:1rem;padding:.5rem 1.5rem;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none}</style>
        </head><body><div class="c"><h1>${title}</h1><p>${message}</p></div></body></html>`,
        {status, headers: {"Content-Type": "text/html"}}
    );
}

export async function GET(
    req: NextRequest,
    {params}: { params: Promise<{ domain: string }>}
) {
    const { domain } = await params;
console.log("working",domain)
    // Skip reserved app routes — let Next.js handle them normally
    if (RESERVED.has(domain)) {
        return new NextResponse(null, { status: 404 });
    }

    try {
        await connectDB();
        console.log("DOMAIN HIT:", domain);

        // Look up userId from TenantDomain by subdomain or custom domain
        const tenantDomain = await TenantDomainModel.findOne({
            $or: [{subdomain: domain}, {customDomain: domain}],
        }).lean() as { userId: { toString(): string } } | null;

        if (!tenantDomain) {
            return errorPage("Site Not Found", `No site found for <strong>${domain}</strong>.`);
        }

        const userId = tenantDomain.userId.toString();

        const site = await (UserSiteModel as any).findOne({userId, isPublished: true})
            .select("_id").lean();

        if (!site) {
            return errorPage("Not Published", "This site exists but hasn't been published yet.");
        }

        const filePath = path.join(SITES_DIR, userId, "index.html");
        try {
            const html = await fs.readFile(filePath, "utf-8");
            return new NextResponse(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": "no-store",
                },
            });
        } catch {
            return errorPage("Not Built", "Click Publish in the Site Builder to generate this site.");
        }
    } catch (err) {
        console.error("[DOMAIN_ROUTE]", err);
        return errorPage("Server Error", "Something went wrong.", 500);
    }
}