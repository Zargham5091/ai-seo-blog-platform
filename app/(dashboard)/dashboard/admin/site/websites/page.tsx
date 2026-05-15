"use client";

import {useEffect, useState, useRef} from "react";
import {useRouter} from "next/navigation";
import {
    Globe, Plus, Edit3, Trash2, Eye, RefreshCw, RotateCcw,
    BarChart2, Calendar, ExternalLink, Loader2, AlertTriangle,
    CheckCircle, XCircle, Sparkles, Copy, MoreVertical,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {cn} from "@/lib/utils";

interface SitePage {
    pageId: string;
    title: string;
    components: unknown[];
    isEnabled: boolean;
}

interface UserSite {
    _id: string;
    siteName: string;
    siteType: string;
    isPublished: boolean;
    publishedAt?: string;
    subdomain?: string;
    customDomain?: string;
    pages: SitePage[];
    createdAt: string;
    updatedAt: string;
    theme?: { primaryColor?: string };
}

const SITE_TYPE_EMOJI: Record<string, string> = {
    blog: "✍️", portfolio: "🎨", saas: "🚀", ecommerce: "🛍️", restaurant: "🍽️", agency: "💼",
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

function ConfirmModal({title, desc, onConfirm, onCancel, danger}: {
    title: string; desc: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-start gap-3">
                    <div
                        className={cn("mt-0.5 p-2 rounded-xl shrink-0", danger ? "bg-red-100 dark:bg-red-950/40" : "bg-amber-100 dark:bg-amber-950/40")}>
                        <AlertTriangle className={cn("h-5 w-5", danger ? "text-red-500" : "text-amber-500")}/>
                    </div>
                    <div>
                        <p className="font-bold text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
                    <Button size="sm" variant={danger ? "destructive" : "default"} onClick={onConfirm}>
                        {danger ? "Delete" : "Confirm"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SiteMenu({site, onAction}: {
    site: UserSite;
    onAction: (action: string, siteId: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const items = [
        {label: "Edit in Builder", icon: Edit3, action: "edit"},
        ...(site.isPublished && site.subdomain ? [{label: "View Live Site", icon: Eye, action: "view"}] : []),
        {
            label: site.isPublished ? "Unpublish" : "Publish",
            icon: Globe,
            action: site.isPublished ? "unpublish" : "republish"
        },
        {label: "Copy URL", icon: Copy, action: "copy"},
        {label: "Reset Content", icon: RotateCcw, action: "reset"},
        {label: "Delete Website", icon: Trash2, action: "delete", danger: true},
    ];

    return (
        <div ref={ref} className="relative">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(v => !v);
                }}
                className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
                <MoreVertical className="h-4 w-4"/>
            </button>
            {open && (
                <div className="absolute right-0 top-9 w-48 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden">
                    {items.map(item => (
                        <button
                            key={item.label}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                onAction(item.action, site._id);
                            }}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left",
                                item.danger && "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            )}
                        >
                            <item.icon className="h-3.5 w-3.5 shrink-0"/>
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function WebsitesPage() {
    const router = useRouter();
    const [sites, setSites] = useState<UserSite[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirm, setConfirm] = useState<{ type: string; siteId: string } | null>(null);
    const [msg, setMsg] = useState("");

    useEffect(() => {
        fetch("/api/site/list").then(r => r.json()).then(d => {
            if (d.success) setSites(d.data ?? []);
            setLoading(false);
        });
    }, []);

    const showMsg = (m: string) => {
        setMsg(m);
        setTimeout(() => setMsg(""), 3000);
    };

    const viewSite = (site: UserSite) => {
        if (!site.subdomain) {
            showMsg("Set a subdomain in Domain Settings first.");
            return;
        }
        window.open(`/preview/${site.subdomain}`, "_blank");
    };

    const copyUrl = (site: UserSite) => {
        if (!site.subdomain && !site.customDomain) {
            showMsg("No URL set yet. Configure in Domain Settings.");
            return;
        }
        const url = site.customDomain ? `https://${site.customDomain}` : `/preview/${site.subdomain}`;
        navigator.clipboard.writeText(window.location.origin + (site.customDomain ? "" : url));
        showMsg("URL copied!");
    };

    const handleAction = async (action: string, siteId: string) => {
        const site = sites.find(s => s._id === siteId);
        if (!site) return;

        if (action === "edit") {
            router.push(`/dashboard/admin/site?siteId=${siteId}`);
            return;
        }
        if (action === "view") {
            viewSite(site);
            return;
        }
        if (action === "copy") {
            copyUrl(site);
            return;
        }
        if (action === "delete") {
            setConfirm({type: "delete", siteId});
            return;
        }
        if (action === "reset") {
            setConfirm({type: "reset", siteId});
            return;
        }

        setActionLoading(`${action}-${siteId}`);
        try {
            if (action === "republish") {
                await fetch("/api/site/publish", {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({siteId}),
                });
                setSites(s => s.map(x => x._id === siteId ? {
                    ...x,
                    isPublished: true,
                    publishedAt: new Date().toISOString()
                } : x));
                showMsg("Published successfully!");
            } else if (action === "unpublish") {
                await fetch(`/api/site/${siteId}/unpublish`, {method: "POST"});
                setSites(s => s.map(x => x._id === siteId ? {...x, isPublished: false} : x));
                showMsg("Website unpublished.");
            }
        } catch {
            showMsg("Action failed. Try again.");
        }
        setActionLoading(null);
    };

    const handleConfirm = async () => {
        if (!confirm) return;
        const {type, siteId} = confirm;
        setConfirm(null);
        setActionLoading(`${type}-${siteId}`);
        try {
            if (type === "delete") {
                await fetch(`/api/site/${siteId}`, {method: "DELETE"});
                setSites(s => s.filter(x => x._id !== siteId));
                showMsg("Website deleted.");
            } else if (type === "reset") {
                await fetch(`/api/site/${siteId}/reset`, {method: "POST"});
                showMsg("Website reset to blank.");
            }
        } catch {
            showMsg("Action failed. Try again.");
        }
        setActionLoading(null);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500"/>
        </div>
    );

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Globe className="h-6 w-6 text-indigo-500"/> My Websites
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {sites.length} website{sites.length !== 1 ? "s" : ""} · Click Edit to open the builder
                    </p>
                </div>
                <Button variant="gradient" className="gap-2" asChild>
                    <Link href="/dashboard/admin/site">
                        <Plus className="h-4 w-4"/> New Website
                    </Link>
                </Button>
            </div>

            {/* Toast */}
            {msg && (
                <div
                    className="fixed top-4 right-4 z-50 bg-card border rounded-xl px-4 py-3 shadow-xl flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500"/> {msg}
                </div>
            )}

            {/* Confirm modal */}
            {confirm && (
                <ConfirmModal
                    title={confirm.type === "delete" ? "Delete website?" : "Reset website?"}
                    desc={confirm.type === "delete"
                        ? "This permanently deletes the website and all its pages. This cannot be undone."
                        : "This clears all components, returning to a blank slate."}
                    danger={confirm.type === "delete"}
                    onConfirm={handleConfirm}
                    onCancel={() => setConfirm(null)}
                />
            )}

            {/* Empty state */}
            {sites.length === 0 && (
                <div className="text-center py-20 border-2 border-dashed rounded-2xl">
                    <div
                        className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Globe className="h-8 w-8 text-indigo-400"/>
                    </div>
                    <h3 className="font-bold text-lg mb-2">No websites yet</h3>
                    <p className="text-muted-foreground text-sm mb-6">Build your first website in minutes with our
                        drag-and-drop builder.</p>
                    <Button variant="gradient" className="gap-2 mx-auto" asChild>
                        <Link href="/dashboard/admin/site"><Sparkles className="h-4 w-4"/> Start Building</Link>
                    </Button>
                </div>
            )}

            {/* Sites grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sites.map(site => (
                    <div key={site._id}
                         className="rounded-2xl border bg-card overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">

                        {/* Preview banner */}
                        <div
                            className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 overflow-visible">
                            <div
                                className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-t-2xl">
                                <span className="text-5xl">{SITE_TYPE_EMOJI[site.siteType] ?? "🌐"}</span>
                            </div>
                            {site.theme?.primaryColor && (
                                <div className="absolute bottom-0 left-0 right-0 h-1"
                                     style={{background: site.theme.primaryColor}}/>
                            )}
                            {/* Status */}
                            <div className={cn(
                                "absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border",
                                site.isPublished
                                    ? "bg-emerald-500/90 text-white border-emerald-400/50"
                                    : "bg-slate-800/80 text-slate-300 border-slate-600/50"
                            )}>
                                {site.isPublished ? <CheckCircle className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                                {site.isPublished ? "Live" : "Draft"}
                            </div>
                            {/* Menu — overflow-visible so dropdown escapes the card */}
                            <div className="absolute top-3 right-3 z-20">
                                <SiteMenu site={site} onAction={handleAction}/>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4 space-y-3">
                            <div>
                                <h3 className="font-bold text-sm truncate">{site.siteName}</h3>
                                <p className="text-xs text-muted-foreground capitalize">
                                    {site.siteType} · {site.pages?.length ?? 0} page{site.pages?.length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {[
                                    {label: "Pages", value: site.pages?.length ?? 0},
                                    {
                                        label: "Sections",
                                        value: site.pages?.reduce((a, p) => a + (p.components?.length ?? 0), 0) ?? 0
                                    },
                                    {label: "Updated", value: timeAgo(site.updatedAt)},
                                ].map(stat => (
                                    <div key={stat.label} className="rounded-lg bg-muted/30 px-2 py-2">
                                        <p className="text-xs font-bold truncate">{stat.value}</p>
                                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Published URL */}
                            {site.isPublished && site.subdomain && (
                                <button
                                    onClick={() => viewSite(site)}
                                    className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate w-full text-left"
                                >
                                    <ExternalLink className="h-3 w-3 shrink-0"/>
                                    {site.customDomain ?? `preview/${site.subdomain}`}
                                </button>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-1">
                                <Button variant="gradient" size="sm" className="flex-1 gap-1.5 h-8 text-xs" asChild>
                                    <Link href={`/dashboard/admin/site?siteId=${site._id}`}>
                                        <Edit3 className="h-3.5 w-3.5"/> Edit
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline" size="sm" className="gap-1.5 h-8 text-xs"
                                    onClick={() => handleAction("republish", site._id)}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === `republish-${site._id}`
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                                        : <RefreshCw className="h-3.5 w-3.5"/>}
                                    {site.isPublished ? "Re-publish" : "Publish"}
                                </Button>
                                {site.isPublished && site.subdomain && (
                                    <Button
                                        variant="outline" size="sm" className="px-2.5 h-8"
                                        onClick={() => viewSite(site)}
                                        title="View live site"
                                    >
                                        <Eye className="h-3.5 w-3.5"/>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}