// ═══════════════════════════════════════════════════════════════════════════
// FILE: lib/builder/publish.ts
//
// Publish pipeline — assembles complete static HTML for every page of a
// UserSite, then writes it to /public/sites/[userId]/ so Next.js can serve
// it statically. Also updates the DB record with lastBuiltAt.
//
// Called from: POST /api/site/publish
// ═══════════════════════════════════════════════════════════════════════════

import path from "path";
import fs from "fs/promises";
import {buildPublishableHTML} from "./renderer";
import UserSiteModel from "@/models/UserSite";
import PlanComponentModel from "@/models/PlanComponent";
import {connectDB} from "@/lib/db";

// Output directory inside /public — served as static files by Next.js
const SITES_DIR = path.join(process.cwd(), "public", "sites");

export interface PublishResult {
    userId: string;
    pagesBuilt: number;
    outputDir: string;
    builtAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main publish function
// ─────────────────────────────────────────────────────────────────────────────

export async function publishSite(userId: string): Promise<PublishResult> {
    await connectDB();

    // 1. Load full site document
    const site = await UserSiteModel.findOne({userId}).lean() as Record<string, unknown> | null;
    if (!site) throw new Error("Site not found");

    const pages = (site.pages as Record<string, unknown>[]) ?? [];
    const theme = (site.theme as Record<string, unknown>) ?? {};
    const globalCSS = (site.globalCSS as string) ?? "";
    const navbar = site.navbar as Record<string, unknown>;
    const footer = site.footer as Record<string, unknown>;
    const integrations = (site.integrations as Record<string, unknown>) ?? {};

    // 2. Collect all unique component IDs referenced across all pages
    const allComponentIds = new Set<string>();
    for (const page of pages) {
        for (const comp of (page.components as Record<string, unknown>[])) {
            allComponentIds.add(comp.componentId as string);
        }
    }

    // 3. Fetch component templates from DB in one query
    const dbComponents = await PlanComponentModel.find({
        _id: {$in: Array.from(allComponentIds)},
    }).select("_id key htmlTemplate cssCode jsCode").lean();

    const compMap = new Map(dbComponents.map((c) => [c._id.toString(), c]));

    // 4. Render navbar HTML (global, used on every page)
    let navbarHTML = "";
    let footerHTML = "";

    if (navbar?.componentKey) {
        const navComp = dbComponents.find((c) => c.key === navbar.componentKey);
        if (navComp) {
            navbarHTML = renderComponentHTML(navComp, {
                siteName: site.siteName as string,
                navLinks: navbar.links,
                ctaLabel: navbar.ctaLabel,
                ctaHref: navbar.ctaHref,
            }, theme);
        }
    }

    if ((footer as Record<string, unknown>)?.isEnabled && footer?.componentKey) {
        const footComp = dbComponents.find((c) => c.key === footer.componentKey);
        if (footComp) {
            footerHTML = renderComponentHTML(footComp, {
                siteName: site.siteName as string,
                tagline: site.siteTagline as string ?? "",
                copyright: (footer as Record<string, unknown>).bottomText as string,
                columns: (footer as Record<string, unknown>).columns,
                socialLinks: (footer as Record<string, unknown>).socialLinks,
            }, theme);
        }
    }

    // 5. Create output directory for this user
    const userDir = path.join(SITES_DIR, userId.toString());
    await fs.mkdir(userDir, {recursive: true});

    let pagesBuilt = 0;

    // 6. Build each page
    for (const page of pages) {
        if (!(page as Record<string, unknown>).isEnabled) continue;

        const pageComponents = ((page as Record<string, unknown>).components as Record<string, unknown>[])
            .filter((c) => c.isVisible)
            .sort((a, b) => (a.order as number) - (b.order as number))
            .map((c) => {
                const dbComp = compMap.get((c.componentId as string).toString());
                if (!dbComp) return null;
                return {
                    instanceId: c.instanceId as string,
                    htmlTemplate: dbComp.htmlTemplate ?? "",
                    cssCode: dbComp.cssCode,
                    jsCode: dbComp.jsCode,
                    propValues: (c.propValues as Record<string, unknown>) ?? {},
                };
            })
            .filter(Boolean) as {
            instanceId: string; htmlTemplate: string;
            cssCode?: string; jsCode?: string;
            propValues: Record<string, unknown>;
        }[];

        const pageSEO = (page as Record<string, unknown>).seo as Record<string, string> ?? {};

        const html = buildPublishableHTML({
            components: pageComponents,
            globalTheme: theme as Parameters<typeof buildPublishableHTML>[0]["globalTheme"],
            globalCSS: globalCSS + ((page as Record<string, unknown>).customCSS as string ?? ""),
            navbar: navbarHTML ? {html: navbarHTML} : undefined,
            footer: footerHTML ? {html: footerHTML} : undefined,
            integrations: {
                googleAnalyticsId: (integrations.googleAnalyticsId as string) ?? undefined,
                customHeadCode: (integrations.customHeadCode as string) ?? undefined,
                customBodyCode: (integrations.customBodyCode as string) ?? undefined,
            },
            siteTitle: site.siteName as string,
            seoMeta: {
                title: pageSEO.metaTitle,
                description: pageSEO.metaDescription,
                ogImage: pageSEO.ogImage,
            },
        });

        // Determine file path: "/" → index.html, "/about" → about/index.html
        const slug = (page as Record<string, unknown>).slug as string;
        const relPath = slug === "/" ? "index.html" : `${slug.replace(/^\//, "")}/index.html`;
        const filePath = path.join(userDir, relPath);

        // Ensure subdirectory exists
        await fs.mkdir(path.dirname(filePath), {recursive: true});
        await fs.writeFile(filePath, html, "utf-8");
        pagesBuilt++;
    }

    // 7. Write a site manifest (used by tenant renderer)
    const manifest = {
        userId: userId.toString(),
        siteName: site.siteName as string,
        siteType: site.siteType as string,
        pages: pages
            .filter((p) => (p as Record<string, unknown>).isEnabled)
            .map((p) => ({
                slug: (p as Record<string, unknown>).slug as string,
                title: (p as Record<string, unknown>).title as string,
            })),
        builtAt: new Date().toISOString(),
        isPublished: true,
    };
    await fs.writeFile(path.join(userDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

    // 8. Update DB
    const builtAt = new Date();
    await UserSiteModel.updateOne({userId}, {$set: {isPublished: true, publishedAt: builtAt, lastBuiltAt: builtAt}});

    return {userId: userId.toString(), pagesBuilt, outputDir: userDir, builtAt};
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete published site files (called when user unpublishes or deletes site)
// ─────────────────────────────────────────────────────────────────────────────

export async function unpublishSite(userId: string): Promise<void> {
    const userDir = path.join(SITES_DIR, userId.toString());
    try {
        await fs.rm(userDir, {recursive: true, force: true});
    } catch {
        // Already deleted — ignore
    }
    await UserSiteModel.updateOne({userId}, {$set: {isPublished: false}});
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: render a single component's htmlTemplate with props
// ─────────────────────────────────────────────────────────────────────────────

function renderComponentHTML(
    comp: { htmlTemplate: string },
    props: Record<string, unknown>,
    theme: Record<string, unknown>
): string {
    // Import renderTemplate inline to avoid circular deps
    // (renderer.ts exports it)
    // We duplicate the minimal version here for the publish pipeline:
    let html = comp.htmlTemplate;
    const merged = {...theme, ...props};

    // Array blocks
    html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, key, inner) => {
        const val = merged[key];
        if (!Array.isArray(val)) return "";
        return val.map((item) =>
            typeof item === "object" && item !== null
                ? inner.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => String((item as Record<string, unknown>)[k] ?? ""))
                : inner.replace(/\{\{(\w+)\}\}/g, () => String(item))
        ).join("");
    });

    // Truthy blocks
    html = html.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, key, inner) =>
        merged[key] ? inner : ""
    );

    // Simple substitutions
    html = html.replace(/\{\{(\w+)\}\}/g, (_m, key) =>
        String(merged[key] ?? "")
    );

    return html;
}