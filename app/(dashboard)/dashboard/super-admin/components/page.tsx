"use client";
/**
 * Super Admin — Component Library Manager
 * Path: app/(dashboard)/dashboard/super-admin/components/page.tsx
 *
 * Features:
 * - Create/edit/delete components for all 9 categories
 * - Live HTML template editor with syntax highlighting hints
 * - Visual prop schema builder (add/remove/reorder props per component)
 * - Category-specific starter templates (click to pre-fill)
 * - Live mini-preview of htmlTemplate + defaultProps
 * - Tag management, site type targeting
 * - Plan access control per component
 */

import {useEffect, useRef, useState, useCallback} from "react";
import {
    Plus, Edit, Trash2, Code, Layers, Sparkles, Save, Eye,
    ChevronDown, ChevronUp, GripVertical, X, Copy, Search,
    Layout, Navigation, PanelBottom, Box, Puzzle, Cpu,
    Star, Lock, Check, AlertCircle, RefreshCw
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {renderTemplate} from "@/lib/builder/renderer";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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
type PropType =
    "text"
    | "textarea"
    | "richtext"
    | "color"
    | "image"
    | "url"
    | "select"
    | "boolean"
    | "number"
    | "array"
    | "icon";
type PlanLevel = "free" | "silver" | "gold" | "diamond";
type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "all";

interface PropSchema {
    key: string;
    label: string;
    type: PropType;
    defaultValue: unknown;
    placeholder?: string;
    options?: string[];
    required?: boolean;
    group?: string;
    min?: number;
    max?: number;
    arrayItemSchema?: PropSchema[];
}

interface PlanComponent {
    _id: string;
    name: string;
    key: string;
    category: ComponentCategory;
    description: string;
    tags: string[];
    siteTypes: SiteType[];
    previewImage?: string;
    htmlTemplate: string;
    cssCode?: string;
    jsCode?: string;
    propsSchema: PropSchema[];
    defaultProps: Record<string, unknown>;
    availableTo: PlanLevel[];
    isActive: boolean;
    isFeatured: boolean;
    isPremium: boolean;
    usageCount: number;
}

interface ComponentForm {
    name: string;
    key: string;
    category: ComponentCategory;
    description: string;
    tags: string[];
    siteTypes: SiteType[];
    previewImage: string;
    htmlTemplate: string;
    cssCode: string;
    jsCode: string;
    propsSchema: PropSchema[];
    availableTo: PlanLevel[];
    isActive: boolean;
    isFeatured: boolean;
    isPremium: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<ComponentCategory, {
    label: string;
    icon: React.ElementType;
    color: string;
    description: string
}> = {
    navbar: {label: "Navbar", icon: Navigation, color: "text-blue-500", description: "Top navigation bars"},
    hero: {label: "Hero", icon: Layers, color: "text-purple-500", description: "Landing hero sections"},
    section: {label: "Section", icon: Layout, color: "text-indigo-500", description: "General page sections"},
    footer: {label: "Footer", icon: PanelBottom, color: "text-slate-500", description: "Footer components"},
    layout: {label: "Layout", icon: Box, color: "text-cyan-500", description: "Grid & layout wrappers"},
    widget: {label: "Widget", icon: Puzzle, color: "text-emerald-500", description: "Forms, pricing, FAQ"},
    animation: {label: "Animation", icon: Sparkles, color: "text-pink-500", description: "Animation presets"},
    template: {label: "Template", icon: Code, color: "text-orange-500", description: "Full page templates"},
    integration: {label: "Integration", icon: Cpu, color: "text-red-500", description: "Third-party embeds"},
};

const PLAN_COLORS: Record<PlanLevel, string> = {
    free: "bg-slate-100 text-slate-700",
    silver: "bg-blue-100 text-blue-700",
    gold: "bg-amber-100 text-amber-700",
    diamond: "bg-purple-100 text-purple-700",
};

const ALL_PLANS: PlanLevel[] = ["free", "silver", "gold", "diamond"];
const ALL_SITE_TYPES: SiteType[] = ["all", "blog", "portfolio", "saas", "ecommerce", "restaurant", "agency"];
const CATEGORIES = Object.keys(CATEGORY_META) as ComponentCategory[];
const PROP_TYPES: PropType[] = ["text", "textarea", "richtext", "color", "image", "url", "select", "boolean", "number", "array", "icon"];

// Category-specific HTML starter templates
const CATEGORY_HTML_STARTERS: Record<ComponentCategory, string> = {
    navbar: `<nav class="w-full px-6 py-4 flex items-center justify-between" style="background:var(--color-bg);border-bottom:1px solid rgba(0,0,0,0.08);">
  <a href="/" class="font-bold text-xl" style="font-family:var(--font-heading);color:var(--color-primary);">{{siteName}}</a>
  <div class="hidden md:flex items-center gap-6">
    {{#navLinks}}<a href="{{href}}" class="text-sm font-medium hover:opacity-70 transition-opacity">{{label}}</a>{{/navLinks}}
  </div>
  {{#ctaLabel}}<a href="{{ctaHref}}" class="px-4 py-2 rounded text-sm font-semibold text-white" style="background:var(--color-primary);">{{ctaLabel}}</a>{{/ctaLabel}}
</nav>`,

    hero: `<section class="py-24 px-6 text-center" style="background:var(--color-bg);">
  <div class="max-w-4xl mx-auto">
    {{#badge}}<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style="background:var(--color-primary)20;color:var(--color-primary);">{{badge}}</span>{{/badge}}
    <h1 class="text-5xl font-bold mb-6" style="font-family:var(--font-heading);">{{headline}}</h1>
    <p class="text-xl mb-8 opacity-70">{{subtext}}</p>
    <div class="flex items-center justify-center gap-4 flex-wrap">
      <a href="{{ctaHref}}" class="px-8 py-3 rounded-lg font-semibold text-white" style="background:var(--color-primary);">{{ctaLabel}}</a>
      {{#secondaryLabel}}<a href="{{secondaryHref}}" class="px-8 py-3 rounded-lg font-semibold border" style="border-color:var(--color-primary);color:var(--color-primary);">{{secondaryLabel}}</a>{{/secondaryLabel}}
    </div>
  </div>
</section>`,

    section: `<section class="py-20 px-6" style="background:var(--color-bg);">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12">
      <h2 class="text-3xl font-bold mb-4" style="font-family:var(--font-heading);">{{heading}}</h2>
      <p class="text-lg opacity-70 max-w-2xl mx-auto">{{subheading}}</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      {{#items}}<div class="p-6 rounded-xl border">
        <h3 class="font-semibold text-lg mb-2">{{title}}</h3>
        <p class="opacity-70 text-sm">{{description}}</p>
      </div>{{/items}}
    </div>
  </div>
</section>`,

    footer: `<footer class="py-12 px-6" style="background:#111;color:#fff;">
  <div class="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
    <div>
      <h3 class="font-bold text-lg mb-2" style="font-family:var(--font-heading);">{{siteName}}</h3>
      <p class="text-sm opacity-60">{{tagline}}</p>
    </div>
    {{#columns}}<div>
      <h4 class="font-semibold mb-3">{{heading}}</h4>
      <ul class="space-y-2 text-sm opacity-60">{{#links}}<li><a href="{{href}}" class="hover:opacity-100">{{label}}</a></li>{{/links}}</ul>
    </div>{{/columns}}
  </div>
  <div class="border-t border-white/10 pt-6 text-center text-sm opacity-50">{{copyright}}</div>
</footer>`,

    layout: `<div class="w-full max-w-7xl mx-auto px-6 py-8">
  <div class="grid gap-8" style="grid-template-columns:repeat({{columns}},1fr);">
    <!-- Layout slot — children components render here -->
  </div>
</div>`,

    widget: `<div class="py-16 px-6">
  <div class="max-w-lg mx-auto text-center">
    <h2 class="text-2xl font-bold mb-2" style="font-family:var(--font-heading);">{{heading}}</h2>
    <p class="opacity-70 mb-6">{{subtext}}</p>
    <form class="flex gap-2">
      <input type="email" placeholder="{{placeholder}}" class="flex-1 px-4 py-2 rounded-lg border" style="border-color:var(--color-primary)40;"/>
      <button type="submit" class="px-6 py-2 rounded-lg text-white font-semibold" style="background:var(--color-primary);">{{buttonLabel}}</button>
    </form>
  </div>
</div>`,

    animation: `<style>
@keyframes {{animationName}} {
  from { {{fromState}} }
  to { {{toState}} }
}
.anim-{{animationName}} {
  animation: {{animationName}} {{duration}}s {{easing}} {{delay}}s {{fillMode}};
}
</style>
<!-- Apply class "anim-{{animationName}}" to any element to trigger this animation -->`,

    template: `<!DOCTYPE html>
<!-- Full page template — include all sections here -->
<div class="min-h-screen" style="background:var(--color-bg);color:var(--color-text);">
  <!-- Navbar slot -->
  <!-- Hero slot -->
  <!-- Content sections -->
  <!-- Footer slot -->
</div>`,

    integration: `<!-- {{serviceName}} Integration -->
<div id="{{containerId}}" data-key="{{embedKey}}"></div>
<script>
(function(){
  // {{serviceName}} embed script
  {{embedCode}}
})();
</script>`,
};

// Category-specific default prop schemas
const CATEGORY_DEFAULT_PROPS: Record<ComponentCategory, PropSchema[]> = {
    navbar: [
        {key: "siteName", label: "Site Name", type: "text", defaultValue: "My Site"},
        {
            key: "navLinks",
            label: "Navigation Links",
            type: "array",
            defaultValue: [{label: "Home", href: "/"}, {label: "About", href: "/about"}, {
                label: "Blog",
                href: "/blog"
            }],
            arrayItemSchema: [{key: "label", label: "Link Label", type: "text", defaultValue: ""}, {
                key: "href",
                label: "URL",
                type: "url",
                defaultValue: "/"
            }]
        },
        {
            key: "ctaLabel",
            label: "CTA Button Label",
            type: "text",
            defaultValue: "Get Started",
            placeholder: "Leave blank to hide"
        },
        {key: "ctaHref", label: "CTA Button URL", type: "url", defaultValue: "#"},
    ],
    hero: [
        {key: "headline", label: "Headline", type: "text", defaultValue: "Build Something Amazing", required: true},
        {
            key: "subtext",
            label: "Subtext",
            type: "textarea",
            defaultValue: "The fastest way to launch your next project."
        },
        {key: "ctaLabel", label: "Primary CTA", type: "text", defaultValue: "Get Started Free"},
        {key: "ctaHref", label: "Primary CTA URL", type: "url", defaultValue: "#"},
        {
            key: "secondaryLabel",
            label: "Secondary CTA",
            type: "text",
            defaultValue: "See Demo",
            placeholder: "Leave blank to hide"
        },
        {key: "secondaryHref", label: "Secondary CTA URL", type: "url", defaultValue: "#"},
        {
            key: "badge",
            label: "Badge Text",
            type: "text",
            defaultValue: "🚀 Now in beta",
            placeholder: "Leave blank to hide"
        },
        {key: "backgroundImage", label: "Background Image", type: "image", defaultValue: ""},
    ],
    section: [
        {key: "heading", label: "Section Heading", type: "text", defaultValue: "Our Features", required: true},
        {
            key: "subheading",
            label: "Section Subheading",
            type: "textarea",
            defaultValue: "Everything you need to succeed."
        },
        {
            key: "items", label: "Items", type: "array", defaultValue: [
                {title: "Fast", description: "Blazing fast performance out of the box."},
                {title: "Secure", description: "Enterprise-grade security built in."},
                {title: "Scalable", description: "Grows with your business."},
            ], arrayItemSchema: [
                {key: "title", label: "Title", type: "text", defaultValue: ""},
                {key: "description", label: "Description", type: "textarea", defaultValue: ""},
                {key: "icon", label: "Icon", type: "icon", defaultValue: "star"},
                {key: "image", label: "Image URL", type: "image", defaultValue: ""},
            ]
        },
    ],
    footer: [
        {key: "siteName", label: "Site Name", type: "text", defaultValue: "My Site"},
        {key: "tagline", label: "Tagline", type: "text", defaultValue: "Building the future."},
        {key: "copyright", label: "Copyright Text", type: "text", defaultValue: "© 2025. All rights reserved."},
        {
            key: "columns", label: "Link Columns", type: "array", defaultValue: [], arrayItemSchema: [
                {key: "heading", label: "Column Heading", type: "text", defaultValue: ""},
                {
                    key: "links", label: "Links", type: "array", defaultValue: [], arrayItemSchema: [
                        {key: "label", label: "Label", type: "text", defaultValue: ""},
                        {key: "href", label: "URL", type: "url", defaultValue: "/"},
                    ]
                },
            ]
        },
    ],
    layout: [
        {key: "columns", label: "Number of Columns", type: "number", defaultValue: 3, min: 1, max: 6},
        {key: "gap", label: "Gap Size", type: "select", defaultValue: "8", options: ["2", "4", "6", "8", "12", "16"]},
        {
            key: "maxWidth",
            label: "Max Width",
            type: "select",
            defaultValue: "7xl",
            options: ["sm", "md", "lg", "xl", "2xl", "4xl", "6xl", "7xl", "full"]
        },
    ],
    widget: [
        {key: "heading", label: "Widget Heading", type: "text", defaultValue: "Stay Updated", required: true},
        {
            key: "subtext",
            label: "Widget Subtext",
            type: "text",
            defaultValue: "Get the latest updates delivered to your inbox."
        },
        {key: "buttonLabel", label: "Button Label", type: "text", defaultValue: "Subscribe"},
        {key: "placeholder", label: "Input Placeholder", type: "text", defaultValue: "Enter your email"},
    ],
    animation: [
        {key: "animationName", label: "Animation Name (CSS)", type: "text", defaultValue: "fadeIn"},
        {key: "duration", label: "Duration (seconds)", type: "number", defaultValue: 0.6, min: 0.1, max: 5},
        {
            key: "easing",
            label: "Easing",
            type: "select",
            defaultValue: "ease-out",
            options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear", "cubic-bezier(0.34,1.56,0.64,1)"]
        },
        {key: "delay", label: "Delay (seconds)", type: "number", defaultValue: 0, min: 0, max: 3},
        {
            key: "fromState",
            label: "From State (CSS properties)",
            type: "textarea",
            defaultValue: "opacity:0;transform:translateY(20px)"
        },
        {
            key: "toState",
            label: "To State (CSS properties)",
            type: "textarea",
            defaultValue: "opacity:1;transform:translateY(0)"
        },
        {
            key: "fillMode",
            label: "Fill Mode",
            type: "select",
            defaultValue: "both",
            options: ["none", "forwards", "backwards", "both"]
        },
    ],
    template: [
        {key: "pageTitle", label: "Page Title", type: "text", defaultValue: "Welcome"},
    ],
    integration: [
        {key: "serviceName", label: "Service Name", type: "text", defaultValue: "My Service"},
        {key: "embedCode", label: "Embed / Script Code", type: "textarea", defaultValue: ""},
        {key: "containerId", label: "Container ID", type: "text", defaultValue: "embed-container"},
        {key: "embedKey", label: "API / Embed Key", type: "text", defaultValue: ""},
    ],
};

const EMPTY_FORM: ComponentForm = {
    name: "", key: "", category: "section", description: "",
    tags: [], siteTypes: ["all"],
    previewImage: "", htmlTemplate: "", cssCode: "", jsCode: "",
    propsSchema: [], availableTo: ["free", "silver", "gold", "diamond"],
    isActive: true, isFeatured: false, isPremium: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Prop Schema Row Component
// ─────────────────────────────────────────────────────────────────────────────

function PropRow({
                     prop, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
                 }: {
    prop: PropSchema;
    index: number;
    onChange: (updated: PropSchema) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border rounded-lg bg-card overflow-hidden">
            <div className="flex items-center gap-2 p-3">
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab"/>
                <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                        value={prop.key}
                        onChange={(e) => onChange({...prop, key: e.target.value.replace(/[^a-z0-9_]/g, "")})}
                        placeholder="propKey"
                        className="h-7 text-xs font-mono"
                    />
                    <Input
                        value={prop.label}
                        onChange={(e) => onChange({...prop, label: e.target.value})}
                        placeholder="Human label"
                        className="h-7 text-xs"
                    />
                    <select
                        value={prop.type}
                        onChange={(e) => onChange({...prop, type: e.target.value as PropType})}
                        className="h-7 rounded border bg-background px-2 text-xs"
                    >
                        {PROP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={onMoveUp} disabled={isFirst}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30">
                        <ChevronUp className="h-3 w-3"/>
                    </button>
                    <button onClick={onMoveDown} disabled={isLast}
                            className="p-1 hover:bg-muted rounded disabled:opacity-30">
                        <ChevronDown className="h-3 w-3"/>
                    </button>
                    <button onClick={() => setExpanded((v) => !v)} className="p-1 hover:bg-muted rounded">
                        <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}/>
                    </button>
                    <button onClick={onRemove} className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded">
                        <X className="h-3 w-3"/>
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="border-t px-3 py-3 bg-muted/30 grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Default Value</Label>
                        <Input
                            value={String(prop.defaultValue ?? "")}
                            onChange={(e) => onChange({...prop, defaultValue: e.target.value})}
                            placeholder="Default value"
                            className="h-7 text-xs mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                            value={prop.placeholder ?? ""}
                            onChange={(e) => onChange({...prop, placeholder: e.target.value})}
                            placeholder="UI placeholder hint"
                            className="h-7 text-xs mt-1"
                        />
                    </div>
                    {prop.type === "select" && (
                        <div className="col-span-2">
                            <Label className="text-xs">Options (comma-separated)</Label>
                            <Input
                                value={(prop.options ?? []).join(",")}
                                onChange={(e) => onChange({
                                    ...prop,
                                    options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                })}
                                placeholder="option1,option2,option3"
                                className="h-7 text-xs mt-1"
                            />
                        </div>
                    )}
                    <div>
                        <Label className="text-xs">Group (optional)</Label>
                        <Input
                            value={prop.group ?? ""}
                            onChange={(e) => onChange({...prop, group: e.target.value})}
                            placeholder="Content, Style, Advanced..."
                            className="h-7 text-xs mt-1"
                        />
                    </div>
                    <div className="flex items-center gap-3 pt-4">
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="checkbox" checked={prop.required ?? false}
                                   onChange={(e) => onChange({...prop, required: e.target.checked})}
                                   className="rounded"/>
                            Required
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Preview Component
// ─────────────────────────────────────────────────────────────────────────────

function LivePreview({htmlTemplate, cssCode, jsCode, propsSchema}: {
    htmlTemplate: string; cssCode?: string; jsCode?: string; propsSchema: PropSchema[];
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Derive preview props from schema defaults
    const previewProps: Record<string, unknown> = {};
    for (const p of propsSchema) {
        previewProps[p.key] = p.defaultValue;
    }

    const rendered = renderTemplate(htmlTemplate, {props: previewProps});

    const iframeContent = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<style>:root{--color-primary:#4F46E5;--color-secondary:#0EA5E9;--color-accent:#22C55E;--color-bg:#ffffff;--color-text:#111827;--font-heading:'Georgia',serif;--font-body:'system-ui',sans-serif;--radius:8px;}*,*::before,*::after{box-sizing:border-box;}body{margin:0;font-family:var(--font-body);background:var(--color-bg);color:var(--color-text);}${cssCode ?? ""}</style>
</head><body>${rendered}<script>(function(){${jsCode ?? ""}})();</script></body></html>`;

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;
        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(iframeContent);
        doc.close();
    }, [iframeContent]);

    return (
        <div className="border rounded-lg overflow-hidden bg-white" style={{height: 300}}>
            {/*<iframe ref={iframeRef} className="w-full h-full border-0" title="Component Preview"*/}
            {/*        sandbox="allow-scripts"/>*/}
            <iframe ref={iframeRef} className="w-full h-full border-0" title="Component Preview"
                    sandbox="allow-scripts allow-same-origin"/>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function ComponentLibraryPage() {
    const [components, setComponents] = useState<PlanComponent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<ComponentCategory | "all">("all");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [form, setForm] = useState<ComponentForm>({...EMPTY_FORM});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [formTab, setFormTab] = useState("basic");

    const fetchComponents = useCallback(async () => {
        setIsLoading(true);
        const res = await fetch("/api/plan-components");
        const d = await res.json();
        if (d.success) setComponents(d.data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchComponents();
    }, [fetchComponents]);

    const filtered = components.filter((c) => {
        const matchCat = activeCategory === "all" || c.category === activeCategory;
        const matchSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase()) ||
            c.tags?.some((t) => t.includes(search.toLowerCase()));
        return matchCat && matchSearch;
    });

    const openEdit = (comp: PlanComponent) => {
        setForm({
            name: comp.name, key: comp.key, category: comp.category,
            description: comp.description ?? "", tags: comp.tags ?? [], siteTypes: comp.siteTypes ?? ["all"],
            previewImage: comp.previewImage ?? "", htmlTemplate: comp.htmlTemplate ?? "",
            cssCode: comp.cssCode ?? "", jsCode: comp.jsCode ?? "",
            propsSchema: comp.propsSchema ?? [],
            availableTo: comp.availableTo, isActive: comp.isActive,
            isFeatured: comp.isFeatured, isPremium: comp.isPremium,
        });
        setEditId(comp._id);
        setShowForm(true);
        setFormTab("basic");
    };

    const openCreate = (category?: ComponentCategory) => {
        const cat = category ?? "section";
        setForm({
            ...EMPTY_FORM,
            category: cat,
            htmlTemplate: CATEGORY_HTML_STARTERS[cat],
            propsSchema: CATEGORY_DEFAULT_PROPS[cat],
        });
        setEditId(null);
        setShowForm(true);
        setFormTab("basic");
    };

    const handleCategoryChange = (cat: ComponentCategory) => {
        setForm((f) => ({
            ...f,
            category: cat,
            htmlTemplate: f.htmlTemplate || CATEGORY_HTML_STARTERS[cat],
            propsSchema: f.propsSchema.length > 0 ? f.propsSchema : CATEGORY_DEFAULT_PROPS[cat],
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        const url = editId ? `/api/plan-components/${editId}` : "/api/plan-components";
        const method = editId ? "PUT" : "POST";
        try {
            const res = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(form),
            });
            const d = await res.json();
            if (d.success) {
                setShowForm(false);
                setEditId(null);
                setForm({...EMPTY_FORM});
                fetchComponents();
            } else {
                setError(d.error ?? "Failed to save");
            }
        } catch {
            setError("Network error. Please try again.");
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await fetch(`/api/plan-components/${deleteId}`, {method: "DELETE"});
        setDeleteId(null);
        fetchComponents();
    };

    const addProp = () => {
        setForm((f) => ({
            ...f,
            propsSchema: [...f.propsSchema, {
                key: `prop${f.propsSchema.length + 1}`,
                label: `Property ${f.propsSchema.length + 1}`,
                type: "text",
                defaultValue: "",
            }],
        }));
    };

    const updateProp = (index: number, updated: PropSchema) => {
        setForm((f) => {
            const ps = [...f.propsSchema];
            ps[index] = updated;
            return {...f, propsSchema: ps};
        });
    };

    const removeProp = (index: number) => {
        setForm((f) => ({...f, propsSchema: f.propsSchema.filter((_, i) => i !== index)}));
    };

    const moveProp = (index: number, dir: -1 | 1) => {
        setForm((f) => {
            const ps = [...f.propsSchema];
            const target = index + dir;
            if (target < 0 || target >= ps.length) return f;
            [ps[index], ps[target]] = [ps[target], ps[index]];
            return {...f, propsSchema: ps};
        });
    };

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase();
        if (tag && !form.tags.includes(tag)) {
            setForm((f) => ({...f, tags: [...f.tags, tag]}));
        }
        setTagInput("");
    };

    const togglePlan = (plan: PlanLevel) => {
        setForm((f) => ({
            ...f,
            availableTo: f.availableTo.includes(plan)
                ? f.availableTo.filter((p) => p !== plan)
                : [...f.availableTo, plan],
        }));
    };

    const toggleSiteType = (st: SiteType) => {
        setForm((f) => ({
            ...f,
            siteTypes: f.siteTypes.includes(st)
                ? f.siteTypes.filter((s) => s !== st)
                : [...f.siteTypes, st],
        }));
    };

    const loadCategoryStarter = () => {
        setForm((f) => ({
            ...f,
            htmlTemplate: CATEGORY_HTML_STARTERS[f.category],
            propsSchema: CATEGORY_DEFAULT_PROPS[f.category],
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Component Library</h1>
                    <p className="text-muted-foreground text-sm">
                        {components.length} components · Build the blocks users assemble into full websites
                    </p>
                </div>
                <Button variant="gradient" className="gap-2" onClick={() => openCreate()}>
                    <Plus className="h-4 w-4"/> Add Component
                </Button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                {CATEGORIES.map((cat) => {
                    const count = components.filter((c) => c.category === cat).length;
                    const {icon: Icon, color, label} = CATEGORY_META[cat];
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center hover:shadow-sm ${activeCategory === cat ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "bg-card hover:border-indigo-200"}`}
                        >
                            <Icon className={`h-4 w-4 mb-1 ${color}`}/>
                            <p className="text-xs font-medium">{label}</p>
                            <p className="text-lg font-bold leading-none mt-0.5">{count}</p>
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex gap-2 items-center flex-wrap">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search components..."
                        className="pl-8 pr-3 h-8 rounded-lg border bg-card text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
                <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm"
                        onClick={() => setActiveCategory("all")}>
                    All
                </Button>
                {CATEGORIES.map((cat) => {
                    const {icon: Icon, label} = CATEGORY_META[cat];
                    return (
                        <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} size="sm"
                                onClick={() => setActiveCategory(cat)} className="gap-1.5">
                            <Icon className="h-3.5 w-3.5"/>{label}
                        </Button>
                    );
                })}
            </div>

            {/* Quick-add by category */}
            {activeCategory !== "all" && (
                <div
                    className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20">
                    <span className="text-sm text-muted-foreground">Quick add:</span>
                    <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                            onClick={() => openCreate(activeCategory as ComponentCategory)}>
                        <Plus className="h-3 w-3"/> New {CATEGORY_META[activeCategory as ComponentCategory]?.label}
                    </Button>
                    <span
                        className="text-xs text-muted-foreground">— pre-filled with {CATEGORY_META[activeCategory as ComponentCategory]?.label} template & props</span>
                </div>
            )}

            {/* Component grid */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-48 skeleton rounded-xl"/>)}
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                        <p className="font-semibold">No components yet</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            {search ? `No results for "${search}"` : "Add your first component to get started."}
                        </p>
                        <Button variant="gradient" size="sm" onClick={() => openCreate()}>
                            <Plus className="h-4 w-4 mr-1.5"/> Add Component
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((comp) => {
                        const {icon: Icon, color} = CATEGORY_META[comp.category];
                        return (
                            <Card key={comp._id} className="group hover:shadow-md transition-all overflow-hidden">
                                {comp.previewImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={comp.previewImage} alt={comp.name} className="w-full h-32 object-cover"/>
                                ) : (
                                    <div
                                        className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                                        <Icon className={`h-8 w-8 ${color} opacity-40`}/>
                                    </div>
                                )}
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-1 mb-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div
                                                className={`shrink-0 flex h-5 w-5 items-center justify-center rounded ${color.replace("text-", "bg-").replace("500", "100")}`}>
                                                <Icon className={`h-3 w-3 ${color}`}/>
                                            </div>
                                            <span className="font-semibold text-sm truncate">{comp.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {comp.isFeatured &&
                                                <Star className="h-3 w-3 text-amber-400 fill-amber-400"/>}
                                            {comp.isPremium && <Lock className="h-3 w-3 text-purple-400"/>}
                                            {comp.isActive
                                                ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
                                                : <span className="h-1.5 w-1.5 rounded-full bg-slate-300"/>}
                                        </div>
                                    </div>
                                    {comp.description && (
                                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{comp.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {comp.availableTo.map((plan) => (
                                            <span key={plan}
                                                  className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${PLAN_COLORS[plan]}`}>{plan}</span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                        <Code className="h-3 w-3"/>
                                        <span className="font-mono truncate text-xs">{comp.key}</span>
                                        <span className="ml-auto">{comp.propsSchema?.length ?? 0} props</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" className="flex-1 gap-1 h-7 text-xs"
                                                onClick={() => openEdit(comp)}>
                                            <Edit className="h-3 w-3"/> Edit
                                        </Button>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(comp.key)}
                                            className="p-1.5 rounded border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            title="Copy key"
                                        >
                                            <Copy className="h-3 w-3"/>
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(comp._id)}
                                            className="p-1.5 rounded border hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3"/>
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
            <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center gap-2">
                            {editId ? <Edit className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
                            {editId ? "Edit Component" : "Add Component"}
                            {form.name && <span className="text-muted-foreground font-normal">— {form.name}</span>}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        {error && (
                            <div
                                className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2 mb-3">
                                <AlertCircle className="h-4 w-4 shrink-0"/>
                                {error}
                            </div>
                        )}

                        <Tabs value={formTab} onValueChange={setFormTab}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="code">HTML / CSS / JS</TabsTrigger>
                                <TabsTrigger value="props">Props Schema ({form.propsSchema.length})</TabsTrigger>
                                <TabsTrigger value="access">Access & Settings</TabsTrigger>
                                {showPreview && <TabsTrigger value="preview">Preview</TabsTrigger>}
                            </TabsList>

                            {/* ── Tab: Basic Info ────────────────────────────── */}
                            <TabsContent value="basic" className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Component Name *</Label>
                                        <Input value={form.name}
                                               onChange={(e) => setForm({...form, name: e.target.value})}
                                               placeholder="e.g. Hero with Gradient Background"/>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Key (unique, lowercase, underscores) *</Label>
                                        <Input value={form.key}
                                               onChange={(e) => setForm({
                                                   ...form,
                                                   key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                                               })}
                                               placeholder="hero_gradient_bg" className="font-mono"/>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Category *</Label>
                                        <select value={form.category}
                                                onChange={(e) => handleCategoryChange(e.target.value as ComponentCategory)}
                                                className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                            {CATEGORIES.map((c) => (
                                                <option key={c}
                                                        value={c}>{CATEGORY_META[c].label} — {CATEGORY_META[c].description}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Preview Image URL</Label>
                                        <Input value={form.previewImage}
                                               onChange={(e) => setForm({...form, previewImage: e.target.value})}
                                               placeholder="https://..."/>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Description</Label>
                                    <textarea value={form.description}
                                              onChange={(e) => setForm({...form, description: e.target.value})}
                                              rows={2}
                                              placeholder="What does this component do? When should it be used?"
                                              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"/>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Tags</Label>
                                    <div className="flex gap-2">
                                        <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                               onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                               placeholder="Add tag and press Enter" className="h-8 text-sm"/>
                                        <Button size="sm" variant="outline" onClick={addTag}
                                                className="h-8">Add</Button>
                                    </div>
                                    {form.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {form.tags.map((tag) => (
                                                <span key={tag}
                                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs">
                                                    {tag}
                                                    <button onClick={() => setForm((f) => ({
                                                        ...f,
                                                        tags: f.tags.filter((t) => t !== tag)
                                                    }))} className="hover:text-red-500">
                                                        <X className="h-2.5 w-2.5"/>
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs">Designed for Site Types</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {ALL_SITE_TYPES.map((st) => (
                                            <button key={st}
                                                    onClick={() => toggleSiteType(st)}
                                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${form.siteTypes.includes(st) ? "bg-indigo-600 text-white border-indigo-600" : "border-border hover:border-indigo-300"}`}>
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab: Code ─────────────────────────────────── */}
                            <TabsContent value="code" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Use <code className="bg-muted px-1 rounded">{"{{propKey}}"}</code> for
                                        substitutions,{" "}
                                        <code className="bg-muted px-1 rounded">{"{{#items}}...{{/items}}"}</code> for
                                        arrays,{" "}
                                        <code className="bg-muted px-1 rounded">{"{{html:key}}"}</code> for rich text.
                                        Tailwind classes work — CDN is auto-injected.
                                    </p>
                                    <div className="flex gap-2 shrink-0">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                                                onClick={loadCategoryStarter}>
                                            <RefreshCw className="h-3 w-3"/> Load Starter
                                        </Button>
                                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                                                onClick={() => {
                                                    setShowPreview(true);
                                                    setFormTab("preview");
                                                }}>
                                            <Eye className="h-3 w-3"/> Preview
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-emerald-600">HTML Template *</Label>
                                    <textarea
                                        value={form.htmlTemplate}
                                        onChange={(e) => setForm({...form, htmlTemplate: e.target.value})}
                                        rows={14}
                                        spellCheck={false}
                                        placeholder={CATEGORY_HTML_STARTERS[form.category]}
                                        className="w-full rounded-md border bg-zinc-950 text-emerald-300 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 leading-relaxed"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-sky-600">CSS (scoped
                                            styles)</Label>
                                        <textarea
                                            value={form.cssCode}
                                            onChange={(e) => setForm({...form, cssCode: e.target.value})}
                                            rows={6}
                                            spellCheck={false}
                                            placeholder={`/* Optional: extra CSS beyond Tailwind */\n.my-component { ... }`}
                                            className="w-full rounded-md border bg-zinc-950 text-sky-300 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 leading-relaxed"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-amber-600">JavaScript
                                            (optional)</Label>
                                        <textarea
                                            value={form.jsCode}
                                            onChange={(e) => setForm({...form, jsCode: e.target.value})}
                                            rows={6}
                                            spellCheck={false}
                                            placeholder={`// Runs after DOM ready\n// Scoped in IIFE automatically\ndocument.querySelector('.my-el')?.addEventListener('click', () => {})`}
                                            className="w-full rounded-md border bg-zinc-950 text-amber-300 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 leading-relaxed"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab: Props Schema ──────────────────────────── */}
                            <TabsContent value="props" className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Define what users can edit in the right panel. Each key must match a <code
                                        className="bg-muted px-1 rounded">{"{{key}}"}</code> in your HTML template.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
                                                onClick={loadCategoryStarter}>
                                            <RefreshCw className="h-3 w-3"/> Reset to Defaults
                                        </Button>
                                        <Button size="sm" variant="gradient" className="gap-1.5 h-7 text-xs"
                                                onClick={addProp}>
                                            <Plus className="h-3 w-3"/> Add Prop
                                        </Button>
                                    </div>
                                </div>

                                {form.propsSchema.length === 0 ? (
                                    <div className="border-2 border-dashed rounded-xl py-10 text-center">
                                        <p className="text-sm text-muted-foreground mb-3">No props yet — add props to
                                            make this component editable</p>
                                        <Button size="sm" variant="outline" onClick={addProp} className="gap-1.5">
                                            <Plus className="h-3.5 w-3.5"/> Add First Prop
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-3 gap-2 px-3 pb-1">
                                            <p className="text-xs font-medium text-muted-foreground">Key (template
                                                variable)</p>
                                            <p className="text-xs font-medium text-muted-foreground">Label (shown in
                                                editor)</p>
                                            <p className="text-xs font-medium text-muted-foreground">Type</p>
                                        </div>
                                        {form.propsSchema.map((prop, i) => (
                                            <PropRow
                                                key={i} prop={prop} index={i}
                                                onChange={(u) => updateProp(i, u)}
                                                onRemove={() => removeProp(i)}
                                                onMoveUp={() => moveProp(i, -1)}
                                                onMoveDown={() => moveProp(i, 1)}
                                                isFirst={i === 0}
                                                isLast={i === form.propsSchema.length - 1}
                                            />
                                        ))}
                                        <Button size="sm" variant="outline" onClick={addProp}
                                                className="w-full gap-1.5 border-dashed">
                                            <Plus className="h-3.5 w-3.5"/> Add Another Prop
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            {/* ── Tab: Access & Settings ─────────────────────── */}
                            <TabsContent value="access" className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Available to Plans</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ALL_PLANS.map((plan) => (
                                            <button key={plan}
                                                    onClick={() => togglePlan(plan)}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm capitalize font-medium transition-colors ${form.availableTo.includes(plan) ? "bg-indigo-600 text-white border-indigo-600" : "border-border hover:border-indigo-300"}`}>
                                                {form.availableTo.includes(plan) && <Check className="h-3.5 w-3.5"/>}
                                                {plan}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
                                    <Label className="text-xs font-semibold">Component Settings</Label>
                                    <div className="space-y-3">
                                        {[
                                            {
                                                key: "isActive",
                                                label: "Active",
                                                desc: "Visible to users on their allowed plan"
                                            },
                                            {
                                                key: "isFeatured",
                                                label: "Featured",
                                                desc: "Shown first / highlighted in library"
                                            },
                                            {
                                                key: "isPremium",
                                                label: "Premium Badge",
                                                desc: "Shows 'Pro' badge even within allowed plan"
                                            },
                                        ].map(({key, label, desc}) => (
                                            <label key={key} className="flex items-center gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(form[key as keyof ComponentForm])}
                                                    onChange={(e) => setForm({...form, [key]: e.target.checked})}
                                                    className="rounded h-4 w-4"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium">{label}</p>
                                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* ── Tab: Preview ───────────────────────────────── */}
                            {showPreview && (
                                <TabsContent value="preview">
                                    <LivePreview
                                        htmlTemplate={form.htmlTemplate}
                                        cssCode={form.cssCode}
                                        jsCode={form.jsCode}
                                        propsSchema={form.propsSchema}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Preview uses default prop values. Actual output depends on user's content.
                                    </p>
                                </TabsContent>
                            )}
                        </Tabs>
                    </div>

                    <DialogFooter className="shrink-0 border-t pt-4 mt-0">
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button variant="outline" className="gap-1.5"
                                onClick={() => {
                                    setShowPreview(true);
                                    setFormTab("preview");
                                }}>
                            <Eye className="h-4 w-4"/> Preview
                        </Button>
                        <Button variant="gradient" onClick={handleSave} isLoading={saving} className="gap-2 min-w-32">
                            <Save className="h-4 w-4"/>
                            {editId ? "Save Changes" : "Create Component"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(o) => !o && setDeleteId(null)}
                title="Delete Component"
                description="This permanently removes the component. Any user sites using this component will lose it on next render."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
}

// "use client";
// /**
//  * Super Admin — Component Library Manager
//  * Path: app/(dashboard)/dashboard/super-admin/components/page.tsx
//  *
//  * Features:
//  * - Create/edit/delete components for all 9 categories
//  * - Live HTML template editor with syntax highlighting hints
//  * - Visual prop schema builder (add/remove/reorder props per component)
//  * - Category-specific starter templates (click to pre-fill)
//  * - Live mini-preview of htmlTemplate + defaultProps
//  * - Tag management, site type targeting
//  * - Plan access control per component
//  */
//
// import {useEffect, useRef, useState, useCallback} from "react";
// import {
//     Plus, Edit, Trash2, Code, Layers, Sparkles, Zap, Save, Eye,
//     ChevronDown, ChevronUp, GripVertical, X, Copy, Search,
//     Globe, Layout, Navigation, PanelBottom, Box, Puzzle, Cpu,
//     Star, Lock, Check, AlertCircle, RefreshCw
// } from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Label, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent} from "@/components/ui/card";
// import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
// import {ConfirmDialog} from "@/components/shared/ConfirmDialog";
// import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
// import {renderTemplate} from "@/lib/builder/renderer";
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Types
// // ─────────────────────────────────────────────────────────────────────────────
//
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
// type PropType =
//     "text"
//     | "textarea"
//     | "richtext"
//     | "color"
//     | "image"
//     | "url"
//     | "select"
//     | "boolean"
//     | "number"
//     | "array"
//     | "icon";
// type PlanLevel = "free" | "silver" | "gold" | "diamond";
// type SiteType = "blog" | "portfolio" | "saas" | "ecommerce" | "restaurant" | "agency" | "all";
//
// interface PropSchema {
//     key: string;
//     label: string;
//     type: PropType;
//     defaultValue: unknown;
//     placeholder?: string;
//     options?: string[];
//     required?: boolean;
//     group?: string;
//     min?: number;
//     max?: number;
//     arrayItemSchema?: PropSchema[];
// }
//
// interface PlanComponent {
//     _id: string;
//     name: string;
//     key: string;
//     category: ComponentCategory;
//     description: string;
//     tags: string[];
//     siteTypes: SiteType[];
//     previewImage?: string;
//     htmlTemplate: string;
//     cssCode?: string;
//     jsCode?: string;
//     propsSchema: PropSchema[];
//     defaultProps: Record<string, unknown>;
//     availableTo: PlanLevel[];
//     isActive: boolean;
//     isFeatured: boolean;
//     isPremium: boolean;
//     usageCount: number;
// }
//
// interface ComponentForm {
//     name: string;
//     key: string;
//     category: ComponentCategory;
//     description: string;
//     tags: string[];
//     siteTypes: SiteType[];
//     previewImage: string;
//     htmlTemplate: string;
//     cssCode: string;
//     jsCode: string;
//     propsSchema: PropSchema[];
//     availableTo: PlanLevel[];
//     isActive: boolean;
//     isFeatured: boolean;
//     isPremium: boolean;
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Constants
// // ─────────────────────────────────────────────────────────────────────────────
//
// const CATEGORY_META: Record<ComponentCategory, {
//     label: string;
//     icon: React.ElementType;
//     color: string;
//     description: string
// }> = {
//     navbar: {label: "Navbar", icon: Navigation, color: "text-blue-500", description: "Top navigation bars"},
//     hero: {label: "Hero", icon: Layers, color: "text-purple-500", description: "Landing hero sections"},
//     section: {label: "Section", icon: Layout, color: "text-indigo-500", description: "General page sections"},
//     footer: {label: "Footer", icon: PanelBottom, color: "text-slate-500", description: "Footer components"},
//     layout: {label: "Layout", icon: Box, color: "text-cyan-500", description: "Grid & layout wrappers"},
//     widget: {label: "Widget", icon: Puzzle, color: "text-emerald-500", description: "Forms, pricing, FAQ"},
//     animation: {label: "Animation", icon: Sparkles, color: "text-pink-500", description: "Animation presets"},
//     template: {label: "Template", icon: Code, color: "text-orange-500", description: "Full page templates"},
//     integration: {label: "Integration", icon: Cpu, color: "text-red-500", description: "Third-party embeds"},
// };
//
// const PLAN_COLORS: Record<PlanLevel, string> = {
//     free: "bg-slate-100 text-slate-700",
//     silver: "bg-blue-100 text-blue-700",
//     gold: "bg-amber-100 text-amber-700",
//     diamond: "bg-purple-100 text-purple-700",
// };
//
// const ALL_PLANS: PlanLevel[] = ["free", "silver", "gold", "diamond"];
// const ALL_SITE_TYPES: SiteType[] = ["all", "blog", "portfolio", "saas", "ecommerce", "restaurant", "agency"];
// const CATEGORIES = Object.keys(CATEGORY_META) as ComponentCategory[];
// const PROP_TYPES: PropType[] = ["text", "textarea", "richtext", "color", "image", "url", "select", "boolean", "number", "array", "icon"];
//
// // Category-specific HTML starter templates
// const CATEGORY_HTML_STARTERS: Record<ComponentCategory, string> = {
//     navbar: `<nav class="w-full px-6 py-4 flex items-center justify-between" style="background:var(--color-bg);border-bottom:1px solid rgba(0,0,0,0.08);">
//   <a href="/" class="font-bold text-xl" style="font-family:var(--font-heading);color:var(--color-primary);">{{siteName}}</a>
//   <div class="hidden md:flex items-center gap-6">
//     {{#navLinks}}<a href="{{href}}" class="text-sm font-medium hover:opacity-70 transition-opacity">{{label}}</a>{{/navLinks}}
//   </div>
//   {{#ctaLabel}}<a href="{{ctaHref}}" class="px-4 py-2 rounded text-sm font-semibold text-white" style="background:var(--color-primary);">{{ctaLabel}}</a>{{/ctaLabel}}
// </nav>`,
//
//     hero: `<section class="py-24 px-6 text-center" style="background:var(--color-bg);">
//   <div class="max-w-4xl mx-auto">
//     {{#badge}}<span class="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4" style="background:var(--color-primary)20;color:var(--color-primary);">{{badge}}</span>{{/badge}}
//     <h1 class="text-5xl font-bold mb-6" style="font-family:var(--font-heading);">{{headline}}</h1>
//     <p class="text-xl mb-8 opacity-70">{{subtext}}</p>
//     <div class="flex items-center justify-center gap-4 flex-wrap">
//       <a href="{{ctaHref}}" class="px-8 py-3 rounded-lg font-semibold text-white" style="background:var(--color-primary);">{{ctaLabel}}</a>
//       {{#secondaryLabel}}<a href="{{secondaryHref}}" class="px-8 py-3 rounded-lg font-semibold border" style="border-color:var(--color-primary);color:var(--color-primary);">{{secondaryLabel}}</a>{{/secondaryLabel}}
//     </div>
//   </div>
// </section>`,
//
//     section: `<section class="py-20 px-6" style="background:var(--color-bg);">
//   <div class="max-w-6xl mx-auto">
//     <div class="text-center mb-12">
//       <h2 class="text-3xl font-bold mb-4" style="font-family:var(--font-heading);">{{heading}}</h2>
//       <p class="text-lg opacity-70 max-w-2xl mx-auto">{{subheading}}</p>
//     </div>
//     <div class="grid md:grid-cols-3 gap-8">
//       {{#items}}<div class="p-6 rounded-xl border">
//         <h3 class="font-semibold text-lg mb-2">{{title}}</h3>
//         <p class="opacity-70 text-sm">{{description}}</p>
//       </div>{{/items}}
//     </div>
//   </div>
// </section>`,
//
//     footer: `<footer class="py-12 px-6" style="background:#111;color:#fff;">
//   <div class="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
//     <div>
//       <h3 class="font-bold text-lg mb-2" style="font-family:var(--font-heading);">{{siteName}}</h3>
//       <p class="text-sm opacity-60">{{tagline}}</p>
//     </div>
//     {{#columns}}<div>
//       <h4 class="font-semibold mb-3">{{heading}}</h4>
//       <ul class="space-y-2 text-sm opacity-60">{{#links}}<li><a href="{{href}}" class="hover:opacity-100">{{label}}</a></li>{{/links}}</ul>
//     </div>{{/columns}}
//   </div>
//   <div class="border-t border-white/10 pt-6 text-center text-sm opacity-50">{{copyright}}</div>
// </footer>`,
//
//     layout: `<div class="w-full max-w-7xl mx-auto px-6 py-8">
//   <div class="grid gap-8" style="grid-template-columns:repeat({{columns}},1fr);">
//     <!-- Layout slot — children components render here -->
//   </div>
// </div>`,
//
//     widget: `<div class="py-16 px-6">
//   <div class="max-w-lg mx-auto text-center">
//     <h2 class="text-2xl font-bold mb-2" style="font-family:var(--font-heading);">{{heading}}</h2>
//     <p class="opacity-70 mb-6">{{subtext}}</p>
//     <form class="flex gap-2">
//       <input type="email" placeholder="{{placeholder}}" class="flex-1 px-4 py-2 rounded-lg border" style="border-color:var(--color-primary)40;"/>
//       <button type="submit" class="px-6 py-2 rounded-lg text-white font-semibold" style="background:var(--color-primary);">{{buttonLabel}}</button>
//     </form>
//   </div>
// </div>`,
//
//     animation: `<style>
// @keyframes {{animationName}} {
//   from { {{fromState}} }
//   to { {{toState}} }
// }
// .anim-{{animationName}} {
//   animation: {{animationName}} {{duration}}s {{easing}} {{delay}}s {{fillMode}};
// }
// </style>
// <!-- Apply class "anim-{{animationName}}" to any element to trigger this animation -->`,
//
//     template: `<!DOCTYPE html>
// <!-- Full page template — include all sections here -->
// <div class="min-h-screen" style="background:var(--color-bg);color:var(--color-text);">
//   <!-- Navbar slot -->
//   <!-- Hero slot -->
//   <!-- Content sections -->
//   <!-- Footer slot -->
// </div>`,
//
//     integration: `<!-- {{serviceName}} Integration -->
// <div id="{{containerId}}" data-key="{{embedKey}}"></div>
// <script>
// (function(){
//   // {{serviceName}} embed script
//   {{embedCode}}
// })();
// </script>`,
// };
//
// // Category-specific default prop schemas
// const CATEGORY_DEFAULT_PROPS: Record<ComponentCategory, PropSchema[]> = {
//     navbar: [
//         {key: "siteName", label: "Site Name", type: "text", defaultValue: "My Site"},
//         {
//             key: "navLinks",
//             label: "Navigation Links",
//             type: "array",
//             defaultValue: [{label: "Home", href: "/"}, {label: "About", href: "/about"}, {
//                 label: "Blog",
//                 href: "/blog"
//             }],
//             arrayItemSchema: [{key: "label", label: "Link Label", type: "text", defaultValue: ""}, {
//                 key: "href",
//                 label: "URL",
//                 type: "url",
//                 defaultValue: "/"
//             }]
//         },
//         {
//             key: "ctaLabel",
//             label: "CTA Button Label",
//             type: "text",
//             defaultValue: "Get Started",
//             placeholder: "Leave blank to hide"
//         },
//         {key: "ctaHref", label: "CTA Button URL", type: "url", defaultValue: "#"},
//     ],
//     hero: [
//         {key: "headline", label: "Headline", type: "text", defaultValue: "Build Something Amazing", required: true},
//         {
//             key: "subtext",
//             label: "Subtext",
//             type: "textarea",
//             defaultValue: "The fastest way to launch your next project."
//         },
//         {key: "ctaLabel", label: "Primary CTA", type: "text", defaultValue: "Get Started Free"},
//         {key: "ctaHref", label: "Primary CTA URL", type: "url", defaultValue: "#"},
//         {
//             key: "secondaryLabel",
//             label: "Secondary CTA",
//             type: "text",
//             defaultValue: "See Demo",
//             placeholder: "Leave blank to hide"
//         },
//         {key: "secondaryHref", label: "Secondary CTA URL", type: "url", defaultValue: "#"},
//         {
//             key: "badge",
//             label: "Badge Text",
//             type: "text",
//             defaultValue: "🚀 Now in beta",
//             placeholder: "Leave blank to hide"
//         },
//         {key: "backgroundImage", label: "Background Image", type: "image", defaultValue: ""},
//     ],
//     section: [
//         {key: "heading", label: "Section Heading", type: "text", defaultValue: "Our Features", required: true},
//         {
//             key: "subheading",
//             label: "Section Subheading",
//             type: "textarea",
//             defaultValue: "Everything you need to succeed."
//         },
//         {
//             key: "items", label: "Items", type: "array", defaultValue: [
//                 {title: "Fast", description: "Blazing fast performance out of the box."},
//                 {title: "Secure", description: "Enterprise-grade security built in."},
//                 {title: "Scalable", description: "Grows with your business."},
//             ], arrayItemSchema: [
//                 {key: "title", label: "Title", type: "text", defaultValue: ""},
//                 {key: "description", label: "Description", type: "textarea", defaultValue: ""},
//                 {key: "icon", label: "Icon", type: "icon", defaultValue: "star"},
//                 {key: "image", label: "Image URL", type: "image", defaultValue: ""},
//             ]
//         },
//     ],
//     footer: [
//         {key: "siteName", label: "Site Name", type: "text", defaultValue: "My Site"},
//         {key: "tagline", label: "Tagline", type: "text", defaultValue: "Building the future."},
//         {key: "copyright", label: "Copyright Text", type: "text", defaultValue: "© 2025. All rights reserved."},
//         {
//             key: "columns", label: "Link Columns", type: "array", defaultValue: [], arrayItemSchema: [
//                 {key: "heading", label: "Column Heading", type: "text", defaultValue: ""},
//                 {
//                     key: "links", label: "Links", type: "array", defaultValue: [], arrayItemSchema: [
//                         {key: "label", label: "Label", type: "text", defaultValue: ""},
//                         {key: "href", label: "URL", type: "url", defaultValue: "/"},
//                     ]
//                 },
//             ]
//         },
//     ],
//     layout: [
//         {key: "columns", label: "Number of Columns", type: "number", defaultValue: 3, min: 1, max: 6},
//         {key: "gap", label: "Gap Size", type: "select", defaultValue: "8", options: ["2", "4", "6", "8", "12", "16"]},
//         {
//             key: "maxWidth",
//             label: "Max Width",
//             type: "select",
//             defaultValue: "7xl",
//             options: ["sm", "md", "lg", "xl", "2xl", "4xl", "6xl", "7xl", "full"]
//         },
//     ],
//     widget: [
//         {key: "heading", label: "Widget Heading", type: "text", defaultValue: "Stay Updated", required: true},
//         {
//             key: "subtext",
//             label: "Widget Subtext",
//             type: "text",
//             defaultValue: "Get the latest updates delivered to your inbox."
//         },
//         {key: "buttonLabel", label: "Button Label", type: "text", defaultValue: "Subscribe"},
//         {key: "placeholder", label: "Input Placeholder", type: "text", defaultValue: "Enter your email"},
//     ],
//     animation: [
//         {key: "animationName", label: "Animation Name (CSS)", type: "text", defaultValue: "fadeIn"},
//         {key: "duration", label: "Duration (seconds)", type: "number", defaultValue: 0.6, min: 0.1, max: 5},
//         {
//             key: "easing",
//             label: "Easing",
//             type: "select",
//             defaultValue: "ease-out",
//             options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear", "cubic-bezier(0.34,1.56,0.64,1)"]
//         },
//         {key: "delay", label: "Delay (seconds)", type: "number", defaultValue: 0, min: 0, max: 3},
//         {
//             key: "fromState",
//             label: "From State (CSS properties)",
//             type: "textarea",
//             defaultValue: "opacity:0;transform:translateY(20px)"
//         },
//         {
//             key: "toState",
//             label: "To State (CSS properties)",
//             type: "textarea",
//             defaultValue: "opacity:1;transform:translateY(0)"
//         },
//         {
//             key: "fillMode",
//             label: "Fill Mode",
//             type: "select",
//             defaultValue: "both",
//             options: ["none", "forwards", "backwards", "both"]
//         },
//     ],
//     template: [
//         {key: "pageTitle", label: "Page Title", type: "text", defaultValue: "Welcome"},
//     ],
//     integration: [
//         {key: "serviceName", label: "Service Name", type: "text", defaultValue: "My Service"},
//         {key: "embedCode", label: "Embed / Script Code", type: "textarea", defaultValue: ""},
//         {key: "containerId", label: "Container ID", type: "text", defaultValue: "embed-container"},
//         {key: "embedKey", label: "API / Embed Key", type: "text", defaultValue: ""},
//     ],
// };
//
// const EMPTY_FORM: ComponentForm = {
//     name: "", key: "", category: "section", description: "",
//     tags: [], siteTypes: ["all"],
//     previewImage: "", htmlTemplate: "", cssCode: "", jsCode: "",
//     propsSchema: [], availableTo: ["free", "silver", "gold", "diamond"],
//     isActive: true, isFeatured: false, isPremium: false,
// };
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Prop Schema Row Component
// // ─────────────────────────────────────────────────────────────────────────────
//
// function PropRow({
//                      prop, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast,
//                  }: {
//     prop: PropSchema;
//     index: number;
//     onChange: (updated: PropSchema) => void;
//     onRemove: () => void;
//     onMoveUp: () => void;
//     onMoveDown: () => void;
//     isFirst: boolean;
//     isLast: boolean;
// }) {
//     const [expanded, setExpanded] = useState(false);
//
//     return (
//         <div className="border rounded-lg bg-card overflow-hidden">
//             <div className="flex items-center gap-2 p-3">
//                 <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab"/>
//                 <div className="flex-1 grid grid-cols-3 gap-2">
//                     <Input
//                         value={prop.key}
//                         onChange={(e) => onChange({...prop, key: e.target.value.replace(/[^a-z0-9_]/g, "")})}
//                         placeholder="propKey"
//                         className="h-7 text-xs font-mono"
//                     />
//                     <Input
//                         value={prop.label}
//                         onChange={(e) => onChange({...prop, label: e.target.value})}
//                         placeholder="Human label"
//                         className="h-7 text-xs"
//                     />
//                     <select
//                         value={prop.type}
//                         onChange={(e) => onChange({...prop, type: e.target.value as PropType})}
//                         className="h-7 rounded border bg-background px-2 text-xs"
//                     >
//                         {PROP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
//                     </select>
//                 </div>
//                 <div className="flex items-center gap-1 shrink-0">
//                     <button onClick={onMoveUp} disabled={isFirst}
//                             className="p-1 hover:bg-muted rounded disabled:opacity-30">
//                         <ChevronUp className="h-3 w-3"/>
//                     </button>
//                     <button onClick={onMoveDown} disabled={isLast}
//                             className="p-1 hover:bg-muted rounded disabled:opacity-30">
//                         <ChevronDown className="h-3 w-3"/>
//                     </button>
//                     <button onClick={() => setExpanded((v) => !v)} className="p-1 hover:bg-muted rounded">
//                         <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}/>
//                     </button>
//                     <button onClick={onRemove} className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded">
//                         <X className="h-3 w-3"/>
//                     </button>
//                 </div>
//             </div>
//             {expanded && (
//                 <div className="border-t px-3 py-3 bg-muted/30 grid grid-cols-2 gap-3">
//                     <div>
//                         <Label className="text-xs">Default Value</Label>
//                         <Input
//                             value={String(prop.defaultValue ?? "")}
//                             onChange={(e) => onChange({...prop, defaultValue: e.target.value})}
//                             placeholder="Default value"
//                             className="h-7 text-xs mt-1"
//                         />
//                     </div>
//                     <div>
//                         <Label className="text-xs">Placeholder</Label>
//                         <Input
//                             value={prop.placeholder ?? ""}
//                             onChange={(e) => onChange({...prop, placeholder: e.target.value})}
//                             placeholder="UI placeholder hint"
//                             className="h-7 text-xs mt-1"
//                         />
//                     </div>
//                     {prop.type === "select" && (
//                         <div className="col-span-2">
//                             <Label className="text-xs">Options (comma-separated)</Label>
//                             <Input
//                                 value={(prop.options ?? []).join(",")}
//                                 onChange={(e) => onChange({
//                                     ...prop,
//                                     options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
//                                 })}
//                                 placeholder="option1,option2,option3"
//                                 className="h-7 text-xs mt-1"
//                             />
//                         </div>
//                     )}
//                     <div>
//                         <Label className="text-xs">Group (optional)</Label>
//                         <Input
//                             value={prop.group ?? ""}
//                             onChange={(e) => onChange({...prop, group: e.target.value})}
//                             placeholder="Content, Style, Advanced..."
//                             className="h-7 text-xs mt-1"
//                         />
//                     </div>
//                     <div className="flex items-center gap-3 pt-4">
//                         <label className="flex items-center gap-1.5 text-xs cursor-pointer">
//                             <input type="checkbox" checked={prop.required ?? false}
//                                    onChange={(e) => onChange({...prop, required: e.target.checked})}
//                                    className="rounded"/>
//                             Required
//                         </label>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Live Preview Component
// // ─────────────────────────────────────────────────────────────────────────────
//
// function LivePreview({htmlTemplate, cssCode, jsCode, propsSchema}: {
//     htmlTemplate: string; cssCode?: string; jsCode?: string; propsSchema: PropSchema[];
// }) {
//     const iframeRef = useRef<HTMLIFrameElement>(null);
//
//     // Derive preview props from schema defaults
//     const previewProps: Record<string, unknown> = {};
//     for (const p of propsSchema) {
//         previewProps[p.key] = p.defaultValue;
//     }
//
//     const rendered = renderTemplate(htmlTemplate, {props: previewProps});
//
//     const iframeContent = `<!DOCTYPE html>
// <html><head>
// <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
// <script src="https://cdn.tailwindcss.com"></script>
// <style>:root{--color-primary:#4F46E5;--color-secondary:#0EA5E9;--color-accent:#22C55E;--color-bg:#ffffff;--color-text:#111827;--font-heading:'Georgia',serif;--font-body:'system-ui',sans-serif;--radius:8px;}*,*::before,*::after{box-sizing:border-box;}body{margin:0;font-family:var(--font-body);background:var(--color-bg);color:var(--color-text);}${cssCode ?? ""}</style>
// </head><body>${rendered}<script>(function(){${jsCode ?? ""}})();</script></body></html>`;
//
//     useEffect(() => {
//         const iframe = iframeRef.current;
//         if (!iframe) return;
//         const doc = iframe.contentDocument;
//         if (!doc) return;
//         doc.open();
//         doc.write(iframeContent);
//         doc.close();
//     }, [iframeContent]);
//
//     return (
//         <div className="border rounded-lg overflow-hidden bg-white" style={{height: 300}}>
//             <iframe ref={iframeRef} className="w-full h-full border-0" title="Component Preview"
//                     sandbox="allow-scripts"/>
//         </div>
//     );
// }
//
// // ─────────────────────────────────────────────────────────────────────────────
// // Main Page
// // ─────────────────────────────────────────────────────────────────────────────
//
// export default function ComponentLibraryPage() {
//     const [components, setComponents] = useState<PlanComponent[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [activeCategory, setActiveCategory] = useState<ComponentCategory | "all">("all");
//     const [search, setSearch] = useState("");
//     const [showForm, setShowForm] = useState(false);
//     const [editId, setEditId] = useState<string | null>(null);
//     const [deleteId, setDeleteId] = useState<string | null>(null);
//     const [form, setForm] = useState<ComponentForm>({...EMPTY_FORM});
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState("");
//     const [tagInput, setTagInput] = useState("");
//     const [showPreview, setShowPreview] = useState(false);
//     const [formTab, setFormTab] = useState("basic");
//
//     const fetchComponents = useCallback(async () => {
//         setIsLoading(true);
//         const res = await fetch("/api/plan-components");
//         const d = await res.json();
//         if (d.success) setComponents(d.data);
//         setIsLoading(false);
//     }, []);
//
//     useEffect(() => {
//         fetchComponents();
//     }, [fetchComponents]);
//
//     const filtered = components.filter((c) => {
//         const matchCat = activeCategory === "all" || c.category === activeCategory;
//         const matchSearch = !search ||
//             c.name.toLowerCase().includes(search.toLowerCase()) ||
//             c.description?.toLowerCase().includes(search.toLowerCase()) ||
//             c.tags?.some((t) => t.includes(search.toLowerCase()));
//         return matchCat && matchSearch;
//     });
//
//     const openEdit = (comp: PlanComponent) => {
//         setForm({
//             name: comp.name, key: comp.key, category: comp.category,
//             description: comp.description ?? "", tags: comp.tags ?? [], siteTypes: comp.siteTypes ?? ["all"],
//             previewImage: comp.previewImage ?? "", htmlTemplate: comp.htmlTemplate ?? "",
//             cssCode: comp.cssCode ?? "", jsCode: comp.jsCode ?? "",
//             propsSchema: comp.propsSchema ?? [],
//             availableTo: comp.availableTo, isActive: comp.isActive,
//             isFeatured: comp.isFeatured, isPremium: comp.isPremium,
//         });
//         setEditId(comp._id);
//         setShowForm(true);
//         setFormTab("basic");
//     };
//
//     const openCreate = (category?: ComponentCategory) => {
//         const cat = category ?? "section";
//         setForm({
//             ...EMPTY_FORM,
//             category: cat,
//             htmlTemplate: CATEGORY_HTML_STARTERS[cat],
//             propsSchema: CATEGORY_DEFAULT_PROPS[cat],
//         });
//         setEditId(null);
//         setShowForm(true);
//         setFormTab("basic");
//     };
//
//     const handleCategoryChange = (cat: ComponentCategory) => {
//         setForm((f) => ({
//             ...f,
//             category: cat,
//             htmlTemplate: f.htmlTemplate || CATEGORY_HTML_STARTERS[cat],
//             propsSchema: f.propsSchema.length > 0 ? f.propsSchema : CATEGORY_DEFAULT_PROPS[cat],
//         }));
//     };
//
//     const handleSave = async () => {
//         setSaving(true);
//         setError("");
//         const url = editId ? `/api/plan-components/${editId}` : "/api/plan-components";
//         const method = editId ? "PUT" : "POST";
//         try {
//             const res = await fetch(url, {
//                 method,
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify(form),
//             });
//             const d = await res.json();
//             if (d.success) {
//                 setShowForm(false);
//                 setEditId(null);
//                 setForm({...EMPTY_FORM});
//                 fetchComponents();
//             } else {
//                 setError(d.error ?? "Failed to save");
//             }
//         } catch {
//             setError("Network error. Please try again.");
//         }
//         setSaving(false);
//     };
//
//     const handleDelete = async () => {
//         if (!deleteId) return;
//         await fetch(`/api/plan-components/${deleteId}`, {method: "DELETE"});
//         setDeleteId(null);
//         fetchComponents();
//     };
//
//     const addProp = () => {
//         setForm((f) => ({
//             ...f,
//             propsSchema: [...f.propsSchema, {
//                 key: `prop${f.propsSchema.length + 1}`,
//                 label: `Property ${f.propsSchema.length + 1}`,
//                 type: "text",
//                 defaultValue: "",
//             }],
//         }));
//     };
//
//     const updateProp = (index: number, updated: PropSchema) => {
//         setForm((f) => {
//             const ps = [...f.propsSchema];
//             ps[index] = updated;
//             return {...f, propsSchema: ps};
//         });
//     };
//
//     const removeProp = (index: number) => {
//         setForm((f) => ({...f, propsSchema: f.propsSchema.filter((_, i) => i !== index)}));
//     };
//
//     const moveProp = (index: number, dir: -1 | 1) => {
//         setForm((f) => {
//             const ps = [...f.propsSchema];
//             const target = index + dir;
//             if (target < 0 || target >= ps.length) return f;
//             [ps[index], ps[target]] = [ps[target], ps[index]];
//             return {...f, propsSchema: ps};
//         });
//     };
//
//     const addTag = () => {
//         const tag = tagInput.trim().toLowerCase();
//         if (tag && !form.tags.includes(tag)) {
//             setForm((f) => ({...f, tags: [...f.tags, tag]}));
//         }
//         setTagInput("");
//     };
//
//     const togglePlan = (plan: PlanLevel) => {
//         setForm((f) => ({
//             ...f,
//             availableTo: f.availableTo.includes(plan)
//                 ? f.availableTo.filter((p) => p !== plan)
//                 : [...f.availableTo, plan],
//         }));
//     };
//
//     const toggleSiteType = (st: SiteType) => {
//         setForm((f) => ({
//             ...f,
//             siteTypes: f.siteTypes.includes(st)
//                 ? f.siteTypes.filter((s) => s !== st)
//                 : [...f.siteTypes, st],
//         }));
//     };
//
//     const loadCategoryStarter = () => {
//         setForm((f) => ({
//             ...f,
//             htmlTemplate: CATEGORY_HTML_STARTERS[f.category],
//             propsSchema: CATEGORY_DEFAULT_PROPS[f.category],
//         }));
//     };
//
//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between flex-wrap gap-3">
//                 <div>
//                     <h1 className="text-2xl font-bold">Component Library</h1>
//                     <p className="text-muted-foreground text-sm">
//                         {components.length} components · Build the blocks users assemble into full websites
//                     </p>
//                 </div>
//                 <Button variant="gradient" className="gap-2" onClick={() => openCreate()}>
//                     <Plus className="h-4 w-4"/> Add Component
//                 </Button>
//             </div>
//
//             {/* Stats strip */}
//             <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
//                 {CATEGORIES.map((cat) => {
//                     const count = components.filter((c) => c.category === cat).length;
//                     const {icon: Icon, color, label} = CATEGORY_META[cat];
//                     return (
//                         <button
//                             key={cat}
//                             onClick={() => setActiveCategory(cat)}
//                             className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center hover:shadow-sm ${activeCategory === cat ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "bg-card hover:border-indigo-200"}`}
//                         >
//                             <Icon className={`h-4 w-4 mb-1 ${color}`}/>
//                             <p className="text-xs font-medium">{label}</p>
//                             <p className="text-lg font-bold leading-none mt-0.5">{count}</p>
//                         </button>
//                     );
//                 })}
//             </div>
//
//             {/* Filters */}
//             <div className="flex gap-2 items-center flex-wrap">
//                 <div className="relative">
//                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
//                     <input
//                         value={search}
//                         onChange={(e) => setSearch(e.target.value)}
//                         placeholder="Search components..."
//                         className="pl-8 pr-3 h-8 rounded-lg border bg-card text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
//                     />
//                 </div>
//                 <Button variant={activeCategory === "all" ? "default" : "outline"} size="sm"
//                         onClick={() => setActiveCategory("all")}>
//                     All
//                 </Button>
//                 {CATEGORIES.map((cat) => {
//                     const {icon: Icon, label} = CATEGORY_META[cat];
//                     return (
//                         <Button key={cat} variant={activeCategory === cat ? "default" : "outline"} size="sm"
//                                 onClick={() => setActiveCategory(cat)} className="gap-1.5">
//                             <Icon className="h-3.5 w-3.5"/>{label}
//                         </Button>
//                     );
//                 })}
//             </div>
//
//             {/* Quick-add by category */}
//             {activeCategory !== "all" && (
//                 <div
//                     className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20">
//                     <span className="text-sm text-muted-foreground">Quick add:</span>
//                     <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
//                             onClick={() => openCreate(activeCategory as ComponentCategory)}>
//                         <Plus className="h-3 w-3"/> New {CATEGORY_META[activeCategory as ComponentCategory]?.label}
//                     </Button>
//                     <span
//                         className="text-xs text-muted-foreground">— pre-filled with {CATEGORY_META[activeCategory as ComponentCategory]?.label} template & props</span>
//                 </div>
//             )}
//
//             {/* Component grid */}
//             {isLoading ? (
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                     {[...Array(8)].map((_, i) => <div key={i} className="h-48 skeleton rounded-xl"/>)}
//                 </div>
//             ) : filtered.length === 0 ? (
//                 <Card>
//                     <CardContent className="flex flex-col items-center justify-center py-16 text-center">
//                         <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3"/>
//                         <p className="font-semibold">No components yet</p>
//                         <p className="text-sm text-muted-foreground mt-1 mb-4">
//                             {search ? `No results for "${search}"` : "Add your first component to get started."}
//                         </p>
//                         <Button variant="gradient" size="sm" onClick={() => openCreate()}>
//                             <Plus className="h-4 w-4 mr-1.5"/> Add Component
//                         </Button>
//                     </CardContent>
//                 </Card>
//             ) : (
//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//                     {filtered.map((comp) => {
//                         const {icon: Icon, color} = CATEGORY_META[comp.category];
//                         return (
//                             <Card key={comp._id} className="group hover:shadow-md transition-all overflow-hidden">
//                                 {comp.previewImage ? (
//                                     // eslint-disable-next-line @next/next/no-img-element
//                                     <img src={comp.previewImage} alt={comp.name} className="w-full h-32 object-cover"/>
//                                 ) : (
//                                     <div
//                                         className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
//                                         <Icon className={`h-8 w-8 ${color} opacity-40`}/>
//                                     </div>
//                                 )}
//                                 <CardContent className="p-3">
//                                     <div className="flex items-start justify-between gap-1 mb-1.5">
//                                         <div className="flex items-center gap-1.5 min-w-0">
//                                             <div
//                                                 className={`shrink-0 flex h-5 w-5 items-center justify-center rounded ${color.replace("text-", "bg-").replace("500", "100")}`}>
//                                                 <Icon className={`h-3 w-3 ${color}`}/>
//                                             </div>
//                                             <span className="font-semibold text-sm truncate">{comp.name}</span>
//                                         </div>
//                                         <div className="flex items-center gap-1 shrink-0">
//                                             {comp.isFeatured &&
//                                                 <Star className="h-3 w-3 text-amber-400 fill-amber-400"/>}
//                                             {comp.isPremium && <Lock className="h-3 w-3 text-purple-400"/>}
//                                             {comp.isActive
//                                                 ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>
//                                                 : <span className="h-1.5 w-1.5 rounded-full bg-slate-300"/>}
//                                         </div>
//                                     </div>
//                                     {comp.description && (
//                                         <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{comp.description}</p>
//                                     )}
//                                     <div className="flex flex-wrap gap-1 mb-2">
//                                         {comp.availableTo.map((plan) => (
//                                             <span key={plan}
//                                                   className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${PLAN_COLORS[plan]}`}>{plan}</span>
//                                         ))}
//                                     </div>
//                                     <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
//                                         <Code className="h-3 w-3"/>
//                                         <span className="font-mono truncate text-xs">{comp.key}</span>
//                                         <span className="ml-auto">{comp.propsSchema?.length ?? 0} props</span>
//                                     </div>
//                                     <div className="flex gap-1">
//                                         <Button variant="outline" size="sm" className="flex-1 gap-1 h-7 text-xs"
//                                                 onClick={() => openEdit(comp)}>
//                                             <Edit className="h-3 w-3"/> Edit
//                                         </Button>
//                                         <button
//                                             onClick={() => navigator.clipboard.writeText(comp.key)}
//                                             className="p-1.5 rounded border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
//                                             title="Copy key"
//                                         >
//                                             <Copy className="h-3 w-3"/>
//                                         </button>
//                                         <button
//                                             onClick={() => setDeleteId(comp._id)}
//                                             className="p-1.5 rounded border hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
//                                         >
//                                             <Trash2 className="h-3 w-3"/>
//                                         </button>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         );
//                     })}
//                 </div>
//             )}
//
//             {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
//             <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
//                 <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
//                     <DialogHeader className="shrink-0">
//                         <DialogTitle className="flex items-center gap-2">
//                             {editId ? <Edit className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
//                             {editId ? "Edit Component" : "Add Component"}
//                             {form.name && <span className="text-muted-foreground font-normal">— {form.name}</span>}
//                         </DialogTitle>
//                     </DialogHeader>
//
//                     <div className="flex-1 overflow-y-auto">
//                         {error && (
//                             <div
//                                 className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2 mb-3">
//                                 <AlertCircle className="h-4 w-4 shrink-0"/>
//                                 {error}
//                             </div>
//                         )}
//
//                         <Tabs value={formTab} onValueChange={setFormTab}>
//                             <TabsList className="mb-4">
//                                 <TabsTrigger value="basic">Basic Info</TabsTrigger>
//                                 <TabsTrigger value="code">HTML / CSS / JS</TabsTrigger>
//                                 <TabsTrigger value="props">Props Schema ({form.propsSchema.length})</TabsTrigger>
//                                 <TabsTrigger value="access">Access & Settings</TabsTrigger>
//                                 {showPreview && <TabsTrigger value="preview">Preview</TabsTrigger>}
//                             </TabsList>
//
//                             {/* ── Tab: Basic Info ────────────────────────────── */}
//                             <TabsContent value="basic" className="space-y-4">
//                                 <div className="grid grid-cols-2 gap-3">
//                                     <div className="space-y-1.5">
//                                         <Label className="text-xs">Component Name *</Label>
//                                         <Input value={form.name}
//                                                onChange={(e) => setForm({...form, name: e.target.value})}
//                                                placeholder="e.g. Hero with Gradient Background"/>
//                                     </div>
//                                     <div className="space-y-1.5">
//                                         <Label className="text-xs">Key (unique, lowercase, underscores) *</Label>
//                                         <Input value={form.key}
//                                                onChange={(e) => setForm({
//                                                    ...form,
//                                                    key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
//                                                })}
//                                                placeholder="hero_gradient_bg" className="font-mono"/>
//                                     </div>
//                                 </div>
//
//                                 <div className="grid grid-cols-2 gap-3">
//                                     <div className="space-y-1.5">
//                                         <Label className="text-xs">Category *</Label>
//                                         <select value={form.category}
//                                                 onChange={(e) => handleCategoryChange(e.target.value as ComponentCategory)}
//                                                 className="w-full h-9 rounded-md border bg-background px-3 text-sm">
//                                             {CATEGORIES.map((c) => (
//                                                 <option key={c}
//                                                         value={c}>{CATEGORY_META[c].label} — {CATEGORY_META[c].description}</option>
//                                             ))}
//                                         </select>
//                                     </div>
//                                     <div className="space-y-1.5">
//                                         <Label className="text-xs">Preview Image URL</Label>
//                                         <Input value={form.previewImage}
//                                                onChange={(e) => setForm({...form, previewImage: e.target.value})}
//                                                placeholder="https://..."/>
//                                     </div>
//                                 </div>
//
//                                 <div className="space-y-1.5">
//                                     <Label className="text-xs">Description</Label>
//                                     <textarea value={form.description}
//                                               onChange={(e) => setForm({...form, description: e.target.value})}
//                                               rows={2}
//                                               placeholder="What does this component do? When should it be used?"
//                                               className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"/>
//                                 </div>
//
//                                 <div className="space-y-1.5">
//                                     <Label className="text-xs">Tags</Label>
//                                     <div className="flex gap-2">
//                                         <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
//                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
//                                                placeholder="Add tag and press Enter" className="h-8 text-sm"/>
//                                         <Button size="sm" variant="outline" onClick={addTag}
//                                                 className="h-8">Add</Button>
//                                     </div>
//                                     {form.tags.length > 0 && (
//                                         <div className="flex flex-wrap gap-1.5 mt-1.5">
//                                             {form.tags.map((tag) => (
//                                                 <span key={tag}
//                                                       className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs">
//                                                     {tag}
//                                                     <button onClick={() => setForm((f) => ({
//                                                         ...f,
//                                                         tags: f.tags.filter((t) => t !== tag)
//                                                     }))} className="hover:text-red-500">
//                                                         <X className="h-2.5 w-2.5"/>
//                                                     </button>
//                                                 </span>
//                                             ))}
//                                         </div>
//                                     )}
//                                 </div>
//
//                                 <div className="space-y-1.5">
//                                     <Label className="text-xs">Designed for Site Types</Label>
//                                     <div className="flex gap-2 flex-wrap">
//                                         {ALL_SITE_TYPES.map((st) => (
//                                             <button key={st}
//                                                     onClick={() => toggleSiteType(st)}
//                                                     className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${form.siteTypes.includes(st) ? "bg-indigo-600 text-white border-indigo-600" : "border-border hover:border-indigo-300"}`}>
//                                                 {st}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </TabsContent>
//
//                             {/* ── Tab: Code ─────────────────────────────────── */}
//                             <TabsContent value="code" className="space-y-4">
//                                 <div className="flex items-center justify-between">
//                                     <p className="text-xs text-muted-foreground">
//                                         Use <code className="bg-muted px-1 rounded">{"{{propKey}}"}</code> for
//                                         substitutions,{" "}
//                                         <code className="bg-muted px-1 rounded">{"{{#items}}...{{/items}}"}</code> for
//                                         arrays,{" "}
//                                         <code className="bg-muted px-1 rounded">{"{{html:key}}"}</code> for rich text.
//                                         Tailwind classes work — CDN is auto-injected.
//                                     </p>
//                                     <div className="flex gap-2 shrink-0">
//                                         <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
//                                                 onClick={loadCategoryStarter}>
//                                             <RefreshCw className="h-3 w-3"/> Load Starter
//                                         </Button>
//                                         <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
//                                                 onClick={() => {
//                                                     setShowPreview(true);
//                                                     setFormTab("preview");
//                                                 }}>
//                                             <Eye className="h-3 w-3"/> Preview
//                                         </Button>
//                                     </div>
//                                 </div>
//
//                                 <div className="space-y-1.5">
//                                     <Label className="text-xs font-semibold text-emerald-600">HTML Template *</Label>
//                                     <textarea
//                                         value={form.htmlTemplate}
//                                         onChange={(e) => setForm({...form, htmlTemplate: e.target.value})}
//                                         rows={14}
//                                         spellCheck={false}
//                                         placeholder={CATEGORY_HTML_STARTERS[form.category]}
//                                         className="w-full rounded-md border bg-zinc-950 text-emerald-300 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 leading-relaxed"
//                                     />
//                                 </div>
//
//                                 <div className="grid grid-cols-2 gap-3">
//                                     <div className="space-y-1.5">
//                                         <Label className="text-xs font-semibold text-sky-600">CSS (scoped
//                                             styles)</Label>
//                                         <textarea
//                                             value={form.cssCode}
//                                             onChange={(e) => setForm({...form, cssCode: e.target.value})}
//                                             rows={6}
//                                             spellCheck={false}
//                                             placeholder={`/* Optional: extra CSS beyond Tailwind */\n.my-component { ... }`}
//                                             className="w-full rounded-md border bg-zinc-950 text-sky-300 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 leading-relaxed"
//                                         />
//                                     </div>
//                                     <div className="space-y-1.5">
//                                         <Label className="text-xs font-semibold text-amber-600">JavaScript
//                                             (optional)</Label>
//                                         <textarea
//                                             value={form.jsCode}
//                                             onChange={(e) => setForm({...form, jsCode: e.target.value})}
//                                             rows={6}
//                                             spellCheck={false}
//                                             placeholder={`// Runs after DOM ready\n// Scoped in IIFE automatically\ndocument.querySelector('.my-el')?.addEventListener('click', () => {})`}
//                                             className="w-full rounded-md border bg-zinc-950 text-amber-300 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 leading-relaxed"
//                                         />
//                                     </div>
//                                 </div>
//                             </TabsContent>
//
//                             {/* ── Tab: Props Schema ──────────────────────────── */}
//                             <TabsContent value="props" className="space-y-3">
//                                 <div className="flex items-center justify-between">
//                                     <p className="text-xs text-muted-foreground">
//                                         Define what users can edit in the right panel. Each key must match a <code
//                                         className="bg-muted px-1 rounded">{"{{key}}"}</code> in your HTML template.
//                                     </p>
//                                     <div className="flex gap-2">
//                                         <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"
//                                                 onClick={loadCategoryStarter}>
//                                             <RefreshCw className="h-3 w-3"/> Reset to Defaults
//                                         </Button>
//                                         <Button size="sm" variant="gradient" className="gap-1.5 h-7 text-xs"
//                                                 onClick={addProp}>
//                                             <Plus className="h-3 w-3"/> Add Prop
//                                         </Button>
//                                     </div>
//                                 </div>
//
//                                 {form.propsSchema.length === 0 ? (
//                                     <div className="border-2 border-dashed rounded-xl py-10 text-center">
//                                         <p className="text-sm text-muted-foreground mb-3">No props yet — add props to
//                                             make this component editable</p>
//                                         <Button size="sm" variant="outline" onClick={addProp} className="gap-1.5">
//                                             <Plus className="h-3.5 w-3.5"/> Add First Prop
//                                         </Button>
//                                     </div>
//                                 ) : (
//                                     <div className="space-y-2">
//                                         <div className="grid grid-cols-3 gap-2 px-3 pb-1">
//                                             <p className="text-xs font-medium text-muted-foreground">Key (template
//                                                 variable)</p>
//                                             <p className="text-xs font-medium text-muted-foreground">Label (shown in
//                                                 editor)</p>
//                                             <p className="text-xs font-medium text-muted-foreground">Type</p>
//                                         </div>
//                                         {form.propsSchema.map((prop, i) => (
//                                             <PropRow
//                                                 key={i} prop={prop} index={i}
//                                                 onChange={(u) => updateProp(i, u)}
//                                                 onRemove={() => removeProp(i)}
//                                                 onMoveUp={() => moveProp(i, -1)}
//                                                 onMoveDown={() => moveProp(i, 1)}
//                                                 isFirst={i === 0}
//                                                 isLast={i === form.propsSchema.length - 1}
//                                             />
//                                         ))}
//                                         <Button size="sm" variant="outline" onClick={addProp}
//                                                 className="w-full gap-1.5 border-dashed">
//                                             <Plus className="h-3.5 w-3.5"/> Add Another Prop
//                                         </Button>
//                                     </div>
//                                 )}
//                             </TabsContent>
//
//                             {/* ── Tab: Access & Settings ─────────────────────── */}
//                             <TabsContent value="access" className="space-y-5">
//                                 <div className="space-y-2">
//                                     <Label className="text-xs font-semibold">Available to Plans</Label>
//                                     <div className="grid grid-cols-4 gap-2">
//                                         {ALL_PLANS.map((plan) => (
//                                             <button key={plan}
//                                                     onClick={() => togglePlan(plan)}
//                                                     className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm capitalize font-medium transition-colors ${form.availableTo.includes(plan) ? "bg-indigo-600 text-white border-indigo-600" : "border-border hover:border-indigo-300"}`}>
//                                                 {form.availableTo.includes(plan) && <Check className="h-3.5 w-3.5"/>}
//                                                 {plan}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
//
//                                 <div className="space-y-3 p-4 rounded-xl border bg-muted/30">
//                                     <Label className="text-xs font-semibold">Component Settings</Label>
//                                     <div className="space-y-3">
//                                         {[
//                                             {
//                                                 key: "isActive",
//                                                 label: "Active",
//                                                 desc: "Visible to users on their allowed plan"
//                                             },
//                                             {
//                                                 key: "isFeatured",
//                                                 label: "Featured",
//                                                 desc: "Shown first / highlighted in library"
//                                             },
//                                             {
//                                                 key: "isPremium",
//                                                 label: "Premium Badge",
//                                                 desc: "Shows 'Pro' badge even within allowed plan"
//                                             },
//                                         ].map(({key, label, desc}) => (
//                                             <label key={key} className="flex items-center gap-3 cursor-pointer">
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={Boolean(form[key as keyof ComponentForm])}
//                                                     onChange={(e) => setForm({...form, [key]: e.target.checked})}
//                                                     className="rounded h-4 w-4"
//                                                 />
//                                                 <div>
//                                                     <p className="text-sm font-medium">{label}</p>
//                                                     <p className="text-xs text-muted-foreground">{desc}</p>
//                                                 </div>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>
//                             </TabsContent>
//
//                             {/* ── Tab: Preview ───────────────────────────────── */}
//                             {showPreview && (
//                                 <TabsContent value="preview">
//                                     <LivePreview
//                                         htmlTemplate={form.htmlTemplate}
//                                         cssCode={form.cssCode}
//                                         jsCode={form.jsCode}
//                                         propsSchema={form.propsSchema}
//                                     />
//                                     <p className="text-xs text-muted-foreground mt-2 text-center">
//                                         Preview uses default prop values. Actual output depends on user's content.
//                                     </p>
//                                 </TabsContent>
//                             )}
//                         </Tabs>
//                     </div>
//
//                     <DialogFooter className="shrink-0 border-t pt-4 mt-0">
//                         <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
//                         <Button variant="outline" className="gap-1.5"
//                                 onClick={() => {
//                                     setShowPreview(true);
//                                     setFormTab("preview");
//                                 }}>
//                             <Eye className="h-4 w-4"/> Preview
//                         </Button>
//                         <Button variant="gradient" onClick={handleSave} isLoading={saving} className="gap-2 min-w-32">
//                             <Save className="h-4 w-4"/>
//                             {editId ? "Save Changes" : "Create Component"}
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//
//             <ConfirmDialog
//                 open={!!deleteId}
//                 onOpenChange={(o) => !o && setDeleteId(null)}
//                 title="Delete Component"
//                 description="This permanently removes the component. Any user sites using this component will lose it on next render."
//                 confirmLabel="Delete"
//                 onConfirm={handleDelete}
//                 variant="destructive"
//             />
//         </div>
//     );
// }
