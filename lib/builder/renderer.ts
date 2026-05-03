/**
 * lib/builder/renderer.ts
 *
 * Converts a component's htmlTemplate + user propValues into rendered HTML.
 * Runs both server-side (for publishing/export) and client-side (iframe preview).
 *
 * Syntax supported in htmlTemplate:
 *   {{key}}                        → simple value substitution
 *   {{#key}}...{{/key}}            → truthy block (renders if value is truthy)
 *   {{^key}}...{{/key}}            → falsy block (renders if value is falsy)
 *   {{#items}}...{{text}}...{{/items}}  → array iteration
 *   {{color:key}}                  → outputs hex color (same as {{key}} but signals color usage)
 */

export interface RenderOptions {
    props: Record<string, unknown>;
    globalTheme?: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
        textColor: string;
        fontHeading: string;
        fontBody: string;
        borderRadius: string;
    };
}

/**
 * Core template renderer — pure string manipulation, no dependencies.
 * Fast enough to run 60fps in-browser for live preview.
 */
export function renderTemplate(htmlTemplate: string, options: RenderOptions): string {
    const {props, globalTheme} = options;

    // Merge theme CSS variables into props so templates can use {{primaryColor}} etc.
    const mergedProps: Record<string, unknown> = {
        ...globalTheme,
        ...props,
    };

    let output = htmlTemplate;

    // 1. Array blocks: {{#items}}...{{fieldName}}...{{/items}}
    output = output.replace(
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, key, inner) => {
            const value = mergedProps[key];
            if (!Array.isArray(value)) return "";
            return value
                .map((item) => {
                    if (typeof item === "object" && item !== null) {
                        // Replace {{fieldName}} with item's field values
                        return inner.replace(/\{\{(\w+)\}\}/g, (_m: string, k: string) =>
                            escapeHtml(String((item as Record<string, unknown>)[k] ?? ""))
                        );
                    }
                    return inner.replace(/\{\{(\w+)\}\}/g, () => escapeHtml(String(item)));
                })
                .join("");
        }
    );

    // 2. Truthy conditional blocks: {{#key}}...{{/key}}
    output = output.replace(
        /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, key, inner) => {
            const value = mergedProps[key];
            return isTruthy(value) ? inner : "";
        }
    );

    // 3. Falsy conditional blocks: {{^key}}...{{/key}}
    output = output.replace(
        /\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
        (_match, key, inner) => {
            const value = mergedProps[key];
            return !isTruthy(value) ? inner : "";
        }
    );

    // 4. Color values ({{color:key}}) — same as simple substitution, no escaping
    output = output.replace(/\{\{color:(\w+)\}\}/g, (_match, key) => {
        const value = mergedProps[key];
        return typeof value === "string" && value.startsWith("#") ? value : "#000000";
    });

    // 5. Raw HTML values ({{html:key}}) — unescaped, for richtext fields
    output = output.replace(/\{\{html:(\w+)\}\}/g, (_match, key) => {
        const value = mergedProps[key];
        return typeof value === "string" ? value : "";
    });

    // 6. Simple substitutions: {{key}} — HTML-escaped for security
    output = output.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
        const value = mergedProps[key];
        if (value === undefined || value === null) return "";
        return escapeHtml(String(value));
    });

    return output;
}

/**
 * Builds the complete HTML document injected into the preview iframe.
 * Includes Tailwind CDN, Google Fonts, global theme CSS variables, and
 * all component HTML assembled in order.
 */
export function buildIframeDocument(options: {
    components: {
        instanceId: string;
        htmlTemplate: string;
        cssCode?: string;
        jsCode?: string;
        propValues: Record<string, unknown>;
    }[];
    globalTheme: RenderOptions["globalTheme"];
    globalCSS?: string;
    navbar?: { html: string };
    footer?: { html: string };
    integrations?: {
        googleAnalyticsId?: string;
        customHeadCode?: string;
        customBodyCode?: string;
    };
}): string {
    const {components, globalTheme, globalCSS, navbar, footer, integrations} = options;

    const theme = globalTheme ?? {
        primaryColor: "#4F46E5",
        secondaryColor: "#0EA5E9",
        accentColor: "#22C55E",
        backgroundColor: "#ffffff",
        textColor: "#111827",
        fontHeading: "Playfair Display",
        fontBody: "Source Sans Pro",
        borderRadius: "md",
    };

    // Render each component
    const renderedComponents = components.map((comp) =>
        `<div data-instance="${comp.instanceId}" class="builder-component">
${renderTemplate(comp.htmlTemplate, {props: comp.propValues, globalTheme: theme})}
</div>`
    );

    // Collect per-component CSS
    const componentCSS = components
        .filter((c) => c.cssCode)
        .map((c) => `/* ${c.instanceId} */\n${c.cssCode}`)
        .join("\n");

    // Collect per-component JS
    const componentJS = components
        .filter((c) => c.jsCode)
        .map((c) => `/* ${c.instanceId} */\n(function(){\n${c.jsCode}\n})();`)
        .join("\n");

    const borderRadiusMap: Record<string, string> = {
        none: "0px", sm: "4px", md: "8px", lg: "16px", full: "9999px",
    };

    const gaScript = integrations?.googleAnalyticsId
        ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${integrations.googleAnalyticsId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${integrations.googleAnalyticsId}');</script>`
        : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.fontHeading)}:wght@400;600;700;900&family=${encodeURIComponent(theme.fontBody)}:wght@400;500;600&display=swap" rel="stylesheet"/>
${gaScript}
${integrations?.customHeadCode ?? ""}
<style>
  :root {
    --color-primary: ${theme.primaryColor};
    --color-secondary: ${theme.secondaryColor};
    --color-accent: ${theme.accentColor};
    --color-bg: ${theme.backgroundColor};
    --color-text: ${theme.textColor};
    --font-heading: '${theme.fontHeading}', serif;
    --font-body: '${theme.fontBody}', sans-serif;
    --radius: ${borderRadiusMap[theme.borderRadius] ?? "8px"};
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: var(--font-body);
    background-color: var(--color-bg);
    color: var(--color-text);
    line-height: 1.6;
  }
  h1,h2,h3,h4,h5,h6 { font-family: var(--font-heading); line-height: 1.2; }
  a { color: var(--color-primary); text-decoration: none; }
  img { max-width: 100%; height: auto; display: block; }
  .builder-component { position: relative; }
  /* Builder highlight (only in preview mode) */
  .builder-preview-mode .builder-component:hover { outline: 2px solid var(--color-primary); outline-offset: 2px; cursor: pointer; }
  .builder-component.selected { outline: 2px solid var(--color-primary) !important; outline-offset: 2px; }
  ${componentCSS}
  ${globalCSS ?? ""}
</style>
</head>
<body>
${navbar?.html ?? ""}
<main>
${renderedComponents.join("\n")}
</main>
${footer?.html ?? ""}
<script>
(function() {
  // Component click → send message to parent builder
  document.querySelectorAll('.builder-component').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      var instanceId = el.getAttribute('data-instance');
      window.parent.postMessage({ type: 'COMPONENT_SELECTED', instanceId: instanceId }, '*');
    });
  });
  // Deselect on body click
  document.body.addEventListener('click', function() {
    window.parent.postMessage({ type: 'COMPONENT_DESELECTED' }, '*');
  });
  ${componentJS}
})();
</script>
${integrations?.customBodyCode ?? ""}
</body>
</html>`;
}

/**
 * Generates the final publishable HTML (no builder chrome, no postMessage scripts).
 * This is what gets written to the CDN / served on the user's domain.
 */
export function buildPublishableHTML(options: Parameters<typeof buildIframeDocument>[0] & {
    siteTitle: string;
    seoMeta?: { title?: string; description?: string; ogImage?: string };
}): string {
    const base = buildIframeDocument(options);
    // Strip builder-specific scripts and classes
    return base
            .replace(/window\.parent\.postMessage[\s\S]*?;/g, "")
            .replace(/builder-preview-mode/g, "")
            .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(options.seoMeta?.title ?? options.siteTitle)}</title>`)
        + (options.seoMeta?.description
            ? `\n<!-- Generated by SiteCraft -->`
            : "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isTruthy(value: unknown): boolean {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
}