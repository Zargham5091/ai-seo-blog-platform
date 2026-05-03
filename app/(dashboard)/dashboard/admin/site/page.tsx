"use client";
/**
 * User Site Builder
 * Path: app/(dashboard)/dashboard/admin/site/page.tsx
 *
 * Features:
 * - Site type onboarding (first visit)
 * - iframe canvas (real HTML preview)
 * - Left sidebar: component library picker (searchable, categorized)
 * - Right panel: selected component props editor
 * - Top bar: page switcher, device preview, zoom, publish
 * - AI builder: natural language → auto-place components
 * - Drag-to-reorder components on canvas
 * - Undo/redo stack (in-memory)
 */

import {useCallback, useEffect, useRef, useState} from "react";
import {
    Laptop, Tablet, Smartphone, Globe, Sparkles, Plus, Eye,
    ChevronLeft, ChevronRight, Layers, GripVertical, Trash2,
    EyeOff, Undo, Redo, Save, Send, X, Search,
    Settings, Layout, Navigation, Puzzle, Code,
    Star, Loader2, Check, ChevronDown, Image, Type,
    ToggleLeft, Hash, List, Link2, Palette, PanelBottom
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {buildIframeDocument} from "@/lib/builder/renderer";
import {v4 as uuid} from "uuid";
import {useSession} from "next-auth/react";

// ─────────────────────────────────────────────────────────────────────────────
// Types (local, matches DB shape)
// ─────────────────────────────────────────────────────────────────────────────

type DevicePreview = "desktop" | "tablet" | "mobile";
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
type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "custom";

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
    isPremium?: boolean;
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

interface UserPage {
    pageId: string;
    slug: string;
    title: string;
    isHomePage: boolean;
    showInNav: boolean;
    components: CanvasComponent[];
    isEnabled: boolean;
}

interface UserSite {
    _id: string;
    siteName: string;
    siteType: SiteType;
    theme: {
        primaryColor: string; secondaryColor: string; accentColor: string;
        backgroundColor: string; textColor: string; fontHeading: string;
        fontBody: string; borderRadius: string; darkMode: boolean;
    };
    navbar: { componentKey?: string; style: string; links: { label: string; href: string; order: number }[] };
    footer: { componentKey?: string; isEnabled: boolean };
    pages: UserPage[];
    builderState: { activePageId?: string; devicePreview: DevicePreview; zoom: number; aiSuggestionsEnabled: boolean };
    isPublished: boolean;
    globalCSS: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SITE_TYPE_OPTIONS: { type: SiteType; label: string; emoji: string; desc: string }[] = [
    {type: "blog", label: "Blog", emoji: "✍️", desc: "Content-focused with posts & categories"},
    {type: "portfolio", label: "Portfolio", emoji: "🎨", desc: "Showcase your work & case studies"},
    {type: "saas", label: "SaaS / Startup", emoji: "🚀", desc: "Landing page that converts visitors"},
    {type: "ecommerce", label: "Shop", emoji: "🛍️", desc: "Sell products with a beautiful store"},
    {type: "restaurant", label: "Restaurant", emoji: "🍽️", desc: "Menu, gallery & reservations"},
    {type: "agency", label: "Agency", emoji: "💼", desc: "Services, team & case studies"},
];

const DEVICE_WIDTHS: Record<DevicePreview, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "390px",
};

const CATEGORY_ICONS: Record<ComponentCategory, React.ElementType> = {
    navbar: Navigation, hero: Layers, section: Layout, footer: PanelBottom,
    layout: Layout, widget: Puzzle, animation: Sparkles, template: Code, integration: Settings,
};

const PROP_TYPE_ICONS: Record<string, React.ElementType> = {
    text: Type, textarea: Type, richtext: Type, color: Palette,
    image: Image, url: Link2, select: ChevronDown, boolean: ToggleLeft,
    number: Hash, array: List, icon: Star,
};

// ─────────────────────────────────────────────────────────────────────────────
// Onboarding — Site Type Picker
// ─────────────────────────────────────────────────────────────────────────────

function SiteTypeOnboarding({onSelect}: { onSelect: (type: SiteType, name: string) => void }) {
    const [selected, setSelected] = useState<SiteType | null>(null);
    const [siteName, setSiteName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        if (!selected || !siteName.trim()) return;
        setLoading(true);
        await onSelect(selected, siteName.trim());
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
            <div className="max-w-3xl w-full">
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-4">
                        <Sparkles className="h-3.5 w-3.5"/> Website Builder
                    </div>
                    <h1 className="text-4xl font-bold mb-3" style={{fontFamily: "'Playfair Display', serif"}}>
                        What are you building?
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Choose a starting point — you can change anything later.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                    {SITE_TYPE_OPTIONS.map((opt) => (
                        <button
                            key={opt.type}
                            onClick={() => setSelected(opt.type)}
                            className={`relative flex flex-col items-start p-5 rounded-2xl border-2 text-left transition-all hover:shadow-md ${
                                selected === opt.type
                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 shadow-md shadow-indigo-100"
                                    : "border-border bg-card hover:border-indigo-200"
                            }`}
                        >
                            {selected === opt.type && (
                                <div
                                    className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white"/>
                                </div>
                            )}
                            <span className="text-3xl mb-3">{opt.emoji}</span>
                            <p className="font-semibold text-sm">{opt.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                        </button>
                    ))}
                </div>

                {selected && (
                    <div className="bg-card rounded-2xl border p-6 space-y-4">
                        <Label className="text-sm font-semibold">What's your site called?</Label>
                        <div className="flex gap-3">
                            <Input
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder={`e.g. "My ${SITE_TYPE_OPTIONS.find((o) => o.type === selected)?.label}"`}
                                className="flex-1 text-base"
                                onKeyDown={(e) => e.key === "Enter" && handleStart()}
                                autoFocus
                            />
                            <Button
                                variant="gradient"
                                onClick={handleStart}
                                disabled={!siteName.trim() || loading}
                                className="gap-2 px-6"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                    <Sparkles className="h-4 w-4"/>}
                                {loading ? "Building..." : "Start Building"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props Editor Panel (right sidebar)
// ─────────────────────────────────────────────────────────────────────────────

function PropField({schema, value, onChange}: {
    schema: PropSchema;
    value: unknown;
    onChange: (val: unknown) => void;
}) {
    const Icon = PROP_TYPE_ICONS[schema.type] ?? Type;
    const strVal = String(value ?? "");

    if (schema.type === "boolean") {
        return (
            <label className="flex items-center gap-2 cursor-pointer py-1">
                <input type="checkbox" checked={Boolean(value)}
                       onChange={(e) => onChange(e.target.checked)} className="rounded h-4 w-4"/>
                <span className="text-sm">{schema.label}</span>
            </label>
        );
    }

    if (schema.type === "color") {
        return (
            <div className="space-y-1">
                <Label className="text-xs">{schema.label}</Label>
                <div className="flex gap-2 items-center">
                    <input type="color" value={strVal || "#4F46E5"} onChange={(e) => onChange(e.target.value)}
                           className="h-8 w-12 rounded border cursor-pointer"/>
                    <Input value={strVal} onChange={(e) => onChange(e.target.value)}
                           className="h-8 text-xs font-mono flex-1"/>
                </div>
            </div>
        );
    }

    if (schema.type === "select") {
        return (
            <div className="space-y-1">
                <Label className="text-xs">{schema.label}</Label>
                <select value={strVal} onChange={(e) => onChange(e.target.value)}
                        className="w-full h-8 rounded-md border bg-background px-2 text-sm">
                    {(schema.options ?? []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>
        );
    }

    if (schema.type === "textarea" || schema.type === "richtext") {
        return (
            <div className="space-y-1">
                <Label className="text-xs">{schema.label}</Label>
                <textarea value={strVal} onChange={(e) => onChange(e.target.value)} rows={3}
                          placeholder={schema.placeholder}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"/>
            </div>
        );
    }

    if (schema.type === "array") {
        const arrVal = Array.isArray(value) ? value as Record<string, unknown>[] : [];
        return (
            <div className="space-y-2">
                <Label className="text-xs">{schema.label}</Label>
                <div className="space-y-2">
                    {arrVal.map((item, idx) => (
                        <div key={idx} className="border rounded-lg p-2 space-y-1.5 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
                                <button onClick={() => onChange(arrVal.filter((_, i) => i !== idx))}
                                        className="text-red-400 hover:text-red-600">
                                    <X className="h-3 w-3"/>
                                </button>
                            </div>
                            {(schema.arrayItemSchema ?? []).map((subSchema) => (
                                <PropField
                                    key={subSchema.key}
                                    schema={subSchema}
                                    value={item[subSchema.key]}
                                    onChange={(v) => {
                                        const updated = [...arrVal];
                                        updated[idx] = {...item, [subSchema.key]: v};
                                        onChange(updated);
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                    <button
                        onClick={() => {
                            const newItem: Record<string, unknown> = {};
                            for (const s of schema.arrayItemSchema ?? []) newItem[s.key] = s.defaultValue ?? "";
                            onChange([...arrVal, newItem]);
                        }}
                        className="w-full border border-dashed rounded-lg py-2 text-xs text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
                    >
                        <Plus className="h-3 w-3"/> Add {schema.label} Item
                    </button>
                </div>
            </div>
        );
    }

    // Default: text / image / url / number / icon
    return (
        <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground"/>
                {schema.label}
                {schema.required && <span className="text-red-400">*</span>}
            </Label>
            <Input
                type={schema.type === "number" ? "number" : "text"}
                value={strVal}
                onChange={(e) => onChange(schema.type === "number" ? Number(e.target.value) : e.target.value)}
                placeholder={schema.placeholder}
                className="h-8 text-sm"
            />
        </div>
    );
}

function PropsPanel({component, onUpdate, onClose, onDelete, onToggleVisibility}: {
    component: CanvasComponent;
    onUpdate: (propKey: string, value: unknown) => void;
    onClose: () => void;
    onDelete: () => void;
    onToggleVisibility: () => void;
}) {
    // Group props by group key
    const groups: Record<string, PropSchema[]> = {};
    for (const prop of component.propsSchema) {
        const g = prop.group ?? "Content";
        if (!groups[g]) groups[g] = [];
        groups[g].push(prop);
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div>
                    <p className="font-semibold text-sm">{component.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{component.category}</p>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onToggleVisibility} title={component.isVisible ? "Hide" : "Show"}
                            className={`p-1.5 rounded hover:bg-muted ${!component.isVisible ? "text-muted-foreground" : ""}`}>
                        {component.isVisible ? <Eye className="h-4 w-4"/> : <EyeOff className="h-4 w-4"/>}
                    </button>
                    <button onClick={onDelete}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4"/>
                    </button>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-muted">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
                {Object.entries(groups).map(([groupName, props]) => (
                    <div key={groupName}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{groupName}</p>
                        <div className="space-y-3">
                            {props.map((prop) => (
                                <PropField
                                    key={prop.key}
                                    schema={prop}
                                    value={component.propValues[prop.key] ?? prop.defaultValue}
                                    onChange={(v) => onUpdate(prop.key, v)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                {component.propsSchema.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-6">This component has no editable
                        properties.</p>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Builder
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteBuilderPage() {
    const {data: session} = useSession();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // ── Site state ────────────────────────────────────────────────────────────
    const [site, setSite] = useState<UserSite | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    // ── Builder state ─────────────────────────────────────────────────────────
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    const [devicePreview, setDevicePreview] = useState<DevicePreview>("desktop");
    const [zoom, setZoom] = useState(100);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);

    // ── Library ───────────────────────────────────────────────────────────────
    const [library, setLibrary] = useState<LibraryComponent[]>([]);
    const [libCategory, setLibCategory] = useState<ComponentCategory | "all">("all");
    const [libSearch, setLibSearch] = useState("");

    // ── AI builder ────────────────────────────────────────────────────────────
    const [showAI, setShowAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    // ── Undo/redo ─────────────────────────────────────────────────────────────
    const undoStack = useRef<CanvasComponent[][]>([]);
    const redoStack = useRef<CanvasComponent[][]>([]);

    // ── Fetch site ────────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/site").then((r) => r.json()).then((d) => {
            if (d.success && d.data) {
                setSite(d.data);
                setActivePageId(d.data.builderState?.activePageId ?? d.data.pages[0]?.pageId ?? null);
                setDevicePreview(d.data.builderState?.devicePreview ?? "desktop");
            } else {
                setShowOnboarding(true);
            }
            setIsLoading(false);
        });
    }, []);

    // ── Fetch component library ───────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/plan-components").then((r) => r.json()).then((d) => {
            if (d.success) setLibrary(d.data);
        });
    }, []);

    // ── Listen for iframe messages (component selection) ──────────────────────
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            if (e.data?.type === "COMPONENT_SELECTED") {
                setSelectedInstanceId(e.data.instanceId);
                setRightPanelOpen(true);
            } else if (e.data?.type === "COMPONENT_DESELECTED") {
                setSelectedInstanceId(null);
                setRightPanelOpen(false);
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    // ── Derived ───────────────────────────────────────────────────────────────
    const activePage = site?.pages.find((p) => p.pageId === activePageId) ?? null;
    const components = activePage?.components.slice().sort((a, b) => a.order - b.order) ?? [];
    const selectedComponent = components.find((c) => c.instanceId === selectedInstanceId) ?? null;

    const filteredLibrary = library.filter((c) => {
        const matchCat = libCategory === "all" || c.category === libCategory;
        const matchSearch = !libSearch ||
            c.name.toLowerCase().includes(libSearch.toLowerCase()) ||
            c.description?.toLowerCase().includes(libSearch.toLowerCase());
        return matchCat && matchSearch;
    });

    // ── Rebuild iframe whenever components change ──────────────────────────────
    useEffect(() => {
        if (!site || !activePage || !iframeRef.current) return;

        const iframeDoc = buildIframeDocument({
            components: components.filter((c) => c.isVisible).map((c) => ({
                instanceId: c.instanceId,
                htmlTemplate: c.htmlTemplate,
                cssCode: c.cssCode,
                jsCode: c.jsCode,
                propValues: c.propValues,
            })),
            globalTheme: site.theme,
            globalCSS: site.globalCSS,
        });

        const iframe = iframeRef.current;
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(iframeDoc);
        doc.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [components, site?.theme, site?.globalCSS, activePageId]);

    // ── Update component on page ──────────────────────────────────────────────
    const updatePageComponents = useCallback((newComponents: CanvasComponent[]) => {
        if (!activePage) return;
        setSite((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                pages: prev.pages.map((p) =>
                    p.pageId === activePageId ? {...p, components: newComponents} : p
                ),
            };
        });
    }, [activePage, activePageId]);

    // ── Add component from library ─────────────────────────────────────────────
    const addComponent = (libComp: LibraryComponent) => {
        undoStack.current.push([...components]);
        redoStack.current = [];

        const newComp: CanvasComponent = {
            instanceId: uuid(),
            componentKey: libComp.key,
            componentId: libComp._id,
            name: libComp.name,
            category: libComp.category,
            htmlTemplate: libComp.htmlTemplate,
            cssCode: libComp.cssCode,
            jsCode: libComp.jsCode,
            propsSchema: libComp.propsSchema,
            propValues: {...libComp.defaultProps},
            isVisible: true,
            isLocked: false,
            order: components.length,
        };

        updatePageComponents([...components, newComp]);
    };

    // ── Update prop value for selected component ──────────────────────────────
    const updatePropValue = useCallback((propKey: string, value: unknown) => {
        if (!selectedInstanceId) return;
        setSite((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                pages: prev.pages.map((p) =>
                    p.pageId !== activePageId ? p : {
                        ...p,
                        components: p.components.map((c) =>
                            c.instanceId !== selectedInstanceId ? c : {
                                ...c,
                                propValues: {...c.propValues, [propKey]: value},
                            }
                        ),
                    }
                ),
            };
        });
    }, [selectedInstanceId, activePageId]);

    // ── Delete selected component ──────────────────────────────────────────────
    const deleteComponent = (instanceId: string) => {
        undoStack.current.push([...components]);
        redoStack.current = [];
        updatePageComponents(components.filter((c) => c.instanceId !== instanceId).map((c, i) => ({...c, order: i})));
        setSelectedInstanceId(null);
        setRightPanelOpen(false);
    };

    // ── Toggle visibility ─────────────────────────────────────────────────────
    const toggleVisibility = (instanceId: string) => {
        setSite((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                pages: prev.pages.map((p) =>
                    p.pageId !== activePageId ? p : {
                        ...p,
                        components: p.components.map((c) =>
                            c.instanceId !== instanceId ? c : {...c, isVisible: !c.isVisible}
                        ),
                    }
                ),
            };
        });
    };

    // ── Reorder ────────────────────────────────────────────────────────────────
    const moveComponent = (instanceId: string, dir: -1 | 1) => {
        const idx = components.findIndex((c) => c.instanceId === instanceId);
        if (idx < 0) return;
        const target = idx + dir;
        if (target < 0 || target >= components.length) return;
        undoStack.current.push([...components]);
        const reordered = [...components];
        [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
        updatePageComponents(reordered.map((c, i) => ({...c, order: i})));
    };

    // ── Undo/Redo ─────────────────────────────────────────────────────────────
    const undo = () => {
        const prev = undoStack.current.pop();
        if (!prev) return;
        redoStack.current.push([...components]);
        updatePageComponents(prev);
    };

    const redo = () => {
        const next = redoStack.current.pop();
        if (!next) return;
        undoStack.current.push([...components]);
        updatePageComponents(next);
    };

    // ── Save to DB ────────────────────────────────────────────────────────────
    const save = async () => {
        if (!activePageId || !site) return;
        setIsSaving(true);
        await fetch(`/api/site/page/${activePageId}/components`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({components}),
        });
        setIsSaving(false);
    };

    // ── Publish ───────────────────────────────────────────────────────────────
    const publish = async () => {
        await save();
        setIsPublishing(true);
        const res = await fetch("/api/site/publish", {method: "POST"});
        const d = await res.json();
        if (d.success) setSite((prev) => prev ? {...prev, isPublished: true} : prev);
        setIsPublishing(false);
    };

    // ── AI Builder ────────────────────────────────────────────────────────────
    const runAIBuilder = async () => {
        if (!aiPrompt.trim() || !site) return;
        setAiLoading(true);
        setAiError("");
        try {
            const res = await fetch("/api/builder/ai", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    prompt: aiPrompt,
                    siteType: site.siteType,
                    pageSlug: activePage?.slug ?? "/",
                    existingComponentKeys: components.map((c) => c.componentKey),
                }),
            });
            const d = await res.json();
            if (!d.success) {
                setAiError(d.error);
                return;
            }

            // Match returned component keys to library
            const toAdd: CanvasComponent[] = [];
            for (const ai of d.data) {
                const libComp = library.find((l) => l.key === ai.componentKey);
                if (!libComp) continue;
                toAdd.push({
                    instanceId: uuid(),
                    componentKey: libComp.key,
                    componentId: libComp._id,
                    name: libComp.name,
                    category: libComp.category,
                    htmlTemplate: libComp.htmlTemplate,
                    cssCode: libComp.cssCode,
                    jsCode: libComp.jsCode,
                    propsSchema: libComp.propsSchema,
                    propValues: {...libComp.defaultProps, ...ai.propValues},
                    isVisible: true,
                    isLocked: false,
                    order: components.length + toAdd.length,
                });
            }

            undoStack.current.push([...components]);
            updatePageComponents([...components, ...toAdd]);
            setAiPrompt("");
            setShowAI(false);
        } catch {
            setAiError("AI service error. Please try again.");
        }
        setAiLoading(false);
    };

    // ── Onboarding handler ────────────────────────────────────────────────────
    const handleOnboardingSelect = async (siteType: SiteType, siteName: string) => {
        const res = await fetch("/api/site/init", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({siteType, siteName}),
        });
        const d = await res.json();
        if (d.success) {
            setSite(d.data);
            setActivePageId(d.data.pages[0]?.pageId ?? null);
            setShowOnboarding(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500"/>
            </div>
        );
    }

    if (showOnboarding) {
        return <SiteTypeOnboarding onSelect={handleOnboardingSelect}/>;
    }

    if (!site) return null;

    const CATEGORIES_NAV = ["all", "navbar", "hero", "section", "footer", "widget", "animation", "layout", "integration"] as const;

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
            {/* ── Top Bar ─────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 px-4 h-12 border-b bg-card shrink-0 z-20">
                {/* Site name */}
                <span className="font-semibold text-sm truncate max-w-32">{site.siteName}</span>
                <span className="text-muted-foreground text-xs">·</span>

                {/* Page tabs */}
                <div className="flex items-center gap-1 overflow-x-auto max-w-xs">
                    {site.pages.map((page) => (
                        <button
                            key={page.pageId}
                            onClick={() => {
                                setActivePageId(page.pageId);
                                setSelectedInstanceId(null);
                            }}
                            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activePageId === page.pageId ? "bg-indigo-600 text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                        >
                            {page.title}
                        </button>
                    ))}
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                    {/* Device preview */}
                    <div className="flex items-center border rounded-lg overflow-hidden">
                        {(["desktop", "tablet", "mobile"] as DevicePreview[]).map((d) => {
                            const Icon = d === "desktop" ? Laptop : d === "tablet" ? Tablet : Smartphone;
                            return (
                                <button key={d} onClick={() => setDevicePreview(d)}
                                        className={`p-2 transition-colors ${devicePreview === d ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}>
                                    <Icon className="h-3.5 w-3.5"/>
                                </button>
                            );
                        })}
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center border rounded-lg overflow-hidden">
                        <button onClick={() => setZoom((z) => Math.max(50, z - 10))}
                                className="px-2 py-1.5 hover:bg-muted text-xs">−
                        </button>
                        <span className="px-2 text-xs font-mono">{zoom}%</span>
                        <button onClick={() => setZoom((z) => Math.min(150, z + 10))}
                                className="px-2 py-1.5 hover:bg-muted text-xs">+
                        </button>
                    </div>

                    {/* Undo/Redo */}
                    <button onClick={undo} disabled={undoStack.current.length === 0}
                            className="p-2 rounded hover:bg-muted disabled:opacity-30" title="Undo">
                        <Undo className="h-3.5 w-3.5"/>
                    </button>
                    <button onClick={redo} disabled={redoStack.current.length === 0}
                            className="p-2 rounded hover:bg-muted disabled:opacity-30" title="Redo">
                        <Redo className="h-3.5 w-3.5"/>
                    </button>

                    {/* AI Builder */}
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => setShowAI(true)}>
                        <Sparkles className="h-3.5 w-3.5 text-purple-500"/> AI Build
                    </Button>

                    {/* Save */}
                    <Button size="sm" variant="outline" onClick={save} isLoading={isSaving}
                            className="gap-1.5 h-8 text-xs">
                        <Save className="h-3.5 w-3.5"/> Save
                    </Button>

                    {/* Publish */}
                    <Button size="sm" variant="gradient" onClick={publish} isLoading={isPublishing}
                            className="gap-1.5 h-8 text-xs">
                        <Globe className="h-3.5 w-3.5"/>
                        {site.isPublished ? "Re-publish" : "Publish"}
                    </Button>
                </div>
            </div>

            {/* ── Main Area ────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ── Left Panel: Component Library ─────────────────────────────── */}
                <div
                    className={`border-r bg-card flex flex-col transition-all shrink-0 ${leftPanelOpen ? "w-64" : "w-0 overflow-hidden"}`}>
                    <div className="px-3 py-2 border-b flex items-center gap-2 shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground"/>
                            <input value={libSearch} onChange={(e) => setLibSearch(e.target.value)}
                                   placeholder="Search..."
                                   className="w-full pl-6 pr-2 h-7 rounded border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                        </div>
                    </div>

                    {/* Category filter */}
                    <div className="flex gap-1 px-2 py-1.5 border-b overflow-x-auto shrink-0">
                        {CATEGORIES_NAV.map((cat) => {
                            const Icon = cat === "all" ? Layers : CATEGORY_ICONS[cat as ComponentCategory];
                            return (
                                <button key={cat} onClick={() => setLibCategory(cat as ComponentCategory | "all")}
                                        title={cat}
                                        className={`p-1.5 rounded transition-colors shrink-0 ${libCategory === cat ? "bg-indigo-600 text-white" : "hover:bg-muted text-muted-foreground"}`}>
                                    <Icon className="h-3.5 w-3.5"/>
                                </button>
                            );
                        })}
                    </div>

                    {/* Component list */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                        {filteredLibrary.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-6">No components found.</p>
                        ) : filteredLibrary.map((comp) => {
                            const Icon = CATEGORY_ICONS[comp.category] ?? Layers;
                            return (
                                <button key={comp._id} onClick={() => addComponent(comp)}
                                        className="w-full text-left rounded-lg border hover:border-indigo-300 hover:shadow-sm transition-all overflow-hidden group bg-background">
                                    {comp.previewImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={comp.previewImage} alt={comp.name}
                                             className="w-full h-20 object-cover"/>
                                    ) : (
                                        <div
                                            className="w-full h-16 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted group-hover:from-indigo-50">
                                            <Icon className="h-6 w-6 text-muted-foreground/50"/>
                                        </div>
                                    )}
                                    <div className="p-2">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-xs">{comp.name}</p>
                                            {comp.isFeatured &&
                                                <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0"/>}
                                        </div>
                                        <p className="text-xs text-muted-foreground capitalize">{comp.category}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Toggle left panel ─────────────────────────────────────────── */}
                <button onClick={() => setLeftPanelOpen((v) => !v)}
                        className="absolute left-64 top-1/2 -translate-y-1/2 z-10 h-8 w-4 bg-card border border-l-0 rounded-r-md flex items-center justify-center hover:bg-muted transition-all"
                        style={{left: leftPanelOpen ? undefined : 0}}>
                    {leftPanelOpen ? <ChevronLeft className="h-3 w-3"/> : <ChevronRight className="h-3 w-3"/>}
                </button>

                {/* ── Center Canvas ──────────────────────────────────────────────── */}
                <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 flex items-start justify-center p-6">
                    <div
                        className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300 relative"
                        style={{
                            width: DEVICE_WIDTHS[devicePreview],
                            minHeight: "600px",
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: "top center",
                        }}
                    >
                        {/* Canvas layer list overlay (left edge) */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-6 z-10 flex flex-col items-center py-2 gap-1 opacity-0 hover:opacity-100 transition-opacity bg-black/5">
                            {components.map((comp, idx) => (
                                <div key={comp.instanceId} className="flex flex-col gap-0.5">
                                    <button onClick={() => moveComponent(comp.instanceId, -1)} disabled={idx === 0}
                                            className="h-3 w-4 flex items-center justify-center hover:bg-black/10 rounded disabled:opacity-20">
                                        <ChevronLeft className="h-2.5 w-2.5 rotate-90"/>
                                    </button>
                                    <button onClick={() => moveComponent(comp.instanceId, 1)}
                                            disabled={idx === components.length - 1}
                                            className="h-3 w-4 flex items-center justify-center hover:bg-black/10 rounded disabled:opacity-20">
                                        <ChevronLeft className="h-2.5 w-2.5 -rotate-90"/>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <iframe
                            ref={iframeRef}
                            className="w-full border-0"
                            style={{height: "100%", minHeight: "600px"}}
                            title="Site Preview"
                            sandbox="allow-scripts allow-same-origin"
                        />

                        {/* Empty canvas CTA */}
                        {components.length === 0 && (
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                                <Layers className="h-12 w-12 text-muted-foreground/30 mb-4"/>
                                <p className="font-semibold text-muted-foreground">Canvas is empty</p>
                                <p className="text-sm text-muted-foreground/60 mt-1">Pick a component from the left
                                    panel or use AI Build</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Props Editor ──────────────────────────────────── */}
                {rightPanelOpen && selectedComponent && (
                    <div className="w-72 border-l bg-card flex flex-col shrink-0">
                        <PropsPanel
                            component={selectedComponent}
                            onUpdate={updatePropValue}
                            onClose={() => {
                                setSelectedInstanceId(null);
                                setRightPanelOpen(false);
                            }}
                            onDelete={() => deleteComponent(selectedComponent.instanceId)}
                            onToggleVisibility={() => toggleVisibility(selectedComponent.instanceId)}
                        />
                    </div>
                )}

                {/* ── Layers Panel (bottom strip) ────────────────────────────────── */}
                {components.length > 0 && !rightPanelOpen && (
                    <div
                        className="absolute bottom-0 left-64 right-0 bg-card border-t z-10 px-3 py-1.5 flex items-center gap-2 overflow-x-auto">
                        {components.map((comp, idx) => {
                            const Icon = CATEGORY_ICONS[comp.category] ?? Layers;
                            return (
                                <button key={comp.instanceId}
                                        onClick={() => {
                                            setSelectedInstanceId(comp.instanceId);
                                            setRightPanelOpen(true);
                                        }}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap border transition-colors ${selectedInstanceId === comp.instanceId ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-muted border-transparent"} ${!comp.isVisible ? "opacity-40" : ""}`}
                                >
                                    <GripVertical className="h-3 w-3"/>
                                    <Icon className="h-3 w-3"/>
                                    {comp.name}
                                    {!comp.isVisible && <EyeOff className="h-2.5 w-2.5"/>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── AI Builder Modal ──────────────────────────────────────────────── */}
            {showAI && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4 text-purple-600"/>
                                </div>
                                <div>
                                    <p className="font-bold">AI Website Builder</p>
                                    <p className="text-xs text-muted-foreground">Powered by Cloudflare Workers AI
                                        (free)</p>
                                </div>
                            </div>
                            <button onClick={() => setShowAI(false)} className="p-1.5 rounded hover:bg-muted">
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Describe what you want to build</Label>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                rows={4}
                                placeholder={`e.g. "A hero section with a bold headline about my consulting firm, a features section showing 3 services, and a contact form"`}
                                className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                onKeyDown={(e) => e.key === "Enter" && e.metaKey && runAIBuilder()}
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground">Tip: Be specific about sections, content, and
                                style.</p>
                        </div>

                        {aiError && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{aiError}</p>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1"
                                    onClick={() => setShowAI(false)}>Cancel</Button>
                            <Button variant="gradient" className="flex-1 gap-2" onClick={runAIBuilder}
                                    disabled={!aiPrompt.trim() || aiLoading}>
                                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
                                {aiLoading ? "Building your site..." : "Generate"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// "use client";
// import {useEffect, useState} from "react";
// import {Palette, Globe, CheckCircle, Sparkles, ExternalLink, Lock} from "lucide-react";
// import {useSession} from "next-auth/react";
// import Link from "next/link";
// import {Button} from "@/components/ui/button";
// import {Badge} from "@/components/ui/form-elements";
// import {Card, CardContent} from "@/components/ui/card";
// import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
//
// interface Template {
//     _id: string;
//     name: string;
//     description: string;
//     theme: string;
//     style: string;
//     previewImage?: string;
//     minPlan: string;
//     colors: { primary: string; secondary: string; background: string };
//     isFeatured: boolean;
// }
//
// interface UserSite {
//     templateId?: { _id: string; name: string; theme: string; previewImage?: string };
//     primaryColor: string;
//     fontFamily: string;
//     navStyle: string;
// }
//
// const PLAN_ORDER: Record<string, number> = {free: 0, silver: 1, gold: 2, diamond: 3};
// const THEME_EMOJI: Record<string, string> = {
//     light: "☀️", dark: "🌙", glassmorphism: "🔮",
//     sketch: "✏️", brutalist: "🔲", minimal: "⬜", bold: "🎨",
// };
//
// export default function SiteBuilderPage() {
//     const {data: session} = useSession();
//     const [templates, setTemplates] = useState<Template[]>([]);
//     const [userSite, setUserSite] = useState<UserSite | null>(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [applying, setApplying] = useState<string | null>(null);
//     const [filterTheme, setFilterTheme] = useState<string>("all");
//
//     const userPlanLevel = PLAN_ORDER[session?.user?.plan ?? "free"] ?? 0;
//     const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
//     const IS_LOCALHOST = ROOT_DOMAIN.startsWith("localhost");
//
//     useEffect(() => {
//         Promise.all([
//             fetch("/api/templates").then((r) => r.json()),
//             fetch("/api/site").then((r) => r.json()),
//         ]).then(([t, s]) => {
//             if (t.success) setTemplates(t.data);
//             if (s.success) setUserSite(s.data);
//         }).finally(() => setIsLoading(false));
//     }, []);
//
//     const applyTemplate = async (templateId: string) => {
//         setApplying(templateId);
//         const res = await fetch(`/api/templates/${templateId}/apply`, {method: "POST"});
//         const d = await res.json();
//         if (d.success) {
//             const s = await fetch("/api/site").then((r) => r.json());
//             if (s.success) setUserSite(s.data);
//         }
//         setApplying(null);
//     };
//
//     const themes = ["all", ...Array.from(new Set(templates.map((t) => t.theme)))];
//     const filtered = filterTheme === "all" ? templates : templates.filter((t) => t.theme === filterTheme);
//
//     const previewUrl = IS_LOCALHOST
//         ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/preview/your-subdomain`
//         : `https://your-subdomain.${ROOT_DOMAIN}`;
//
//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-bold flex items-center gap-2">
//                         <Palette className="h-6 w-6 text-indigo-500"/> Site Builder
//                     </h1>
//                     <p className="text-muted-foreground text-sm">
//                         Choose a template for your public blog site
//                     </p>
//                 </div>
//                 {userSite?.templateId && (
//                     <Button asChild variant="outline" size="sm" className="gap-1.5">
//                         <a href={previewUrl} target="_blank" rel="noreferrer">
//                             <ExternalLink className="h-3.5 w-3.5"/> Preview Site
//                         </a>
//                     </Button>
//                 )}
//             </div>
//
//             {/* Current template */}
//             {userSite?.templateId && (
//                 <div
//                     className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
//                     <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0"/>
//                     <div>
//                         <p className="font-semibold text-sm">Active Template: {userSite.templateId.name}</p>
//                         <p className="text-xs text-muted-foreground">Theme: {userSite.templateId.theme}</p>
//                     </div>
//                     <Button asChild variant="outline" size="sm" className="ml-auto gap-1.5">
//                         <Link href="/dashboard/admin/domain">
//                             <Globe className="h-3.5 w-3.5"/> Customize Domain
//                         </Link>
//                     </Button>
//                 </div>
//             )}
//
//             {/* Theme filter */}
//             <div className="flex gap-2 flex-wrap">
//                 {themes.map((t) => (
//                     <Button
//                         key={t}
//                         variant={filterTheme === t ? "default" : "outline"}
//                         size="sm"
//                         onClick={() => setFilterTheme(t)}
//                         className="capitalize gap-1.5"
//                     >
//                         {t !== "all" && THEME_EMOJI[t]} {t}
//                     </Button>
//                 ))}
//             </div>
//
//             {/* Templates grid */}
//             {isLoading ? (
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {[...Array(6)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl"/>)}
//                 </div>
//             ) : filtered.length === 0 ? (
//                 <div className="text-center py-20 text-muted-foreground">
//                     <Palette className="h-10 w-10 mx-auto mb-3 opacity-30"/>
//                     <p>No templates available yet. Super admin can create templates from the Component Library.</p>
//                 </div>
//             ) : (
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {filtered.map((template) => {
//                         const requiredLevel = PLAN_ORDER[template.minPlan] ?? 1;
//                         const canAccess = userPlanLevel >= requiredLevel;
//                         const isActive = userSite?.templateId?._id === template._id;
//
//                         return (
//                             <Card key={template._id}
//                                   className={`group relative overflow-hidden transition-all hover:shadow-md ${isActive ? "border-emerald-500 shadow-md shadow-emerald-500/10" : ""} ${!canAccess ? "opacity-75" : ""}`}>
//                                 {template.isFeatured && (
//                                     <div className="absolute top-2 left-2 z-10">
//                                         <Badge
//                                             className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 text-xs gap-1">
//                                             <Sparkles className="h-2.5 w-2.5"/> Featured
//                                         </Badge>
//                                     </div>
//                                 )}
//                                 {!canAccess && (
//                                     <div className="absolute top-2 right-2 z-10">
//                                         <Badge variant="secondary" className="capitalize text-xs gap-1">
//                                             <Lock className="h-2.5 w-2.5"/> {template.minPlan}+
//                                         </Badge>
//                                     </div>
//                                 )}
//                                 {isActive && (
//                                     <div className="absolute top-2 right-2 z-10">
//                                         <Badge variant="success" className="text-xs gap-1">
//                                             <CheckCircle className="h-2.5 w-2.5"/> Active
//                                         </Badge>
//                                     </div>
//                                 )}
//
//                                 {/* Preview */}
//                                 {template.previewImage ? (
//                                     // eslint-disable-next-line @next/next/no-img-element
//                                     <img src={template.previewImage} alt={template.name}
//                                          className="w-full h-44 object-cover"/>
//                                 ) : (
//                                     <div
//                                         className="w-full h-44 flex items-center justify-center text-4xl"
//                                         style={{background: `linear-gradient(135deg, ${template.colors.primary}30, ${template.colors.secondary}20)`}}
//                                     >
//                                         {THEME_EMOJI[template.theme]}
//                                     </div>
//                                 )}
//
//                                 <CardContent className="p-4">
//                                     <div className="flex items-start justify-between mb-2">
//                                         <div>
//                                             <h3 className="font-semibold text-sm">{template.name}</h3>
//                                             <p className="text-xs text-muted-foreground capitalize">{template.theme} · {template.style}</p>
//                                         </div>
//                                         <div className="flex gap-1">
//                                             {Object.values(template.colors).slice(0, 3).map((c, i) => (
//                                                 <div key={i}
//                                                      className="h-4 w-4 rounded-full border border-background shadow-sm"
//                                                      style={{background: c}}/>
//                                             ))}
//                                         </div>
//                                     </div>
//                                     <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
//
//                                     {canAccess ? (
//                                         <Button
//                                             variant={isActive ? "outline" : "gradient"}
//                                             size="sm"
//                                             className="w-full"
//                                             onClick={() => !isActive && applyTemplate(template._id)}
//                                             isLoading={applying === template._id}
//                                             disabled={isActive}
//                                         >
//                                             {isActive ? "✓ Currently Active" : applying === template._id ? "Applying..." : "Apply Template"}
//                                         </Button>
//                                     ) : (
//                                         <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
//                                             <Link href="/dashboard/admin/settings?tab=billing">
//                                                 <Lock className="h-3.5 w-3.5"/> Upgrade to {template.minPlan}
//                                             </Link>
//                                         </Button>
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         );
//                     })}
//                 </div>
//             )}
//         </div>
//     );
// }
