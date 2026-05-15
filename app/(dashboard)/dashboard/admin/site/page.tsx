"use client";

import React, {useCallback, useEffect, useRef, useState} from "react";
import {
    Laptop, Tablet, Smartphone, Globe, Sparkles, Plus, Eye,
    Layers, Trash2, EyeOff, Undo, Redo, Save,
    Send, X, Search, Navigation, Loader2, Check, Palette,
    Copy, Download, Upload, FileText, AlertTriangle,
    Menu, Share2, Wand2, Link2, ChevronRight,
    Settings, Zap, LayoutTemplate, Paintbrush, Code2, Monitor,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {buildIframeDocument} from "@/lib/builder/renderer";
import {duplicateComponent, checkMobileIssues, exportPageAsHTML, exportFullSiteAsZip} from "@/lib/builder/export";
import type {MobileIssue} from "@/lib/builder/export";
import {v4 as uuid} from "uuid";
import {useSession} from "next-auth/react";
import ThemeEditor, {type SiteTheme} from "@/components/builder/ThemeEditor";
import PageManager from "@/components/builder/PageManager";
import GlobalSections from "@/components/builder/GlobalSections";
import {PersonalityOnboarding} from "@/components/builder/PersonalityOnboarding";
import {MagicAIPanel} from "@/components/builder/MagicAIPanel";
import {AssetLibrary} from "@/components/builder/AssetLibrary";
import {OGPreviewEditor} from "@/components/builder/OGPreviewEditor";
import {LiveSEOScore} from "@/components/builder/LiveSEOScore";
import {CAT_ICONS} from "@/components/builder/SortableLayerItem";
import {AnimationStudio} from "@/components/builder/AnimationStudio";
import {VibeCheckPanel} from "@/components/builder/VibeCheckPanel";
import Link from "next/link";
import {cn} from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type DevicePreview = "desktop" | "tablet" | "mobile";
type RightPanel =
    | "props" | "theme" | "pages" | "global" | "seo" | "export"
    | "og" | "magic" | "assets" | "clone" | "animation" | null;
type ComponentCategory =
    | "navbar" | "hero" | "section" | "footer" | "layout"
    | "widget" | "animation" | "template" | "integration";

interface PropSchema {
    key: string;
    label: string;
    type: string;
    defaultValue: unknown;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    group?: string;
    arrayItemSchema?: PropSchema[];
}

interface LibraryComponent {
    _id: string;
    key: string;
    name: string;
    category: ComponentCategory;
    description?: string;
    previewImage?: string;
    htmlTemplate: string;
    cssCode?: string;
    jsCode?: string;
    propsSchema: PropSchema[];
    defaultProps: Record<string, unknown>;
    isFeatured?: boolean;
    availableTo: string[];
}

interface CanvasComponent {
    instanceId: string;
    componentKey: string;
    componentId: string;
    name: string;
    category: ComponentCategory;
    htmlTemplate: string;
    cssCode?: string;
    jsCode?: string;
    propsSchema: PropSchema[];
    propValues: Record<string, unknown>;
    isVisible: boolean;
    isLocked: boolean;
    order: number;
    animationPreset?: string;
}

interface PageSEO {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
}

interface UserPage {
    pageId: string;
    slug: string;
    title: string;
    isHomePage: boolean;
    showInNav: boolean;
    components: CanvasComponent[];
    isEnabled: boolean;
    role: string;
    seo: PageSEO;
    customCSS?: string;
}

interface UserSite {
    _id: string;
    siteName: string;
    siteType: string;
    theme: SiteTheme;
    globalCSS: string;
    navbar: {
        componentKey?: string; style: string; isTransparent: boolean;
        links: { label: string; href: string; order: number }[];
        ctaLabel?: string; ctaHref?: string; showThemeToggle: boolean;
    };
    footer: {
        componentKey?: string; isEnabled: boolean;
        columns: { heading: string; links: { label: string; href: string }[] }[];
        bottomText: string; socialLinks: { platform: string; url: string }[];
    };
    pages: UserPage[];
    builderState: { activePageId?: string; devicePreview: DevicePreview; zoom: number; aiSuggestionsEnabled: boolean };
    isPublished: boolean;
    publishedAt?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEVICE_WIDTHS: Record<DevicePreview, string> = {
    desktop: "100%", tablet: "768px", mobile: "390px",
};
const SITE_TYPES = [
    {type: "blog", emoji: "✍️", label: "Blog", desc: "Articles & content"},
    {type: "portfolio", emoji: "🎨", label: "Portfolio", desc: "Showcase your work"},
    {type: "saas", emoji: "🚀", label: "SaaS", desc: "Software product"},
    {type: "ecommerce", emoji: "🛍️", label: "Shop", desc: "Sell products"},
    {type: "restaurant", emoji: "🍽️", label: "Restaurant", desc: "Food & dining"},
    {type: "agency", emoji: "💼", label: "Agency", desc: "Services & team"},
];
const CATS = ["all", "navbar", "hero", "section", "footer", "widget", "animation", "layout", "integration"] as const;
const SINGLETON_CATEGORIES: ComponentCategory[] = ["navbar", "footer"];

// ─── ImagePropField ───────────────────────────────────────────────────────────

function ImagePropField({label, value, onChange}: { label: string; value: string; onChange: (v: unknown) => void }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("File must be under 5MB");
            return;
        }
        if (!file.type.startsWith("image/")) {
            setError("Only image files allowed");
            return;
        }
        setError(null);
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/upload", {method: "POST", body: fd});
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error ?? "Upload failed");
            onChange(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            {value && (
                <div className="relative group rounded-lg overflow-hidden border bg-muted/20 aspect-video">
                    <img src={value} alt="Preview" className="w-full h-full object-cover"
                         onError={(e) => {
                             (e.target as HTMLImageElement).style.display = "none";
                         }}/>
                    <button onClick={() => onChange("")}
                            className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-3 w-3"/>
                    </button>
                </div>
            )}
            <button onClick={() => inputRef.current?.click()} disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 disabled:opacity-50 transition-all">
                {uploading ? <><Loader2 className="h-3 w-3 animate-spin"/>Uploading…</> : <><Upload
                    className="h-3 w-3"/>{value ? "Replace" : "Upload image"}</>}
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
            <Input type="url" value={value} onChange={(e) => onChange(e.target.value)}
                   placeholder="Or paste URL…" className="h-7 text-xs"/>
            {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle
                className="h-3 w-3 shrink-0"/>{error}</p>}
        </div>
    );
}

// ─── PropField ────────────────────────────────────────────────────────────────

function PropField({schema, value, onChange}: { schema: PropSchema; value: unknown; onChange: (v: unknown) => void }) {
    const s = String(value ?? "");

    if (schema.type === "boolean") return (
        <label className="flex items-center gap-2.5 cursor-pointer py-1 group">
            <div
                className={cn("relative w-9 h-5 rounded-full transition-colors", Boolean(value) ? "bg-indigo-500" : "bg-muted-foreground/30")}>
                <div
                    className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", Boolean(value) ? "translate-x-4" : "translate-x-0")}/>
                <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)}
                       className="sr-only"/>
            </div>
            <span className="text-sm">{schema.label}</span>
        </label>
    );

    if (schema.type === "color") return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
            <div className="flex gap-2">
                <input type="color" value={s || "#4F46E5"} onChange={(e) => onChange(e.target.value)}
                       className="h-8 w-10 rounded-md border cursor-pointer p-0.5 bg-transparent"/>
                <Input value={s} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs font-mono flex-1"/>
            </div>
        </div>
    );

    if (schema.type === "select") return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
            <select value={s} onChange={(e) => onChange(e.target.value)}
                    className="w-full h-8 rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {(schema.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );

    if (schema.type === "textarea" || schema.type === "richtext") return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
            <textarea value={s} onChange={(e) => onChange(e.target.value)} rows={3}
                      placeholder={schema.placeholder}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
        </div>
    );

    if (schema.type === "image") return <ImagePropField label={schema.label} value={s} onChange={onChange}/>;

    if (schema.type === "array") {
        const arr = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
        return (
            <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
                {arr.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-2.5 space-y-2 bg-muted/20">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                            <button onClick={() => onChange(arr.filter((_, i) => i !== idx))}
                                    className="text-muted-foreground hover:text-red-500 transition-colors"><X
                                className="h-3.5 w-3.5"/></button>
                        </div>
                        {(schema.arrayItemSchema ?? []).map((sub) => (
                            <PropField key={sub.key} schema={sub} value={item[sub.key]}
                                       onChange={(v) => {
                                           const u = [...arr];
                                           u[idx] = {...item, [sub.key]: v};
                                           onChange(u);
                                       }}/>
                        ))}
                    </div>
                ))}
                <button onClick={() => {
                    const ni: Record<string, unknown> = {};
                    (schema.arrayItemSchema ?? []).forEach((s) => {
                        ni[s.key] = s.defaultValue ?? "";
                    });
                    onChange([...arr, ni]);
                }}
                        className="w-full border border-dashed rounded-lg py-2 text-xs text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 flex items-center justify-center gap-1 transition-all">
                    <Plus className="h-3 w-3"/>Add {schema.label}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
                {schema.label}{schema.required && <span className="text-red-400 ml-0.5">*</span>}
            </Label>
            <Input type={schema.type === "number" ? "number" : "text"} value={s}
                   onChange={(e) => onChange(schema.type === "number" ? Number(e.target.value) : e.target.value)}
                   placeholder={schema.placeholder} className="h-8 text-sm"/>
        </div>
    );
}

// ─── ComponentThumbnail ───────────────────────────────────────────────────────

function ComponentThumbnail({html, defaultProps, theme}: {
    html: string;
    defaultProps: Record<string, unknown>;
    theme?: SiteTheme
}) {
    const rendered = React.useMemo(() => {
        let out = html;
        out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => {
            if (theme && key in theme) return String(theme[key as keyof SiteTheme] ?? "");
            return String(defaultProps[key] ?? "");
        });
        out = out.replace(/\{\{[#^/][^}]*\}\}/g, "");
        return out;
    }, [html, defaultProps, theme]);

    const doc = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;overflow:hidden;pointer-events:none;}*{animation:none!important;transition:none!important;}</style></head><body>${rendered}</body></html>`;

    return (
        <div className="relative w-full h-full overflow-hidden pointer-events-none">
            <iframe srcDoc={doc} className="absolute top-0 left-0 border-0"
                    style={{
                        width: "800px",
                        height: "400px",
                        transform: "scale(0.185)",
                        transformOrigin: "top left",
                        pointerEvents: "none"
                    }}
                    sandbox="allow-scripts" title="preview" loading="lazy"/>
        </div>
    );
}

// ─── SEOPanel ─────────────────────────────────────────────────────────────────

function SEOPanel({page, onSave, onClose}: {
    page: UserPage;
    onSave: (seo: PageSEO, css: string) => void;
    onClose: () => void
}) {
    const [seo, setSeo] = useState<PageSEO>({...page.seo});
    const [css, setCss] = useState(page.customCSS ?? "");
    const tl = (seo.metaTitle ?? "").length, dl = (seo.metaDescription ?? "").length;

    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="SEO Settings" subtitle={page.title} onClose={onClose}
                         icon={<FileText className="h-4 w-4 text-indigo-500"/>}/>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <FieldGroup>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <Label className="text-xs font-semibold">Meta Title</Label>
                            <span
                                className={cn("text-xs", tl > 60 ? "text-red-400" : tl > 50 ? "text-amber-400" : "text-muted-foreground")}>{tl}/60</span>
                        </div>
                        <Input value={seo.metaTitle ?? ""} onChange={e => setSeo({...seo, metaTitle: e.target.value})}
                               placeholder="Page title for search engines" className="h-9"/>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between">
                            <Label className="text-xs font-semibold">Meta Description</Label>
                            <span
                                className={cn("text-xs", dl > 160 ? "text-red-400" : dl > 140 ? "text-amber-400" : "text-muted-foreground")}>{dl}/160</span>
                        </div>
                        <textarea value={seo.metaDescription ?? ""}
                                  onChange={e => setSeo({...seo, metaDescription: e.target.value})}
                                  rows={3} placeholder="Brief description for search results"
                                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                    </div>
                </FieldGroup>

                <FieldGroup label="Open Graph">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">OG Image URL</Label>
                        <Input value={seo.ogImage ?? ""} onChange={e => setSeo({...seo, ogImage: e.target.value})}
                               placeholder="https://… (1200×630px)"/>
                        {seo.ogImage &&
                            <img src={seo.ogImage} alt="OG" className="w-full rounded-lg border object-cover h-28"/>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Canonical URL <span
                            className="font-normal text-muted-foreground">(optional)</span></Label>
                        <Input value={seo.canonicalUrl ?? ""}
                               onChange={e => setSeo({...seo, canonicalUrl: e.target.value})}
                               placeholder="https://yourdomain.com/page"/>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <div
                            className={cn("relative w-9 h-5 rounded-full transition-colors", seo.noIndex ? "bg-red-400" : "bg-muted-foreground/30")}>
                            <div
                                className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", seo.noIndex ? "translate-x-4" : "translate-x-0")}/>
                            <input type="checkbox" checked={seo.noIndex ?? false}
                                   onChange={e => setSeo({...seo, noIndex: e.target.checked})} className="sr-only"/>
                        </div>
                        <div><p className="text-sm font-medium">No Index</p><p
                            className="text-xs text-muted-foreground">Hide from search engines</p></div>
                    </label>
                </FieldGroup>

                <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Google
                        Preview</p>
                    <p className="text-blue-600 text-sm font-medium truncate">{seo.metaTitle || page.title || "Page Title"}</p>
                    <p className="text-emerald-700 text-xs">yourdomain.com{page.slug}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{seo.metaDescription || "Add a description to improve click-through rate."}</p>
                </div>

                <FieldGroup label="Custom CSS">
          <textarea value={css} onChange={e => setCss(e.target.value)} rows={5} placeholder="/* Page-specific CSS */"
                    className="w-full rounded-lg border bg-zinc-950 text-sky-300 font-mono px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </FieldGroup>
            </div>
            <div className="border-t px-4 py-3 shrink-0">
                <Button variant="gradient" className="w-full gap-2" onClick={() => onSave(seo, css)}>
                    <Check className="h-4 w-4"/>Save SEO
                </Button>
            </div>
        </div>
    );
}

// ─── ExportPanel ──────────────────────────────────────────────────────────────

function ExportPanel({site, activePage, onClose}: {
    site: UserSite;
    activePage: UserPage | null;
    onClose: () => void
}) {
    const [exp, setExp] = useState<string | null>(null);
    const opts = {siteName: site.siteName, theme: site.theme, globalCSS: site.globalCSS, integrations: {}};
    const doExport = async (t: "page" | "site") => {
        setExp(t);
        if (t === "page" && activePage) exportPageAsHTML(activePage, opts);
        else await exportFullSiteAsZip(site.pages, opts);
        setExp(null);
    };
    return (
        <div className="flex flex-col h-full">
            <PanelHeader title="Export" onClose={onClose} icon={<Download className="h-4 w-4 text-indigo-500"/>}/>
            <div className="flex-1 px-4 py-4 space-y-3">
                <ExportCard icon={<FileText className="h-5 w-5 text-indigo-500"/>} title="Current Page"
                            desc={`${activePage?.title} → HTML file`}>
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => doExport("page")}
                            isLoading={exp === "page"} disabled={!activePage}>
                        <Download className="h-3.5 w-3.5"/>Download HTML
                    </Button>
                </ExportCard>
                <ExportCard icon={<Download className="h-5 w-5 text-purple-500"/>} title="Full Site ZIP"
                            desc={`${site.pages.length} pages bundled`}>
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => doExport("site")}
                            isLoading={exp === "site"}>
                        <Download className="h-3.5 w-3.5"/>Download ZIP
                    </Button>
                </ExportCard>
                <p className="text-xs text-muted-foreground text-center px-2 py-2">
                    Host on Netlify, Vercel, GitHub Pages or any static host — no server needed.
                </p>
            </div>
        </div>
    );
}

function ExportCard({icon, title, desc, children}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border p-4 space-y-3 bg-card">
            <div className="flex items-center gap-2.5">{icon}
                <div><p className="font-semibold text-sm">{title}</p><p
                    className="text-xs text-muted-foreground">{desc}</p></div>
            </div>
            {children}
        </div>
    );
}

// ─── SiteType Onboarding ──────────────────────────────────────────────────────

function SiteTypeOnboarding({onSelect}: { onSelect: (type: string, name: string) => void }) {
    const [sel, setSel] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
            {/* Background grid */}
            <div
                className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"/>
            <div className="relative max-w-3xl w-full">
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
                        <Sparkles className="h-3.5 w-3.5"/>Website Builder
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">What are you building?</h1>
                    <p className="text-slate-400 text-lg">Pick a starting point — customize everything after.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                    {SITE_TYPES.map(o => (
                        <button key={o.type} onClick={() => setSel(o.type)}
                                className={cn("relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg hover:shadow-indigo-500/10",
                                    sel === o.type ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10")}>
                            {sel === o.type && (
                                <div
                                    className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white"/>
                                </div>
                            )}
                            <span className="text-3xl mb-3">{o.emoji}</span>
                            <p className="font-semibold text-sm text-white">{o.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{o.desc}</p>
                        </button>
                    ))}
                </div>

                {sel && (
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex gap-3">
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name your site…"
                               className="flex-1 text-base bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                               autoFocus
                               onKeyDown={e => e.key === "Enter" && name.trim() && (setLoading(true), onSelect(sel, name.trim()))}/>
                        <Button variant="gradient" onClick={() => {
                            if (!name.trim()) return;
                            setLoading(true);
                            onSelect(sel, name.trim());
                        }}
                                disabled={!name.trim() || loading} className="gap-2 px-6 shrink-0">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
                            {loading ? "Building…" : "Start Building"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function PanelHeader({title, subtitle, onClose, icon, action}: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    icon?: React.ReactNode;
    action?: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-card/50">
            <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
                </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {action}
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X
                    className="h-4 w-4"/></button>
            </div>
        </div>
    );
}

function FieldGroup({label, children}: { label?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            {label && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>}
            {children}
        </div>
    );
}

function ToolbarBtn({active, onClick, title, children}: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode
}) {
    return (
        <button onClick={onClick} title={title}
                className={cn("p-1.5 rounded-lg transition-all", active ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
            {children}
        </button>
    );
}

// ─── Main Builder Page ────────────────────────────────────────────────────────

export default function SiteBuilderPage() {
    useSession();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const undoStack = useRef<CanvasComponent[][]>([]);
    const redoStack = useRef<CanvasComponent[][]>([]);
    const propAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dndSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Use refs for stale-closure-safe event handlers
    const rightPanelRef = useRef<RightPanel>(null);
    const activePageIdRef = useRef<string | null>(null);
    const libraryRef = useRef<LibraryComponent[]>([]);
    // addCompAt defined below — ref so message handler (mounted once) can call it
    const addCompAtRef = useRef<(lc: LibraryComponent, insertBeforeId: string | null) => void>(() => {
    });

    const [site, setSite] = useState<UserSite | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showPersonality, setShowPersonality] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [devicePreview, setDevicePreview] = useState<DevicePreview>("desktop");
    const [zoom, setZoom] = useState(100);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightPanel, setRightPanel] = useState<RightPanel>(null);

    const [library, setLibrary] = useState<LibraryComponent[]>([]);
    const [libCat, setLibCat] = useState<string>("all");
    const [libSearch, setLibSearch] = useState("");

    const [showAI, setShowAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    const [mobileIssues, setMobileIssues] = useState<MobileIssue[]>([]);
    const [checkingMobile, setCheckingMobile] = useState(false);
    const [showMobilePanel, setShowMobilePanel] = useState(false);


    const [magicAIOpen, setMagicAIOpen] = useState(false);
    const [aiClearCanvas, setAiClearCanvas] = useState(false);
    const [cloneUrl, setCloneUrl] = useState("");
    const [cloneLoading, setCloneLoading] = useState(false);
    const [cloneError, setCloneError] = useState("");

    // Keep ref in sync for stale-closure-safe event listeners
    useEffect(() => {
        rightPanelRef.current = rightPanel;
    }, [rightPanel]);
    useEffect(() => {
        activePageIdRef.current = activePageId;
    }, [activePageId]);
    useEffect(() => {
        libraryRef.current = library;
    }, [library]);


    // ── Load ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([
            fetch("/api/site").then(r => r.json()),
            fetch("/api/plan-components").then(r => r.json()),
        ]).then(([s, l]) => {
            if (s.success && s.data) {
                setSite(s.data);
                setActivePageId(s.data.builderState?.activePageId ?? s.data.pages[0]?.pageId ?? null);
                setDevicePreview(s.data.builderState?.devicePreview ?? "desktop");
            } else {
                setShowOnboarding(true);
            }
            if (l.success) setLibrary(l.data);
            setIsLoading(false);
        });
    }, []);

    // ── iframe postMessage — use ref to avoid stale closure ──────────────────
    useEffect(() => {
        const h = (e: MessageEvent) => {
            const {type} = e.data ?? {};

            if (type === "COMPONENT_SELECTED") {
                setSelectedInstanceId(e.data.instanceId);
                setRightPanel("props");

            } else if (type === "COMPONENT_DBLCLICK") {
                setSelectedInstanceId(e.data.instanceId);
                setRightPanel("props");

            } else if (type === "COMPONENT_DESELECTED") {
                setTimeout(() => {
                    if (rightPanelRef.current === "props") {
                        setSelectedInstanceId(null);
                        setRightPanel(null);
                    }
                }, 50);

            } else if (type === "COMPONENT_REORDER") {
                const {fromId, insertBeforeId} = e.data as { fromId: string; insertBeforeId: string | null };
                setSite(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        pages: prev.pages.map(p => {
                            if (p.pageId !== activePageIdRef.current) return p;
                            const sorted = [...p.components].sort((a, b) => a.order - b.order);
                            const fromIdx = sorted.findIndex(c => c.instanceId === fromId);
                            if (fromIdx === -1) return p;
                            const [moving] = sorted.splice(fromIdx, 1);
                            if (insertBeforeId) {
                                const toIdx = sorted.findIndex(c => c.instanceId === insertBeforeId);
                                sorted.splice(toIdx === -1 ? sorted.length : toIdx, 0, moving);
                            } else {
                                sorted.push(moving);
                            }
                            return {...p, components: sorted.map((c, i) => ({...c, order: i}))};
                        }),
                    };
                });
                if (dndSaveTimer.current) clearTimeout(dndSaveTimer.current);
                dndSaveTimer.current = setTimeout(() => saveComps(true), 800);

            } else if (type === "COMPONENT_DROP_EXTERNAL") {
                const {componentKey, insertBeforeId} = e.data as {
                    componentKey: string;
                    insertBeforeId: string | null
                };
                const lc = libraryRef.current.find(l => l.key === componentKey);
                if (!lc) return;
                addCompAtRef.current(lc, insertBeforeId);
            }
        };
        window.addEventListener("message", h);
        return () => window.removeEventListener("message", h);
    }, []); // no deps — uses refs

    // ── Derived ───────────────────────────────────────────────────────────────
    const activePage = site?.pages.find(p => p.pageId === activePageId) ?? null;
    const components = (activePage?.components ?? []).slice().sort((a, b) => a.order - b.order);
    const selectedComp = components.find(c => c.instanceId === selectedInstanceId) ?? null;
    const filteredLib = library.filter(c =>
        (libCat === "all" || c.category === libCat) &&
        (!libSearch || c.name.toLowerCase().includes(libSearch.toLowerCase()) || c.category.toLowerCase().includes(libSearch.toLowerCase()))
    );

    // ── Update components in active page ─────────────────────────────────────
    const updateComps = useCallback((c: CanvasComponent[]) => {
        setSite(prev => prev ? {
            ...prev,
            pages: prev.pages.map(p => p.pageId === activePageId ? {...p, components: c} : p),
        } : prev);
    }, [activePageId]);

    // ── Add component to canvas ───────────────────────────────────────────────
    const addComp = useCallback((lc: LibraryComponent) => {
        undoStack.current.push([...components]);
        redoStack.current = [];

        const newComp: CanvasComponent = {
            instanceId: uuid(), componentKey: lc.key, componentId: lc._id,
            name: lc.name, category: lc.category, htmlTemplate: lc.htmlTemplate,
            cssCode: lc.cssCode, jsCode: lc.jsCode, propsSchema: lc.propsSchema ?? [],
            propValues: {...(lc.defaultProps ?? {})}, isVisible: true, isLocked: false, order: components.length,
        };

        // Singleton: navbar/footer only one allowed per page
        if (SINGLETON_CATEGORIES.includes(lc.category)) {
            const existingIdx = components.findIndex(c => c.category === lc.category);
            if (existingIdx !== -1) {
                const updated = components.map((c, i) => i === existingIdx ? {
                    ...newComp,
                    instanceId: c.instanceId,
                    order: c.order
                } : c);
                updateComps(updated);
                setSelectedInstanceId(updated[existingIdx].instanceId);
                setRightPanel("props");
                return;
            }
            if (lc.category === "navbar") {
                const reordered = [newComp, ...components].map((c, i) => ({...c, order: i}));
                updateComps(reordered);
                setSelectedInstanceId(newComp.instanceId);
                setRightPanel("props");
                return;
            }
            if (lc.category === "footer") {
                const reordered = [...components, newComp].map((c, i) => ({...c, order: i}));
                updateComps(reordered);
                setSelectedInstanceId(newComp.instanceId);
                setRightPanel("props");
                return;
            }
        }

        const updated = [...components, newComp];
        updateComps(updated);
        // Auto-select the newly added component
        setSelectedInstanceId(newComp.instanceId);
        setRightPanel("props");
    }, [components, updateComps]);

    // ── addCompAt: add component at a specific position (for drag-from-library) ─
    const addCompAt = useCallback((lc: LibraryComponent, insertBeforeId: string | null) => {
        undoStack.current.push([...componentsRef.current]);
        redoStack.current = [];
        const current = componentsRef.current;

        const newComp: CanvasComponent = {
            instanceId: uuid(), componentKey: lc.key, componentId: lc._id,
            name: lc.name, category: lc.category, htmlTemplate: lc.htmlTemplate,
            cssCode: lc.cssCode, jsCode: lc.jsCode, propsSchema: lc.propsSchema,
            propValues: {...lc.defaultProps}, isVisible: true, isLocked: false, order: 0,
        };

        // Singleton: navbar/footer only one allowed
        if (SINGLETON_CATEGORIES.includes(lc.category)) {
            const existingIdx = current.findIndex(c => c.category === lc.category);
            if (existingIdx !== -1) {
                const updated = current.map((c, i) => i === existingIdx ? {
                    ...newComp,
                    instanceId: c.instanceId,
                    order: c.order
                } : c);
                updateComps(updated);
                setSelectedInstanceId(updated[existingIdx].instanceId);
                setRightPanel("props");
                return;
            }
        }

        let result: CanvasComponent[];
        if (!insertBeforeId) {
            result = [...current, newComp];
        } else {
            const idx = current.findIndex(c => c.instanceId === insertBeforeId);
            if (idx === -1) {
                result = [...current, newComp];
            } else {
                result = [...current.slice(0, idx), newComp, ...current.slice(idx)];
            }
        }
        updateComps(result.map((c, i) => ({...c, order: i})));
        setSelectedInstanceId(newComp.instanceId);
        setRightPanel("props");
    }, [updateComps]); // intentionally avoids components — uses componentsRef

    // Keep addCompAtRef in sync so the message handler can call it
    useEffect(() => {
        addCompAtRef.current = addCompAt;
    }, [addCompAt]);

    // ── Iframe rendering ─────────────────────────────────────────────────────
    // componentsRef declared here so rewriteIframe and saveComps can safely use it
    const componentsRef = useRef(components);
    useEffect(() => {
        componentsRef.current = components;
    }, [components]);

    // selectedInstanceId ref for use in rewriteIframe without adding to deps
    const selectedInstanceIdRef = useRef<string | null>(null);
    useEffect(() => {
        selectedInstanceIdRef.current = selectedInstanceId;
    }, [selectedInstanceId]);

    // Track previous components to detect what changed
    const prevCompsRef = useRef<typeof components>([]);
    const iframeReadyRef = useRef(false);

    const writeIframe = useCallback((html: string) => {
        const d = iframeRef.current?.contentDocument;
        if (!d) return;
        iframeReadyRef.current = false;
        d.open();
        d.write(html);
        d.close();
        iframeReadyRef.current = true;
    }, []);

    // Full rewrite — use refs for components/selectedInstanceId to keep deps minimal
    const rewriteIframe = useCallback(() => {
        if (!site || !activePage) return;
        const currentComps = componentsRef.current;
        const html = buildIframeDocument({
            components: currentComps.filter(c => c.isVisible).map(c => ({
                instanceId: c.instanceId, htmlTemplate: c.htmlTemplate,
                cssCode: c.cssCode, jsCode: c.jsCode,
                propValues: c.propValues, animationPreset: c.animationPreset,
            })),
            globalTheme: site.theme,
            globalCSS: site.globalCSS + (activePage.customCSS ?? ""),
        });
        writeIframe(html);
        prevCompsRef.current = currentComps;
        // Re-highlight selected after rewrite — use ref to avoid dep
        const selId = selectedInstanceIdRef.current;
        if (selId) {
            setTimeout(() => {
                const el = iframeRef.current?.contentDocument?.querySelector(`[data-instance="${selId}"]`);
                el?.classList.add("selected");
            }, 80);
        }
    }, [site, activePage, writeIframe]); // components intentionally excluded — uses prevCompsRef

    // Prop-only update — don't rewrite, just patch via postMessage
    const patchIframeProps = useCallback((instanceId: string, propValues: Record<string, unknown>) => {
        iframeRef.current?.contentWindow?.postMessage({
            type: "UPDATE_PROPS",
            instanceId,
            propValues,
        }, "*");
    }, []);

    useEffect(() => {
        if (!site || !activePage) return;
        const prev = prevCompsRef.current;

        // Detect if it's a structural change (add/remove/reorder/visibility) or prop-only
        const structuralChange =
            prev.length !== components.length ||
            prev.some((p, i) => p.instanceId !== components[i]?.instanceId) ||
            prev.some((p, i) => p.isVisible !== components[i]?.isVisible);

        if (structuralChange || !iframeReadyRef.current) {
            rewriteIframe();
        } else {
            // Only props changed — patch without rewrite (preserves drag state)
            for (const comp of components) {
                const prevComp = prev.find(p => p.instanceId === comp.instanceId);
                if (prevComp && JSON.stringify(prevComp.propValues) !== JSON.stringify(comp.propValues)) {
                    patchIframeProps(comp.instanceId, comp.propValues);
                }
            }
            prevCompsRef.current = components;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [components, site?.theme, site?.globalCSS, activePage?.customCSS, activePageId]);

    // ── Update single prop ────────────────────────────────────────────────────
    const updateProp = useCallback((key: string, val: unknown) => {
        if (!selectedInstanceId) return;
        setSite(prev => prev ? {
            ...prev,
            pages: prev.pages.map(p => p.pageId !== activePageId ? p : {
                ...p,
                components: p.components.map(c => c.instanceId !== selectedInstanceId ? c : {
                    ...c, propValues: {...c.propValues, [key]: val},
                }),
            }),
        } : prev);
        // Auto-save props after 1.5s of no changes
        if (propAutoSaveTimer.current) clearTimeout(propAutoSaveTimer.current);
        propAutoSaveTimer.current = setTimeout(() => saveComps(true), 1500);
    }, [selectedInstanceId, activePageId]); // eslint-disable-line

    // ── Component actions ─────────────────────────────────────────────────────
    const delComp = (id: string) => {
        undoStack.current.push([...components]);
        redoStack.current = [];
        updateComps(components.filter(c => c.instanceId !== id).map((c, i) => ({...c, order: i})));
        setSelectedInstanceId(null);
        setRightPanel(null);
    };
    const toggleVis = (id: string) => {
        setSite(prev => prev ? {
            ...prev,
            pages: prev.pages.map(p => p.pageId !== activePageId ? p : {
                ...p, components: p.components.map(c => c.instanceId !== id ? c : {...c, isVisible: !c.isVisible}),
            }),
        } : prev);
    };
    const dup = (id: string) => {
        undoStack.current.push([...components]);
        redoStack.current = [];
        updateComps(duplicateComponent(components as never[], id) as typeof components);
    };
    const undo = () => {
        const p = undoStack.current.pop();
        if (!p) return;
        redoStack.current.push([...components]);
        updateComps(p);
    };
    const redo = () => {
        const n = redoStack.current.pop();
        if (!n) return;
        undoStack.current.push([...components]);
        updateComps(n);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const saveComps = useCallback(async (silent = false) => {
        if (!activePageId) return;
        if (!silent) setIsSaving(true);
        await fetch(`/api/site/page/${activePageId}/components`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({components: componentsRef.current}),
        });
        if (!silent) {
            setIsSaving(false);
            setSaveMsg("Saved!");
            setTimeout(() => setSaveMsg(""), 2000);
        }
    }, [activePageId]);

    // ── Update single comp patch (for animation etc.) ─────────────────────────
    const updateComp = useCallback((instanceId: string, patch: Partial<CanvasComponent>) => {
        const updated = components.map(c => c.instanceId === instanceId ? {...c, ...patch} : c);
        updateComps(updated);
        if (dndSaveTimer.current) clearTimeout(dndSaveTimer.current);
        dndSaveTimer.current = setTimeout(() => saveComps(true), 800);
    }, [components, updateComps, saveComps]);

    // Canvas DnD reorder handled via iframe postMessage COMPONENT_REORDER

    // ── Clone URL ─────────────────────────────────────────────────────────────
    const handleClone = useCallback(async () => {
        if (!cloneUrl.trim()) return;
        setCloneLoading(true);
        setCloneError("");
        try {
            const res = await fetch("/api/builder/clone-url", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({url: cloneUrl.trim()})
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error ?? "Clone failed");
            // Clone clears canvas first then adds new components
            undoStack.current.push([...componentsRef.current]);
            updateComps([]);
            for (const ai of (data.data ?? [])) {
                const lc = library.find(l => l.key === ai.componentKey);
                if (lc) addCompAtRef.current({...lc, defaultProps: {...lc.defaultProps, ...ai.propValues}}, null);
            }
            setCloneUrl("");
            setRightPanel(null);
        } catch (e) {
            setCloneError(e instanceof Error ? e.message : "Clone failed");
        } finally {
            setCloneLoading(false);
        }
    }, [cloneUrl, library, addComp]);

    // ── Publish ───────────────────────────────────────────────────────────────
    const publish = async () => {
        await saveComps(true);
        setIsPublishing(true);
        const d = await fetch("/api/site/publish", {method: "POST"}).then(r => r.json());
        if (d.success) setSite(prev => prev ? {...prev, isPublished: true} : prev);
        setIsPublishing(false);
    };

    // ── Theme / pages / global handlers ──────────────────────────────────────
    const handleThemeChange = (theme: SiteTheme) => setSite(prev => prev ? {...prev, theme} : prev);
    const handleThemeSave = async () => {
        if (!site) return;
        await fetch("/api/site/theme", {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({theme: site.theme, globalCSS: site.globalCSS})
        });
        setSaveMsg("Theme saved!");
        setTimeout(() => setSaveMsg(""), 2000);
    };
    const handleAddPage = async (p: { title: string; slug: string; role: string }) => {
        const d = await fetch("/api/site/page", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(p)
        }).then(r => r.json());
        if (d.success) setSite(prev => prev ? {
            ...prev,
            pages: [...prev.pages, {...d.data, components: [], seo: {}}]
        } : prev);
    };
    const handleRenamePage = async (id: string, title: string, slug: string) => {
        await fetch(`/api/site/page/${id}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({title, slug})
        });
        setSite(prev => prev ? {...prev, pages: prev.pages.map(p => p.pageId === id ? {...p, title, slug} : p)} : prev);
    };
    const handleDeletePage = async (id: string) => {
        await fetch("/api/site/page", {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({pageId: id})
        });
        setSite(prev => prev ? {...prev, pages: prev.pages.filter(p => p.pageId !== id)} : prev);
        if (activePageId === id) setActivePageId(site?.pages[0]?.pageId ?? null);
    };
    const handleToggleNav = (id: string) => setSite(prev => prev ? {
        ...prev,
        pages: prev.pages.map(p => p.pageId === id ? {...p, showInNav: !p.showInNav} : p)
    } : prev);
    const handleSaveGlobal = async (navbar: UserSite["navbar"], footer: UserSite["footer"]) => {
        setSite(prev => prev ? {...prev, navbar, footer} : prev);
        await fetch("/api/site", {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({navbar, footer})
        });
    };
    const handleSaveSEO = async (seo: PageSEO, customCSS: string) => {
        setSite(prev => prev ? {
            ...prev,
            pages: prev.pages.map(p => p.pageId === activePageId ? {...p, seo, customCSS} : p)
        } : prev);
        await fetch(`/api/site/page/${activePageId}/seo`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({seo, customCSS})
        });
        setRightPanel(null);
    };

    // ── Mobile check ──────────────────────────────────────────────────────────
    const runMobileCheck = async () => {
        if (!iframeRef.current) return;
        setCheckingMobile(true);
        const issues = await checkMobileIssues(iframeRef.current, components.map(c => ({
            instanceId: c.instanceId,
            name: c.name
        })));
        setMobileIssues(issues);
        setShowMobilePanel(true);
        setCheckingMobile(false);
    };

    // ── AI build ──────────────────────────────────────────────────────────────
    const runAI = async (clearCanvas = false) => {
        if (!aiPrompt.trim() || !site) return;
        setAiLoading(true);
        setAiError("");
        try {
            const d = await fetch("/api/builder/ai", {
                method: "POST", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    prompt: aiPrompt, siteType: site.siteType,
                    pageSlug: activePage?.slug ?? "/",
                    existingComponentKeys: clearCanvas ? [] : components.map(c => c.componentKey),
                    clearCanvas,
                }),
            }).then(r => r.json());
            if (!d.success) {
                setAiError(d.error);
                return;
            }
            const add: CanvasComponent[] = [];
            for (const ai of (d.data ?? [])) {
                const lc = library.find(l => l.key === ai.componentKey);
                if (!lc) continue;
                add.push({
                    instanceId: uuid(), componentKey: lc.key, componentId: lc._id,
                    name: lc.name, category: lc.category, htmlTemplate: lc.htmlTemplate,
                    cssCode: lc.cssCode, jsCode: lc.jsCode,
                    propsSchema: lc.propsSchema ?? [],
                    propValues: {...lc.defaultProps, ...ai.propValues},
                    isVisible: true, isLocked: false, order: 0,
                });
            }
            undoStack.current.push([...components]);
            // If clearCanvas or AI said to clear, replace all; otherwise append
            const base = clearCanvas ? [] : components;
            updateComps([...base, ...add].map((c, i) => ({...c, order: i})));
            setAiPrompt("");
            setShowAI(false);
        } catch {
            setAiError("AI error. Try again.");
        }
        setAiLoading(false);
    };

    const exportCompJSON = (c: CanvasComponent) => {
        const b = new Blob([JSON.stringify({
            componentKey: c.componentKey,
            propValues: c.propValues,
            name: c.name
        }, null, 2)], {type: "application/json"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = `${c.componentKey}.json`;
        a.click();
    };
    const importCompJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        try {
            const d = JSON.parse(await f.text());
            const lc = library.find(l => l.key === d.componentKey);
            if (!lc) {
                alert(`Component "${d.componentKey}" not found.`);
                return;
            }
            addComp({...lc, defaultProps: {...lc.defaultProps, ...(d.propValues ?? {})}});
        } catch {
            alert("Invalid JSON.");
        }
        e.target.value = "";
    };
    const handleOnboarding = async (t: string, n: string) => {
        const d = await fetch("/api/site/init", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({siteType: t, siteName: n})
        }).then(r => r.json());
        if (d.success) {
            setSite(d.data);
            setActivePageId(d.data.pages[0]?.pageId ?? null);
            setShowOnboarding(false);
            setShowPersonality(true);
        }
    };

    // ── Guards ────────────────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="flex items-center justify-center h-[80vh]">
            <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto"/>
                <p className="text-sm text-muted-foreground">Loading builder…</p>
            </div>
        </div>
    );
    if (showOnboarding) return <SiteTypeOnboarding onSelect={handleOnboarding}/>;
    if (showPersonality && site) return (
        <PersonalityOnboarding siteType={site.siteType}
                               onComplete={(updatedSite) => {
                                   setSite(updatedSite as typeof site);
                                   setShowPersonality(false);
                               }}
                               onSkip={() => setShowPersonality(false)}/>
    );
    if (!site) return null;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">

            {/* ── Top Toolbar ─────────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-1.5 px-3 h-12 border-b bg-card/95 backdrop-blur shrink-0 z-20 shadow-sm">
                {/* Left: toggle + pages */}
                <button onClick={() => setLeftOpen(v => !v)}
                        className={cn("p-1.5 rounded-lg transition-all", leftOpen ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600" : "hover:bg-muted text-muted-foreground")}>
                    <Menu className="h-4 w-4"/>
                </button>

                <div className="w-px h-5 bg-border mx-0.5"/>

                {/* Pages tab bar */}
                <div className="flex items-center gap-0.5 overflow-x-auto max-w-sm scrollbar-none">
                    {site.pages.map(p => (
                        <button key={p.pageId} onClick={() => {
                            setActivePageId(p.pageId);
                            setSelectedInstanceId(null);
                            setRightPanel(null);
                        }}
                                className={cn("px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                                    activePageId === p.pageId ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                            {p.title}
                        </button>
                    ))}
                    <button onClick={() => setRightPanel("pages")} title="Manage pages"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                        <Plus className="h-3.5 w-3.5"/>
                    </button>
                </div>

                <div className="w-px h-5 bg-border mx-0.5"/>

                <Link href={`/dashboard/admin/site/marketplace?pageId=${activePageId ?? ""}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500"/>Marketplace
                </Link>

                {/* Right: controls */}
                <div className="ml-auto flex items-center gap-0.5">
                    {/* Device selector */}
                    <div className="flex border rounded-lg overflow-hidden mr-1">
                        {(["desktop", "tablet", "mobile"] as DevicePreview[]).map(d => {
                            const I = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
                            return (
                                <button key={d} onClick={() => setDevicePreview(d)} title={d}
                                        className={cn("p-1.5 transition-colors", devicePreview === d ? "bg-indigo-600 text-white" : "hover:bg-muted text-muted-foreground")}>
                                    <I className="h-3.5 w-3.5"/>
                                </button>
                            );
                        })}
                    </div>

                    {/* Zoom */}
                    <div className="flex border rounded-lg overflow-hidden mr-1">
                        <button onClick={() => setZoom(z => Math.max(50, z - 10))}
                                className="px-2 py-1.5 hover:bg-muted text-xs text-muted-foreground">−
                        </button>
                        <span
                            className="px-2 text-xs font-mono flex items-center border-x text-muted-foreground">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(150, z + 10))}
                                className="px-2 py-1.5 hover:bg-muted text-xs text-muted-foreground">+
                        </button>
                    </div>

                    {/* Undo/Redo */}
                    <button onClick={undo} disabled={!undoStack.current.length} title="Undo"
                            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><Undo
                        className="h-3.5 w-3.5"/></button>
                    <button onClick={redo} disabled={!redoStack.current.length} title="Redo"
                            className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><Redo
                        className="h-3.5 w-3.5"/></button>

                    <div className="w-px h-5 bg-border mx-0.5"/>

                    {/* Panel toggles */}
                    <ToolbarBtn active={rightPanel === "theme"}
                                onClick={() => setRightPanel(p => p === "theme" ? null : "theme")} title="Theme editor"><Paintbrush
                        className="h-3.5 w-3.5"/></ToolbarBtn>
                    <ToolbarBtn active={rightPanel === "global"}
                                onClick={() => setRightPanel(p => p === "global" ? null : "global")}
                                title="Navbar & Footer"><Navigation className="h-3.5 w-3.5"/></ToolbarBtn>
                    <ToolbarBtn active={rightPanel === "seo"}
                                onClick={() => setRightPanel(p => p === "seo" ? null : "seo")}
                                title="SEO settings"><FileText className="h-3.5 w-3.5"/></ToolbarBtn>
                    <ToolbarBtn active={rightPanel === "og"}
                                onClick={() => setRightPanel(p => p === "og" ? null : "og")}
                                title="Social preview"><Share2 className="h-3.5 w-3.5"/></ToolbarBtn>
                    <ToolbarBtn active={rightPanel === "magic"}
                                onClick={() => setRightPanel(p => p === "magic" ? null : "magic")}
                                title="Magic AI"><Wand2 className="h-3.5 w-3.5"/></ToolbarBtn>
                    <ToolbarBtn active={rightPanel === "clone"}
                                onClick={() => setRightPanel(p => p === "clone" ? null : "clone")}
                                title="Clone a URL"><Link2 className="h-3.5 w-3.5"/></ToolbarBtn>
                    <ToolbarBtn active={rightPanel === "export"}
                                onClick={() => setRightPanel(p => p === "export" ? null : "export")}
                                title="Export"><Download className="h-3.5 w-3.5"/></ToolbarBtn>

                    {/* Mobile check */}
                    <button onClick={runMobileCheck} disabled={checkingMobile} title="Mobile check"
                            className={cn("p-1.5 rounded-lg transition-colors flex items-center gap-0.5", mobileIssues.length > 0 ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30" : "hover:bg-muted text-muted-foreground")}>
                        {checkingMobile ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> :
                            <Smartphone className="h-3.5 w-3.5"/>}
                        {mobileIssues.length > 0 &&
                            <span className="text-[10px] font-bold">{mobileIssues.length}</span>}
                    </button>

                    {/* Import JSON */}
                    <label
                        className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors"
                        title="Import component JSON">
                        <Upload className="h-3.5 w-3.5"/>
                        <input type="file" accept=".json" className="hidden" onChange={importCompJSON}/>
                    </label>

                    <div className="w-px h-5 bg-border mx-0.5"/>

                    {/* AI + SEO Score */}
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAI(true)}>
                        <Sparkles className="h-3.5 w-3.5 text-purple-500"/>AI Build
                    </Button>

                    <LiveSEOScore page={activePage} componentCount={components.length}
                                  hasHero={components.some(c => c.category === "hero")}
                                  hasFooter={components.some(c => c.category === "footer")}/>

                    {/* Save */}
                    {saveMsg
                        ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 px-2"><Check
                            className="h-3.5 w-3.5"/>{saveMsg}</span>
                        : <Button size="sm" variant="outline" onClick={() => saveComps()} isLoading={isSaving}
                                  className="gap-1.5 h-8 text-xs"><Save className="h-3.5 w-3.5"/>Save</Button>
                    }

                    {/* Publish */}
                    <Button size="sm" variant="gradient" onClick={publish} isLoading={isPublishing}
                            className="gap-1.5 h-8 text-xs">
                        <Globe className="h-3.5 w-3.5"/>{site.isPublished ? "Re-publish" : "Publish"}
                    </Button>
                </div>
            </div>

            {/* ── Main area ────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* ── Left Panel: Component Library ───────────────────────────── */}
                <div
                    className={cn("border-r bg-card flex flex-col transition-all duration-200 shrink-0", leftOpen ? "w-56" : "w-0 overflow-hidden")}>
                    {/* Search */}
                    <div className="px-2.5 py-2 border-b shrink-0 flex items-center gap-2 bg-muted/20">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                        <input value={libSearch} onChange={e => setLibSearch(e.target.value)}
                               placeholder="Search components…"
                               className="flex-1 h-7 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/60"/>
                        {libSearch && <button onClick={() => setLibSearch("")}
                                              className="text-muted-foreground hover:text-foreground"><X
                            className="h-3 w-3"/></button>}
                    </div>

                    {/* Category filters */}
                    <div className="flex gap-0.5 px-1.5 py-1.5 border-b overflow-x-auto shrink-0 scrollbar-none">
                        {CATS.map(cat => {
                            const I = cat === "all" ? Layers : CAT_ICONS[cat] ?? Layers;
                            return (
                                <button key={cat} onClick={() => setLibCat(cat)} title={cat}
                                        className={cn("p-1.5 rounded-lg shrink-0 transition-all", libCat === cat ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
                                    <I className="h-3.5 w-3.5"/>
                                </button>
                            );
                        })}
                    </div>

                    {/* Component list */}
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
                        {filteredLib.length === 0 && (
                            <div className="text-center py-8 px-3">
                                <Layers className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2"/>
                                <p className="text-xs text-muted-foreground">No components found</p>
                            </div>
                        )}
                        {filteredLib.map(comp => {
                            const I = CAT_ICONS[comp.category] ?? Layers;
                            return (
                                <button key={comp._id} onClick={() => addComp(comp)}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.effectAllowed = "copy";
                                            e.dataTransfer.setData("text/sc-library-key", comp.key);
                                            // Show a small ghost while dragging
                                            const ghost = document.createElement("div");
                                            ghost.textContent = comp.name;
                                            Object.assign(ghost.style, {
                                                position: "fixed", top: "-999px", left: "-999px",
                                                background: "#4F46E5", color: "white", padding: "4px 10px",
                                                borderRadius: "8px", fontSize: "12px", fontWeight: "600",
                                                whiteSpace: "nowrap", pointerEvents: "none",
                                            });
                                            document.body.appendChild(ghost);
                                            e.dataTransfer.setDragImage(ghost, 40, 14);
                                            setTimeout(() => document.body.removeChild(ghost), 0);
                                        }}
                                        className="w-full text-left rounded-xl border hover:border-indigo-400 hover:shadow-sm transition-all overflow-hidden group bg-background cursor-grab active:cursor-grabbing">
                                    {/* Thumbnail */}
                                    <div
                                        className="w-full h-16 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 relative">
                                        {comp.previewImage ? (
                                            <img src={comp.previewImage} alt={comp.name}
                                                 className="w-full h-full object-cover"/>
                                        ) : comp.htmlTemplate ? (
                                            <ComponentThumbnail html={comp.htmlTemplate}
                                                                defaultProps={comp.defaultProps} theme={site?.theme}/>
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center bg-muted/30 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors">
                                                <I className="h-5 w-5 text-muted-foreground/30"/>
                                            </div>
                                        )}
                                        <span
                                            className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded-md bg-black/60 text-white font-medium capitalize backdrop-blur-sm">
                      {comp.category}
                    </span>
                                        {comp.isFeatured && (
                                            <span
                                                className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-bold">★</span>
                                        )}
                                    </div>
                                    <div className="px-2.5 py-1.5 flex items-center gap-1.5">
                                        <I className="h-3 w-3 text-muted-foreground/60 shrink-0"/>
                                        <p className="font-medium text-xs truncate">{comp.name}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Magic AI — collapsible accordion at bottom */}
                    <div className="border-t shrink-0">
                        <button onClick={() => setMagicAIOpen(v => !v)}
                                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
              <span className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <Sparkles className="h-3.5 w-3.5"/>Magic AI Suggestions
              </span>
                            <ChevronRight
                                className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", magicAIOpen && "rotate-90")}/>
                        </button>
                        {magicAIOpen && (
                            <div className="px-2 pb-2">
                                <MagicAIPanel siteType={site.siteType} pageSlug={activePage?.slug ?? "/"}
                                              existingComponentKeys={components.map(c => c.componentKey)}
                                              onAddComponents={(comps) => {
                                                  for (const ai of comps) {
                                                      const lc = library.find(l => l.key === ai.componentKey);
                                                      if (lc) addComp({
                                                          ...lc,
                                                          defaultProps: {...lc.defaultProps, ...ai.propValues}
                                                      });
                                                  }
                                              }}/>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Canvas + Layers ──────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    {/* Canvas viewport */}
                    <div
                        className="flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.04),transparent_70%)] dark:bg-zinc-950 flex items-start justify-center p-8">
                        <div
                            className="bg-white dark:bg-slate-900 shadow-2xl rounded-xl overflow-hidden relative ring-1 ring-black/5"
                            style={{
                                width: DEVICE_WIDTHS[devicePreview],
                                minHeight: 600,
                                transform: `scale(${zoom / 100})`,
                                transformOrigin: "top center",
                                transition: "width 0.2s ease",
                            }}>
                            <iframe ref={iframeRef} className="w-full border-0" style={{height: "100%", minHeight: 600}}
                                    title="Site Preview" sandbox="allow-scripts allow-same-origin"/>
                            {components.length === 0 && (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                                    <div
                                        className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
                                        <LayoutTemplate className="h-8 w-8 text-indigo-300"/>
                                    </div>
                                    <p className="font-semibold text-muted-foreground text-sm">Canvas is empty</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">Click any component in
                                        the left panel to add it, or use AI Build to generate a full page layout.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Layers strip — simple clickable chips ───────────────────── */}
                    {components.length > 0 && (
                        <div
                            className="shrink-0 bg-card/95 border-t px-3 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none shadow-sm">
                            <span
                                className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider shrink-0 mr-1">Layers</span>
                            {components.map(c => {
                                const I = CAT_ICONS[c.category] ?? Layers;
                                return (
                                    <button key={c.instanceId}
                                            onClick={() => {
                                                setSelectedInstanceId(c.instanceId);
                                                setRightPanel("props");
                                            }}
                                            className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                                                selectedInstanceId === c.instanceId
                                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                                                    : "bg-background text-muted-foreground border-border hover:border-indigo-300 hover:text-foreground",
                                                !c.isVisible && "opacity-40"
                                            )}>
                                        <I className="h-3 w-3 shrink-0"/>
                                        {c.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Right Panel ─────────────────────────────────────────────── */}
                {rightPanel && (
                    <div className="w-72 border-l bg-card flex flex-col shrink-0 overflow-hidden">

                        {/* Props editor */}
                        {rightPanel === "props" && selectedComp && (
                            <div className="flex flex-col h-full">
                                <PanelHeader
                                    title={selectedComp.name}
                                    subtitle={`${selectedComp.category} component`}
                                    onClose={() => {
                                        setRightPanel(null);
                                        setSelectedInstanceId(null);
                                    }}
                                    icon={(() => {
                                        const I = CAT_ICONS[selectedComp.category] ?? Layers;
                                        return <I className="h-4 w-4 text-indigo-500"/>;
                                    })()}
                                    action={
                                        <div className="flex items-center gap-0.5">
                                            <button onClick={() => toggleVis(selectedComp.instanceId)}
                                                    title={selectedComp.isVisible ? "Hide" : "Show"}
                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                                {selectedComp.isVisible ? <Eye className="h-3.5 w-3.5"/> :
                                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground"/>}
                                            </button>
                                            <button onClick={() => dup(selectedComp.instanceId)} title="Duplicate"
                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                                <Copy className="h-3.5 w-3.5"/>
                                            </button>
                                            <button onClick={() => setRightPanel("animation")} title="Animate"
                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                                <Sparkles className="h-3.5 w-3.5"/>
                                            </button>
                                            <button onClick={() => exportCompJSON(selectedComp)} title="Export JSON"
                                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                                <Download className="h-3.5 w-3.5"/>
                                            </button>
                                            <button onClick={() => delComp(selectedComp.instanceId)} title="Delete"
                                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </button>
                                        </div>
                                    }
                                />

                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                                    {(selectedComp.propsSchema ?? []).length === 0 ? (
                                        <div className="text-center py-8">
                                            <Settings className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2"/>
                                            <p className="text-xs text-muted-foreground">No editable props for this
                                                component.</p>
                                        </div>
                                    ) : (() => {
                                        const groups: Record<string, PropSchema[]> = {};
                                        for (const p of (selectedComp.propsSchema ?? [])) {
                                            const g = p.group ?? "Content";
                                            if (!groups[g]) groups[g] = [];
                                            groups[g].push(p);
                                        }
                                        return Object.entries(groups).map(([g, props]) => (
                                            <div key={g}>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                                    <ChevronRight className="h-3 w-3"/>{g}
                                                </p>
                                                <div className="space-y-3 pl-0.5">
                                                    {props.map(prop => (
                                                        <PropField key={prop.key} schema={prop}
                                                                   value={(selectedComp.propValues ?? {})[prop.key] ?? prop.defaultValue}
                                                                   onChange={v => updateProp(prop.key, v)}/>
                                                    ))}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Props panel but no component selected — show prompt */}
                        {rightPanel === "props" && !selectedComp && (
                            <div className="flex flex-col h-full">
                                <PanelHeader title="Properties" onClose={() => setRightPanel(null)}
                                             icon={<Settings className="h-4 w-4 text-muted-foreground"/>}/>
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                    <Layers className="h-10 w-10 text-muted-foreground/20 mb-3"/>
                                    <p className="text-sm font-medium text-muted-foreground">No component selected</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Click a component in the canvas
                                        or layers bar to edit its properties.</p>
                                </div>
                            </div>
                        )}

                        {rightPanel === "theme" && (
                            <ThemeEditor theme={site.theme} onChange={handleThemeChange} onSave={handleThemeSave}
                                         onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "pages" && (
                            <PageManager pages={site.pages.map(p => ({...p, componentCount: p.components.length}))}
                                         activePageId={activePageId}
                                         onSelect={id => {
                                             setActivePageId(id);
                                             setRightPanel(null);
                                         }}
                                         onAdd={handleAddPage} onRename={handleRenamePage}
                                         onDelete={handleDeletePage} onToggleNav={handleToggleNav}
                                         onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "global" && (
                            <GlobalSections navbar={{
                                ...site.navbar,
                                style: site.navbar.style as "sticky" | "static" | "floating" | "sidebar"
                            }}
                                            footer={site.footer} library={library}
                                            onSave={handleSaveGlobal} onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "seo" && activePage && (
                            <SEOPanel page={activePage} onSave={handleSaveSEO} onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "export" && (
                            <ExportPanel site={site} activePage={activePage} onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "og" && activePage && (
                            <OGPreviewEditor page={activePage} siteName={site.siteName}
                                             onSave={async (seo) => {
                                                 await handleSaveSEO(seo, activePage.customCSS ?? "");
                                             }}
                                             onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "magic" && (
                            <div className="flex flex-col h-full">
                                <PanelHeader title="Magic AI" onClose={() => setRightPanel(null)}
                                             icon={<Wand2 className="h-4 w-4 text-purple-500"/>}/>
                                <div className="flex-1 overflow-y-auto">
                                    <MagicAIPanel siteType={site.siteType} pageSlug={activePage?.slug ?? "/"}
                                                  existingComponentKeys={components.map(c => c.componentKey)}
                                                  onAddComponents={(comps) => {
                                                      for (const ai of comps) {
                                                          const lc = library.find(l => l.key === ai.componentKey);
                                                          if (lc) addComp({
                                                              ...lc,
                                                              defaultProps: {...lc.defaultProps, ...ai.propValues}
                                                          });
                                                      }
                                                  }}/>
                                    <VibeCheckPanel siteType={site.siteType}
                                                    onApplied={(updatedSite) => {
                                                        setSite(updatedSite as typeof site);
                                                        setRightPanel(null);
                                                    }}
                                                    onClose={() => setRightPanel(null)}/>
                                </div>
                            </div>
                        )}
                        {rightPanel === "clone" && (
                            <div className="flex flex-col h-full">
                                <PanelHeader title="Clone a URL" subtitle="Recreate any site's structure"
                                             onClose={() => setRightPanel(null)}
                                             icon={<Link2 className="h-4 w-4 text-indigo-500"/>}/>
                                <div className="p-4 space-y-3">
                                    <input type="url" value={cloneUrl} onChange={e => {
                                        setCloneUrl(e.target.value);
                                        setCloneError("");
                                    }}
                                           placeholder="https://example.com"
                                           className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                           onKeyDown={e => e.key === "Enter" && handleClone()}/>
                                    {cloneError &&
                                        <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle
                                            className="h-3 w-3 shrink-0"/>{cloneError}</p>}
                                    <Button onClick={handleClone} disabled={!cloneUrl.trim() || cloneLoading}
                                            isLoading={cloneLoading} className="w-full gap-2" size="sm"
                                            variant="gradient">
                                        {!cloneLoading && <Wand2
                                            className="h-3.5 w-3.5"/>}{cloneLoading ? "Analyzing…" : "Clone Structure"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground leading-relaxed">AI analyzes the page
                                        and adds matching components. Images are not copied.</p>
                                </div>
                            </div>
                        )}
                        {rightPanel === "assets" && (
                            <AssetLibrary onSelect={(url) => {
                                navigator.clipboard?.writeText(url).catch(() => null);
                                setRightPanel(null);
                            }}
                                          onClose={() => setRightPanel(null)}/>
                        )}
                        {rightPanel === "animation" && selectedInstanceId && (
                            <AnimationStudio instanceId={selectedInstanceId}
                                             currentPreset={components.find(c => c.instanceId === selectedInstanceId)?.animationPreset ?? ""}
                                             onApply={(preset) => {
                                                 updateComp(selectedInstanceId, {animationPreset: preset});
                                                 setRightPanel("props");
                                             }}
                                             onClose={() => setRightPanel("props")}/>
                        )}
                    </div>
                )}
            </div>

            {/* ── Mobile issues panel ──────────────────────────────────────────── */}
            {showMobilePanel && (
                <div
                    className="fixed bottom-4 right-4 z-50 w-80 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4"/>
                            <p className="font-semibold text-sm">Mobile Check</p>
                            {mobileIssues.length === 0
                                ? <span
                                    className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">All clear!</span>
                                : <span
                                    className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">{mobileIssues.length} issue{mobileIssues.length > 1 ? "s" : ""}</span>}
                        </div>
                        <button onClick={() => setShowMobilePanel(false)} className="p-1 rounded-lg hover:bg-muted"><X
                            className="h-3.5 w-3.5"/></button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {mobileIssues.length === 0
                            ? <div className="px-4 py-6 text-center"><Check
                                className="h-8 w-8 text-emerald-500 mx-auto mb-2"/><p
                                className="text-sm text-muted-foreground">No mobile issues found.</p></div>
                            : mobileIssues.map((issue, i) => (
                                <div key={i} className="px-4 py-3 border-b last:border-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <AlertTriangle
                                            className={cn("h-3.5 w-3.5 shrink-0", issue.severity === "error" ? "text-red-500" : "text-amber-500")}/>
                                        <p className="text-xs font-semibold">{issue.componentName}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{issue.issue}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* ── AI Build modal ───────────────────────────────────────────────── */}
            {showAI && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div
                        className="bg-card rounded-2xl border shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Sparkles className="h-5 w-5 text-white"/>
                                </div>
                                <div>
                                    <p className="font-bold">AI Builder</p>
                                    <p className="text-xs text-muted-foreground">Describe what you want to build</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-1.5 rounded-lg hover:bg-muted"><X
                                className="h-4 w-4"/></button>
                        </div>
                        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} autoFocus
                                  placeholder={`e.g. "A hero with bold headline, 3 feature cards below, and a contact form at the bottom"`}
                                  className="w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                                  onKeyDown={e => e.key === "Enter" && e.metaKey && runAI()}/>
                        {aiError &&
                            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0"/>{aiError}</p>}
                        <div className="flex items-center justify-between">
                            <label
                                className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                                <div
                                    className={cn("relative w-8 h-4 rounded-full transition-colors", aiClearCanvas ? "bg-indigo-500" : "bg-muted-foreground/30")}>
                                    <div
                                        className={cn("absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform", aiClearCanvas ? "translate-x-4" : "")}/>
                                    <input type="checkbox" checked={aiClearCanvas}
                                           onChange={e => setAiClearCanvas(e.target.checked)} className="sr-only"/>
                                </div>
                                Clear canvas &amp; rebuild
                            </label>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowAI(false)}>Cancel</Button>
                                <Button variant="gradient" className="gap-2" onClick={() => runAI(aiClearCanvas)}
                                        disabled={!aiPrompt.trim() || aiLoading}>
                                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                        <Send className="h-4 w-4"/>}
                                    {aiLoading ? "Building…" : "Generate"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// "use client";
//
// import React, {useCallback, useEffect, useRef, useState} from "react";
// import {
//     Tablet, Smartphone, Globe, Sparkles, Plus, Eye,
//     Layers, Trash2, EyeOff, Undo, Redo, Save,
//     Send, X, Search, Navigation, Loader2, Check,
//     Copy, Download, Upload, FileText, AlertTriangle,
//     Menu, Share2, Wand2, Link2, ChevronRight,
//     Settings, LayoutTemplate, Paintbrush, Monitor,
// } from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Label} from "@/components/ui/form-elements";
// import {buildIframeDocument} from "@/lib/builder/renderer";
// import {duplicateComponent, checkMobileIssues, exportPageAsHTML, exportFullSiteAsZip} from "@/lib/builder/export";
// import type {MobileIssue} from "@/lib/builder/export";
// import {v4 as uuid} from "uuid";
// import {useSession} from "next-auth/react";
// import ThemeEditor, {type SiteTheme} from "@/components/builder/ThemeEditor";
// import PageManager from "@/components/builder/PageManager";
// import GlobalSections from "@/components/builder/GlobalSections";
// import {PersonalityOnboarding} from "@/components/builder/PersonalityOnboarding";
// import {MagicAIPanel} from "@/components/builder/MagicAIPanel";
// import {AssetLibrary} from "@/components/builder/AssetLibrary";
// import {OGPreviewEditor} from "@/components/builder/OGPreviewEditor";
// import {LiveSEOScore} from "@/components/builder/LiveSEOScore";
// import {CAT_ICONS} from "@/components/builder/SortableLayerItem";
// import {AnimationStudio} from "@/components/builder/AnimationStudio";
// import {VibeCheckPanel} from "@/components/builder/VibeCheckPanel";
// import Link from "next/link";
// import {cn} from "@/lib/utils";
//
// // ─── Types ───────────────────────────────────────────────────────────────────
//
// type DevicePreview = "desktop" | "tablet" | "mobile";
// type RightPanel =
//     | "props" | "theme" | "pages" | "global" | "seo" | "export"
//     | "og" | "magic" | "assets" | "clone" | "animation" | null;
// type ComponentCategory =
//     | "navbar" | "hero" | "section" | "footer" | "layout"
//     | "widget" | "animation" | "template" | "integration";
//
// interface PropSchema {
//     key: string;
//     label: string;
//     type: string;
//     defaultValue: unknown;
//     placeholder?: string;
//     options?: string[];
//     required?: boolean;
//     group?: string;
//     arrayItemSchema?: PropSchema[];
// }
//
// interface LibraryComponent {
//     _id: string;
//     key: string;
//     name: string;
//     category: ComponentCategory;
//     description?: string;
//     previewImage?: string;
//     htmlTemplate: string;
//     cssCode?: string;
//     jsCode?: string;
//     propsSchema: PropSchema[];
//     defaultProps: Record<string, unknown>;
//     isFeatured?: boolean;
//     availableTo: string[];
// }
//
// interface CanvasComponent {
//     instanceId: string;
//     componentKey: string;
//     componentId: string;
//     name: string;
//     category: ComponentCategory;
//     htmlTemplate: string;
//     cssCode?: string;
//     jsCode?: string;
//     propsSchema: PropSchema[];
//     propValues: Record<string, unknown>;
//     isVisible: boolean;
//     isLocked: boolean;
//     order: number;
//     animationPreset?: string;
// }
//
// interface PageSEO {
//     metaTitle?: string;
//     metaDescription?: string;
//     ogImage?: string;
//     canonicalUrl?: string;
//     noIndex?: boolean;
// }
//
// interface UserPage {
//     pageId: string;
//     slug: string;
//     title: string;
//     isHomePage: boolean;
//     showInNav: boolean;
//     components: CanvasComponent[];
//     isEnabled: boolean;
//     role: string;
//     seo: PageSEO;
//     customCSS?: string;
// }
//
// interface UserSite {
//     _id: string;
//     siteName: string;
//     siteType: string;
//     theme: SiteTheme;
//     globalCSS: string;
//     navbar: {
//         componentKey?: string; style: string; isTransparent: boolean;
//         links: { label: string; href: string; order: number }[];
//         ctaLabel?: string; ctaHref?: string; showThemeToggle: boolean;
//     };
//     footer: {
//         componentKey?: string; isEnabled: boolean;
//         columns: { heading: string; links: { label: string; href: string }[] }[];
//         bottomText: string; socialLinks: { platform: string; url: string }[];
//     };
//     pages: UserPage[];
//     builderState: { activePageId?: string; devicePreview: DevicePreview; zoom: number; aiSuggestionsEnabled: boolean };
//     isPublished: boolean;
//     publishedAt?: string;
// }
//
// // ─── Constants ───────────────────────────────────────────────────────────────
//
// const DEVICE_WIDTHS: Record<DevicePreview, string> = {
//     desktop: "100%", tablet: "768px", mobile: "390px",
// };
// const SITE_TYPES = [
//     {type: "blog", emoji: "✍️", label: "Blog", desc: "Articles & content"},
//     {type: "portfolio", emoji: "🎨", label: "Portfolio", desc: "Showcase your work"},
//     {type: "saas", emoji: "🚀", label: "SaaS", desc: "Software product"},
//     {type: "ecommerce", emoji: "🛍️", label: "Shop", desc: "Sell products"},
//     {type: "restaurant", emoji: "🍽️", label: "Restaurant", desc: "Food & dining"},
//     {type: "agency", emoji: "💼", label: "Agency", desc: "Services & team"},
// ];
// const CATS = ["all", "navbar", "hero", "section", "footer", "widget", "animation", "layout", "integration"] as const;
// const SINGLETON_CATEGORIES: ComponentCategory[] = ["navbar", "footer"];
//
// // ─── ImagePropField ───────────────────────────────────────────────────────────
//
// function ImagePropField({label, value, onChange}: { label: string; value: string; onChange: (v: unknown) => void }) {
//     const [uploading, setUploading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const inputRef = useRef<HTMLInputElement>(null);
//
//     async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
//         const file = e.target.files?.[0];
//         if (!file) return;
//         if (file.size > 5 * 1024 * 1024) {
//             setError("File must be under 5MB");
//             return;
//         }
//         if (!file.type.startsWith("image/")) {
//             setError("Only image files allowed");
//             return;
//         }
//         setError(null);
//         setUploading(true);
//         try {
//             const fd = new FormData();
//             fd.append("file", file);
//             const res = await fetch("/api/upload", {method: "POST", body: fd});
//             const data = await res.json();
//             if (!res.ok || !data.success) throw new Error(data.error ?? "Upload failed");
//             onChange(data.url);
//         } catch (err) {
//             setError(err instanceof Error ? err.message : "Upload failed");
//         } finally {
//             setUploading(false);
//             if (inputRef.current) inputRef.current.value = "";
//         }
//     }
//
//     return (
//         <div className="space-y-1.5">
//             <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
//             {value && (
//                 <div className="relative group rounded-lg overflow-hidden border bg-muted/20 aspect-video">
//                     <img src={value} alt="Preview" className="w-full h-full object-cover"
//                          onError={(e) => {
//                              (e.target as HTMLImageElement).style.display = "none";
//                          }}/>
//                     <button onClick={() => onChange("")}
//                             className="absolute top-1.5 right-1.5 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                         <X className="h-3 w-3"/>
//                     </button>
//                 </div>
//             )}
//             <button onClick={() => inputRef.current?.click()} disabled={uploading}
//                     className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 disabled:opacity-50 transition-all">
//                 {uploading ? <><Loader2 className="h-3 w-3 animate-spin"/>Uploading…</> : <><Upload
//                     className="h-3 w-3"/>{value ? "Replace" : "Upload image"}</>}
//             </button>
//             <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
//             <Input type="url" value={value} onChange={(e) => onChange(e.target.value)}
//                    placeholder="Or paste URL…" className="h-7 text-xs"/>
//             {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle
//                 className="h-3 w-3 shrink-0"/>{error}</p>}
//         </div>
//     );
// }
//
// // ─── PropField ────────────────────────────────────────────────────────────────
//
// function PropField({schema, value, onChange}: { schema: PropSchema; value: unknown; onChange: (v: unknown) => void }) {
//     const s = String(value ?? "");
//
//     if (schema.type === "boolean") return (
//         <label className="flex items-center gap-2.5 cursor-pointer py-1 group">
//             <div
//                 className={cn("relative w-9 h-5 rounded-full transition-colors", Boolean(value) ? "bg-indigo-500" : "bg-muted-foreground/30")}>
//                 <div
//                     className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", Boolean(value) ? "translate-x-4" : "translate-x-0")}/>
//                 <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)}
//                        className="sr-only"/>
//             </div>
//             <span className="text-sm">{schema.label}</span>
//         </label>
//     );
//
//     if (schema.type === "color") return (
//         <div className="space-y-1">
//             <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
//             <div className="flex gap-2">
//                 <input type="color" value={s || "#4F46E5"} onChange={(e) => onChange(e.target.value)}
//                        className="h-8 w-10 rounded-md border cursor-pointer p-0.5 bg-transparent"/>
//                 <Input value={s} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs font-mono flex-1"/>
//             </div>
//         </div>
//     );
//
//     if (schema.type === "select") return (
//         <div className="space-y-1">
//             <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
//             <select value={s} onChange={(e) => onChange(e.target.value)}
//                     className="w-full h-8 rounded-lg border bg-background px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
//                 {(schema.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
//             </select>
//         </div>
//     );
//
//     if (schema.type === "textarea" || schema.type === "richtext") return (
//         <div className="space-y-1">
//             <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
//             <textarea value={s} onChange={(e) => onChange(e.target.value)} rows={3}
//                       placeholder={schema.placeholder}
//                       className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
//         </div>
//     );
//
//     if (schema.type === "image") return <ImagePropField label={schema.label} value={s} onChange={onChange}/>;
//
//     if (schema.type === "array") {
//         const arr = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
//         return (
//             <div className="space-y-2">
//                 <Label className="text-xs font-medium text-muted-foreground">{schema.label}</Label>
//                 {arr.map((item, idx) => (
//                     <div key={idx} className="border rounded-lg p-2.5 space-y-2 bg-muted/20">
//                         <div className="flex justify-between items-center">
//                             <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
//                             <button onClick={() => onChange(arr.filter((_, i) => i !== idx))}
//                                     className="text-muted-foreground hover:text-red-500 transition-colors"><X
//                                 className="h-3.5 w-3.5"/></button>
//                         </div>
//                         {(schema.arrayItemSchema ?? []).map((sub) => (
//                             <PropField key={sub.key} schema={sub} value={item[sub.key]}
//                                        onChange={(v) => {
//                                            const u = [...arr];
//                                            u[idx] = {...item, [sub.key]: v};
//                                            onChange(u);
//                                        }}/>
//                         ))}
//                     </div>
//                 ))}
//                 <button onClick={() => {
//                     const ni: Record<string, unknown> = {};
//                     (schema.arrayItemSchema ?? []).forEach((s) => {
//                         ni[s.key] = s.defaultValue ?? "";
//                     });
//                     onChange([...arr, ni]);
//                 }}
//                         className="w-full border border-dashed rounded-lg py-2 text-xs text-muted-foreground hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 flex items-center justify-center gap-1 transition-all">
//                     <Plus className="h-3 w-3"/>Add {schema.label}
//                 </button>
//             </div>
//         );
//     }
//
//     return (
//         <div className="space-y-1">
//             <Label className="text-xs font-medium text-muted-foreground">
//                 {schema.label}{schema.required && <span className="text-red-400 ml-0.5">*</span>}
//             </Label>
//             <Input type={schema.type === "number" ? "number" : "text"} value={s}
//                    onChange={(e) => onChange(schema.type === "number" ? Number(e.target.value) : e.target.value)}
//                    placeholder={schema.placeholder} className="h-8 text-sm"/>
//         </div>
//     );
// }
//
// // ─── ComponentThumbnail ───────────────────────────────────────────────────────
//
// function ComponentThumbnail({html, defaultProps, theme}: {
//     html: string;
//     defaultProps: Record<string, unknown>;
//     theme?: SiteTheme
// }) {
//     const rendered = React.useMemo(() => {
//         let out = html;
//         out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => {
//             if (theme && key in theme) return String(theme[key as keyof SiteTheme] ?? "");
//             return String(defaultProps[key] ?? "");
//         });
//         out = out.replace(/\{\{[#^/][^}]*\}\}/g, "");
//         return out;
//     }, [html, defaultProps, theme]);
//
//     const doc = `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>body{margin:0;overflow:hidden;pointer-events:none;}*{animation:none!important;transition:none!important;}</style></head><body>${rendered}</body></html>`;
//
//     return (
//         <div className="relative w-full h-full overflow-hidden pointer-events-none">
//             <iframe srcDoc={doc} className="absolute top-0 left-0 border-0"
//                     style={{
//                         width: "800px",
//                         height: "400px",
//                         transform: "scale(0.185)",
//                         transformOrigin: "top left",
//                         pointerEvents: "none"
//                     }}
//                     sandbox="allow-scripts" title="preview" loading="lazy"/>
//         </div>
//     );
// }
//
// // ─── SEOPanel ─────────────────────────────────────────────────────────────────
//
// function SEOPanel({page, onSave, onClose}: {
//     page: UserPage;
//     onSave: (seo: PageSEO, css: string) => void;
//     onClose: () => void
// }) {
//     const [seo, setSeo] = useState<PageSEO>({...page.seo});
//     const [css, setCss] = useState(page.customCSS ?? "");
//     const tl = (seo.metaTitle ?? "").length, dl = (seo.metaDescription ?? "").length;
//
//     return (
//         <div className="flex flex-col h-full">
//             <PanelHeader title="SEO Settings" subtitle={page.title} onClose={onClose}
//                          icon={<FileText className="h-4 w-4 text-indigo-500"/>}/>
//             <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
//                 <FieldGroup>
//                     <div className="space-y-1.5">
//                         <div className="flex justify-between">
//                             <Label className="text-xs font-semibold">Meta Title</Label>
//                             <span
//                                 className={cn("text-xs", tl > 60 ? "text-red-400" : tl > 50 ? "text-amber-400" : "text-muted-foreground")}>{tl}/60</span>
//                         </div>
//                         <Input value={seo.metaTitle ?? ""} onChange={e => setSeo({...seo, metaTitle: e.target.value})}
//                                placeholder="Page title for search engines" className="h-9"/>
//                     </div>
//                     <div className="space-y-1.5">
//                         <div className="flex justify-between">
//                             <Label className="text-xs font-semibold">Meta Description</Label>
//                             <span
//                                 className={cn("text-xs", dl > 160 ? "text-red-400" : dl > 140 ? "text-amber-400" : "text-muted-foreground")}>{dl}/160</span>
//                         </div>
//                         <textarea value={seo.metaDescription ?? ""}
//                                   onChange={e => setSeo({...seo, metaDescription: e.target.value})}
//                                   rows={3} placeholder="Brief description for search results"
//                                   className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
//                     </div>
//                 </FieldGroup>
//
//                 <FieldGroup label="Open Graph">
//                     <div className="space-y-1.5">
//                         <Label className="text-xs font-semibold">OG Image URL</Label>
//                         <Input value={seo.ogImage ?? ""} onChange={e => setSeo({...seo, ogImage: e.target.value})}
//                                placeholder="https://… (1200×630px)"/>
//                         {seo.ogImage &&
//                             <img src={seo.ogImage} alt="OG" className="w-full rounded-lg border object-cover h-28"/>}
//                     </div>
//                     <div className="space-y-1.5">
//                         <Label className="text-xs font-semibold">Canonical URL <span
//                             className="font-normal text-muted-foreground">(optional)</span></Label>
//                         <Input value={seo.canonicalUrl ?? ""}
//                                onChange={e => setSeo({...seo, canonicalUrl: e.target.value})}
//                                placeholder="https://yourdomain.com/page"/>
//                     </div>
//                     <label className="flex items-center gap-2.5 cursor-pointer">
//                         <div
//                             className={cn("relative w-9 h-5 rounded-full transition-colors", seo.noIndex ? "bg-red-400" : "bg-muted-foreground/30")}>
//                             <div
//                                 className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform", seo.noIndex ? "translate-x-4" : "translate-x-0")}/>
//                             <input type="checkbox" checked={seo.noIndex ?? false}
//                                    onChange={e => setSeo({...seo, noIndex: e.target.checked})} className="sr-only"/>
//                         </div>
//                         <div><p className="text-sm font-medium">No Index</p><p
//                             className="text-xs text-muted-foreground">Hide from search engines</p></div>
//                     </label>
//                 </FieldGroup>
//
//                 <div className="rounded-xl border bg-muted/20 p-3 space-y-1">
//                     <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Google
//                         Preview</p>
//                     <p className="text-blue-600 text-sm font-medium truncate">{seo.metaTitle || page.title || "Page Title"}</p>
//                     <p className="text-emerald-700 text-xs">yourdomain.com{page.slug}</p>
//                     <p className="text-xs text-muted-foreground line-clamp-2">{seo.metaDescription || "Add a description to improve click-through rate."}</p>
//                 </div>
//
//                 <FieldGroup label="Custom CSS">
//           <textarea value={css} onChange={e => setCss(e.target.value)} rows={5} placeholder="/* Page-specific CSS */"
//                     className="w-full rounded-lg border bg-zinc-950 text-sky-300 font-mono px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
//                 </FieldGroup>
//             </div>
//             <div className="border-t px-4 py-3 shrink-0">
//                 <Button variant="gradient" className="w-full gap-2" onClick={() => onSave(seo, css)}>
//                     <Check className="h-4 w-4"/>Save SEO
//                 </Button>
//             </div>
//         </div>
//     );
// }
//
// // ─── ExportPanel ──────────────────────────────────────────────────────────────
//
// function ExportPanel({site, activePage, onClose}: {
//     site: UserSite;
//     activePage: UserPage | null;
//     onClose: () => void
// }) {
//     const [exp, setExp] = useState<string | null>(null);
//     const opts = {siteName: site.siteName, theme: site.theme, globalCSS: site.globalCSS, integrations: {}};
//     const doExport = async (t: "page" | "site") => {
//         setExp(t);
//         if (t === "page" && activePage) exportPageAsHTML(activePage, opts);
//         else await exportFullSiteAsZip(site.pages, opts);
//         setExp(null);
//     };
//     return (
//         <div className="flex flex-col h-full">
//             <PanelHeader title="Export" onClose={onClose} icon={<Download className="h-4 w-4 text-indigo-500"/>}/>
//             <div className="flex-1 px-4 py-4 space-y-3">
//                 <ExportCard icon={<FileText className="h-5 w-5 text-indigo-500"/>} title="Current Page"
//                             desc={`${activePage?.title} → HTML file`}>
//                     <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => doExport("page")}
//                             isLoading={exp === "page"} disabled={!activePage}>
//                         <Download className="h-3.5 w-3.5"/>Download HTML
//                     </Button>
//                 </ExportCard>
//                 <ExportCard icon={<Download className="h-5 w-5 text-purple-500"/>} title="Full Site ZIP"
//                             desc={`${site.pages.length} pages bundled`}>
//                     <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => doExport("site")}
//                             isLoading={exp === "site"}>
//                         <Download className="h-3.5 w-3.5"/>Download ZIP
//                     </Button>
//                 </ExportCard>
//                 <p className="text-xs text-muted-foreground text-center px-2 py-2">
//                     Host on Netlify, Vercel, GitHub Pages or any static host — no server needed.
//                 </p>
//             </div>
//         </div>
//     );
// }
//
// function ExportCard({icon, title, desc, children}: {
//     icon: React.ReactNode;
//     title: string;
//     desc: string;
//     children: React.ReactNode
// }) {
//     return (
//         <div className="rounded-xl border p-4 space-y-3 bg-card">
//             <div className="flex items-center gap-2.5">{icon}
//                 <div><p className="font-semibold text-sm">{title}</p><p
//                     className="text-xs text-muted-foreground">{desc}</p></div>
//             </div>
//             {children}
//         </div>
//     );
// }
//
// // ─── SiteType Onboarding ──────────────────────────────────────────────────────
//
// function SiteTypeOnboarding({onSelect}: { onSelect: (type: string, name: string) => void }) {
//     const [sel, setSel] = useState<string | null>(null);
//     const [name, setName] = useState("");
//     const [loading, setLoading] = useState(false);
//
//     return (
//         <div
//             className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
//             {/* Background grid */}
//             <div
//                 className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"/>
//             <div className="relative max-w-3xl w-full">
//                 <div className="text-center mb-10">
//                     <div
//                         className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
//                         <Sparkles className="h-3.5 w-3.5"/>Website Builder
//                     </div>
//                     <h1 className="text-4xl font-bold text-white mb-3">What are you building?</h1>
//                     <p className="text-slate-400 text-lg">Pick a starting point — customize everything after.</p>
//                 </div>
//
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
//                     {SITE_TYPES.map(o => (
//                         <button key={o.type} onClick={() => setSel(o.type)}
//                                 className={cn("relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg hover:shadow-indigo-500/10",
//                                     sel === o.type ? "border-indigo-500 bg-indigo-500/10" : "border-white/10 bg-white/5 hover:border-indigo-500/40 hover:bg-white/10")}>
//                             {sel === o.type && (
//                                 <div
//                                     className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
//                                     <Check className="h-3 w-3 text-white"/>
//                                 </div>
//                             )}
//                             <span className="text-3xl mb-3">{o.emoji}</span>
//                             <p className="font-semibold text-sm text-white">{o.label}</p>
//                             <p className="text-xs text-slate-400 mt-0.5">{o.desc}</p>
//                         </button>
//                     ))}
//                 </div>
//
//                 {sel && (
//                     <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5 flex gap-3">
//                         <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name your site…"
//                                className="flex-1 text-base bg-white/10 border-white/20 text-white placeholder:text-slate-500"
//                                autoFocus
//                                onKeyDown={e => e.key === "Enter" && name.trim() && (setLoading(true), onSelect(sel, name.trim()))}/>
//                         <Button variant="gradient" onClick={() => {
//                             if (!name.trim()) return;
//                             setLoading(true);
//                             onSelect(sel, name.trim());
//                         }}
//                                 disabled={!name.trim() || loading} className="gap-2 px-6 shrink-0">
//                             {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4"/>}
//                             {loading ? "Building…" : "Start Building"}
//                         </Button>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
//
// // ─── Small UI helpers ─────────────────────────────────────────────────────────
//
// function PanelHeader({title, subtitle, onClose, icon, action}: {
//     title: string;
//     subtitle?: string;
//     onClose: () => void;
//     icon?: React.ReactNode;
//     action?: React.ReactNode
// }) {
//     return (
//         <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-card/50">
//             <div className="flex items-center gap-2.5 min-w-0">
//                 {icon}
//                 <div className="min-w-0">
//                     <p className="font-semibold text-sm truncate">{title}</p>
//                     {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
//                 </div>
//             </div>
//             <div className="flex items-center gap-1 shrink-0">
//                 {action}
//                 <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X
//                     className="h-4 w-4"/></button>
//             </div>
//         </div>
//     );
// }
//
// function FieldGroup({label, children}: { label?: string; children: React.ReactNode }) {
//     return (
//         <div className="space-y-3">
//             {label && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>}
//             {children}
//         </div>
//     );
// }
//
// function ToolbarBtn({active, onClick, title, children}: {
//     active?: boolean;
//     onClick: () => void;
//     title: string;
//     children: React.ReactNode
// }) {
//     return (
//         <button onClick={onClick} title={title}
//                 className={cn("p-1.5 rounded-lg transition-all", active ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
//             {children}
//         </button>
//     );
// }
//
// // ─── Main Builder Page ────────────────────────────────────────────────────────
//
// export default function SiteBuilderPage() {
//     useSession();
//     const iframeRef = useRef<HTMLIFrameElement>(null);
//     const undoStack = useRef<CanvasComponent[][]>([]);
//     const redoStack = useRef<CanvasComponent[][]>([]);
//     const propAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
//     const dndSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
//     // Use refs for stale-closure-safe event handlers
//     const rightPanelRef = useRef<RightPanel>(null);
//     const activePageIdRef = useRef<string | null>(null);
//     const libraryRef = useRef<LibraryComponent[]>([]);
//     // addCompAt defined below — ref so message handler (mounted once) can call it
//     const addCompAtRef = useRef<(lc: LibraryComponent, insertBeforeId: string | null) => void>(() => {
//     });
//
//     const [site, setSite] = useState<UserSite | null>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [isPublishing, setIsPublishing] = useState(false);
//     const [showOnboarding, setShowOnboarding] = useState(false);
//     const [showPersonality, setShowPersonality] = useState(false);
//     const [saveMsg, setSaveMsg] = useState("");
//
//     const [activePageId, setActivePageId] = useState<string | null>(null);
//     const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
//     const [devicePreview, setDevicePreview] = useState<DevicePreview>("desktop");
//     const [zoom, setZoom] = useState(100);
//     const [leftOpen, setLeftOpen] = useState(true);
//     const [rightPanel, setRightPanel] = useState<RightPanel>(null);
//
//     const [library, setLibrary] = useState<LibraryComponent[]>([]);
//     const [libCat, setLibCat] = useState<string>("all");
//     const [libSearch, setLibSearch] = useState("");
//
//     const [showAI, setShowAI] = useState(false);
//     const [aiPrompt, setAiPrompt] = useState("");
//     const [aiLoading, setAiLoading] = useState(false);
//     const [aiError, setAiError] = useState("");
//
//     const [mobileIssues, setMobileIssues] = useState<MobileIssue[]>([]);
//     const [checkingMobile, setCheckingMobile] = useState(false);
//     const [showMobilePanel, setShowMobilePanel] = useState(false);
//
//     const [aiClearCanvas, setAiClearCanvas] = useState(false);
//     const [cloneUrl, setCloneUrl] = useState("");
//     const [cloneLoading, setCloneLoading] = useState(false);
//     const [cloneError, setCloneError] = useState("");
//
//     // Keep ref in sync for stale-closure-safe event listeners
//     useEffect(() => {
//         rightPanelRef.current = rightPanel;
//     }, [rightPanel]);
//     useEffect(() => {
//         activePageIdRef.current = activePageId;
//     }, [activePageId]);
//     useEffect(() => {
//         libraryRef.current = library;
//     }, [library]);
//
//
//     // ── Load ──────────────────────────────────────────────────────────────────
//     useEffect(() => {
//         Promise.all([
//             fetch("/api/site").then(r => r.json()),
//             fetch("/api/plan-components").then(r => r.json()),
//         ]).then(([s, l]) => {
//             if (s.success && s.data) {
//                 setSite(s.data);
//                 setActivePageId(s.data.builderState?.activePageId ?? s.data.pages[0]?.pageId ?? null);
//                 setDevicePreview(s.data.builderState?.devicePreview ?? "desktop");
//             } else {
//                 setShowOnboarding(true);
//             }
//             if (l.success) setLibrary(l.data);
//             setIsLoading(false);
//         });
//     }, []);
//
//     // ── iframe postMessage — use ref to avoid stale closure ──────────────────
//     useEffect(() => {
//         const h = (e: MessageEvent) => {
//             const {type} = e.data ?? {};
//
//             if (type === "COMPONENT_SELECTED") {
//                 setSelectedInstanceId(e.data.instanceId);
//                 setRightPanel("props");
//
//             } else if (type === "COMPONENT_DBLCLICK") {
//                 setSelectedInstanceId(e.data.instanceId);
//                 setRightPanel("props");
//
//             } else if (type === "COMPONENT_DESELECTED") {
//                 setTimeout(() => {
//                     if (rightPanelRef.current === "props") {
//                         setSelectedInstanceId(null);
//                         setRightPanel(null);
//                     }
//                 }, 50);
//
//             } else if (type === "COMPONENT_REORDER") {
//                 const {fromId, insertBeforeId} = e.data as { fromId: string; insertBeforeId: string | null };
//                 setSite(prev => {
//                     if (!prev) return prev;
//                     return {
//                         ...prev,
//                         pages: prev.pages.map(p => {
//                             if (p.pageId !== activePageIdRef.current) return p;
//                             const sorted = [...p.components].sort((a, b) => a.order - b.order);
//                             const fromIdx = sorted.findIndex(c => c.instanceId === fromId);
//                             if (fromIdx === -1) return p;
//                             const [moving] = sorted.splice(fromIdx, 1);
//                             if (insertBeforeId) {
//                                 const toIdx = sorted.findIndex(c => c.instanceId === insertBeforeId);
//                                 sorted.splice(toIdx === -1 ? sorted.length : toIdx, 0, moving);
//                             } else {
//                                 sorted.push(moving);
//                             }
//                             return {...p, components: sorted.map((c, i) => ({...c, order: i}))};
//                         }),
//                     };
//                 });
//                 if (dndSaveTimer.current) clearTimeout(dndSaveTimer.current);
//                 dndSaveTimer.current = setTimeout(() => saveComps(true), 800);
//
//             } else if (type === "COMPONENT_DROP_EXTERNAL") {
//                 const {componentKey, insertBeforeId} = e.data as {
//                     componentKey: string;
//                     insertBeforeId: string | null
//                 };
//                 const lc = libraryRef.current.find(l => l.key === componentKey);
//                 if (!lc) return;
//                 addCompAtRef.current(lc, insertBeforeId);
//             }
//         };
//         window.addEventListener("message", h);
//         return () => window.removeEventListener("message", h);
//     }, []); // no deps — uses refs
//
//     // ── Derived ───────────────────────────────────────────────────────────────
//     const activePage = site?.pages.find(p => p.pageId === activePageId) ?? null;
//     const components = (activePage?.components ?? []).slice().sort((a, b) => a.order - b.order);
//     const selectedComp = components.find(c => c.instanceId === selectedInstanceId) ?? null;
//     const filteredLib = library.filter(c =>
//         (libCat === "all" || c.category === libCat) &&
//         (!libSearch || c.name.toLowerCase().includes(libSearch.toLowerCase()) || c.category.toLowerCase().includes(libSearch.toLowerCase()))
//     );
//
//     // ── Update components in active page ─────────────────────────────────────
//     const updateComps = useCallback((c: CanvasComponent[]) => {
//         setSite(prev => prev ? {
//             ...prev,
//             pages: prev.pages.map(p => p.pageId === activePageId ? {...p, components: c} : p),
//         } : prev);
//     }, [activePageId]);
//
//     // ── Add component to canvas ───────────────────────────────────────────────
//     const addComp = useCallback((lc: LibraryComponent) => {
//         undoStack.current.push([...components]);
//         redoStack.current = [];
//
//         const newComp: CanvasComponent = {
//             instanceId: uuid(), componentKey: lc.key, componentId: lc._id,
//             name: lc.name, category: lc.category, htmlTemplate: lc.htmlTemplate,
//             cssCode: lc.cssCode, jsCode: lc.jsCode, propsSchema: lc.propsSchema ?? [],
//             propValues: {...(lc.defaultProps ?? {})}, isVisible: true, isLocked: false, order: components.length,
//         };
//
//         // Singleton: navbar/footer only one allowed per page
//         if (SINGLETON_CATEGORIES.includes(lc.category)) {
//             const existingIdx = components.findIndex(c => c.category === lc.category);
//             if (existingIdx !== -1) {
//                 const updated = components.map((c, i) => i === existingIdx ? {
//                     ...newComp,
//                     instanceId: c.instanceId,
//                     order: c.order
//                 } : c);
//                 updateComps(updated);
//                 setSelectedInstanceId(updated[existingIdx].instanceId);
//                 setRightPanel("props");
//                 return;
//             }
//             if (lc.category === "navbar") {
//                 const reordered = [newComp, ...components].map((c, i) => ({...c, order: i}));
//                 updateComps(reordered);
//                 setSelectedInstanceId(newComp.instanceId);
//                 setRightPanel("props");
//                 return;
//             }
//             if (lc.category === "footer") {
//                 const reordered = [...components, newComp].map((c, i) => ({...c, order: i}));
//                 updateComps(reordered);
//                 setSelectedInstanceId(newComp.instanceId);
//                 setRightPanel("props");
//                 return;
//             }
//         }
//
//         const updated = [...components, newComp];
//         updateComps(updated);
//         // Auto-select the newly added component
//         setSelectedInstanceId(newComp.instanceId);
//         setRightPanel("props");
//     }, [components, updateComps]);
//
//     // ── addCompAt: add component at a specific position (for drag-from-library) ─
//     const addCompAt = useCallback((lc: LibraryComponent, insertBeforeId: string | null) => {
//         undoStack.current.push([...componentsRef.current]);
//         redoStack.current = [];
//         const current = componentsRef.current;
//
//         const newComp: CanvasComponent = {
//             instanceId: uuid(), componentKey: lc.key, componentId: lc._id,
//             name: lc.name, category: lc.category, htmlTemplate: lc.htmlTemplate,
//             cssCode: lc.cssCode, jsCode: lc.jsCode, propsSchema: lc.propsSchema,
//             propValues: {...lc.defaultProps}, isVisible: true, isLocked: false, order: 0,
//         };
//
//         // Singleton: navbar/footer only one allowed
//         if (SINGLETON_CATEGORIES.includes(lc.category)) {
//             const existingIdx = current.findIndex(c => c.category === lc.category);
//             if (existingIdx !== -1) {
//                 const updated = current.map((c, i) => i === existingIdx ? {
//                     ...newComp,
//                     instanceId: c.instanceId,
//                     order: c.order
//                 } : c);
//                 updateComps(updated);
//                 setSelectedInstanceId(updated[existingIdx].instanceId);
//                 setRightPanel("props");
//                 return;
//             }
//         }
//
//         let result: CanvasComponent[];
//         if (!insertBeforeId) {
//             result = [...current, newComp];
//         } else {
//             const idx = current.findIndex(c => c.instanceId === insertBeforeId);
//             if (idx === -1) {
//                 result = [...current, newComp];
//             } else {
//                 result = [...current.slice(0, idx), newComp, ...current.slice(idx)];
//             }
//         }
//         updateComps(result.map((c, i) => ({...c, order: i})));
//         setSelectedInstanceId(newComp.instanceId);
//         setRightPanel("props");
//     }, [updateComps]); // intentionally avoids components — uses componentsRef
//
//     // Keep addCompAtRef in sync so the message handler can call it
//     useEffect(() => {
//         addCompAtRef.current = addCompAt;
//     }, [addCompAt]);
//
//     // ── Iframe rendering ─────────────────────────────────────────────────────
//     // Track previous components to detect what changed
//     const prevCompsRef = useRef<typeof components>([]);
//     const iframeReadyRef = useRef(false);
//
//     const writeIframe = useCallback((html: string) => {
//         const d = iframeRef.current?.contentDocument;
//         if (!d) return;
//         iframeReadyRef.current = false;
//         d.open();
//         d.write(html);
//         d.close();
//         iframeReadyRef.current = true;
//     }, []);
//
//     // Full rewrite — structure changed (add/remove/reorder/visibility/page change)
//     const rewriteIframe = useCallback(() => {
//         if (!site || !activePage) return;
//         const html = buildIframeDocument({
//             components: components.filter(c => c.isVisible).map(c => ({
//                 instanceId: c.instanceId, htmlTemplate: c.htmlTemplate,
//                 cssCode: c.cssCode, jsCode: c.jsCode,
//                 propValues: c.propValues, animationPreset: c.animationPreset,
//             })),
//             globalTheme: site.theme,
//             globalCSS: site.globalCSS + (activePage.customCSS ?? ""),
//         });
//         writeIframe(html);
//         prevCompsRef.current = components;
//         // Re-highlight selected after rewrite
//         if (selectedInstanceId) {
//             setTimeout(() => {
//                 const el = iframeRef.current?.contentDocument?.querySelector(`[data-instance="${selectedInstanceId}"]`);
//                 el?.classList.add("selected");
//             }, 80);
//         }
//     }, [site, activePage, components, selectedInstanceId, writeIframe]);
//
//     // Prop-only update — don't rewrite, just patch via postMessage
//     const patchIframeProps = useCallback((instanceId: string, propValues: Record<string, unknown>) => {
//         iframeRef.current?.contentWindow?.postMessage({
//             type: "UPDATE_PROPS",
//             instanceId,
//             propValues,
//         }, "*");
//     }, []);
//
//     useEffect(() => {
//         if (!site || !activePage) return;
//         const prev = prevCompsRef.current;
//
//         // Detect if it's a structural change (add/remove/reorder/visibility) or prop-only
//         const structuralChange =
//             prev.length !== components.length ||
//             prev.some((p, i) => p.instanceId !== components[i]?.instanceId) ||
//             prev.some((p, i) => p.isVisible !== components[i]?.isVisible);
//
//         if (structuralChange || !iframeReadyRef.current) {
//             rewriteIframe();
//         } else {
//             // Only props changed — patch without rewrite (preserves drag state)
//             for (const comp of components) {
//                 const prevComp = prev.find(p => p.instanceId === comp.instanceId);
//                 if (prevComp && JSON.stringify(prevComp.propValues) !== JSON.stringify(comp.propValues)) {
//                     patchIframeProps(comp.instanceId, comp.propValues);
//                 }
//             }
//             prevCompsRef.current = components;
//         }
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [components, site?.theme, site?.globalCSS, activePage?.customCSS, activePageId]);
//
//     // ── Update single prop ────────────────────────────────────────────────────
//     const updateProp = useCallback((key: string, val: unknown) => {
//         if (!selectedInstanceId) return;
//         setSite(prev => prev ? {
//             ...prev,
//             pages: prev.pages.map(p => p.pageId !== activePageId ? p : {
//                 ...p,
//                 components: p.components.map(c => c.instanceId !== selectedInstanceId ? c : {
//                     ...c, propValues: {...c.propValues, [key]: val},
//                 }),
//             }),
//         } : prev);
//         // Auto-save props after 1.5s of no changes
//         if (propAutoSaveTimer.current) clearTimeout(propAutoSaveTimer.current);
//         propAutoSaveTimer.current = setTimeout(() => saveComps(true), 1500);
//     }, [selectedInstanceId, activePageId]); // eslint-disable-line
//
//     // ── Component actions ─────────────────────────────────────────────────────
//     const delComp = (id: string) => {
//         undoStack.current.push([...components]);
//         redoStack.current = [];
//         updateComps(components.filter(c => c.instanceId !== id).map((c, i) => ({...c, order: i})));
//         setSelectedInstanceId(null);
//         setRightPanel(null);
//     };
//     const toggleVis = (id: string) => {
//         setSite(prev => prev ? {
//             ...prev,
//             pages: prev.pages.map(p => p.pageId !== activePageId ? p : {
//                 ...p, components: p.components.map(c => c.instanceId !== id ? c : {...c, isVisible: !c.isVisible}),
//             }),
//         } : prev);
//     };
//     const dup = (id: string) => {
//         undoStack.current.push([...components]);
//         redoStack.current = [];
//         updateComps(duplicateComponent(components as never[], id) as typeof components);
//     };
//     const undo = () => {
//         const p = undoStack.current.pop();
//         if (!p) return;
//         redoStack.current.push([...components]);
//         updateComps(p);
//     };
//     const redo = () => {
//         const n = redoStack.current.pop();
//         if (!n) return;
//         undoStack.current.push([...components]);
//         updateComps(n);
//     };
//
//     // ── Save ──────────────────────────────────────────────────────────────────
//     // Use ref-based version to avoid stale closure in timers
//     const componentsRef = useRef(components);
//     useEffect(() => {
//         componentsRef.current = components;
//     }, [components]);
//
//     const saveComps = useCallback(async (silent = false) => {
//         if (!activePageId) return;
//         if (!silent) setIsSaving(true);
//         await fetch(`/api/site/page/${activePageId}/components`, {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({components: componentsRef.current}),
//         });
//         if (!silent) {
//             setIsSaving(false);
//             setSaveMsg("Saved!");
//             setTimeout(() => setSaveMsg(""), 2000);
//         }
//     }, [activePageId]);
//
//     // ── Update single comp patch (for animation etc.) ─────────────────────────
//     const updateComp = useCallback((instanceId: string, patch: Partial<CanvasComponent>) => {
//         const updated = components.map(c => c.instanceId === instanceId ? {...c, ...patch} : c);
//         updateComps(updated);
//         if (dndSaveTimer.current) clearTimeout(dndSaveTimer.current);
//         dndSaveTimer.current = setTimeout(() => saveComps(true), 800);
//     }, [components, updateComps, saveComps]);
//
//     // Canvas DnD reorder handled via iframe postMessage COMPONENT_REORDER
//
//     // ── Clone URL ─────────────────────────────────────────────────────────────
//     const handleClone = useCallback(async () => {
//         if (!cloneUrl.trim()) return;
//         setCloneLoading(true);
//         setCloneError("");
//         try {
//             const res = await fetch("/api/builder/clone-url", {
//                 method: "POST",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({url: cloneUrl.trim()})
//             });
//             const data = await res.json();
//             if (!data.success) throw new Error(data.error ?? "Clone failed");
//             // Clone clears canvas first then adds new components
//             undoStack.current.push([...componentsRef.current]);
//             updateComps([]);
//             for (const ai of (data.data ?? [])) {
//                 const lc = library.find(l => l.key === ai.componentKey);
//                 if (lc) addCompAtRef.current({...lc, defaultProps: {...lc.defaultProps, ...ai.propValues}}, null);
//             }
//             setCloneUrl("");
//             setRightPanel(null);
//         } catch (e) {
//             setCloneError(e instanceof Error ? e.message : "Clone failed");
//         } finally {
//             setCloneLoading(false);
//         }
//     }, [cloneUrl, library, addComp]);
//
//     // ── Publish ───────────────────────────────────────────────────────────────
//     const publish = async () => {
//         await saveComps(true);
//         setIsPublishing(true);
//         const d = await fetch("/api/site/publish", {method: "POST"}).then(r => r.json());
//         if (d.success) setSite(prev => prev ? {...prev, isPublished: true} : prev);
//         setIsPublishing(false);
//     };
//
//     // ── Theme / pages / global handlers ──────────────────────────────────────
//     const handleThemeChange = (theme: SiteTheme) => setSite(prev => prev ? {...prev, theme} : prev);
//     const handleThemeSave = async () => {
//         if (!site) return;
//         await fetch("/api/site/theme", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({theme: site.theme, globalCSS: site.globalCSS})
//         });
//         setSaveMsg("Theme saved!");
//         setTimeout(() => setSaveMsg(""), 2000);
//     };
//     const handleAddPage = async (p: { title: string; slug: string; role: string }) => {
//         const d = await fetch("/api/site/page", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify(p)
//         }).then(r => r.json());
//         if (d.success) setSite(prev => prev ? {
//             ...prev,
//             pages: [...prev.pages, {...d.data, components: [], seo: {}}]
//         } : prev);
//     };
//     const handleRenamePage = async (id: string, title: string, slug: string) => {
//         await fetch(`/api/site/page/${id}`, {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({title, slug})
//         });
//         setSite(prev => prev ? {...prev, pages: prev.pages.map(p => p.pageId === id ? {...p, title, slug} : p)} : prev);
//     };
//     const handleDeletePage = async (id: string) => {
//         await fetch("/api/site/page", {
//             method: "DELETE",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({pageId: id})
//         });
//         setSite(prev => prev ? {...prev, pages: prev.pages.filter(p => p.pageId !== id)} : prev);
//         if (activePageId === id) setActivePageId(site?.pages[0]?.pageId ?? null);
//     };
//     const handleToggleNav = (id: string) => setSite(prev => prev ? {
//         ...prev,
//         pages: prev.pages.map(p => p.pageId === id ? {...p, showInNav: !p.showInNav} : p)
//     } : prev);
//     const handleSaveGlobal = async (navbar: UserSite["navbar"], footer: UserSite["footer"]) => {
//         setSite(prev => prev ? {...prev, navbar, footer} : prev);
//         await fetch("/api/site", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({navbar, footer})
//         });
//     };
//     const handleSaveSEO = async (seo: PageSEO, customCSS: string) => {
//         setSite(prev => prev ? {
//             ...prev,
//             pages: prev.pages.map(p => p.pageId === activePageId ? {...p, seo, customCSS} : p)
//         } : prev);
//         await fetch(`/api/site/page/${activePageId}/seo`, {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({seo, customCSS})
//         });
//         setRightPanel(null);
//     };
//
//     // ── Mobile check ──────────────────────────────────────────────────────────
//     const runMobileCheck = async () => {
//         if (!iframeRef.current) return;
//         setCheckingMobile(true);
//         const issues = await checkMobileIssues(iframeRef.current, components.map(c => ({
//             instanceId: c.instanceId,
//             name: c.name
//         })));
//         setMobileIssues(issues);
//         setShowMobilePanel(true);
//         setCheckingMobile(false);
//     };
//
//     // ── AI build ──────────────────────────────────────────────────────────────
//     const runAI = async (clearCanvas = false) => {
//         if (!aiPrompt.trim() || !site) return;
//         setAiLoading(true);
//         setAiError("");
//         try {
//             const d = await fetch("/api/builder/ai", {
//                 method: "POST", headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({
//                     prompt: aiPrompt, siteType: site.siteType,
//                     pageSlug: activePage?.slug ?? "/",
//                     existingComponentKeys: clearCanvas ? [] : components.map(c => c.componentKey),
//                     clearCanvas,
//                 }),
//             }).then(r => r.json());
//             if (!d.success) {
//                 setAiError(d.error);
//                 return;
//             }
//             const add: CanvasComponent[] = [];
//             for (const ai of (d.data ?? [])) {
//                 const lc = library.find(l => l.key === ai.componentKey);
//                 if (!lc) continue;
//                 add.push({
//                     instanceId: uuid(), componentKey: lc.key, componentId: lc._id,
//                     name: lc.name, category: lc.category, htmlTemplate: lc.htmlTemplate,
//                     cssCode: lc.cssCode, jsCode: lc.jsCode,
//                     propsSchema: lc.propsSchema ?? [],
//                     propValues: {...lc.defaultProps, ...ai.propValues},
//                     isVisible: true, isLocked: false, order: 0,
//                 });
//             }
//             undoStack.current.push([...components]);
//             // If clearCanvas or AI said to clear, replace all; otherwise append
//             const base = clearCanvas ? [] : components;
//             updateComps([...base, ...add].map((c, i) => ({...c, order: i})));
//             setAiPrompt("");
//             setShowAI(false);
//         } catch {
//             setAiError("AI error. Try again.");
//         }
//         setAiLoading(false);
//     };
//
//     const exportCompJSON = (c: CanvasComponent) => {
//         const b = new Blob([JSON.stringify({
//             componentKey: c.componentKey,
//             propValues: c.propValues,
//             name: c.name
//         }, null, 2)], {type: "application/json"});
//         const a = document.createElement("a");
//         a.href = URL.createObjectURL(b);
//         a.download = `${c.componentKey}.json`;
//         a.click();
//     };
//     const importCompJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const f = e.target.files?.[0];
//         if (!f) return;
//         try {
//             const d = JSON.parse(await f.text());
//             const lc = library.find(l => l.key === d.componentKey);
//             if (!lc) {
//                 alert(`Component "${d.componentKey}" not found.`);
//                 return;
//             }
//             addComp({...lc, defaultProps: {...lc.defaultProps, ...(d.propValues ?? {})}});
//         } catch {
//             alert("Invalid JSON.");
//         }
//         e.target.value = "";
//     };
//     const handleOnboarding = async (t: string, n: string) => {
//         const d = await fetch("/api/site/init", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({siteType: t, siteName: n})
//         }).then(r => r.json());
//         if (d.success) {
//             setSite(d.data);
//             setActivePageId(d.data.pages[0]?.pageId ?? null);
//             setShowOnboarding(false);
//             setShowPersonality(true);
//         }
//     };
//
//     // ── Guards ────────────────────────────────────────────────────────────────
//     if (isLoading) return (
//         <div className="flex items-center justify-center h-[80vh]">
//             <div className="text-center space-y-3">
//                 <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto"/>
//                 <p className="text-sm text-muted-foreground">Loading builder…</p>
//             </div>
//         </div>
//     );
//     if (showOnboarding) return <SiteTypeOnboarding onSelect={handleOnboarding}/>;
//     if (showPersonality && site) return (
//         <PersonalityOnboarding siteType={site.siteType}
//                                onComplete={(updatedSite) => {
//                                    setSite(updatedSite as typeof site);
//                                    setShowPersonality(false);
//                                }}
//                                onSkip={() => setShowPersonality(false)}/>
//     );
//     if (!site) return null;
//
//     // ── Render ────────────────────────────────────────────────────────────────
//     return (
//         <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
//
//             {/* ── Top Toolbar ─────────────────────────────────────────────────── */}
//             <div
//                 className="flex items-center gap-1.5 px-3 h-12 border-b bg-card/95 backdrop-blur shrink-0 z-20 shadow-sm">
//                 {/* Left: toggle + pages */}
//                 <button onClick={() => setLeftOpen(v => !v)}
//                         className={cn("p-1.5 rounded-lg transition-all", leftOpen ? "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600" : "hover:bg-muted text-muted-foreground")}>
//                     <Menu className="h-4 w-4"/>
//                 </button>
//
//                 <div className="w-px h-5 bg-border mx-0.5"/>
//
//                 {/* Pages tab bar */}
//                 <div className="flex items-center gap-0.5 overflow-x-auto max-w-sm scrollbar-none">
//                     {site.pages.map(p => (
//                         <button key={p.pageId} onClick={() => {
//                             setActivePageId(p.pageId);
//                             setSelectedInstanceId(null);
//                             setRightPanel(null);
//                         }}
//                                 className={cn("px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
//                                     activePageId === p.pageId ? "bg-indigo-600 text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
//                             {p.title}
//                         </button>
//                     ))}
//                     <button onClick={() => setRightPanel("pages")} title="Manage pages"
//                             className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
//                         <Plus className="h-3.5 w-3.5"/>
//                     </button>
//                 </div>
//
//                 <div className="w-px h-5 bg-border mx-0.5"/>
//
//                 <Link href={`/dashboard/admin/site/marketplace?pageId=${activePageId ?? ""}`}
//                       className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0">
//                     <Sparkles className="h-3.5 w-3.5 text-purple-500"/>Marketplace
//                 </Link>
//
//                 {/* Right: controls */}
//                 <div className="ml-auto flex items-center gap-0.5">
//                     {/* Device selector */}
//                     <div className="flex border rounded-lg overflow-hidden mr-1">
//                         {(["desktop", "tablet", "mobile"] as DevicePreview[]).map(d => {
//                             const I = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
//                             return (
//                                 <button key={d} onClick={() => setDevicePreview(d)} title={d}
//                                         className={cn("p-1.5 transition-colors", devicePreview === d ? "bg-indigo-600 text-white" : "hover:bg-muted text-muted-foreground")}>
//                                     <I className="h-3.5 w-3.5"/>
//                                 </button>
//                             );
//                         })}
//                     </div>
//
//                     {/* Zoom */}
//                     <div className="flex border rounded-lg overflow-hidden mr-1">
//                         <button onClick={() => setZoom(z => Math.max(50, z - 10))}
//                                 className="px-2 py-1.5 hover:bg-muted text-xs text-muted-foreground">−
//                         </button>
//                         <span
//                             className="px-2 text-xs font-mono flex items-center border-x text-muted-foreground">{zoom}%</span>
//                         <button onClick={() => setZoom(z => Math.min(150, z + 10))}
//                                 className="px-2 py-1.5 hover:bg-muted text-xs text-muted-foreground">+
//                         </button>
//                     </div>
//
//                     {/* Undo/Redo */}
//                     <button onClick={undo} disabled={!undoStack.current.length} title="Undo"
//                             className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><Undo
//                         className="h-3.5 w-3.5"/></button>
//                     <button onClick={redo} disabled={!redoStack.current.length} title="Redo"
//                             className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"><Redo
//                         className="h-3.5 w-3.5"/></button>
//
//                     <div className="w-px h-5 bg-border mx-0.5"/>
//
//                     {/* Panel toggles */}
//                     <ToolbarBtn active={rightPanel === "theme"}
//                                 onClick={() => setRightPanel(p => p === "theme" ? null : "theme")} title="Theme editor"><Paintbrush
//                         className="h-3.5 w-3.5"/></ToolbarBtn>
//                     <ToolbarBtn active={rightPanel === "global"}
//                                 onClick={() => setRightPanel(p => p === "global" ? null : "global")}
//                                 title="Navbar & Footer"><Navigation className="h-3.5 w-3.5"/></ToolbarBtn>
//                     <ToolbarBtn active={rightPanel === "seo"}
//                                 onClick={() => setRightPanel(p => p === "seo" ? null : "seo")}
//                                 title="SEO settings"><FileText className="h-3.5 w-3.5"/></ToolbarBtn>
//                     <ToolbarBtn active={rightPanel === "og"}
//                                 onClick={() => setRightPanel(p => p === "og" ? null : "og")}
//                                 title="Social preview"><Share2 className="h-3.5 w-3.5"/></ToolbarBtn>
//                     <ToolbarBtn active={rightPanel === "magic"}
//                                 onClick={() => setRightPanel(p => p === "magic" ? null : "magic")}
//                                 title="Magic AI"><Wand2 className="h-3.5 w-3.5"/></ToolbarBtn>
//                     <ToolbarBtn active={rightPanel === "clone"}
//                                 onClick={() => setRightPanel(p => p === "clone" ? null : "clone")}
//                                 title="Clone a URL"><Link2 className="h-3.5 w-3.5"/></ToolbarBtn>
//                     <ToolbarBtn active={rightPanel === "export"}
//                                 onClick={() => setRightPanel(p => p === "export" ? null : "export")}
//                                 title="Export"><Download className="h-3.5 w-3.5"/></ToolbarBtn>
//
//                     {/* Mobile check */}
//                     <button onClick={runMobileCheck} disabled={checkingMobile} title="Mobile check"
//                             className={cn("p-1.5 rounded-lg transition-colors flex items-center gap-0.5", mobileIssues.length > 0 ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30" : "hover:bg-muted text-muted-foreground")}>
//                         {checkingMobile ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> :
//                             <Smartphone className="h-3.5 w-3.5"/>}
//                         {mobileIssues.length > 0 &&
//                             <span className="text-[10px] font-bold">{mobileIssues.length}</span>}
//                     </button>
//
//                     {/* Import JSON */}
//                     <label
//                         className="p-1.5 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground transition-colors"
//                         title="Import component JSON">
//                         <Upload className="h-3.5 w-3.5"/>
//                         <input type="file" accept=".json" className="hidden" onChange={importCompJSON}/>
//                     </label>
//
//                     <div className="w-px h-5 bg-border mx-0.5"/>
//
//                     {/* AI + SEO Score */}
//                     <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAI(true)}>
//                         <Sparkles className="h-3.5 w-3.5 text-purple-500"/>AI Build
//                     </Button>
//
//                     <LiveSEOScore page={activePage} componentCount={components.length}
//                                   hasHero={components.some(c => c.category === "hero")}
//                                   hasFooter={components.some(c => c.category === "footer")}/>
//
//                     {/* Save */}
//                     {saveMsg
//                         ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 px-2"><Check
//                             className="h-3.5 w-3.5"/>{saveMsg}</span>
//                         : <Button size="sm" variant="outline" onClick={() => saveComps()} isLoading={isSaving}
//                                   className="gap-1.5 h-8 text-xs"><Save className="h-3.5 w-3.5"/>Save</Button>
//                     }
//
//                     {/* Publish */}
//                     <Button size="sm" variant="gradient" onClick={publish} isLoading={isPublishing}
//                             className="gap-1.5 h-8 text-xs">
//                         <Globe className="h-3.5 w-3.5"/>{site.isPublished ? "Re-publish" : "Publish"}
//                     </Button>
//                 </div>
//             </div>
//
//             {/* ── Main area ────────────────────────────────────────────────────── */}
//             <div className="flex flex-1 overflow-hidden relative">
//
//                 {/* ── Left Panel: Component Library ───────────────────────────── */}
//                 <div
//                     className={cn("border-r bg-card flex flex-col transition-all duration-200 shrink-0", leftOpen ? "w-56" : "w-0 overflow-hidden")}>
//                     {/* Search */}
//                     <div className="px-2.5 py-2 border-b shrink-0 flex items-center gap-2 bg-muted/20">
//                         <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
//                         <input value={libSearch} onChange={e => setLibSearch(e.target.value)}
//                                placeholder="Search components…"
//                                className="flex-1 h-7 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/60"/>
//                         {libSearch && <button onClick={() => setLibSearch("")}
//                                               className="text-muted-foreground hover:text-foreground"><X
//                             className="h-3 w-3"/></button>}
//                     </div>
//
//                     {/* Category filters */}
//                     <div className="flex gap-0.5 px-1.5 py-1.5 border-b overflow-x-auto shrink-0 scrollbar-none">
//                         {CATS.map(cat => {
//                             const I = cat === "all" ? Layers : CAT_ICONS[cat] ?? Layers;
//                             return (
//                                 <button key={cat} onClick={() => setLibCat(cat)} title={cat}
//                                         className={cn("p-1.5 rounded-lg shrink-0 transition-all", libCat === cat ? "bg-indigo-600 text-white shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground")}>
//                                     <I className="h-3.5 w-3.5"/>
//                                 </button>
//                             );
//                         })}
//                     </div>
//
//                     {/* Component list */}
//                     <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
//                         {filteredLib.length === 0 && (
//                             <div className="text-center py-8 px-3">
//                                 <Layers className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2"/>
//                                 <p className="text-xs text-muted-foreground">No components found</p>
//                             </div>
//                         )}
//                         {filteredLib.map(comp => {
//                             const I = CAT_ICONS[comp.category] ?? Layers;
//                             return (
//                                 <button key={comp._id} onClick={() => addComp(comp)}
//                                         draggable
//                                         onDragStart={(e) => {
//                                             e.dataTransfer.effectAllowed = "copy";
//                                             e.dataTransfer.setData("text/sc-library-key", comp.key);
//                                             // Show a small ghost while dragging
//                                             const ghost = document.createElement("div");
//                                             ghost.textContent = comp.name;
//                                             Object.assign(ghost.style, {
//                                                 position: "fixed", top: "-999px", left: "-999px",
//                                                 background: "#4F46E5", color: "white", padding: "4px 10px",
//                                                 borderRadius: "8px", fontSize: "12px", fontWeight: "600",
//                                                 whiteSpace: "nowrap", pointerEvents: "none",
//                                             });
//                                             document.body.appendChild(ghost);
//                                             e.dataTransfer.setDragImage(ghost, 40, 14);
//                                             setTimeout(() => document.body.removeChild(ghost), 0);
//                                         }}
//                                         className="w-full text-left rounded-xl border hover:border-indigo-400 hover:shadow-sm transition-all overflow-hidden group bg-background cursor-grab active:cursor-grabbing">
//                                     {/* Thumbnail */}
//                                     <div
//                                         className="w-full h-16 overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 relative">
//                                         {comp.previewImage ? (
//                                             <img src={comp.previewImage} alt={comp.name}
//                                                  className="w-full h-full object-cover"/>
//                                         ) : comp.htmlTemplate ? (
//                                             <ComponentThumbnail html={comp.htmlTemplate}
//                                                                 defaultProps={comp.defaultProps} theme={site?.theme}/>
//                                         ) : (
//                                             <div
//                                                 className="w-full h-full flex items-center justify-center bg-muted/30 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 transition-colors">
//                                                 <I className="h-5 w-5 text-muted-foreground/30"/>
//                                             </div>
//                                         )}
//                                         <span
//                                             className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded-md bg-black/60 text-white font-medium capitalize backdrop-blur-sm">
//                       {comp.category}
//                     </span>
//                                         {comp.isFeatured && (
//                                             <span
//                                                 className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-bold">★</span>
//                                         )}
//                                     </div>
//                                     <div className="px-2.5 py-1.5 flex items-center gap-1.5">
//                                         <I className="h-3 w-3 text-muted-foreground/60 shrink-0"/>
//                                         <p className="font-medium text-xs truncate">{comp.name}</p>
//                                     </div>
//                                 </button>
//                             );
//                         })}
//                     </div>
//
//                 </div>
//
//                 {/* ── Canvas + Layers ──────────────────────────────────────────── */}
//                 <div className="flex-1 flex flex-col overflow-hidden">
//
//                     {/* Canvas viewport */}
//                     <div
//                         className="flex-1 overflow-auto bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.04),transparent_70%)] dark:bg-zinc-950 flex items-start justify-center p-8">
//                         <div
//                             className="bg-white dark:bg-slate-900 shadow-2xl rounded-xl overflow-hidden relative ring-1 ring-black/5"
//                             style={{
//                                 width: DEVICE_WIDTHS[devicePreview],
//                                 minHeight: 600,
//                                 transform: `scale(${zoom / 100})`,
//                                 transformOrigin: "top center",
//                                 transition: "width 0.2s ease",
//                             }}>
//                             <iframe ref={iframeRef} className="w-full border-0" style={{height: "100%", minHeight: 600}}
//                                     title="Site Preview" sandbox="allow-scripts allow-same-origin"/>
//                             {components.length === 0 && (
//                                 <div
//                                     className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
//                                     <div
//                                         className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
//                                         <LayoutTemplate className="h-8 w-8 text-indigo-300"/>
//                                     </div>
//                                     <p className="font-semibold text-muted-foreground text-sm">Canvas is empty</p>
//                                     <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">Click any component in
//                                         the left panel to add it, or use AI Build to generate a full page layout.</p>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//
//                     {/* ── Layers strip — simple clickable chips ───────────────────── */}
//                     {components.length > 0 && (
//                         <div
//                             className="shrink-0 bg-card/95 border-t px-3 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-none shadow-sm">
//                             <span
//                                 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider shrink-0 mr-1">Layers</span>
//                             {components.map(c => {
//                                 const I = CAT_ICONS[c.category] ?? Layers;
//                                 return (
//                                     <button key={c.instanceId}
//                                             onClick={() => {
//                                                 setSelectedInstanceId(c.instanceId);
//                                                 setRightPanel("props");
//                                             }}
//                                             className={cn(
//                                                 "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
//                                                 selectedInstanceId === c.instanceId
//                                                     ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
//                                                     : "bg-background text-muted-foreground border-border hover:border-indigo-300 hover:text-foreground",
//                                                 !c.isVisible && "opacity-40"
//                                             )}>
//                                         <I className="h-3 w-3 shrink-0"/>
//                                         {c.name}
//                                     </button>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </div>
//
//                 {/* ── Right Panel ─────────────────────────────────────────────── */}
//                 {rightPanel && (
//                     <div className="w-72 border-l bg-card flex flex-col shrink-0 overflow-hidden">
//
//                         {/* Props editor */}
//                         {rightPanel === "props" && selectedComp && (
//                             <div className="flex flex-col h-full">
//                                 <PanelHeader
//                                     title={selectedComp.name}
//                                     subtitle={`${selectedComp.category} component`}
//                                     onClose={() => {
//                                         setRightPanel(null);
//                                         setSelectedInstanceId(null);
//                                     }}
//                                     icon={(() => {
//                                         const I = CAT_ICONS[selectedComp.category] ?? Layers;
//                                         return <I className="h-4 w-4 text-indigo-500"/>;
//                                     })()}
//                                     action={
//                                         <div className="flex items-center gap-0.5">
//                                             <button onClick={() => toggleVis(selectedComp.instanceId)}
//                                                     title={selectedComp.isVisible ? "Hide" : "Show"}
//                                                     className="p-1.5 rounded-lg hover:bg-muted transition-colors">
//                                                 {selectedComp.isVisible ? <Eye className="h-3.5 w-3.5"/> :
//                                                     <EyeOff className="h-3.5 w-3.5 text-muted-foreground"/>}
//                                             </button>
//                                             <button onClick={() => dup(selectedComp.instanceId)} title="Duplicate"
//                                                     className="p-1.5 rounded-lg hover:bg-muted transition-colors">
//                                                 <Copy className="h-3.5 w-3.5"/>
//                                             </button>
//                                             <button onClick={() => setRightPanel("animation")} title="Animate"
//                                                     className="p-1.5 rounded-lg hover:bg-muted transition-colors">
//                                                 <Sparkles className="h-3.5 w-3.5"/>
//                                             </button>
//                                             <button onClick={() => exportCompJSON(selectedComp)} title="Export JSON"
//                                                     className="p-1.5 rounded-lg hover:bg-muted transition-colors">
//                                                 <Download className="h-3.5 w-3.5"/>
//                                             </button>
//                                             <button onClick={() => delComp(selectedComp.instanceId)} title="Delete"
//                                                     className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
//                                                 <Trash2 className="h-3.5 w-3.5"/>
//                                             </button>
//                                         </div>
//                                     }
//                                 />
//
//                                 <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
//                                     {(selectedComp.propsSchema ?? []).length === 0 ? (
//                                         <div className="text-center py-8">
//                                             <Settings className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2"/>
//                                             <p className="text-xs text-muted-foreground">No editable props for this
//                                                 component.</p>
//                                         </div>
//                                     ) : (() => {
//                                         const groups: Record<string, PropSchema[]> = {};
//                                         for (const p of (selectedComp.propsSchema ?? [])) {
//                                             const g = p.group ?? "Content";
//                                             if (!groups[g]) groups[g] = [];
//                                             groups[g].push(p);
//                                         }
//                                         return Object.entries(groups).map(([g, props]) => (
//                                             <div key={g}>
//                                                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
//                                                     <ChevronRight className="h-3 w-3"/>{g}
//                                                 </p>
//                                                 <div className="space-y-3 pl-0.5">
//                                                     {props.map(prop => (
//                                                         <PropField key={prop.key} schema={prop}
//                                                                    value={(selectedComp.propValues ?? {})[prop.key] ?? prop.defaultValue}
//                                                                    onChange={v => updateProp(prop.key, v)}/>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         ));
//                                     })()}
//                                 </div>
//                             </div>
//                         )}
//
//                         {/* Props panel but no component selected — show prompt */}
//                         {rightPanel === "props" && !selectedComp && (
//                             <div className="flex flex-col h-full">
//                                 <PanelHeader title="Properties" onClose={() => setRightPanel(null)}
//                                              icon={<Settings className="h-4 w-4 text-muted-foreground"/>}/>
//                                 <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
//                                     <Layers className="h-10 w-10 text-muted-foreground/20 mb-3"/>
//                                     <p className="text-sm font-medium text-muted-foreground">No component selected</p>
//                                     <p className="text-xs text-muted-foreground/60 mt-1">Click a component in the canvas
//                                         or layers bar to edit its properties.</p>
//                                 </div>
//                             </div>
//                         )}
//
//                         {rightPanel === "theme" && (
//                             <ThemeEditor theme={site.theme} onChange={handleThemeChange} onSave={handleThemeSave}
//                                          onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "pages" && (
//                             <PageManager pages={site.pages.map(p => ({...p, componentCount: p.components.length}))}
//                                          activePageId={activePageId}
//                                          onSelect={id => {
//                                              setActivePageId(id);
//                                              setRightPanel(null);
//                                          }}
//                                          onAdd={handleAddPage} onRename={handleRenamePage}
//                                          onDelete={handleDeletePage} onToggleNav={handleToggleNav}
//                                          onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "global" && (
//                             <GlobalSections navbar={{
//                                 ...site.navbar,
//                                 style: site.navbar.style as "sticky" | "static" | "floating" | "sidebar"
//                             }}
//                                             footer={site.footer} library={library}
//                                             onSave={handleSaveGlobal} onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "seo" && activePage && (
//                             <SEOPanel page={activePage} onSave={handleSaveSEO} onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "export" && (
//                             <ExportPanel site={site} activePage={activePage} onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "og" && activePage && (
//                             <OGPreviewEditor page={activePage} siteName={site.siteName}
//                                              onSave={async (seo) => {
//                                                  await handleSaveSEO(seo, activePage.customCSS ?? "");
//                                              }}
//                                              onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "magic" && (
//                             <div className="flex flex-col h-full">
//                                 <PanelHeader title="Magic AI" onClose={() => setRightPanel(null)}
//                                              icon={<Wand2 className="h-4 w-4 text-purple-500"/>}/>
//                                 <div className="flex-1 overflow-y-auto">
//                                     <MagicAIPanel siteType={site.siteType} pageSlug={activePage?.slug ?? "/"}
//                                                   existingComponentKeys={components.map(c => c.componentKey)}
//                                                   onAddComponents={(comps) => {
//                                                       for (const ai of comps) {
//                                                           const lc = library.find(l => l.key === ai.componentKey);
//                                                           if (lc) addComp({
//                                                               ...lc,
//                                                               defaultProps: {...lc.defaultProps, ...ai.propValues}
//                                                           });
//                                                       }
//                                                   }}/>
//                                     <VibeCheckPanel siteType={site.siteType}
//                                                     onApplied={(updatedSite) => {
//                                                         setSite(updatedSite as typeof site);
//                                                         setRightPanel(null);
//                                                     }}
//                                                     onClose={() => setRightPanel(null)}/>
//                                 </div>
//                             </div>
//                         )}
//                         {rightPanel === "clone" && (
//                             <div className="flex flex-col h-full">
//                                 <PanelHeader title="Clone a URL" subtitle="Recreate any site's structure"
//                                              onClose={() => setRightPanel(null)}
//                                              icon={<Link2 className="h-4 w-4 text-indigo-500"/>}/>
//                                 <div className="p-4 space-y-3">
//                                     <input type="url" value={cloneUrl} onChange={e => {
//                                         setCloneUrl(e.target.value);
//                                         setCloneError("");
//                                     }}
//                                            placeholder="https://example.com"
//                                            className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                                            onKeyDown={e => e.key === "Enter" && handleClone()}/>
//                                     {cloneError &&
//                                         <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle
//                                             className="h-3 w-3 shrink-0"/>{cloneError}</p>}
//                                     <Button onClick={handleClone} disabled={!cloneUrl.trim() || cloneLoading}
//                                             isLoading={cloneLoading} className="w-full gap-2" size="sm"
//                                             variant="gradient">
//                                         {!cloneLoading && <Wand2
//                                             className="h-3.5 w-3.5"/>}{cloneLoading ? "Analyzing…" : "Clone Structure"}
//                                     </Button>
//                                     <p className="text-xs text-muted-foreground leading-relaxed">AI analyzes the page
//                                         and adds matching components. Images are not copied.</p>
//                                 </div>
//                             </div>
//                         )}
//                         {rightPanel === "assets" && (
//                             <AssetLibrary onSelect={(url) => {
//                                 navigator.clipboard?.writeText(url).catch(() => null);
//                                 setRightPanel(null);
//                             }}
//                                           onClose={() => setRightPanel(null)}/>
//                         )}
//                         {rightPanel === "animation" && selectedInstanceId && (
//                             <AnimationStudio instanceId={selectedInstanceId}
//                                              currentPreset={components.find(c => c.instanceId === selectedInstanceId)?.animationPreset ?? ""}
//                                              onApply={(preset) => {
//                                                  updateComp(selectedInstanceId, {animationPreset: preset});
//                                                  setRightPanel("props");
//                                              }}
//                                              onClose={() => setRightPanel("props")}/>
//                         )}
//                     </div>
//                 )}
//             </div>
//
//             {/* ── Mobile issues panel ──────────────────────────────────────────── */}
//             {showMobilePanel && (
//                 <div
//                     className="fixed bottom-4 right-4 z-50 w-80 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
//                     <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
//                         <div className="flex items-center gap-2">
//                             <Smartphone className="h-4 w-4"/>
//                             <p className="font-semibold text-sm">Mobile Check</p>
//                             {mobileIssues.length === 0
//                                 ? <span
//                                     className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">All clear!</span>
//                                 : <span
//                                     className="text-xs text-amber-600 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">{mobileIssues.length} issue{mobileIssues.length > 1 ? "s" : ""}</span>}
//                         </div>
//                         <button onClick={() => setShowMobilePanel(false)} className="p-1 rounded-lg hover:bg-muted"><X
//                             className="h-3.5 w-3.5"/></button>
//                     </div>
//                     <div className="max-h-64 overflow-y-auto">
//                         {mobileIssues.length === 0
//                             ? <div className="px-4 py-6 text-center"><Check
//                                 className="h-8 w-8 text-emerald-500 mx-auto mb-2"/><p
//                                 className="text-sm text-muted-foreground">No mobile issues found.</p></div>
//                             : mobileIssues.map((issue, i) => (
//                                 <div key={i} className="px-4 py-3 border-b last:border-0">
//                                     <div className="flex items-center gap-1.5 mb-1">
//                                         <AlertTriangle
//                                             className={cn("h-3.5 w-3.5 shrink-0", issue.severity === "error" ? "text-red-500" : "text-amber-500")}/>
//                                         <p className="text-xs font-semibold">{issue.componentName}</p>
//                                     </div>
//                                     <p className="text-xs text-muted-foreground">{issue.issue}</p>
//                                 </div>
//                             ))
//                         }
//                     </div>
//                 </div>
//             )}
//
//             {/* ── AI Build modal ───────────────────────────────────────────────── */}
//             {showAI && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//                     <div
//                         className="bg-card rounded-2xl border shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-3">
//                                 <div
//                                     className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
//                                     <Sparkles className="h-5 w-5 text-white"/>
//                                 </div>
//                                 <div>
//                                     <p className="font-bold">AI Builder</p>
//                                     <p className="text-xs text-muted-foreground">Describe what you want to build</p>
//                                 </div>
//                             </div>
//                             <button onClick={() => setShowAI(false)} className="p-1.5 rounded-lg hover:bg-muted"><X
//                                 className="h-4 w-4"/></button>
//                         </div>
//                         <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} autoFocus
//                                   placeholder={`e.g. "A hero with bold headline, 3 feature cards below, and a contact form at the bottom"`}
//                                   className="w-full rounded-xl border bg-muted/30 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
//                                   onKeyDown={e => e.key === "Enter" && e.metaKey && runAI()}/>
//                         {aiError &&
//                             <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
//                                 <AlertTriangle className="h-4 w-4 shrink-0"/>{aiError}</p>}
//                         <div className="flex items-center justify-between">
//                             <label
//                                 className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
//                                 <div
//                                     className={cn("relative w-8 h-4 rounded-full transition-colors", aiClearCanvas ? "bg-indigo-500" : "bg-muted-foreground/30")}>
//                                     <div
//                                         className={cn("absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform", aiClearCanvas ? "translate-x-4" : "")}/>
//                                     <input type="checkbox" checked={aiClearCanvas}
//                                            onChange={e => setAiClearCanvas(e.target.checked)} className="sr-only"/>
//                                 </div>
//                                 Clear canvas &amp; rebuild
//                             </label>
//                             <div className="flex gap-2">
//                                 <Button variant="outline" onClick={() => setShowAI(false)}>Cancel</Button>
//                                 <Button variant="gradient" className="gap-2" onClick={() => runAI(aiClearCanvas)}
//                                         disabled={!aiPrompt.trim() || aiLoading}>
//                                     {aiLoading ? <Loader2 className="h-4 w-4 animate-spin"/> :
//                                         <Send className="h-4 w-4"/>}
//                                     {aiLoading ? "Building…" : "Generate"}
//                                 </Button>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
