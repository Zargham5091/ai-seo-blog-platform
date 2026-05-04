// =============================================================================
// components/builder/VersionHistory.tsx
// Super admin panel — view and restore component versions
// =============================================================================

"use client";

import {useEffect, useState} from "react";
import {History, RotateCcw, ChevronDown, ChevronUp, Clock, User, X, AlertCircle} from "lucide-react";
import {Button} from "@/components/ui/button";

interface ComponentVersion {
    _id: string;
    version: number;
    createdAt: string;
    changeNote?: string;
    savedBy: { name: string; email: string };
    snapshot: { name: string; htmlTemplate: string; cssCode: string; description: string };
}

interface VersionHistoryProps {
    componentId: string;
    componentName: string;
    onRestore: () => void;
    onClose: () => void;
}

export function VersionHistory({componentId, componentName, onRestore, onClose}: VersionHistoryProps) {
    const [versions, setVersions] = useState<ComponentVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch(`/api/plan-components/${componentId}/versions`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setVersions(d.data);
                else setError(d.error);
                setLoading(false);
            });
    }, [componentId]);

    const restore = async (versionId: string) => {
        if (confirmId !== versionId) {
            setConfirmId(versionId);
            return;
        }
        setRestoring(versionId);
        const res = await fetch(`/api/plan-components/${componentId}/versions`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({versionId}),
        });
        const d = await res.json();
        if (d.success) {
            onRestore();
            onClose();
        } else setError(d.error);
        setRestoring(null);
        setConfirmId(null);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-indigo-500"/>
                    <div>
                        <p className="font-semibold text-sm">Version History</p>
                        <p className="text-xs text-muted-foreground truncate max-w-48">{componentName}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X className="h-4 w-4"/></button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {error && (
                    <div
                        className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
                        <AlertCircle className="h-4 w-4"/>{error}
                    </div>
                )}
                {loading && [...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-lg"/>)}
                {!loading && versions.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-30"/>
                        <p className="text-sm">No version history yet.</p>
                        <p className="text-xs mt-1">Versions are saved each time you edit this component.</p>
                    </div>
                )}
                {versions.map((ver, idx) => (
                    <div key={ver._id} className="border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-3 py-2.5">
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 shrink-0">
                                v{ver.version}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{ver.snapshot.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3"/>
                                    {new Date(ver.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                    <User className="h-3 w-3 ml-1"/>
                                    {ver.savedBy?.name ?? "Admin"}
                                </div>
                                {ver.changeNote &&
                                    <p className="text-xs italic text-muted-foreground mt-0.5">{ver.changeNote}</p>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {idx !== 0 && (
                                    <button
                                        onClick={() => restore(ver._id)}
                                        disabled={restoring === ver._id}
                                        className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                                            confirmId === ver._id
                                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                                : "border hover:border-indigo-300 hover:text-indigo-600"
                                        }`}
                                    >
                                        {restoring === ver._id ? "..." : confirmId === ver._id ? "Confirm?" : <>
                                            <RotateCcw className="h-3 w-3 inline mr-1"/>Restore</>}
                                    </button>
                                )}
                                {idx === 0 &&
                                    <span className="text-xs text-emerald-600 font-medium px-2">Current</span>}
                                <button onClick={() => setExpandedId(expandedId === ver._id ? null : ver._id)}
                                        className="p-1 rounded hover:bg-muted text-muted-foreground">
                                    {expandedId === ver._id ? <ChevronUp className="h-3.5 w-3.5"/> :
                                        <ChevronDown className="h-3.5 w-3.5"/>}
                                </button>
                            </div>
                        </div>

                        {expandedId === ver._id && (
                            <div className="border-t px-3 py-2 bg-muted/30 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">HTML Preview (first 300
                                    chars)</p>
                                <pre
                                    className="text-xs font-mono bg-zinc-950 text-emerald-300 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                    {(ver.snapshot.htmlTemplate ?? "").slice(0, 300)}{ver.snapshot.htmlTemplate?.length > 300 ? "\n..." : ""}
                    </pre>
                                {ver.snapshot.description && (
                                    <p className="text-xs text-muted-foreground">{ver.snapshot.description}</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="border-t px-4 py-3 shrink-0">
                <p className="text-xs text-muted-foreground text-center">
                    Last 20 versions kept automatically.
                </p>
            </div>
        </div>
    );
}