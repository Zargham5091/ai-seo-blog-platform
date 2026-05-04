"use client";
/**
 * app/(dashboard)/dashboard/admin/site/page.tsx
 * FULLY WIRED builder — ThemeEditor, PageManager, GlobalSections,
 * duplicate, mobile-check, version-history, SEO panel, export, AI, publish.
 */

import {useCallback, useEffect, useRef, useState} from "react";
import {
    Laptop, Tablet, Smartphone, Globe, Sparkles, Plus, Eye,
    Layers, Trash2, EyeOff, Undo, Redo, Save,
    Send, X, Search, Settings, Layout, Navigation, PanelBottom,
    Puzzle, Code, Loader2, Check, Palette,
    Copy, Download, Upload, FileText, AlertTriangle,
    ChevronLeft, Menu,
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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type DevicePreview = "desktop" | "tablet" | "mobile";
type RightPanel = "props" | "theme" | "pages" | "global" | "seo" | "export" | null;
type ComponentCategory =
    "navbar"
    | "hero"
    | "section"
    | "footer"
    | "layout"
    | "widget"
    | "animation"
    | "template"
    | "integration";

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
        componentKey?: string;
        style: string;
        isTransparent: boolean;
        links: { label: string; href: string; order: number }[];
        ctaLabel?: string;
        ctaHref?: string;
        showThemeToggle: boolean
    };
    footer: {
        componentKey?: string;
        isEnabled: boolean;
        columns: { heading: string; links: { label: string; href: string }[] }[];
        bottomText: string;
        socialLinks: { platform: string; url: string }[]
    };
    pages: UserPage[];
    builderState: { activePageId?: string; devicePreview: DevicePreview; zoom: number; aiSuggestionsEnabled: boolean };
    isPublished: boolean;
    publishedAt?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEVICE_WIDTHS: Record<DevicePreview, string> = {desktop: "100%", tablet: "768px", mobile: "390px"};
const CAT_ICONS: Record<string, React.ElementType> = {
    navbar: Navigation,
    hero: Layers,
    section: Layout,
    footer: PanelBottom,
    layout: Layout,
    widget: Puzzle,
    animation: Sparkles,
    template: Code,
    integration: Settings
};
const SITE_TYPES = [{type: "blog", emoji: "✍️", label: "Blog"}, {
    type: "portfolio",
    emoji: "🎨",
    label: "Portfolio"
}, {type: "saas", emoji: "🚀", label: "SaaS"}, {type: "ecommerce", emoji: "🛍️", label: "Shop"}, {
    type: "restaurant",
    emoji: "🍽️",
    label: "Restaurant"
}, {type: "agency", emoji: "💼", label: "Agency"}];
const CATS = ["all", "navbar", "hero", "section", "footer", "widget", "animation", "layout", "integration"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Prop Field
// ─────────────────────────────────────────────────────────────────────────────

function PropField({schema, value, onChange}: { schema: PropSchema; value: unknown; onChange: (v: unknown) => void }) {
    const s = String(value ?? "");
    if (schema.type === "boolean") return <label className="flex items-center gap-2 cursor-pointer py-1"><input
        type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)}
        className="rounded h-4 w-4"/><span className="text-sm">{schema.label}</span></label>;
    if (schema.type === "color") return <div className="space-y-1"><Label className="text-xs">{schema.label}</Label>
        <div className="flex gap-2"><input type="color" value={s || "#4F46E5"} onChange={e => onChange(e.target.value)}
                                           className="h-8 w-12 rounded border cursor-pointer"/><Input value={s}
                                                                                                      onChange={e => onChange(e.target.value)}
                                                                                                      className="h-8 text-xs font-mono flex-1"/>
        </div>
    </div>;
    if (schema.type === "select") return <div className="space-y-1"><Label
        className="text-xs">{schema.label}</Label><select value={s} onChange={e => onChange(e.target.value)}
                                                          className="w-full h-8 rounded-md border bg-background px-2 text-sm">{(schema.options ?? []).map(o =>
        <option key={o} value={o}>{o}</option>)}</select></div>;
    if (schema.type === "textarea" || schema.type === "richtext") return <div className="space-y-1"><Label
        className="text-xs">{schema.label}</Label><textarea value={s} onChange={e => onChange(e.target.value)} rows={3}
                                                            placeholder={schema.placeholder}
                                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
    </div>;
    if (schema.type === "array") {
        const arr = Array.isArray(value) ? value as Record<string, unknown>[] : [];
        return <div className="space-y-2"><Label className="text-xs">{schema.label}</Label>{arr.map((item, idx) => <div
            key={idx} className="border rounded-lg p-2 space-y-1.5 bg-muted/30">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Item {idx + 1}</span>
                <button onClick={() => onChange(arr.filter((_, i) => i !== idx))} className="text-red-400"><X
                    className="h-3 w-3"/></button>
            </div>
            {(schema.arrayItemSchema ?? []).map(sub => <PropField key={sub.key} schema={sub} value={item[sub.key]}
                                                                  onChange={v => {
                                                                      const u = [...arr];
                                                                      u[idx] = {...item, [sub.key]: v};
                                                                      onChange(u);
                                                                  }}/>)}</div>)}
            <button onClick={() => {
                const ni: Record<string, unknown> = {};
                (schema.arrayItemSchema ?? []).forEach(s => {
                    ni[s.key] = s.defaultValue ?? ""
                });
                onChange([...arr, ni]);
            }}
                    className="w-full border border-dashed rounded-lg py-2 text-xs text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center gap-1">
                <Plus className="h-3 w-3"/>Add {schema.label} Item
            </button>
        </div>;
    }
    return <div className="space-y-1"><Label className="text-xs">{schema.label}{schema.required &&
        <span className="text-red-400 ml-0.5">*</span>}</Label><Input
        type={schema.type === "number" ? "number" : "text"} value={s}
        onChange={e => onChange(schema.type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={schema.placeholder} className="h-8 text-sm"/></div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO Panel
// ─────────────────────────────────────────────────────────────────────────────

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
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div><p className="font-semibold text-sm">SEO Settings</p><p
                    className="text-xs text-muted-foreground">{page.title}</p></div>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Meta Title <span
                        className={`font-normal ${tl > 60 ? "text-red-400" : tl > 50 ? "text-amber-400" : "text-muted-foreground"}`}>{tl}/60</span></Label>
                    <Input value={seo.metaTitle ?? ""} onChange={e => setSeo({...seo, metaTitle: e.target.value})}
                           placeholder="Page title for search engines" className="h-9"/>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Meta Description <span
                        className={`font-normal ${dl > 160 ? "text-red-400" : dl > 140 ? "text-amber-400" : "text-muted-foreground"}`}>{dl}/160</span></Label>
                    <textarea value={seo.metaDescription ?? ""}
                              onChange={e => setSeo({...seo, metaDescription: e.target.value})} rows={3}
                              placeholder="Brief description for search results"
                              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">OG Image URL</Label>
                    <Input value={seo.ogImage ?? ""} onChange={e => setSeo({...seo, ogImage: e.target.value})}
                           placeholder="https://... (1200×630px)"/>
                    {seo.ogImage && <img src={seo.ogImage} alt="OG preview"
                                         className="w-full rounded-lg border object-cover h-28"/>}
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Canonical URL <span
                        className="font-normal text-muted-foreground">(optional)</span></Label>
                    <Input value={seo.canonicalUrl ?? ""} onChange={e => setSeo({...seo, canonicalUrl: e.target.value})}
                           placeholder="https://yourdomain.com/page"/>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={seo.noIndex ?? false}
                           onChange={e => setSeo({...seo, noIndex: e.target.checked})} className="rounded h-4 w-4"/>
                    <div><p className="text-sm font-medium">No Index</p><p
                        className="text-xs text-muted-foreground">Hide from search engines</p></div>
                </label>
                <div className="rounded-xl border p-4 bg-muted/30">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Google
                        Preview</p>
                    <p className="text-blue-600 text-base font-medium truncate">{seo.metaTitle || page.title || "Page Title"}</p>
                    <p className="text-green-700 text-xs">yourdomain.com{page.slug}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{seo.metaDescription || "Add a description to improve click-through rate."}</p>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Custom CSS <span
                        className="font-normal text-muted-foreground">(this page only)</span></Label>
                    <textarea value={css} onChange={e => setCss(e.target.value)} rows={4}
                              placeholder="/* Page-specific styles */"
                              className="w-full rounded-md border bg-zinc-950 text-sky-300 font-mono px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"/>
                </div>
            </div>
            <div className="border-t px-4 py-3 shrink-0">
                <Button variant="gradient" className="w-full gap-2" onClick={() => onSave(seo, css)}><Check
                    className="h-4 w-4"/>Save SEO</Button>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export Panel
// ─────────────────────────────────────────────────────────────────────────────

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
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <p className="font-semibold text-sm">Export</p>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>
            <div className="flex-1 px-4 py-4 space-y-3">
                <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-indigo-500"/>
                        <div><p className="font-semibold text-sm">Current Page</p><p
                            className="text-xs text-muted-foreground">{activePage?.title} → .html</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => doExport("page")}
                            isLoading={exp === "page"} disabled={!activePage}><Download className="h-4 w-4"/>Download
                        HTML</Button>
                </div>
                <div className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center gap-2"><Download className="h-5 w-5 text-purple-500"/>
                        <div><p className="font-semibold text-sm">Full Site ZIP</p><p
                            className="text-xs text-muted-foreground">{site.pages.length} pages bundled</p></div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => doExport("site")}
                            isLoading={exp === "site"}><Download className="h-4 w-4"/>Download ZIP</Button>
                </div>
                <p className="text-xs text-muted-foreground text-center px-2">Host on Netlify, Vercel, GitHub Pages, or
                    any static host — no server needed.</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding
// ─────────────────────────────────────────────────────────────────────────────

function SiteTypeOnboarding({onSelect}: { onSelect: (type: string, name: string) => void }) {
    const [sel, setSel] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <span
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4"><Sparkles
                        className="h-3.5 w-3.5"/>Website Builder</span>
                    <h1 className="text-4xl font-bold mb-3">What are you building?</h1>
                    <p className="text-muted-foreground text-lg">Pick a starting point — change anything later.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                    {SITE_TYPES.map(o => (
                        <button key={o.type} onClick={() => setSel(o.type)}
                                className={`relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${sel === o.type ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40" : "border-border bg-card hover:border-indigo-200"}`}>
                            {sel === o.type && <div
                                className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white"/></div>}
                            <span className="text-3xl mb-3">{o.emoji}</span>
                            <p className="font-semibold text-sm">{o.label}</p>
                        </button>
                    ))}
                </div>
                {sel && (
                    <div className="bg-card rounded-2xl border p-6 flex gap-3">
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name your site..."
                               className="flex-1 text-base" autoFocus
                               onKeyDown={e => e.key === "Enter" && name.trim() && (setLoading(true), onSelect(sel, name.trim()))}/>
                        <Button variant="gradient" onClick={() => {
                            if (!name.trim()) return;
                            setLoading(true);
                            onSelect(sel, name.trim());
                        }} disabled={!name.trim() || loading} className="gap-2 px-6">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                <Sparkles className="h-4 w-4"/>}{loading ? "Building..." : "Start"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Builder
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteBuilderPage() {
    useSession();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const undoStack = useRef<CanvasComponent[][]>([]);
    const redoStack = useRef<CanvasComponent[][]>([]);

    const [site, setSite] = useState<UserSite | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
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

    // Load
    useEffect(() => {
        Promise.all([fetch("/api/site").then(r => r.json()), fetch("/api/plan-components").then(r => r.json())]).then(([s, l]) => {
            if (s.success && s.data) {
                setSite(s.data);
                setActivePageId(s.data.builderState?.activePageId ?? s.data.pages[0]?.pageId ?? null);
                setDevicePreview(s.data.builderState?.devicePreview ?? "desktop");
            } else setShowOnboarding(true);
            if (l.success) setLibrary(l.data);
            setIsLoading(false);
        });
    }, []);

    // iframe messages
    useEffect(() => {
        const h = (e: MessageEvent) => {
            if (e.data?.type === "COMPONENT_SELECTED") {
                setSelectedInstanceId(e.data.instanceId);
                setRightPanel("props");
            } else if (e.data?.type === "COMPONENT_DESELECTED") {
                setSelectedInstanceId(null);
                if (rightPanel === "props") setRightPanel(null);
            }
        };
        window.addEventListener("message", h);
        return () => window.removeEventListener("message", h);
    }, [rightPanel]);

    // Derived
    const activePage = site?.pages.find(p => p.pageId === activePageId) ?? null;
    const components = (activePage?.components ?? []).slice().sort((a, b) => a.order - b.order);
    const selectedComp = components.find(c => c.instanceId === selectedInstanceId) ?? null;
    const filteredLib = library.filter(c => (libCat === "all" || c.category === libCat) && (!libSearch || c.name.toLowerCase().includes(libSearch.toLowerCase())));

    // Rebuild iframe
    useEffect(() => {
        if (!site || !activePage || !iframeRef.current) return;
        const html = buildIframeDocument({
            components: components.filter(c => c.isVisible).map(c => ({
                instanceId: c.instanceId,
                htmlTemplate: c.htmlTemplate,
                cssCode: c.cssCode,
                jsCode: c.jsCode,
                propValues: c.propValues
            })),
            globalTheme: site.theme, globalCSS: site.globalCSS + (activePage.customCSS ?? ""),
        });
        const d = iframeRef.current.contentDocument;
        if (!d) return;
        d.open();
        d.write(html);
        d.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [components, site?.theme, site?.globalCSS, activePage?.customCSS, activePageId]);

    const updateComps = useCallback((c: CanvasComponent[]) => {
        setSite(prev => prev ? {
            ...prev,
            pages: prev.pages.map(p => p.pageId === activePageId ? {...p, components: c} : p)
        } : prev);
    }, [activePageId]);

    const addComp = (lc: LibraryComponent) => {
        undoStack.current.push([...components]);
        redoStack.current = [];
        updateComps([...components, {
            instanceId: uuid(),
            componentKey: lc.key,
            componentId: lc._id,
            name: lc.name,
            category: lc.category,
            htmlTemplate: lc.htmlTemplate,
            cssCode: lc.cssCode,
            jsCode: lc.jsCode,
            propsSchema: lc.propsSchema,
            propValues: {...lc.defaultProps},
            isVisible: true,
            isLocked: false,
            order: components.length
        }]);
    };

    const updateProp = useCallback((key: string, val: unknown) => {
        if (!selectedInstanceId) return;
        setSite(prev => prev ? {
            ...prev,
            pages: prev.pages.map(p => p.pageId !== activePageId ? p : {
                ...p,
                components: p.components.map(c => c.instanceId !== selectedInstanceId ? c : {
                    ...c,
                    propValues: {...c.propValues, [key]: val}
                })
            })
        } : prev);
    }, [selectedInstanceId, activePageId]);

    const delComp = (id: string) => {
        undoStack.current.push([...components]);
        redoStack.current = [];
        updateComps(components.filter(c => c.instanceId !== id).map((c, i) => ({...c, order: i})));
        setSelectedInstanceId(null);
        setRightPanel(null);
    };
    const toggleVis = (id: string) => setSite(prev => prev ? {
        ...prev,
        pages: prev.pages.map(p => p.pageId !== activePageId ? p : {
            ...p,
            components: p.components.map(c => c.instanceId !== id ? c : {...c, isVisible: !c.isVisible})
        })
    } : prev);
    const moveComp = (id: string, dir: -1 | 1) => {
        const idx = components.findIndex(c => c.instanceId === id);
        if (idx < 0) return;
        const t = idx + dir;
        if (t < 0 || t >= components.length) return;
        undoStack.current.push([...components]);
        const r = [...components];
        [r[idx], r[t]] = [r[t], r[idx]];
        updateComps(r.map((c, i) => ({...c, order: i})));
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

    const save = async (silent = false) => {
        if (!activePageId || !site) return;
        if (!silent) setIsSaving(true);
        await fetch(`/api/site/page/${activePageId}/components`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({components})
        });
        if (!silent) {
            setIsSaving(false);
            setSaveMsg("Saved!");
            setTimeout(() => setSaveMsg(""), 2000);
        }
    };

    const publish = async () => {
        await save(true);
        setIsPublishing(true);
        const d = await fetch("/api/site/publish", {method: "POST"}).then(r => r.json());
        if (d.success) setSite(prev => prev ? {...prev, isPublished: true} : prev);
        setIsPublishing(false);
    };

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

    const runAI = async () => {
        if (!aiPrompt.trim() || !site) return;
        setAiLoading(true);
        setAiError("");
        try {
            const d = await fetch("/api/builder/ai", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    prompt: aiPrompt,
                    siteType: site.siteType,
                    pageSlug: activePage?.slug ?? "/",
                    existingComponentKeys: components.map(c => c.componentKey)
                })
            }).then(r => r.json());
            if (!d.success) {
                setAiError(d.error);
                return;
            }
            const add: CanvasComponent[] = [];
            for (const ai of d.data) {
                const lc = library.find(l => l.key === ai.componentKey);
                if (!lc) continue;
                add.push({
                    instanceId: uuid(),
                    componentKey: lc.key,
                    componentId: lc._id,
                    name: lc.name,
                    category: lc.category,
                    htmlTemplate: lc.htmlTemplate,
                    cssCode: lc.cssCode,
                    jsCode: lc.jsCode,
                    propsSchema: lc.propsSchema,
                    propValues: {...lc.defaultProps, ...ai.propValues},
                    isVisible: true,
                    isLocked: false,
                    order: components.length + add.length
                });
            }
            undoStack.current.push([...components]);
            updateComps([...components, ...add]);
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
                alert(`Component "${d.componentKey}" not in library.`);
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
        }
    };

    if (isLoading) return <div className="flex items-center justify-center h-[80vh]"><Loader2
        className="h-8 w-8 animate-spin text-indigo-500"/></div>;
    if (showOnboarding) return <SiteTypeOnboarding onSelect={handleOnboarding}/>;
    if (!site) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">

            {/* Top bar */}
            <div className="flex items-center gap-2 px-3 h-12 border-b bg-card shrink-0 z-20">
                <button onClick={() => setLeftOpen(v => !v)} className="p-1.5 rounded hover:bg-muted"><Menu
                    className="h-4 w-4"/></button>
                <div className="flex items-center gap-0.5 overflow-x-auto max-w-xs">
                    {site.pages.map(p => (
                        <button key={p.pageId} onClick={() => {
                            setActivePageId(p.pageId);
                            setSelectedInstanceId(null);
                            setRightPanel(null);
                        }}
                                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap ${activePageId === p.pageId ? "bg-indigo-600 text-white" : "text-muted-foreground hover:bg-muted"}`}>{p.title}</button>
                    ))}
                    <button onClick={() => setRightPanel("pages")}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"><Plus className="h-3.5 w-3.5"/>
                    </button>
                </div>
                <div className="ml-auto flex items-center gap-1">
                    <div className="flex border rounded-lg overflow-hidden">
                        {(["desktop", "tablet", "mobile"] as DevicePreview[]).map(d => {
                            const I = d === "desktop" ? Laptop : d === "tablet" ? Tablet : Smartphone;
                            return <button key={d} onClick={() => setDevicePreview(d)}
                                           className={`p-1.5 ${devicePreview === d ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}>
                                <I className="h-3.5 w-3.5"/></button>;
                        })}
                    </div>
                    <div className="flex border rounded-lg overflow-hidden">
                        <button onClick={() => setZoom(z => Math.max(50, z - 10))}
                                className="px-2 py-1.5 hover:bg-muted text-xs">−
                        </button>
                        <span className="px-2 text-xs font-mono flex items-center">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(150, z + 10))}
                                className="px-2 py-1.5 hover:bg-muted text-xs">+
                        </button>
                    </div>
                    <button onClick={undo} disabled={!undoStack.current.length}
                            className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><Undo className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={redo} disabled={!redoStack.current.length}
                            className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><Redo className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={() => setRightPanel(p => p === "theme" ? null : "theme")}
                            className={`p-1.5 rounded ${rightPanel === "theme" ? "bg-indigo-100 text-indigo-600" : "hover:bg-muted"}`}
                            title="Theme"><Palette className="h-3.5 w-3.5"/></button>
                    <button onClick={() => setRightPanel(p => p === "global" ? null : "global")}
                            className={`p-1.5 rounded ${rightPanel === "global" ? "bg-indigo-100 text-indigo-600" : "hover:bg-muted"}`}
                            title="Navbar & Footer"><Navigation className="h-3.5 w-3.5"/></button>
                    <button onClick={() => setRightPanel(p => p === "seo" ? null : "seo")}
                            className={`p-1.5 rounded ${rightPanel === "seo" ? "bg-indigo-100 text-indigo-600" : "hover:bg-muted"}`}
                            title="SEO"><FileText className="h-3.5 w-3.5"/></button>
                    <button onClick={() => setRightPanel(p => p === "export" ? null : "export")}
                            className={`p-1.5 rounded ${rightPanel === "export" ? "bg-indigo-100 text-indigo-600" : "hover:bg-muted"}`}
                            title="Export"><Download className="h-3.5 w-3.5"/></button>
                    <button onClick={runMobileCheck} disabled={checkingMobile}
                            className={`p-1.5 rounded ${mobileIssues.length > 0 ? "text-amber-500" : "hover:bg-muted"}`}
                            title="Mobile check">
                        {checkingMobile ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> :
                            <Smartphone className="h-3.5 w-3.5"/>}
                        {mobileIssues.length > 0 &&
                            <span className="text-xs font-bold ml-0.5">{mobileIssues.length}</span>}
                    </button>
                    <label className="p-1.5 rounded hover:bg-muted cursor-pointer" title="Import component JSON"><Upload
                        className="h-3.5 w-3.5"/><input type="file" accept=".json" className="hidden"
                                                        onChange={importCompJSON}/></label>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAI(true)}><Sparkles
                        className="h-3.5 w-3.5 text-purple-500"/>AI</Button>
                    {saveMsg ? <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check
                            className="h-3.5 w-3.5"/>{saveMsg}</span> :
                        <Button size="sm" variant="outline" onClick={() => save()} isLoading={isSaving}
                                className="gap-1.5 h-8 text-xs"><Save className="h-3.5 w-3.5"/>Save</Button>}
                    <Button size="sm" variant="gradient" onClick={publish} isLoading={isPublishing}
                            className="gap-1.5 h-8 text-xs"><Globe
                        className="h-3.5 w-3.5"/>{site.isPublished ? "Re-publish" : "Publish"}</Button>
                </div>
            </div>

            {/* Main */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left panel */}
                <div
                    className={`border-r bg-card flex flex-col transition-all duration-200 shrink-0 ${leftOpen ? "w-56" : "w-0 overflow-hidden"}`}>
                    <div className="px-2 py-2 border-b shrink-0 flex items-center gap-1.5">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                        <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Search..."
                               className="flex-1 h-7 bg-transparent text-xs focus:outline-none"/>
                    </div>
                    <div className="flex gap-0.5 px-1 py-1 border-b overflow-x-auto shrink-0">
                        {CATS.map(cat => {
                            const I = cat === "all" ? Layers : CAT_ICONS[cat] ?? Layers;
                            return <button key={cat} onClick={() => setLibCat(cat)} title={cat}
                                           className={`p-1.5 rounded shrink-0 ${libCat === cat ? "bg-indigo-600 text-white" : "hover:bg-muted text-muted-foreground"}`}>
                                <I className="h-3.5 w-3.5"/></button>;
                        })}
                    </div>
                    <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                        {filteredLib.map(comp => {
                            const I = CAT_ICONS[comp.category] ?? Layers;
                            return (
                                <button key={comp._id} onClick={() => addComp(comp)}
                                        className="w-full text-left rounded-lg border hover:border-indigo-300 transition-all overflow-hidden group bg-background">
                                    {comp.previewImage ? <img src={comp.previewImage} alt={comp.name}
                                                              className="w-full h-14 object-cover"/> : <div
                                        className="w-full h-12 flex items-center justify-center bg-muted/50 group-hover:bg-indigo-50">
                                        <I className="h-5 w-5 text-muted-foreground/40"/></div>}
                                    <div className="px-2 py-1"><p
                                        className="font-medium text-xs truncate">{comp.name}</p><p
                                        className="text-xs text-muted-foreground capitalize">{comp.category}</p></div>
                                </button>
                            );
                        })}
                        {filteredLib.length === 0 &&
                            <p className="text-xs text-muted-foreground text-center py-6">No components found.</p>}
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 flex items-start justify-center p-6">
                    <div className="bg-white shadow-2xl rounded-lg overflow-hidden relative" style={{
                        width: DEVICE_WIDTHS[devicePreview],
                        minHeight: 600,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "top center"
                    }}>
                        <iframe ref={iframeRef} className="w-full border-0" style={{height: "100%", minHeight: 600}}
                                title="Preview" sandbox="allow-scripts allow-same-origin"/>
                        {components.length === 0 && <div
                            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                            <Layers className="h-12 w-12 text-muted-foreground/20 mb-4"/><p
                            className="font-semibold text-muted-foreground">Canvas is empty</p><p
                            className="text-sm text-muted-foreground/60 mt-1">Add components from the left or use AI
                            Build</p></div>}
                    </div>
                </div>

                {/* Layers strip */}
                {components.length > 0 && rightPanel !== "props" && (
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t z-10 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto">
                        {components.map((c, idx) => {
                            const I = CAT_ICONS[c.category] ?? Layers;
                            return (
                                <div key={c.instanceId} className="flex items-center gap-0.5 shrink-0">
                                    <button onClick={() => {
                                        setSelectedInstanceId(c.instanceId);
                                        setRightPanel("props");
                                    }}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap border ${selectedInstanceId === c.instanceId ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-muted border-transparent"} ${!c.isVisible ? "opacity-40" : ""}`}>
                                        <I className="h-3 w-3"/>{c.name}{!c.isVisible &&
                                        <EyeOff className="h-2.5 w-2.5"/>}
                                    </button>
                                    <div className="flex flex-col">
                                        <button onClick={() => moveComp(c.instanceId, -1)} disabled={idx === 0}
                                                className="h-3 w-3 flex items-center justify-center disabled:opacity-20">
                                            <ChevronLeft className="h-2.5 w-2.5 rotate-90"/></button>
                                        <button onClick={() => moveComp(c.instanceId, 1)}
                                                disabled={idx === components.length - 1}
                                                className="h-3 w-3 flex items-center justify-center disabled:opacity-20">
                                            <ChevronLeft className="h-2.5 w-2.5 -rotate-90"/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Right panel */}
                {rightPanel && (
                    <div className="w-72 border-l bg-card flex flex-col shrink-0 overflow-hidden">
                        {rightPanel === "props" && selectedComp && (
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                                    <div><p className="font-semibold text-sm">{selectedComp.name}</p><p
                                        className="text-xs text-muted-foreground capitalize">{selectedComp.category}</p>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <button onClick={() => toggleVis(selectedComp.instanceId)}
                                                className="p-1.5 rounded hover:bg-muted">{selectedComp.isVisible ?
                                            <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}</button>
                                        <button onClick={() => dup(selectedComp.instanceId)}
                                                className="p-1.5 rounded hover:bg-muted" title="Duplicate"><Copy
                                            className="h-4 w-4"/></button>
                                        <button onClick={() => exportCompJSON(selectedComp)}
                                                className="p-1.5 rounded hover:bg-muted" title="Export JSON"><Download
                                            className="h-4 w-4"/></button>
                                        <button onClick={() => delComp(selectedComp.instanceId)}
                                                className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                                            <Trash2 className="h-4 w-4"/></button>
                                        <button onClick={() => {
                                            setRightPanel(null);
                                            setSelectedInstanceId(null);
                                        }} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                                    {(() => {
                                        const groups: Record<string, PropSchema[]> = {};
                                        for (const p of selectedComp.propsSchema) {
                                            const g = p.group ?? "Content";
                                            if (!groups[g]) groups[g] = [];
                                            groups[g].push(p);
                                        }
                                        return Object.entries(groups).map(([g, props]) => (
                                            <div key={g}><p
                                                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{g}</p>
                                                <div className="space-y-3">{props.map(prop => <PropField key={prop.key}
                                                                                                         schema={prop}
                                                                                                         value={selectedComp.propValues[prop.key] ?? prop.defaultValue}
                                                                                                         onChange={v => updateProp(prop.key, v)}/>)}</div>
                                            </div>
                                        ));
                                    })()}
                                    {selectedComp.propsSchema.length === 0 &&
                                        <p className="text-xs text-muted-foreground text-center py-6">No editable
                                            props.</p>}
                                </div>
                            </div>
                        )}
                        {rightPanel === "theme" &&
                            <ThemeEditor theme={site.theme} onChange={handleThemeChange} onSave={handleThemeSave}
                                         onClose={() => setRightPanel(null)}/>}
                        {rightPanel === "pages" &&
                            <PageManager pages={site.pages.map(p => ({...p, componentCount: p.components.length}))}
                                         activePageId={activePageId} onSelect={id => {
                                setActivePageId(id);
                                setRightPanel(null);
                            }} onAdd={handleAddPage} onRename={handleRenamePage} onDelete={handleDeletePage}
                                         onToggleNav={handleToggleNav} onClose={() => setRightPanel(null)}/>}
                        {rightPanel === "global" &&
                            <GlobalSections navbar={{
                                ...site.navbar,
                                style: site.navbar.style as "sticky" | "static" | "floating" | "sidebar"
                            }} footer={site.footer} library={library}
                                            onSave={handleSaveGlobal} onClose={() => setRightPanel(null)}/>}
                        {rightPanel === "seo" && activePage &&
                            <SEOPanel page={activePage} onSave={handleSaveSEO} onClose={() => setRightPanel(null)}/>}
                        {rightPanel === "export" &&
                            <ExportPanel site={site} activePage={activePage} onClose={() => setRightPanel(null)}/>}
                    </div>
                )}
            </div>

            {/* Mobile issues */}
            {showMobilePanel && (
                <div className="fixed bottom-16 right-4 z-50 w-80 bg-card border rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2"><Smartphone className="h-4 w-4"/><p
                            className="font-semibold text-sm">Mobile Check</p>{mobileIssues.length === 0 ?
                            <span className="text-xs text-emerald-600 font-medium">All clear!</span> : <span
                                className="text-xs text-amber-600 font-medium">{mobileIssues.length} issue{mobileIssues.length > 1 ? "s" : ""}</span>}
                        </div>
                        <button onClick={() => setShowMobilePanel(false)} className="p-1 rounded hover:bg-muted"><X
                            className="h-3.5 w-3.5"/></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {mobileIssues.length === 0 ? <div className="px-4 py-6 text-center"><Check
                                className="h-8 w-8 text-emerald-500 mx-auto mb-2"/><p
                                className="text-sm text-muted-foreground">No issues found.</p></div>
                            : mobileIssues.map((issue, i) => (
                                <div key={i} className="px-4 py-3 border-b last:border-0">
                                    <div className="flex items-center gap-1.5 mb-1"><AlertTriangle
                                        className={`h-3.5 w-3.5 shrink-0 ${issue.severity === "error" ? "text-red-500" : "text-amber-500"}`}/>
                                        <p className="text-xs font-semibold">{issue.componentName}</p></div>
                                    <p className="text-xs text-muted-foreground">{issue.issue}</p>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* AI modal */}
            {showAI && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-purple-600"/></div>
                                <div><p className="font-bold">AI Builder</p><p
                                    className="text-xs text-muted-foreground">Cloudflare Workers AI · Free</p></div>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-1.5 rounded hover:bg-muted"><X
                                className="h-4 w-4"/></button>
                        </div>
                        <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} autoFocus
                                  placeholder='e.g. "A hero section with bold headline, 3 feature cards, and a contact form at the bottom"'
                                  className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                                  onKeyDown={e => e.key === "Enter" && e.metaKey && runAI()}/>
                        {aiError &&
                            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{aiError}</p>}
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1"
                                    onClick={() => setShowAI(false)}>Cancel</Button>
                            <Button variant="gradient" className="flex-1 gap-2" onClick={runAI}
                                    disabled={!aiPrompt.trim() || aiLoading}>{aiLoading ?
                                <Loader2 className="h-4 w-4 animate-spin"/> :
                                <Send className="h-4 w-4"/>}{aiLoading ? "Building..." : "Generate"}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// "use client";
// /**
//  * User Site Builder
//  * Path: app/(dashboard)/dashboard/admin/site/page.tsx
//  *
//  * Features:
//  * - Site type onboarding (first visit)
//  * - iframe canvas (real HTML preview)
//  * - Left sidebar: component library picker (searchable, categorized)
//  * - Right panel: selected component props editor
//  * - Top bar: page switcher, device preview, zoom, publish
//  * - AI builder: natural language → auto-place components
//  * - Drag-to-reorder components on canvas
//  * - Undo/redo stack (in-memory)
//  */
//
// import {useCallback, useEffect, useRef, useState} from "react";
// import {
//     Laptop, Tablet, Smartphone, Globe, Sparkles, Plus, Eye,
//     ChevronLeft, ChevronRight, Layers, GripVertical, Trash2,
//     EyeOff, Undo, Redo, Save, Send, X, Search,
//     Settings, Layout, Navigation, Puzzle, Code,
//     Star, Loader2, Check, ChevronDown, Image, Type,
//     ToggleLeft, Hash, List, Link2, Palette, PanelBottom
// } from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Label} from "@/components/ui/form-elements";
// import {buildIframeDocument} from "@/lib/builder/renderer";
// import {v4 as uuid} from "uuid";
// import {useSession} from "next-auth/react";
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Types (local, matches DB shape)
// // ─────────────────────────────────────────────────────────────────────────────
//
// type DevicePreview = "desktop" | "tablet" | "mobile";
// type ComponentCategory =
//     "navbar"
//     | "hero"
//     | "section"
//     | "footer"
//     | "layout"
//     | "widget"
//     | "animation"
//     | "template"
//     | "integration";
// type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "custom";
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
//     isPremium?: boolean;
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
// }
//
// interface UserSite {
//     _id: string;
//     siteName: string;
//     siteType: SiteType;
//     theme: {
//         primaryColor: string; secondaryColor: string; accentColor: string;
//         backgroundColor: string; textColor: string; fontHeading: string;
//         fontBody: string; borderRadius: string; darkMode: boolean;
//     };
//     navbar: { componentKey?: string; style: string; links: { label: string; href: string; order: number }[] };
//     footer: { componentKey?: string; isEnabled: boolean };
//     pages: UserPage[];
//     builderState: { activePageId?: string; devicePreview: DevicePreview; zoom: number; aiSuggestionsEnabled: boolean };
//     isPublished: boolean;
//     globalCSS: string;
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Constants
// // ─────────────────────────────────────────────────────────────────────────────
//
// const SITE_TYPE_OPTIONS: { type: SiteType; label: string; emoji: string; desc: string }[] = [
//     {type: "blog", label: "Blog", emoji: "✍️", desc: "Content-focused with posts & categories"},
//     {type: "portfolio", label: "Portfolio", emoji: "🎨", desc: "Showcase your work & case studies"},
//     {type: "saas", label: "SaaS / Startup", emoji: "🚀", desc: "Landing page that converts visitors"},
//     {type: "ecommerce", label: "Shop", emoji: "🛍️", desc: "Sell products with a beautiful store"},
//     {type: "restaurant", label: "Restaurant", emoji: "🍽️", desc: "Menu, gallery & reservations"},
//     {type: "agency", label: "Agency", emoji: "💼", desc: "Services, team & case studies"},
// ];
//
// const DEVICE_WIDTHS: Record<DevicePreview, string> = {
//     desktop: "100%",
//     tablet: "768px",
//     mobile: "390px",
// };
//
// const CATEGORY_ICONS: Record<ComponentCategory, React.ElementType> = {
//     navbar: Navigation, hero: Layers, section: Layout, footer: PanelBottom,
//     layout: Layout, widget: Puzzle, animation: Sparkles, template: Code, integration: Settings,
// };
//
// const PROP_TYPE_ICONS: Record<string, React.ElementType> = {
//     text: Type, textarea: Type, richtext: Type, color: Palette,
//     image: Image, url: Link2, select: ChevronDown, boolean: ToggleLeft,
//     number: Hash, array: List, icon: Star,
// };
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Onboarding — Site Type Picker
// // ─────────────────────────────────────────────────────────────────────────────
//
// function SiteTypeOnboarding({onSelect}: { onSelect: (type: SiteType, name: string) => void }) {
//     const [selected, setSelected] = useState<SiteType | null>(null);
//     const [siteName, setSiteName] = useState("");
//     const [loading, setLoading] = useState(false);
//
//     const handleStart = async () => {
//         if (!selected || !siteName.trim()) return;
//         setLoading(true);
//         await onSelect(selected, siteName.trim());
//     };
//
//     return (
//         <div
//             className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
//             <div className="max-w-3xl w-full">
//                 <div className="text-center mb-10">
//                     <div
//                         className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
//                         <Sparkles className="h-3.5 w-3.5"/> Website Builder
//                     </div>
//                     <h1 className="text-4xl font-bold mb-3" style={{fontFamily: "'Playfair Display', serif"}}>
//                         What are you building?
//                     </h1>
//                     <p className="text-muted-foreground text-lg">
//                         Choose a starting point — you can change anything later.
//                     </p>
//                 </div>
//
//                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
//                     {SITE_TYPE_OPTIONS.map((opt) => (
//                         <button
//                             key={opt.type}
//                             onClick={() => setSelected(opt.type)}
//                             className={`relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
//                                 selected === opt.type
//                                     ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md shadow-indigo-100"
//                                     : "border-border bg-card hover:border-indigo-200"
//                             }`}
//                         >
//                             {selected === opt.type && (
//                                 <div
//                                     className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
//                                     <Check className="h-3 w-3 text-white"/>
//                                 </div>
//                             )}
//                             <span className="text-3xl mb-3">{opt.emoji}</span>
//                             <p className="font-semibold text-sm">{opt.label}</p>
//                             <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
//                         </button>
//                     ))}
//                 </div>
//
//                 {selected && (
//                     <div className="bg-card rounded-2xl border p-6 space-y-4">
//                         <Label className="text-sm font-semibold">What's your site called?</Label>
//                         <div className="flex gap-3">
//                             <Input
//                                 value={siteName}
//                                 onChange={(e) => setSiteName(e.target.value)}
//                                 placeholder={`e.g. "My ${SITE_TYPE_OPTIONS.find((o) => o.type === selected)?.label}"`}
//                                 className="flex-1 text-base"
//                                 onKeyDown={(e) => e.key === "Enter" && handleStart()}
//                                 autoFocus
//                             />
//                             <Button
//                                 variant="gradient"
//                                 onClick={handleStart}
//                                 disabled={!siteName.trim() || loading}
//                                 className="gap-2 px-6"
//                             >
//                                 {loading ? <Loader2 className="h-4 w-4 animate-spin"/> :
//                                     <Sparkles className="h-4 w-4"/>}
//                                 {loading ? "Building..." : "Start Building"}
//                             </Button>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Props Editor Panel (right sidebar)
// // ─────────────────────────────────────────────────────────────────────────────
//
// function PropField({schema, value, onChange}: {
//     schema: PropSchema;
//     value: unknown;
//     onChange: (val: unknown) => void;
// }) {
//     const Icon = PROP_TYPE_ICONS[schema.type] ?? Type;
//     const strVal = String(value ?? "");
//
//     if (schema.type === "boolean") {
//         return (
//             <label className="flex items-center gap-2 cursor-pointer py-1">
//                 <input type="checkbox" checked={Boolean(value)}
//                        onChange={(e) => onChange(e.target.checked)} className="rounded h-4 w-4"/>
//                 <span className="text-sm">{schema.label}</span>
//             </label>
//         );
//     }
//
//     if (schema.type === "color") {
//         return (
//             <div className="space-y-1">
//                 <Label className="text-xs">{schema.label}</Label>
//                 <div className="flex gap-2 items-center">
//                     <input type="color" value={strVal || "#4F46E5"} onChange={(e) => onChange(e.target.value)}
//                            className="h-8 w-12 rounded border cursor-pointer"/>
//                     <Input value={strVal} onChange={(e) => onChange(e.target.value)}
//                            className="h-8 text-xs font-mono flex-1"/>
//                 </div>
//             </div>
//         );
//     }
//
//     if (schema.type === "select") {
//         return (
//             <div className="space-y-1">
//                 <Label className="text-xs">{schema.label}</Label>
//                 <select value={strVal} onChange={(e) => onChange(e.target.value)}
//                         className="w-full h-8 rounded-md border bg-background px-2 text-sm">
//                     {(schema.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
//                 </select>
//             </div>
//         );
//     }
//
//     if (schema.type === "textarea" || schema.type === "richtext") {
//         return (
//             <div className="space-y-1">
//                 <Label className="text-xs">{schema.label}</Label>
//                 <textarea value={strVal} onChange={(e) => onChange(e.target.value)} rows={3}
//                           placeholder={schema.placeholder}
//                           className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"/>
//             </div>
//         );
//     }
//
//     if (schema.type === "array") {
//         const arrVal = Array.isArray(value) ? value as Record<string, unknown>[] : [];
//         return (
//             <div className="space-y-2">
//                 <Label className="text-xs">{schema.label}</Label>
//                 <div className="space-y-2">
//                     {arrVal.map((item, idx) => (
//                         <div key={idx} className="border rounded-lg p-2 space-y-1.5 bg-muted/30">
//                             <div className="flex items-center justify-between">
//                                 <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
//                                 <button onClick={() => onChange(arrVal.filter((_, i) => i !== idx))}
//                                         className="text-red-400 hover:text-red-600">
//                                     <X className="h-3 w-3"/>
//                                 </button>
//                             </div>
//                             {(schema.arrayItemSchema ?? []).map((subSchema) => (
//                                 <PropField
//                                     key={subSchema.key}
//                                     schema={subSchema}
//                                     value={item[subSchema.key]}
//                                     onChange={(v) => {
//                                         const updated = [...arrVal];
//                                         updated[idx] = {...item, [subSchema.key]: v};
//                                         onChange(updated);
//                                     }}
//                                 />
//                             ))}
//                         </div>
//                     ))}
//                     <button
//                         onClick={() => {
//                             const newItem: Record<string, unknown> = {};
//                             for (const s of schema.arrayItemSchema ?? []) newItem[s.key] = s.defaultValue ?? "";
//                             onChange([...arrVal, newItem]);
//                         }}
//                         className="w-full border border-dashed rounded-lg py-2 text-xs text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
//                     >
//                         <Plus className="h-3 w-3"/> Add {schema.label} Item
//                     </button>
//                 </div>
//             </div>
//         );
//     }
//
//     // Default: text / image / url / number / icon
//     return (
//         <div className="space-y-1">
//             <Label className="text-xs flex items-center gap-1.5">
//                 <Icon className="h-3 w-3 text-muted-foreground"/>
//                 {schema.label}
//                 {schema.required && <span className="text-red-400">*</span>}
//             </Label>
//             <Input
//                 type={schema.type === "number" ? "number" : "text"}
//                 value={strVal}
//                 onChange={(e) => onChange(schema.type === "number" ? Number(e.target.value) : e.target.value)}
//                 placeholder={schema.placeholder}
//                 className="h-8 text-sm"
//             />
//         </div>
//     );
// }
//
// function PropsPanel({component, onUpdate, onClose, onDelete, onToggleVisibility}: {
//     component: CanvasComponent;
//     onUpdate: (propKey: string, value: unknown) => void;
//     onClose: () => void;
//     onDelete: () => void;
//     onToggleVisibility: () => void;
// }) {
//     // Group props by group key
//     const groups: Record<string, PropSchema[]> = {};
//     for (const prop of component.propsSchema) {
//         const g = prop.group ?? "Content";
//         if (!groups[g]) groups[g] = [];
//         groups[g].push(prop);
//     }
//
//     return (
//         <div className="flex flex-col h-full">
//             <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
//                 <div>
//                     <p className="font-semibold text-sm">{component.name}</p>
//                     <p className="text-xs text-muted-foreground capitalize">{component.category}</p>
//                 </div>
//                 <div className="flex items-center gap-1">
//                     <button onClick={onToggleVisibility} title={component.isVisible ? "Hide" : "Show"}
//                             className={`p-1.5 rounded hover:bg-muted ${!component.isVisible ? "text-muted-foreground" : ""}`}>
//                         {component.isVisible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
//                     </button>
//                     <button onClick={onDelete}
//                             className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
//                         <Trash2 className="h-4 w-4"/>
//                     </button>
//                     <button onClick={onClose} className="p-1.5 rounded hover:bg-muted">
//                         <X className="h-4 w-4"/>
//                     </button>
//                 </div>
//             </div>
//
//             <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
//                 {Object.entries(groups).map(([groupName, props]) => (
//                     <div key={groupName}>
//                         <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{groupName}</p>
//                         <div className="space-y-3">
//                             {props.map((prop) => (
//                                 <PropField
//                                     key={prop.key}
//                                     schema={prop}
//                                     value={component.propValues[prop.key] ?? prop.defaultValue}
//                                     onChange={(v) => onUpdate(prop.key, v)}
//                                 />
//                             ))}
//                         </div>
//                     </div>
//                 ))}
//                 {component.propsSchema.length === 0 && (
//                     <p className="text-xs text-muted-foreground text-center py-6">This component has no editable
//                         properties.</p>
//                 )}
//             </div>
//         </div>
//     );
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Main Builder
// // ─────────────────────────────────────────────────────────────────────────────
//
// export default function SiteBuilderPage() {
//     const {data: session} = useSession();
//     const iframeRef = useRef<HTMLIFrameElement>(null);
//
//     // ── Site state ────────────────────────────────────────────────────────────
//     const [site, setSite] = useState<UserSite | null>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isSaving, setIsSaving] = useState(false);
//     const [isPublishing, setIsPublishing] = useState(false);
//     const [showOnboarding, setShowOnboarding] = useState(false);
//
//     // ── Builder state ─────────────────────────────────────────────────────────
//     const [activePageId, setActivePageId] = useState<string | null>(null);
//     const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
//     const [devicePreview, setDevicePreview] = useState<DevicePreview>("desktop");
//     const [zoom, setZoom] = useState(100);
//     const [leftPanelOpen, setLeftPanelOpen] = useState(true);
//     const [rightPanelOpen, setRightPanelOpen] = useState(false);
//
//     // ── Library ───────────────────────────────────────────────────────────────
//     const [library, setLibrary] = useState<LibraryComponent[]>([]);
//     const [libCategory, setLibCategory] = useState<ComponentCategory | "all">("all");
//     const [libSearch, setLibSearch] = useState("");
//
//     // ── AI builder ────────────────────────────────────────────────────────────
//     const [showAI, setShowAI] = useState(false);
//     const [aiPrompt, setAiPrompt] = useState("");
//     const [aiLoading, setAiLoading] = useState(false);
//     const [aiError, setAiError] = useState("");
//
//     // ── Undo/redo ─────────────────────────────────────────────────────────────
//     const undoStack = useRef<CanvasComponent[][]>([]);
//     const redoStack = useRef<CanvasComponent[][]>([]);
//
//     // ── Fetch site ────────────────────────────────────────────────────────────
//     useEffect(() => {
//         fetch("/api/site").then((r) => r.json()).then((d) => {
//             if (d.success && d.data) {
//                 setSite(d.data);
//                 setActivePageId(d.data.builderState?.activePageId ?? d.data.pages[0]?.pageId ?? null);
//                 setDevicePreview(d.data.builderState?.devicePreview ?? "desktop");
//             } else {
//                 setShowOnboarding(true);
//             }
//             setIsLoading(false);
//         });
//     }, []);
//
//     // ── Fetch component library ───────────────────────────────────────────────
//     useEffect(() => {
//         fetch("/api/plan-components").then((r) => r.json()).then((d) => {
//             if (d.success) setLibrary(d.data);
//         });
//     }, []);
//
//     // ── Listen for iframe messages (component selection) ──────────────────────
//     useEffect(() => {
//         const handler = (e: MessageEvent) => {
//             if (e.data?.type === "COMPONENT_SELECTED") {
//                 setSelectedInstanceId(e.data.instanceId);
//                 setRightPanelOpen(true);
//             } else if (e.data?.type === "COMPONENT_DESELECTED") {
//                 setSelectedInstanceId(null);
//                 setRightPanelOpen(false);
//             }
//         };
//         window.addEventListener("message", handler);
//         return () => window.removeEventListener("message", handler);
//     }, []);
//
//     // ── Derived ───────────────────────────────────────────────────────────────
//     const activePage = site?.pages.find((p) => p.pageId === activePageId) ?? null;
//     const components = activePage?.components.slice().sort((a, b) => a.order - b.order) ?? [];
//     const selectedComponent = components.find((c) => c.instanceId === selectedInstanceId) ?? null;
//
//     const filteredLibrary = library.filter((c) => {
//         const matchCat = libCategory === "all" || c.category === libCategory;
//         const matchSearch = !libSearch ||
//             c.name.toLowerCase().includes(libSearch.toLowerCase()) ||
//             c.description?.toLowerCase().includes(libSearch.toLowerCase());
//         return matchCat && matchSearch;
//     });
//
//     // ── Rebuild iframe whenever components change ──────────────────────────────
//     useEffect(() => {
//         if (!site || !activePage || !iframeRef.current) return;
//
//         const iframeDoc = buildIframeDocument({
//             components: components.filter((c) => c.isVisible).map((c) => ({
//                 instanceId: c.instanceId,
//                 htmlTemplate: c.htmlTemplate,
//                 cssCode: c.cssCode,
//                 jsCode: c.jsCode,
//                 propValues: c.propValues,
//             })),
//             globalTheme: site.theme,
//             globalCSS: site.globalCSS,
//         });
//
//         const iframe = iframeRef.current;
//         const doc = iframe.contentDocument;
//         if (!doc) return;
//         doc.open();
//         doc.write(iframeDoc);
//         doc.close();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [components, site?.theme, site?.globalCSS, activePageId]);
//
//     // ── Update component on page ──────────────────────────────────────────────
//     const updatePageComponents = useCallback((newComponents: CanvasComponent[]) => {
//         if (!activePage) return;
//         setSite((prev) => {
//             if (!prev) return prev;
//             return {
//                 ...prev,
//                 pages: prev.pages.map((p) =>
//                     p.pageId === activePageId ? {...p, components: newComponents} : p
//                 ),
//             };
//         });
//     }, [activePage, activePageId]);
//
//     // ── Add component from library ─────────────────────────────────────────────
//     const addComponent = (libComp: LibraryComponent) => {
//         undoStack.current.push([...components]);
//         redoStack.current = [];
//
//         const newComp: CanvasComponent = {
//             instanceId: uuid(),
//             componentKey: libComp.key,
//             componentId: libComp._id,
//             name: libComp.name,
//             category: libComp.category,
//             htmlTemplate: libComp.htmlTemplate,
//             cssCode: libComp.cssCode,
//             jsCode: libComp.jsCode,
//             propsSchema: libComp.propsSchema,
//             propValues: {...libComp.defaultProps},
//             isVisible: true,
//             isLocked: false,
//             order: components.length,
//         };
//
//         updatePageComponents([...components, newComp]);
//     };
//
//     // ── Update prop value for selected component ──────────────────────────────
//     const updatePropValue = useCallback((propKey: string, value: unknown) => {
//         if (!selectedInstanceId) return;
//         setSite((prev) => {
//             if (!prev) return prev;
//             return {
//                 ...prev,
//                 pages: prev.pages.map((p) =>
//                     p.pageId !== activePageId ? p : {
//                         ...p,
//                         components: p.components.map((c) =>
//                             c.instanceId !== selectedInstanceId ? c : {
//                                 ...c,
//                                 propValues: {...c.propValues, [propKey]: value},
//                             }
//                         ),
//                     }
//                 ),
//             };
//         });
//     }, [selectedInstanceId, activePageId]);
//
//     // ── Delete selected component ──────────────────────────────────────────────
//     const deleteComponent = (instanceId: string) => {
//         undoStack.current.push([...components]);
//         redoStack.current = [];
//         updatePageComponents(components.filter((c) => c.instanceId !== instanceId).map((c, i) => ({...c, order: i})));
//         setSelectedInstanceId(null);
//         setRightPanelOpen(false);
//     };
//
//     // ── Toggle visibility ─────────────────────────────────────────────────────
//     const toggleVisibility = (instanceId: string) => {
//         setSite((prev) => {
//             if (!prev) return prev;
//             return {
//                 ...prev,
//                 pages: prev.pages.map((p) =>
//                     p.pageId !== activePageId ? p : {
//                         ...p,
//                         components: p.components.map((c) =>
//                             c.instanceId !== instanceId ? c : {...c, isVisible: !c.isVisible}
//                         ),
//                     }
//                 ),
//             };
//         });
//     };
//
//     // ── Reorder ────────────────────────────────────────────────────────────────
//     const moveComponent = (instanceId: string, dir: -1 | 1) => {
//         const idx = components.findIndex((c) => c.instanceId === instanceId);
//         if (idx < 0) return;
//         const target = idx + dir;
//         if (target < 0 || target >= components.length) return;
//         undoStack.current.push([...components]);
//         const reordered = [...components];
//         [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
//         updatePageComponents(reordered.map((c, i) => ({...c, order: i})));
//     };
//
//     // ── Undo/Redo ─────────────────────────────────────────────────────────────
//     const undo = () => {
//         const prev = undoStack.current.pop();
//         if (!prev) return;
//         redoStack.current.push([...components]);
//         updatePageComponents(prev);
//     };
//
//     const redo = () => {
//         const next = redoStack.current.pop();
//         if (!next) return;
//         undoStack.current.push([...components]);
//         updatePageComponents(next);
//     };
//
//     // ── Save to DB ────────────────────────────────────────────────────────────
//     const save = async () => {
//         if (!activePageId || !site) return;
//         setIsSaving(true);
//         await fetch(`/api/site/page/${activePageId}/components`, {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({components}),
//         });
//         setIsSaving(false);
//     };
//
//     // ── Publish ───────────────────────────────────────────────────────────────
//     const publish = async () => {
//         await save();
//         setIsPublishing(true);
//         const res = await fetch("/api/site/publish", {method: "POST"});
//         const d = await res.json();
//         if (d.success) setSite((prev) => prev ? {...prev, isPublished: true} : prev);
//         setIsPublishing(false);
//     };
//
//     // ── AI Builder ────────────────────────────────────────────────────────────
//     const runAIBuilder = async () => {
//         if (!aiPrompt.trim() || !site) return;
//         setAiLoading(true);
//         setAiError("");
//         try {
//             const res = await fetch("/api/builder/ai", {
//                 method: "POST",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({
//                     prompt: aiPrompt,
//                     siteType: site.siteType,
//                     pageSlug: activePage?.slug ?? "/",
//                     existingComponentKeys: components.map((c) => c.componentKey),
//                 }),
//             });
//             const d = await res.json();
//             if (!d.success) {
//                 setAiError(d.error);
//                 return;
//             }
//
//             // Match returned component keys to library
//             const toAdd: CanvasComponent[] = [];
//             for (const ai of d.data) {
//                 const libComp = library.find((l) => l.key === ai.componentKey);
//                 if (!libComp) continue;
//                 toAdd.push({
//                     instanceId: uuid(),
//                     componentKey: libComp.key,
//                     componentId: libComp._id,
//                     name: libComp.name,
//                     category: libComp.category,
//                     htmlTemplate: libComp.htmlTemplate,
//                     cssCode: libComp.cssCode,
//                     jsCode: libComp.jsCode,
//                     propsSchema: libComp.propsSchema,
//                     propValues: {...libComp.defaultProps, ...ai.propValues},
//                     isVisible: true,
//                     isLocked: false,
//                     order: components.length + toAdd.length,
//                 });
//             }
//
//             undoStack.current.push([...components]);
//             updatePageComponents([...components, ...toAdd]);
//             setAiPrompt("");
//             setShowAI(false);
//         } catch {
//             setAiError("AI service error. Please try again.");
//         }
//         setAiLoading(false);
//     };
//
//     // ── Onboarding handler ────────────────────────────────────────────────────
//     const handleOnboardingSelect = async (siteType: SiteType, siteName: string) => {
//         const res = await fetch("/api/site/init", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({siteType, siteName}),
//         });
//         const d = await res.json();
//         if (d.success) {
//             setSite(d.data);
//             setActivePageId(d.data.pages[0]?.pageId ?? null);
//             setShowOnboarding(false);
//         }
//     };
//
//     // ─────────────────────────────────────────────────────────────────────────
//     // Render
//     // ─────────────────────────────────────────────────────────────────────────
//
//     if (isLoading) {
//         return (
//             <div className="flex items-center justify-center h-[80vh]">
//                 <Loader2 className="h-8 w-8 animate-spin text-indigo-500"/>
//             </div>
//         );
//     }
//
//     if (showOnboarding) {
//         return <SiteTypeOnboarding onSelect={handleOnboardingSelect}/>;
//     }
//
//     if (!site) return null;
//
//     const CATEGORIES_NAV = ["all", "navbar", "hero", "section", "footer", "widget", "animation", "layout", "integration"] as const;
//
//     return (
//         <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
//             {/* ── Top Bar ─────────────────────────────────────────────────────── */}
//             <div className="flex items-center gap-2 px-4 h-12 border-b bg-card shrink-0 z-20">
//                 {/* Site name */}
//                 <span className="font-semibold text-sm truncate max-w-32">{site.siteName}</span>
//                 <span className="text-muted-foreground text-xs">·</span>
//
//                 {/* Page tabs */}
//                 <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
//                     {site.pages.map((page) => (
//                         <button
//                             key={page.pageId}
//                             onClick={() => {
//                                 setActivePageId(page.pageId);
//                                 setSelectedInstanceId(null);
//                             }}
//                             className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activePageId === page.pageId ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
//                         >
//                             {page.title}
//                         </button>
//                     ))}
//                 </div>
//
//                 <div className="ml-auto flex items-center gap-1.5">
//                     {/* Device preview */}
//                     <div className="flex items-center border rounded-lg overflow-hidden">
//                         {(["desktop", "tablet", "mobile"] as DevicePreview[]).map((d) => {
//                             const Icon = d === "desktop" ? Laptop : d === "tablet" ? Tablet : Smartphone;
//                             return (
//                                 <button key={d} onClick={() => setDevicePreview(d)}
//                                         className={`p-2 transition-colors ${devicePreview === d ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}>
//                                     <Icon className="h-3.5 w-3.5"/>
//                                 </button>
//                             );
//                         })}
//                     </div>
//
//                     {/* Zoom */}
//                     <div className="flex items-center border rounded-lg overflow-hidden">
//                         <button onClick={() => setZoom((z) => Math.max(50, z - 10))}
//                                 className="px-2 py-1.5 hover:bg-muted text-xs">−
//                         </button>
//                         <span className="px-2 text-xs font-mono">{zoom}%</span>
//                         <button onClick={() => setZoom((z) => Math.min(150, z + 10))}
//                                 className="px-2 py-1.5 hover:bg-muted text-xs">+
//                         </button>
//                     </div>
//
//                     {/* Undo/Redo */}
//                     <button onClick={undo} disabled={undoStack.current.length === 0}
//                             className="p-2 rounded hover:bg-muted disabled:opacity-30" title="Undo">
//                         <Undo className="h-3.5 w-3.5"/>
//                     </button>
//                     <button onClick={redo} disabled={redoStack.current.length === 0}
//                             className="p-2 rounded hover:bg-muted disabled:opacity-30" title="Redo">
//                         <Redo className="h-3.5 w-3.5"/>
//                     </button>
//
//                     {/* AI Builder */}
//                     <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAI(true)}>
//                         <Sparkles className="h-3.5 w-3.5 text-purple-500"/> AI Build
//                     </Button>
//
//                     {/* Save */}
//                     <Button size="sm" variant="outline" onClick={save} isLoading={isSaving}
//                             className="gap-1.5 h-8 text-xs">
//                         <Save className="h-3.5 w-3.5"/> Save
//                     </Button>
//
//                     {/* Publish */}
//                     <Button size="sm" variant="gradient" onClick={publish} isLoading={isPublishing}
//                             className="gap-1.5 h-8 text-xs">
//                         <Globe className="h-3.5 w-3.5"/>
//                         {site.isPublished ? "Re-publish" : "Publish"}
//                     </Button>
//                 </div>
//             </div>
//
//             {/* ── Main Area ────────────────────────────────────────────────────── */}
//             <div className="flex flex-1 overflow-hidden">
//                 {/* ── Left Panel: Component Library ─────────────────────────────── */}
//                 <div
//                     className={`border-r bg-card flex flex-col transition-all shrink-0 ${leftPanelOpen ? "w-64" : "w-0 overflow-hidden"}`}>
//                     <div className="px-3 py-2 border-b flex items-center gap-2 shrink-0">
//                         <div className="relative flex-1">
//                             <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"/>
//                             <input value={libSearch} onChange={(e) => setLibSearch(e.target.value)}
//                                    placeholder="Search..."
//                                    className="w-full pl-6 pr-2 h-7 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
//                         </div>
//                     </div>
//
//                     {/* Category filter */}
//                     <div className="flex gap-1 px-2 py-1.5 border-b overflow-x-auto shrink-0">
//                         {CATEGORIES_NAV.map((cat) => {
//                             const Icon = cat === "all" ? Layers : CATEGORY_ICONS[cat as ComponentCategory];
//                             return (
//                                 <button key={cat} onClick={() => setLibCategory(cat as ComponentCategory | "all")}
//                                         title={cat}
//                                         className={`p-1.5 rounded transition-colors shrink-0 ${libCategory === cat ? "bg-indigo-600 text-white" : "hover:bg-muted text-muted-foreground"}`}>
//                                     <Icon className="h-3.5 w-3.5"/>
//                                 </button>
//                             );
//                         })}
//                     </div>
//
//                     {/* Component list */}
//                     <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
//                         {filteredLibrary.length === 0 ? (
//                             <p className="text-xs text-muted-foreground text-center py-6">No components found.</p>
//                         ) : filteredLibrary.map((comp) => {
//                             const Icon = CATEGORY_ICONS[comp.category] ?? Layers;
//                             return (
//                                 <button key={comp._id} onClick={() => addComponent(comp)}
//                                         className="w-full text-left rounded-lg border hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden group bg-background">
//                                     {comp.previewImage ? (
//                                         // eslint-disable-next-line @next/next/no-img-element
//                                         <img src={comp.previewImage} alt={comp.name}
//                                              className="w-full h-20 object-cover"/>
//                                     ) : (
//                                         <div
//                                             className="w-full h-16 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted group-hover:from-indigo-50">
//                                             <Icon className="h-6 w-6 text-muted-foreground/50"/>
//                                         </div>
//                                     )}
//                                     <div className="p-2">
//                                         <div className="flex items-center justify-between">
//                                             <p className="font-medium text-xs">{comp.name}</p>
//                                             {comp.isFeatured &&
//                                                 <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0"/>}
//                                         </div>
//                                         <p className="text-xs text-muted-foreground capitalize">{comp.category}</p>
//                                     </div>
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 </div>
//
//                 {/* ── Toggle left panel ─────────────────────────────────────────── */}
//                 <button onClick={() => setLeftPanelOpen((v) => !v)}
//                         className="absolute left-64 top-1/2 -translate-y-1/2 z-10 h-8 w-4 bg-card border border-l-0 rounded-r-md flex items-center justify-center hover:bg-muted transition-all"
//                         style={{left: leftPanelOpen ? undefined : 0}}>
//                     {leftPanelOpen ? <ChevronLeft className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
//                 </button>
//
//                 {/* ── Center Canvas ──────────────────────────────────────────────── */}
//                 <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 flex items-start justify-center p-6">
//                     <div
//                         className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 relative"
//                         style={{
//                             width: DEVICE_WIDTHS[devicePreview],
//                             minHeight: "600px",
//                             transform: `scale(${zoom / 100})`,
//                             transformOrigin: "top center",
//                         }}
//                     >
//                         {/* Canvas layer list overlay (left edge) */}
//                         <div
//                             className="absolute left-0 top-0 bottom-0 w-6 z-10 flex flex-col items-center py-2 gap-1 opacity-0 hover:opacity-100 transition-opacity bg-black/5">
//                             {components.map((comp, idx) => (
//                                 <div key={comp.instanceId} className="flex flex-col gap-0.5">
//                                     <button onClick={() => moveComponent(comp.instanceId, -1)} disabled={idx === 0}
//                                             className="h-3 w-4 flex items-center justify-center hover:bg-black/10 rounded disabled:opacity-20">
//                                         <ChevronLeft className="h-2.5 w-2.5 rotate-90"/>
//                                     </button>
//                                     <button onClick={() => moveComponent(comp.instanceId, 1)}
//                                             disabled={idx === components.length - 1}
//                                             className="h-3 w-4 flex items-center justify-center hover:bg-black/10 rounded disabled:opacity-20">
//                                         <ChevronLeft className="h-2.5 w-2.5 -rotate-90"/>
//                                     </button>
//                                 </div>
//                             ))}
//                         </div>
//
//                         <iframe
//                             ref={iframeRef}
//                             className="w-full border-0"
//                             style={{height: "100%", minHeight: "600px"}}
//                             title="Site Preview"
//                             sandbox="allow-scripts allow-same-origin"
//                         />
//
//                         {/* Empty canvas CTA */}
//                         {components.length === 0 && (
//                             <div
//                                 className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
//                                 <Layers className="h-12 w-12 text-muted-foreground/30 mb-4"/>
//                                 <p className="font-semibold text-muted-foreground">Canvas is empty</p>
//                                 <p className="text-sm text-muted-foreground/60 mt-1">Pick a component from the left
//                                     panel or use AI Build</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//
//                 {/* ── Right Panel: Props Editor ──────────────────────────────────── */}
//                 {rightPanelOpen && selectedComponent && (
//                     <div className="w-72 border-l bg-card flex flex-col shrink-0">
//                         <PropsPanel
//                             component={selectedComponent}
//                             onUpdate={updatePropValue}
//                             onClose={() => {
//                                 setSelectedInstanceId(null);
//                                 setRightPanelOpen(false);
//                             }}
//                             onDelete={() => deleteComponent(selectedComponent.instanceId)}
//                             onToggleVisibility={() => toggleVisibility(selectedComponent.instanceId)}
//                         />
//                     </div>
//                 )}
//
//                 {/* ── Layers Panel (bottom strip) ────────────────────────────────── */}
//                 {components.length > 0 && !rightPanelOpen && (
//                     <div
//                         className="absolute bottom-0 left-64 right-0 bg-card border-t z-10 px-3 py-1.5 flex items-center gap-2 overflow-x-auto">
//                         {components.map((comp, idx) => {
//                             const Icon = CATEGORY_ICONS[comp.category] ?? Layers;
//                             return (
//                                 <button key={comp.instanceId}
//                                         onClick={() => {
//                                             setSelectedInstanceId(comp.instanceId);
//                                             setRightPanelOpen(true);
//                                         }}
//                                         className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap border transition-colors ${selectedInstanceId === comp.instanceId ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-muted border-transparent"} ${!comp.isVisible ? "opacity-40" : ""}`}
//                                 >
//                                     <GripVertical className="h-3 w-3"/>
//                                     <Icon className="h-3 w-3"/>
//                                     {comp.name}
//                                     {!comp.isVisible && <EyeOff className="h-2.5 w-2.5"/>}
//                                 </button>
//                             );
//                         })}
//                     </div>
//                 )}
//             </div>
//
//             {/* ── AI Builder Modal ──────────────────────────────────────────────── */}
//             {showAI && (
//                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
//                     <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-lg p-6 space-y-4">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                                 <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
//                                     <Sparkles className="h-4 w-4 text-purple-600"/>
//                                 </div>
//                                 <div>
//                                     <p className="font-bold">AI Website Builder</p>
//                                     <p className="text-xs text-muted-foreground">Powered by Cloudflare Workers AI
//                                         (free)</p>
//                                 </div>
//                             </div>
//                             <button onClick={() => setShowAI(false)} className="p-1.5 rounded hover:bg-muted">
//                                 <X className="h-4 w-4"/>
//                             </button>
//                         </div>
//
//                         <div className="space-y-2">
//                             <Label className="text-sm font-medium">Describe what you want to build</Label>
//                             <textarea
//                                 value={aiPrompt}
//                                 onChange={(e) => setAiPrompt(e.target.value)}
//                                 rows={4}
//                                 placeholder={`e.g. "A hero section with a bold headline about my consulting firm, a features section showing 3 services, and a contact form"`}
//                                 className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
//                                 onKeyDown={(e) => e.key === "Enter" && e.metaKey && runAIBuilder()}
//                                 autoFocus
//                             />
//                             <p className="text-xs text-muted-foreground">Tip: Be specific about sections, content, and
//                                 style.</p>
//                         </div>
//
//                         {aiError && (
//                             <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{aiError}</p>
//                         )}
//
//                         <div className="flex gap-2">
//                             <Button variant="outline" className="flex-1"
//                                     onClick={() => setShowAI(false)}>Cancel</Button>
//                             <Button variant="gradient" className="flex-1 gap-2" onClick={runAIBuilder}
//                                     disabled={!aiPrompt.trim() || aiLoading}>
//                                 {aiLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
//                                 {aiLoading ? "Building your site..." : "Generate"}
//                             </Button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }