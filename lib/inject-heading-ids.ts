export function injectHeadingIds(html: string): string {
    if (!html) return html;
    let counter = 0;
    return html.replace(/<(h[23])([^>]*)>(.*?)<\/h[23]>/gi, (_, tag, attrs, text) => {
        const clean = text.replace(/<[^>]*>/g, "").trim();
        const id = `heading-${counter++}-${clean.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)}`;
        return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
    });
}