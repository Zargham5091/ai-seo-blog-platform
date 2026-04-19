"use client";
import {useEffect, useState} from "react";
import {Plus, Edit, Trash2, Tag, Save, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";

interface Category {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
    postCount: number;
}

const DEFAULT_COLORS = [
    "#4F46E5", "#0EA5E9", "#22C55E", "#F59E0B",
    "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({name: "", description: "", color: "#4F46E5"});

    const fetchCategories = async () => {
        setIsLoading(true);
        const res = await fetch("/api/categories");
        const d = await res.json();
        if (d.success) setCategories(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async () => {
        if (!form.name.trim()) return;
        setIsSaving(true);
        setError("");

        const url = editId ? `/api/categories/${editId}` : "/api/categories";
        const method = editId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(form),
        });
        const d = await res.json();

        if (d.success) {
            setForm({name: "", description: "", color: "#4F46E5"});
            setShowAdd(false);
            setEditId(null);
            fetchCategories();
        } else {
            setError(d.error);
        }
        setIsSaving(false);
    };

    const handleEdit = (cat: Category) => {
        setForm({name: cat.name, description: cat.description ?? "", color: cat.color});
        setEditId(cat._id);
        setShowAdd(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        await fetch(`/api/categories/${deleteId}`, {method: "DELETE"});
        setDeleteId(null);
        setIsDeleting(false);
        fetchCategories();
    };

    const cancelForm = () => {
        setShowAdd(false);
        setEditId(null);
        setError("");
        setForm({name: "", description: "", color: "#4F46E5"});
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Categories</h1>
                    <p className="text-muted-foreground text-sm">
                        Organize your blog posts into categories
                    </p>
                </div>
                {!showAdd && (
                    <Button variant="gradient" className="gap-2" onClick={() => setShowAdd(true)}>
                        <Plus className="h-4 w-4"/> New Category
                    </Button>
                )}
            </div>

            {/* Add / Edit form */}
            {showAdd && (
                <Card className="border-indigo-200 dark:border-indigo-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">
                            {editId ? "Edit Category" : "New Category"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div
                                className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Category Name *</Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({...f, name: e.target.value}))}
                                    placeholder="e.g. Marketing, SEO, Tech"
                                    onKeyDown={(e) => e.key === "Enter" && handleSave()}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Description</Label>
                                <Input
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({...f, description: e.target.value}))}
                                    placeholder="Optional short description"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="flex items-center gap-3 flex-wrap">
                                {DEFAULT_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setForm((f) => ({...f, color: c}))}
                                        className={`h-7 w-7 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"}`}
                                        style={{background: c}}
                                    />
                                ))}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={form.color}
                                        onChange={(e) => setForm((f) => ({...f, color: e.target.value}))}
                                        className="h-7 w-7 rounded-full cursor-pointer border-0"
                                    />
                                    <span className="text-xs text-muted-foreground font-mono">{form.color}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="gradient" onClick={handleSave} isLoading={isSaving} className="gap-2">
                                <Save className="h-4 w-4"/> {editId ? "Save Changes" : "Create Category"}
                            </Button>
                            <Button variant="outline" onClick={cancelForm} className="gap-2">
                                <X className="h-4 w-4"/> Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Categories list */}
            {isLoading ? (
                <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl"/>)}
                </div>
            ) : categories.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Tag className="h-12 w-12 text-muted-foreground/30 mb-4"/>
                        <h3 className="font-semibold text-lg mb-2">No categories yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            Create categories to organize your blog posts.
                        </p>
                        <Button variant="gradient" onClick={() => setShowAdd(true)} className="gap-2">
                            <Plus className="h-4 w-4"/> Create First Category
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <Card key={cat._id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-4 flex items-center gap-4">
                                {/* Color swatch */}
                                <div
                                    className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-white font-bold text-sm"
                                    style={{background: cat.color}}
                                >
                                    {cat.name.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm">{cat.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {cat.postCount} post{cat.postCount !== 1 ? "s" : ""}
                                        </Badge>
                                    </div>
                                    {cat.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">/{cat.slug}</p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleEdit(cat)}
                                    >
                                        <Edit className="h-3.5 w-3.5"/>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => setDeleteId(cat._id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5"/>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(o) => !o && setDeleteId(null)}
                title="Delete Category"
                description="This will remove the category from all blog posts that use it. Posts will not be deleted."
                confirmLabel="Delete Category"
                onConfirm={handleDelete}
                isLoading={isDeleting}
                variant="destructive"
            />
        </div>
    );
}
