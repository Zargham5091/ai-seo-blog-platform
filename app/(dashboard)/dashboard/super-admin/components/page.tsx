"use client";
import {useEffect, useState} from "react";
import {Plus, Edit, Trash2, Code, Layers, Sparkles, Zap, Save} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";

// ── Interfaces ────────────────────────────────────────────────────────────────

type ComponentCategory = "section" | "animation" | "template" | "widget" | "integration";
type PlanLevel = "free" | "silver" | "gold" | "diamond";

interface PlanComponent {
    _id: string;
    name: string;
    key: string;
    category: ComponentCategory;
    description?: string;
    previewImage?: string;
    cssCode?: string;
    jsCode?: string;
    availableTo: PlanLevel[];
    isActive: boolean;
}

interface ComponentForm {
    name: string;
    key: string;
    category: ComponentCategory;
    description: string;
    previewImage: string;
    cssCode: string;
    jsCode: string;
    availableTo: PlanLevel[];
    isActive: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<ComponentCategory, React.ElementType> = {
    section: Layers,
    animation: Sparkles,
    template: Code,
    widget: Zap,
    integration: Zap,
};

const PLAN_BADGE: Record<PlanLevel, "secondary" | "info" | "warning" | "success"> = {
    free: "secondary", silver: "info", gold: "warning", diamond: "success",
};

const ALL_PLANS: PlanLevel[] = ["free", "silver", "gold", "diamond"];
const CATEGORIES: ComponentCategory[] = ["section", "animation", "template", "widget", "integration"];

const EMPTY_FORM: ComponentForm = {
    name: "", key: "", category: "animation", description: "",
    previewImage: "", cssCode: "", jsCode: "",
    availableTo: ["gold", "diamond"], isActive: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ComponentLibraryPage() {
    const [components, setComponents] = useState<PlanComponent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<ComponentCategory | "all">("all");
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [form, setForm] = useState<ComponentForm>({...EMPTY_FORM});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const fetchComponents = async () => {
        setIsLoading(true);
        const res = await fetch("/api/plan-components");
        const d = await res.json();
        if (d.success) setComponents(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchComponents();
    }, []);

    const filtered = activeCategory === "all"
        ? components
        : components.filter((c) => c.category === activeCategory);

    const openEdit = (comp: PlanComponent) => {
        setForm({
            name: comp.name, key: comp.key, category: comp.category,
            description: comp.description ?? "", previewImage: comp.previewImage ?? "",
            cssCode: comp.cssCode ?? "", jsCode: comp.jsCode ?? "",
            availableTo: comp.availableTo, isActive: comp.isActive,
        });
        setEditId(comp._id);
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        const url = editId ? `/api/plan-components/${editId}` : "/api/plan-components";
        const method = editId ? "PUT" : "POST";
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
            setError(d.error);
        }
        setSaving(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        await fetch(`/api/plan-components/${deleteId}`, {method: "DELETE"});
        setDeleteId(null);
        fetchComponents();
    };

    const togglePlan = (plan: PlanLevel) => {
        setForm((f) => ({
            ...f,
            availableTo: f.availableTo.includes(plan)
                ? f.availableTo.filter((p) => p !== plan)
                : [...f.availableTo, plan],
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Component Library</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage animations, sections, templates, and widgets available per plan
                    </p>
                </div>
                <Button variant="gradient" className="gap-2" onClick={() => {
                    setShowForm(true);
                    setEditId(null);
                    setForm({...EMPTY_FORM});
                }}>
                    <Plus className="h-4 w-4"/> Add Component
                </Button>
            </div>

            {/* Category filter */}
            <div className="flex gap-2 flex-wrap">
                {(["all", ...CATEGORIES] as const).map((cat) => (
                    <Button
                        key={cat}
                        variant={activeCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory(cat)}
                        className="capitalize"
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {CATEGORIES.map((cat) => {
                    const count = components.filter((c) => c.category === cat).length;
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                        <Card key={cat} className="cursor-pointer hover:border-indigo-200 transition-colors"
                              onClick={() => setActiveCategory(cat)}>
                            <CardContent className="p-3 flex items-center gap-2">
                                <Icon className="h-4 w-4 text-indigo-500"/>
                                <div>
                                    <p className="text-xs text-muted-foreground capitalize">{cat}</p>
                                    <p className="font-bold text-lg">{count}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Component grid */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-40 skeleton rounded-xl"/>)}
                </div>
            ) : filtered.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                        <p className="font-semibold">No components yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Add animations, sections, and templates for
                            users to use.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((comp) => {
                        const Icon = CATEGORY_ICONS[comp.category];
                        return (
                            <Card key={comp._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    {comp.previewImage && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={comp.previewImage} alt={comp.name}
                                             className="w-full h-28 object-cover rounded-lg mb-3"/>
                                    )}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                <Icon className="h-3.5 w-3.5 text-indigo-600"/>
                                            </div>
                                            <span className="font-semibold text-sm">{comp.name}</span>
                                        </div>
                                        <Badge variant={comp.isActive ? "success" : "secondary"}
                                               className="text-xs shrink-0">
                                            {comp.isActive ? "Active" : "Off"}
                                        </Badge>
                                    </div>
                                    {comp.description && (
                                        <p className="text-xs text-muted-foreground mb-3">{comp.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {comp.availableTo.map((plan) => (
                                            <Badge key={plan} variant={PLAN_BADGE[plan]}
                                                   className="text-xs capitalize">{plan}</Badge>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="sm" className="flex-1 gap-1.5"
                                                onClick={() => openEdit(comp)}>
                                            <Edit className="h-3.5 w-3.5"/> Edit
                                        </Button>
                                        <Button variant="ghost" size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleteId(comp._id)}>
                                            <Trash2 className="h-3.5 w-3.5"/>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editId ? "Edit Component" : "Add Component"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {error && (
                            <div className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Name</Label>
                                <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                                       placeholder="Bounce Animation"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Key (unique, lowercase, underscores)</Label>
                                <Input value={form.key} onChange={(e) => setForm({
                                    ...form,
                                    key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                                })} placeholder="animation_bounce"/>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Category</Label>
                                <select value={form.category} onChange={(e) => setForm({
                                    ...form,
                                    category: e.target.value as ComponentCategory
                                })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                    {CATEGORIES.map((c) => <option key={c} value={c}
                                                                   className="capitalize">{c}</option>)}
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
                            <Input value={form.description}
                                   onChange={(e) => setForm({...form, description: e.target.value})}
                                   placeholder="Short description of what this does"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">CSS Code</Label>
                            <textarea
                                value={form.cssCode}
                                onChange={(e) => setForm({...form, cssCode: e.target.value})}
                                rows={5}
                                placeholder="@keyframes bounce { ... }"
                                className="w-full rounded-md border bg-zinc-950 text-emerald-400 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">JS Code (optional)</Label>
                            <textarea
                                value={form.jsCode}
                                onChange={(e) => setForm({...form, jsCode: e.target.value})}
                                rows={3}
                                placeholder="// Optional JavaScript"
                                className="w-full rounded-md border bg-zinc-950 text-sky-400 font-mono px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Available to Plans</Label>
                            <div className="flex gap-3">
                                {ALL_PLANS.map((plan) => (
                                    <label key={plan}
                                           className="flex items-center gap-1.5 cursor-pointer text-sm capitalize">
                                        <input
                                            type="checkbox"
                                            checked={form.availableTo.includes(plan)}
                                            onChange={() => togglePlan(plan)}
                                            className="rounded"
                                        />
                                        {plan}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm({...form, isActive: e.target.checked})}
                                className="rounded"
                            />
                            Active (visible to users)
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSave} isLoading={saving} className="gap-2">
                            <Save className="h-4 w-4"/> {editId ? "Save Changes" : "Create Component"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(o) => !o && setDeleteId(null)}
                title="Delete Component"
                description="This will permanently remove this component. Users who have applied it to their site may be affected."
                confirmLabel="Delete"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
}
