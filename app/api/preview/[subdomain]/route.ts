// app/preview/[subdomain]/route.ts
// MUST be named route.ts not route.ts — this is a route handler not a page component
// Serves the published static HTML for a given subdomain on localhost dev

import {NextResponse} from "next/server";
import {NextRequest} from "next/server";
import path from "path";
import fs from "fs/promises";
import {connectDB} from "@/lib/db";
import UserSiteModel from "@/models/UserSite";
import TenantDomainModel from "@/models/TenantDomain";
import UserModel from "@/models/User";

const SITES_DIR = path.join(process.cwd(), "public", "sites");

function errorPage(title: string, message: string, status = 404): NextResponse {
    return new NextResponse(
        `<!DOCTYPE html><html><head><title>${title}</title>
        <style>
          body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}
          .c{text-align:center;max-width:500px;padding:2rem}
          h1{font-size:1.75rem;color:#1e293b;margin-bottom:.5rem}
          p{color:#64748b;margin:.5rem 0}
          code{background:#f1f5f9;padding:.2rem .5rem;border-radius:4px;font-size:.85rem}
          a{display:inline-block;margin-top:1.5rem;padding:.6rem 1.5rem;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}
        </style></head>
        <body><div class="c">
          <h1>${title}</h1>
          <p>${message}</p>
          <a href="/dashboard/admin/site">Open Builder</a>
        </div></body></html>`,
        {status, headers: {"Content-Type": "text/html"}}
    );
}

export async function GET(
    _req: NextRequest,
    {params}: { params: Promise<{ subdomain: string }> }
) {
    const {subdomain} = await params;
    console.log("[PREVIEW] hit:", subdomain);
    if (!subdomain?.trim()) {
        return errorPage("Invalid URL", "No subdomain specified.");
    }

    try {
        await connectDB();

        // Strategy 1: Look up by TenantDomain record
        let userId: string | null = null;

        // No isActive check — domains API now always sets isActive:true, but old records may not have it
        const domain = await TenantDomainModel.findOne({subdomain}).lean() as { userId: { toString(): string } } | null;
        if (domain) {
            userId = domain.userId.toString();
        }

        // Strategy 2: Look up by User.siteSubdomain field (fallback)
        if (!userId) {
            const user = await (UserModel as any).findOne({siteSubdomain: subdomain}).select("_id").lean() as {
                _id: { toString(): string }
            } | null;
            if (user) userId = user._id.toString();
        }

        if (!userId) {
            return errorPage(
                "Site Not Found",
                `No site found for <code>${subdomain}</code>. Make sure you saved your subdomain in Domain Settings.`
            );
        }

        // Check site exists and is published
        const site = await (UserSiteModel as any).findOne({userId})
            .select("isPublished siteName")
            .lean() as { isPublished: boolean; siteName: string } | null;

        if (!site) {
            return errorPage(
                "No Site Created",
                "This account hasn't built a site yet. Go to the Site Builder to get started."
            );
        }

        if (!site.isPublished) {
            return errorPage(
                "Site Not Published",
                `<strong>${site.siteName || "Your site"}</strong> exists but hasn't been published yet. Click <strong>Publish</strong> in the builder.`
            );
        }

        // Serve the static HTML file
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
            // File doesn't exist — site is marked published in DB but files weren't written
            // Auto-trigger a rebuild
            try {
                const {publishSite} = await import("@/lib/builder/publish");
                await publishSite(userId);
                const html = await fs.readFile(filePath, "utf-8");
                return new NextResponse(html, {
                    headers: {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store"},
                });
            } catch (rebuildErr) {
                console.error("[PREVIEW] Rebuild failed:", rebuildErr);
                return errorPage(
                    "Site Not Built",
                    "The site files haven't been generated. Click <strong>Publish</strong> in the Site Builder."
                );
            }
        }
    } catch (err) {
        console.error("[PREVIEW]", err);
        return errorPage("Server Error", "Something went wrong. Please try again.", 500);
    }
}
