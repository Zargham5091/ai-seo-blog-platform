import React from "react";

interface Block {
    id: string;
    type: string;
    content: {
        text?: string;
        url?: string;
        caption?: string;
        author?: string;
        items?: string[];
        headers?: string[];
        rows?: string[][];
        code?: string;
        lang?: string;
        style?: "unordered" | "ordered";
    };
    order: number;
}

function getYouTubeId(url: string): string {
    if (!url) return "";
    const patterns = [
        /[?&]v=([^&#]+)/,
        /youtu\.be\/([^?&#]+)/,
        /youtube\.com\/embed\/([^?&#]+)/,
        /youtube\.com\/shorts\/([^?&#]+)/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m?.[1]) return m[1];
    }
    return "";
}

export function BlocksRenderer({blocks}: { blocks: Block[] }) {
    if (!blocks || blocks.length === 0) return null;

    const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div className="space-y-6">
            {sorted.map((block) => (
                <BlockItem key={block.id} block={block}/>
            ))}
        </div>
    );
}

function BlockItem({block}: { block: Block }) {
    const c = block.content ?? {};

    switch (block.type) {
        case "paragraph":
            return (
                <p className="text-base md:text-lg leading-relaxed text-foreground/90">
                    {(c.text as string) || ""}
                </p>
            );

        case "image":
            if (!c.url) return null;
            return (
                <figure className="my-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={c.url}
                        alt={(c.caption) || ""}
                        className="w-full rounded-xl object-cover max-h-[500px]"
                    />
                    {c.caption && (
                        <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
                            {c.caption as string}
                        </figcaption>
                    )}
                </figure>
            );

        case "quote":
            return (
                <blockquote
                    className="border-l-4 border-indigo-500 pl-6 py-2 my-6 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-xl">
                    <p className="text-lg italic text-foreground/80 leading-relaxed">
                        {(c.text as string) || ""}
                    </p>
                    {c.author && (
                        <cite className="block text-sm text-muted-foreground mt-2 not-italic font-medium">
                            — {c.author as string}
                        </cite>
                    )}
                </blockquote>
            );

        case "list": {
            const items = (c.items as string[]) ?? [];
            if (items.length === 0) return null;
            return (
                <ul className="list-disc list-outside pl-6 space-y-2 text-base leading-relaxed">
                    {items.filter(Boolean).map((item, i) => (
                        <li key={i} className="text-foreground/90">{item}</li>
                    ))}
                </ul>
            );
        }

        case "ordered_list": {
            const items = (c.items as string[]) ?? [];
            if (items.length === 0) return null;
            return (
                <ol className="list-decimal list-outside pl-6 space-y-2 text-base leading-relaxed">
                    {items.filter(Boolean).map((item, i) => (
                        <li key={i} className="text-foreground/90">{item}</li>
                    ))}
                </ol>
            );
        }

        case "table": {
            const headers = (c.headers as string[]) ?? [];
            const rows = (c.rows as string[][]) ?? [];
            if (headers.length === 0) return null;
            return (
                <div className="overflow-x-auto my-6 rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-4 py-3 text-left font-semibold border-b">
                                    {h}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {rows.map((row, r) => (
                            <tr key={r} className="hover:bg-muted/20 transition-colors">
                                {(row ?? []).map((cell, c_) => (
                                    <td key={c_} className="px-4 py-3">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        case "video": {
            const videoId = getYouTubeId((c.url as string) ?? "");
            if (!videoId) return null;
            return (
                <div
                    className="relative w-full rounded-xl overflow-hidden bg-black my-6 shadow-lg"
                    style={{paddingTop: "56.25%"}}
                >
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            );
        }

        case "code": {
            const code = (c.code as string) ?? "";
            const lang = (c.lang as string) ?? "";
            if (!code) return null;
            return (
                <div className="my-6 rounded-xl overflow-hidden shadow-md">
                    {lang && (
                        <div
                            className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 font-mono flex items-center justify-between">
                            <span>{lang}</span>
                            <span className="text-zinc-600">code</span>
                        </div>
                    )}
                    <pre className="bg-zinc-950 text-emerald-400 p-5 overflow-x-auto font-mono text-sm leading-relaxed">
            <code>{code}</code>
          </pre>
                </div>
            );
        }

        case "divider":
            return (
                <div className="my-8 flex items-center gap-4">
                    <hr className="flex-1 border-border"/>
                    <div className="flex gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"/>
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-300"/>
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-200"/>
                    </div>
                    <hr className="flex-1 border-border"/>
                </div>
            );

        default:
            return null; // unknown block types are silently skipped on public view
    }
}
