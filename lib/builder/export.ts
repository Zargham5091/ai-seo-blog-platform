/**
 * lib/builder/export.ts
 *
 * Export to static HTML — wraps buildPublishableHTML from renderer.ts
 * and triggers a browser download.
 *
 * Usage (client-side in builder):
 *   import { exportPageAsHTML, exportFullSiteAsZip } from "@/lib/builder/export";
 */

import {buildPublishableHTML} from "./renderer";

// ─────────────────────────────────────────────────────────────────────────────
// Types (matching UserSite shape)
// ─────────────────────────────────────────────────────────────────────────────

interface ExportComponent {
    instanceId: string;
    htmlTemplate: string;
    cssCode?: string;
    jsCode?: string;
    propValues: Record<string, unknown>;
    isVisible: boolean;
}

interface ExportTheme {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontHeading: string;
    fontBody: string;
    borderRadius: string;
}

interface ExportPage {
    title: string;
    slug: string;
    components: ExportComponent[];
    seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string };
    customCSS?: string;
}

interface ExportSiteOptions {
    siteName: string;
    theme: ExportTheme;
    globalCSS?: string;
    navbarHTML?: string;
    footerHTML?: string;
    integrations?: {
        googleAnalyticsId?: string;
        customHeadCode?: string;
        customBodyCode?: string;
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Single page export → file download
// ─────────────────────────────────────────────────────────────────────────────

export function exportPageAsHTML(page: ExportPage, siteOptions: ExportSiteOptions): void {
    const visibleComponents = page.components
        .filter((c) => c.isVisible)
        .sort((a, b) => 0); // already ordered

    const html = buildPublishableHTML({
        components: visibleComponents,
        globalTheme: siteOptions.theme,
        globalCSS: (siteOptions.globalCSS ?? "") + (page.customCSS ?? ""),
        navbar: siteOptions.navbarHTML ? {html: siteOptions.navbarHTML} : undefined,
        footer: siteOptions.footerHTML ? {html: siteOptions.footerHTML} : undefined,
        integrations: siteOptions.integrations,
        siteTitle: siteOptions.siteName,
        seoMeta: page.seo,
    });

    downloadFile(`${page.slug.replace("/", "") || "index"}.html`, html, "text/html");
}

// ─────────────────────────────────────────────────────────────────────────────
// Full site export → zip (uses JSZip loaded from CDN dynamically)
// ─────────────────────────────────────────────────────────────────────────────

export async function exportFullSiteAsZip(
    pages: ExportPage[],
    siteOptions: ExportSiteOptions
): Promise<void> {
    // Dynamically load JSZip — no npm install needed
    // Add <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"> to your _document
    // or use the dynamic import below if you have it installed
    const {default: JSZip} = await import("jszip");

    const zip = new JSZip();

    for (const page of pages) {
        const visibleComponents = page.components.filter((c) => c.isVisible);
        const html = buildPublishableHTML({
            components: visibleComponents,
            globalTheme: siteOptions.theme,
            globalCSS: (siteOptions.globalCSS ?? "") + (page.customCSS ?? ""),
            navbar: siteOptions.navbarHTML ? {html: siteOptions.navbarHTML} : undefined,
            footer: siteOptions.footerHTML ? {html: siteOptions.footerHTML} : undefined,
            integrations: siteOptions.integrations,
            siteTitle: siteOptions.siteName,
            seoMeta: page.seo,
        });

        const filename = page.slug === "/" ? "index.html" : `${page.slug.replace(/^\//, "")}/index.html`;
        zip.file(filename, html);
    }

    const blob = await zip.generateAsync({type: "blob"});
    downloadFile(`${siteOptions.siteName.replace(/\s+/g, "_")}_export.zip`, blob as unknown as string, "application/zip", true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

function downloadFile(filename: string, content: string | Blob, mimeType: string, isBlob = false): void {
    const a = document.createElement("a");
    if (isBlob) {
        a.href = URL.createObjectURL(content as Blob);
    } else {
        a.href = `data:${mimeType};charset=utf-8,${encodeURIComponent(content as string)}`;
    }
    a.download = filename;
    a.click();
    if (isBlob) URL.revokeObjectURL(a.href);
}


// =============================================================================
// lib/builder/duplicate.ts
// Duplicate a canvas component instance with a new unique instanceId
// =============================================================================

import {v4 as uuid} from "uuid";

interface CanvasComponent {
    instanceId: string;
    componentKey: string;
    componentId: string;
    name: string;
    category: string;
    htmlTemplate: string;
    cssCode?: string;
    jsCode?: string;
    propsSchema: unknown[];
    propValues: Record<string, unknown>;
    isVisible: boolean;
    isLocked: boolean;
    order: number;
}

/**
 * Duplicates a component, placing the copy directly after the original.
 * Returns the new full components array (ready to save to state).
 */
export function duplicateComponent(
    components: CanvasComponent[],
    instanceId: string
): CanvasComponent[] {
    const idx = components.findIndex((c) => c.instanceId === instanceId);
    if (idx === -1) return components;

    const original = components[idx];
    const duplicate: CanvasComponent = {
        ...original,
        instanceId: uuid(),                           // new unique id
        propValues: JSON.parse(JSON.stringify(original.propValues)), // deep clone props
        isLocked: false,                              // duplicates always unlocked
        order: original.order + 0.5,                 // insert after original
    };

    const updated = [...components, duplicate]
        .sort((a, b) => a.order - b.order)
        .map((c, i) => ({...c, order: i}));           // renormalize order

    return updated;
}


// =============================================================================
// lib/builder/mobile-check.ts
// Checks if an iframe page looks broken on mobile viewports
// =============================================================================

export interface MobileIssue {
    instanceId: string;
    componentName: string;
    issue: string;
    severity: "warning" | "error";
}

/**
 * Injects a script into the preview iframe that checks common mobile issues.
 * Returns an array of issues found. Call after iframe finishes loading.
 *
 * Usage:
 *   const issues = await checkMobileIssues(iframeRef.current, components);
 */
export async function checkMobileIssues(
    iframe: HTMLIFrameElement,
    components: { instanceId: string; name: string }[]
): Promise<MobileIssue[]> {
    return new Promise((resolve) => {
        const issues: MobileIssue[] = [];

        try {
            const doc = iframe.contentDocument;
            if (!doc) {
                resolve([]);
                return;
            }

            for (const comp of components) {
                const el = doc.querySelector(`[data-instance="${comp.instanceId}"]`) as HTMLElement | null;
                if (!el) continue;

                const rect = el.getBoundingClientRect();

                // Check 1: Element wider than 390px (mobile viewport)
                if (rect.width > 390) {
                    issues.push({
                        instanceId: comp.instanceId,
                        componentName: comp.name,
                        issue: `Content is ${Math.round(rect.width)}px wide — overflows mobile (390px)`,
                        severity: "error",
                    });
                }

                // Check 2: Text too small (below 12px)
                const allText = Array.from(el.querySelectorAll("p, span, li, a, button")) as HTMLElement[];
                for (const textEl of allText) {
                    const fs = parseFloat(window.getComputedStyle(textEl).fontSize);
                    if (fs < 12 && fs > 0) {
                        issues.push({
                            instanceId: comp.instanceId,
                            componentName: comp.name,
                            issue: `Text element has font-size ${fs}px — too small for mobile (min 12px)`,
                            severity: "warning",
                        });
                        break; // one warning per component is enough
                    }
                }

                // Check 3: Images without width constraints
                const imgs = Array.from(el.querySelectorAll("img")) as HTMLImageElement[];
                for (const img of imgs) {
                    if (!img.style.maxWidth && !img.className.includes("max-w")) {
                        issues.push({
                            instanceId: comp.instanceId,
                            componentName: comp.name,
                            issue: "Image may overflow on mobile — add max-w-full or width:100%",
                            severity: "warning",
                        });
                        break;
                    }
                }

                // Check 4: Buttons/CTAs too small to tap (< 44px touch target)
                const buttons = Array.from(el.querySelectorAll("button, a[href]")) as HTMLElement[];
                for (const btn of buttons) {
                    const br = btn.getBoundingClientRect();
                    if (br.height < 44 && br.height > 0 && br.width < 44) {
                        issues.push({
                            instanceId: comp.instanceId,
                            componentName: comp.name,
                            issue: `Touch target ${Math.round(br.height)}x${Math.round(br.width)}px — below 44x44px minimum`,
                            severity: "warning",
                        });
                        break;
                    }
                }
            }
        } catch {
            // iframe may block access — ignore
        }

        resolve(issues);
    });
}