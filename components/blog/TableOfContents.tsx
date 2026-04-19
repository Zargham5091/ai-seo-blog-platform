"use client";
import {useEffect, useState} from "react";
import {List} from "lucide-react";

interface TocItem {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    htmlContent: string;
    blocks: { type: string; content: Record<string, unknown> }[];
}

export function TableOfContents({htmlContent, blocks}: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>("");
    const [toc, setToc] = useState<TocItem[]>([]);

    useEffect(() => {
        const items: TocItem[] = [];

        // Extract from HTML content (tiptap rich text)
        if (htmlContent) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, "text/html");
            const headings = doc.querySelectorAll("h2, h3");
            headings.forEach((el, i) => {
                const text = el.textContent?.trim() ?? "";
                if (!text) return;
                const id = `heading-${i}-${text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)}`;
                items.push({id, text, level: el.tagName === "H2" ? 2 : 3});
            });
        }

        // Extract from paragraph blocks that start with ## or ### (markdown-style)
        if (blocks?.length) {
            blocks.forEach((block, i) => {
                if (block.type === "paragraph") {
                    const text = (block.content?.text as string) ?? "";
                    if (text.startsWith("## ")) {
                        const clean = text.slice(3).trim();
                        items.push({id: `block-h2-${i}`, text: clean, level: 2});
                    } else if (text.startsWith("### ")) {
                        const clean = text.slice(4).trim();
                        items.push({id: `block-h3-${i}`, text: clean, level: 3});
                    }
                }
            });
        }

        setToc(items);
    }, [htmlContent, blocks]);

    // Track scroll position to highlight active heading
    useEffect(() => {
        if (toc.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {rootMargin: "-20% 0% -60% 0%"}
        );

        toc.forEach(({id}) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [toc]);

    if (toc.length < 2) return null; // don't show for very short posts

    return (
        <div className="rounded-xl border bg-muted/30 p-4 mb-8">
            <div className="flex items-center gap-2 mb-3">
                <List className="h-4 w-4 text-indigo-500"/>
                <span className="text-sm font-semibold">Table of Contents</span>
            </div>
            <nav>
                <ul className="space-y-1.5">
                    {toc.map((item) => (
                        <li
                            key={item.id}
                            style={{paddingLeft: item.level === 3 ? "1rem" : "0"}}
                        >
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const el = document.getElementById(item.id);
                                    if (el) {
                                        el.scrollIntoView({behavior: "smooth", block: "start"});
                                        window.history.pushState(null, "", `#${item.id}`);
                                    }
                                }}
                                className={`text-sm leading-snug transition-colors hover:text-indigo-600 block py-0.5 ${
                                    activeId === item.id
                                        ? "text-indigo-600 font-medium"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {item.level === 3 && (
                                    <span className="text-muted-foreground/40 mr-1.5">—</span>
                                )}
                                {item.text}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}

// ── Server-side: inject IDs into HTML headings for anchor links ───────────────
export function injectHeadingIds(html: string): string {
    if (!html) return html;
    let counter = 0;
    return html.replace(/<(h[23])([^>]*)>(.*?)<\/h[23]>/gi, (match, tag, attrs, text) => {
        const clean = text.replace(/<[^>]*>/g, "").trim();
        const id = `heading-${counter++}-${clean.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)}`;
        return `<${tag}${attrs} id="${id}">${text}</${tag}>`;
    });
}
