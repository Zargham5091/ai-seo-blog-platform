// components/dashboard/SessionManager.tsx
"use client";
import {useEffect, useState} from "react";
import {Monitor, Smartphone, Trash2, Shield, AlertTriangle, Download} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {formatDate} from "@/lib/utils";

interface Session {
    _id: string;
    ip: string;
    browser: string;
    os: string;
    device: string;
    lastActiveAt: string;
    createdAt: string;
}

export function SessionManager() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [exportingData, setExportingData] = useState(false);

    const fetchSessions = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/sessions");
            const d = await res.json();
            if (d.success) setSessions(d.data ?? []);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const revokeSession = async (id: string) => {
        setRevoking(id);
        try {
            await fetch(`/api/auth/sessions?id=${id}`, {method: "DELETE"});
            setSessions((prev) => prev.filter((s) => s._id !== id));
        } finally {
            setRevoking(null);
        }
    };

    const revokeAll = async () => {
        if (!confirm("Sign out of all other sessions? You will remain signed in on this device.")) return;
        setRevoking("all");
        try {
            await fetch("/api/auth/sessions?all=true", {method: "DELETE"});
            await fetchSessions();
        } finally {
            setRevoking(null);
        }
    };

    const exportData = async () => {
        setExportingData(true);
        try {
            const res = await fetch("/api/auth/gdpr-export");
            if (!res.ok) {
                alert("Export failed. Please try again.");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `seo-platform-data-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } finally {
            setExportingData(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Active Sessions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <Shield className="h-4 w-4 text-indigo-500"/> Active Sessions
                            </CardTitle>
                            <CardDescription>Devices currently signed in to your account</CardDescription>
                        </div>
                        {sessions.length > 1 && (
                            <Button variant="outline" size="sm"
                                    className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1.5"
                                    onClick={revokeAll} isLoading={revoking === "all"}>
                                <Trash2 className="h-3.5 w-3.5"/> Sign out all
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i}
                                                                                     className="h-16 skeleton rounded-lg"/>)}</div>
                    ) : sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No active sessions recorded
                            yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {sessions.map((s, i) => (
                                <div key={s._id}
                                     className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}>
                                    <div
                                        className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        {s.device === "mobile" || s.device === "tablet"
                                            ? <Smartphone className="h-4 w-4 text-muted-foreground"/>
                                            : <Monitor className="h-4 w-4 text-muted-foreground"/>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{s.browser} on {s.os}</p>
                                            {i === 0 &&
                                                <Badge variant="success" className="text-[10px]">This device</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {s.ip !== "unknown" && `${s.ip} · `}
                                            Last active {formatDate(new Date(s.lastActiveAt), {
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                        </p>
                                    </div>
                                    {i !== 0 && (
                                        <Button variant="ghost" size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => revokeSession(s._id)} isLoading={revoking === s._id}>
                                            <Trash2 className="h-3.5 w-3.5"/>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* GDPR Data Export */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <Download className="h-4 w-4 text-indigo-500"/> Your Data
                    </CardTitle>
                    <CardDescription>Download a copy of all data SEO Platform holds about you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Your export includes: account details, all blog posts, activity history. Sensitive data like
                        passwords and tokens are excluded.
                    </p>
                    <Button variant="outline" className="gap-2" onClick={exportData} isLoading={exportingData}>
                        <Download className="h-4 w-4"/> Export My Data (JSON)
                    </Button>
                    <div
                        className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5"/>
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                            To request permanent account deletion, use the &quot;Delete Account&quot; button below or
                            contact support.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}