"use client";
/**
 * components/builder/PageManager.tsx
 *
 * Add, rename, delete, reorder pages and toggle their nav visibility.
 * Mounted inside the builder top bar as a popover or slide-over panel.
 *
 * Usage:
 *   <PageManager
 *     pages={site.pages}
 *     activePageId={activePageId}
 *     onSelect={(id) => setActivePageId(id)}
 *     onAdd={(page) => { ... }}
 *     onRename={(id, title) => { ... }}
 *     onDelete={(id) => { ... }}
 *     onToggleNav={(id) => { ... }}
 *     onClose={() => setShowPageManager(false)}
 *   />
 */

import {useState} from "react";
import {
    Plus, Trash2, Edit2, Check, X, Eye, EyeOff,
    GripVertical, Home, ExternalLink,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ManagedPage {
    pageId: string;
    slug: string;
    title: string;
    isHomePage: boolean;
    isEnabled: boolean;
    showInNav: boolean;
    role: string;
    componentCount?: number;
}

interface PageManagerProps {
    pages: ManagedPage[];
    activePageId: string | null;
    onSelect: (pageId: string) => void;
    onAdd: (page: { title: string; slug: string; role: string }) => Promise<void>;
    onRename: (pageId: string, title: string, slug: string) => Promise<void>;
    onDelete: (pageId: string) => Promise<void>;
    onToggleNav: (pageId: string) => void;
    onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Slug generator
// ─────────────────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
    return "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const PAGE_ROLES = [
    {value: "custom", label: "Custom Page"},
    {value: "about", label: "About"},
    {value: "contact", label: "Contact"},
    {value: "pricing", label: "Pricing"},
    {value: "blog", label: "Blog"},
    {value: "portfolio", label: "Portfolio"},
    {value: "shop", label: "Shop"},
];

// ─────────────────────────────────────────────────────────────────────────────
// Page row
// ─────────────────────────────────────────────────────────────────────────────

function PageRow({
                     page, isActive, onSelect, onRename, onDelete, onToggleNav,
                 }: {
    page: ManagedPage;
    isActive: boolean;
    onSelect: () => void;
    onRename: (title: string, slug: string) => Promise<void>;
    onDelete: () => Promise<void>;
    onToggleNav: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(page.title);
    const [slug, setSlug] = useState(page.slug);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        await onRename(title.trim(), slug.trim() || toSlug(title));
        setSaving(false);
        setEditing(false);
    };

    const handleDelete = async () => {
        if (!confirmDel) {
            setConfirmDel(true);
            return;
        }
        setDeleting(true);
        await onDelete();
        setDeleting(false);
    };

    return (
        <div
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" : "border-transparent hover:border-border hover:bg-muted/50"
            }`}
            onClick={() => !editing && onSelect()}
        >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 cursor-grab"/>

            {page.isHomePage && <Home className="h-3.5 w-3.5 text-amber-500 shrink-0"/>}

            {editing ? (
                <div className="flex-1 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Input value={title} onChange={(e) => {
                        setTitle(e.target.value);
                        setSlug(toSlug(e.target.value));
                    }}
                           className="h-7 text-xs" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()}/>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value)}
                           className="h-7 text-xs font-mono" placeholder="/slug"/>
                    <div className="flex gap-1">
                        <Button size="sm" variant="gradient" onClick={handleSave} isLoading={saving}
                                className="h-6 text-xs px-2">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                            setEditing(false);
                            setTitle(page.title);
                            setSlug(page.slug);
                        }} className="h-6 text-xs px-2">Cancel</Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{page.title}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">{page.slug}</p>
                    </div>

                    {page.componentCount !== undefined && (
                        <span className="text-xs text-muted-foreground shrink-0">{page.componentCount} blocks</span>
                    )}

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={(e) => e.stopPropagation()}>
                        <button onClick={onToggleNav} title={page.showInNav ? "Hide from nav" : "Show in nav"}
                                className={`p-1 rounded hover:bg-muted ${!page.showInNav ? "text-muted-foreground" : "text-indigo-500"}`}>
                            {page.showInNav ? <Eye className="h-3.5 w-3.5"/> : <EyeOff className="h-3.5 w-3.5"/>}
                        </button>
                        <button onClick={() => setEditing(true)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground">
                            <Edit2 className="h-3.5 w-3.5"/>
                        </button>
                        {!page.isHomePage && (
                            <button
                                onClick={handleDelete}
                                className={`p-1 rounded transition-colors ${confirmDel ? "text-white bg-red-500 hover:bg-red-600" : "text-red-400 hover:bg-red-50 hover:text-red-600"}`}
                                title={confirmDel ? "Click again to confirm delete" : "Delete page"}
                            >
                                {deleting ? <span className="text-xs">...</span> : confirmDel ?
                                    <Check className="h-3.5 w-3.5"/> : <Trash2 className="h-3.5 w-3.5"/>}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

export default function PageManager({
                                        pages, activePageId, onSelect, onAdd, onRename, onDelete, onToggleNav, onClose,
                                    }: PageManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newSlug, setNewSlug] = useState("");
    const [newRole, setNewRole] = useState("custom");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");

    const handleAdd = async () => {
        if (!newTitle.trim()) {
            setAddError("Page name is required");
            return;
        }
        const slug = newSlug.trim() || toSlug(newTitle);
        if (pages.some((p) => p.slug === slug)) {
            setAddError("A page with this slug already exists");
            return;
        }
        setAdding(true);
        setAddError("");
        await onAdd({title: newTitle.trim(), slug, role: newRole});
        setNewTitle("");
        setNewSlug("");
        setNewRole("custom");
        setShowAddForm(false);
        setAdding(false);
    };

    return (
        <div className="flex flex-col h-full max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <p className="font-semibold text-sm">Pages ({pages.length})</p>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-muted">
                    <X className="h-4 w-4"/>
                </button>
            </div>

            {/* Page list */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {pages.map((page) => (
                    <PageRow
                        key={page.pageId}
                        page={page}
                        isActive={page.pageId === activePageId}
                        onSelect={() => {
                            onSelect(page.pageId);
                            onClose();
                        }}
                        onRename={(title, slug) => onRename(page.pageId, title, slug)}
                        onDelete={() => onDelete(page.pageId)}
                        onToggleNav={() => onToggleNav(page.pageId)}
                    />
                ))}
            </div>

            {/* Add page form */}
            {showAddForm && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30 shrink-0">
                    <p className="text-xs font-semibold">New Page</p>
                    {addError && <p className="text-xs text-destructive">{addError}</p>}
                    <div className="space-y-2">
                        <Input
                            value={newTitle}
                            onChange={(e) => {
                                setNewTitle(e.target.value);
                                setNewSlug(toSlug(e.target.value));
                                setAddError("");
                            }}
                            placeholder="Page name e.g. About Us"
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        />
                        <Input
                            value={newSlug}
                            onChange={(e) => setNewSlug(e.target.value)}
                            placeholder="/about-us"
                            className="h-8 text-sm font-mono"
                        />
                        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                                className="w-full h-8 rounded-md border bg-background px-2 text-sm">
                            {PAGE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="gradient" onClick={handleAdd} isLoading={adding}
                                className="flex-1 h-8 text-xs">
                            Add Page
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                            setShowAddForm(false);
                            setAddError("");
                        }} className="h-8 text-xs">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* Footer */}
            {!showAddForm && (
                <div className="border-t px-4 py-3 shrink-0">
                    <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowAddForm(true)}>
                        <Plus className="h-3.5 w-3.5"/> Add New Page
                    </Button>
                </div>
            )}
        </div>
    );
}