"use client";
import {useEffect, useState, useCallback} from "react";
import {
    Activity, LogIn, FileText, UserCheck, UserX,
    Settings, Search, Filter, X, Monitor, Smartphone,
    Globe, AlertTriangle, TrendingUp, Users, Clock,
    ChevronRight, RefreshCw, Download,
} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/form-elements";
import {formatDate} from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedUA {
    browser: string;
    os: string;
    device: string;
    deviceIcon: string
}

interface ActivityLog {
    _id: string;
    action: string;
    category: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    parsedUA?: ParsedUA;
    createdAt: string;
    userId: { _id: string; name: string; email: string; image?: string; role: string; plan: string };
}

interface Stats {
    total24h: number;
    logins24h: number;
    uniqueUsers24h: number;
    topActions: { _id: string; count: number }[];
    activityByHour: { _id: number; count: number }[];
}

interface UserDetail {
    user: {
        name: string;
        email: string;
        image?: string;
        role: string;
        plan: string;
        createdAt: string;
        isActive: boolean;
        aiCreditsUsed: number;
        aiCreditsLimit: number
    };
    logs: ActivityLog[];
    loginStats: { _id: string; count: number; ips: string[] }[];
    uniqueIPs: string[];
    totalActions: number;
}

interface SuspiciousEntry {
    _id: { userId: string; ip: string };
    count: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
    "user.login": {label: "Signed in", icon: LogIn, color: "text-emerald-600"},
    "user.register": {label: "Registered", icon: UserCheck, color: "text-indigo-600"},
    "user.password_changed": {label: "Changed password", icon: Settings, color: "text-amber-600"},
    "blog.created": {label: "Created blog post", icon: FileText, color: "text-sky-600"},
    "blog.published": {label: "Published post", icon: FileText, color: "text-emerald-600"},
    "blog.deleted": {label: "Deleted post", icon: FileText, color: "text-red-500"},
    "blog.ai_generated": {label: "AI generated post", icon: FileText, color: "text-purple-600"},
    "team.member_invited": {label: "Invited team member", icon: UserCheck, color: "text-indigo-600"},
    "team.member_joined": {label: "Joined team", icon: UserCheck, color: "text-emerald-600"},
    "team.member_removed": {label: "Removed team member", icon: UserX, color: "text-red-500"},
    "team.role_changed": {label: "Changed team role", icon: Settings, color: "text-amber-600"},
    "billing.plan_upgraded": {label: "Upgraded plan", icon: TrendingUp, color: "text-emerald-600"},
    "billing.plan_cancelled": {label: "Cancelled plan", icon: X, color: "text-red-500"},
    "seo.keywords_researched": {label: "Researched keywords", icon: Search, color: "text-sky-600"},
    "seo.analyzed": {label: "Analyzed SEO", icon: Activity, color: "text-sky-600"},
};

const CATEGORY_COLOR: Record<string, "info" | "success" | "warning" | "destructive" | "secondary"> = {
    auth: "info", blog: "success", team: "warning",
    billing: "success", seo: "secondary", system: "secondary",
};

const PLAN_COLOR: Record<string, "secondary" | "info" | "warning" | "success"> = {
    free: "secondary", silver: "info", gold: "warning", diamond: "success",
};

const BROWSER_ICONS: Record<string, string> = {
    Chrome: "🌐", Firefox: "🦊", Safari: "🧭", Edge: "🔵",
    Opera: "🔴", IE: "🔷", Chromium: "⚪", Unknown: "❓",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SuperAdminActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [suspicious, setSuspicious] = useState<SuspiciousEntry[]>([]);
    const [topIPs, setTopIPs] = useState<{ ip: string; count: number }[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Filters
    const [category, setCategory] = useState("");
    const [searchUser, setSearchUser] = useState("");
    const [filterIP, setFilterIP] = useState("");
    const [filterAction, setFilterAction] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // User detail modal
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);

    // ── Fetch stats ───────────────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await fetch("/api/super-admin/activity?statsOnly=true");
            const d = await res.json();
            if (d.success) setStats(d.data);
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // ── Fetch logs ────────────────────────────────────────────────────────────
    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({limit: "50"});
            if (category) params.set("category", category);
            if (filterIP) params.set("ip", filterIP);
            if (filterAction) params.set("action", filterAction);
            if (dateFrom) params.set("from", dateFrom);
            if (dateTo) params.set("to", dateTo);

            const res = await fetch(`/api/super-admin/activity?${params}`);
            const d = await res.json();
            if (d.success) {
                setLogs(d.data ?? []);
                setSuspicious(d.suspicious ?? []);
                setTopIPs(d.topIPs ?? []);
                setTotal(d.total ?? 0);
            }
        } finally {
            setIsLoading(false);
        }
    }, [category, filterIP, filterAction, dateFrom, dateTo]);

    // ── Fetch user detail ─────────────────────────────────────────────────────
    const fetchUserDetail = async (userId: string) => {
        setSelectedUser(userId);
        setUserDetailLoading(true);
        try {
            const res = await fetch(`/api/super-admin/activity?userDetail=${userId}`);
            const d = await res.json();
            if (d.success) setUserDetail(d.data);
        } finally {
            setUserDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Client-side user name filter
    const filteredLogs = searchUser
        ? logs.filter((l) =>
            l.userId?.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
            l.userId?.email?.toLowerCase().includes(searchUser.toLowerCase())
        )
        : logs;

    // ── Export CSV ────────────────────────────────────────────────────────────
    const exportCSV = () => {
        const rows = [
            ["Time", "User", "Email", "Action", "Category", "IP", "Device", "Browser", "OS"].join(","),
            ...filteredLogs.map((l) => [
                new Date(l.createdAt).toISOString(),
                l.userId?.name ?? "",
                l.userId?.email ?? "",
                l.action,
                l.category,
                l.ip ?? "",
                l.parsedUA?.device ?? "",
                l.parsedUA?.browser ?? "",
                l.parsedUA?.os ?? "",
            ].map((v) => `"${v}"`).join(",")),
        ].join("\n");

        const blob = new Blob([rows], {type: "text/csv"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Activity className="h-6 w-6 text-indigo-500"/> Platform Activity
                    </h1>
                    <p className="text-muted-foreground text-sm">Real-time user activity across the platform</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => {
                        fetchLogs();
                        fetchStats();
                    }}>
                        <RefreshCw className="h-3.5 w-3.5"/> Refresh
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                        <Download className="h-3.5 w-3.5"/> Export CSV
                    </Button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Actions (24h)",
                        value: stats?.total24h ?? 0,
                        icon: Activity,
                        color: "from-indigo-500 to-indigo-600"
                    },
                    {
                        label: "Logins (24h)",
                        value: stats?.logins24h ?? 0,
                        icon: LogIn,
                        color: "from-emerald-500 to-emerald-600"
                    },
                    {
                        label: "Active Users (24h)",
                        value: stats?.uniqueUsers24h ?? 0,
                        icon: Users,
                        color: "from-sky-500 to-sky-600"
                    },
                    {
                        label: "Suspicious",
                        value: suspicious.length,
                        icon: AlertTriangle,
                        color: suspicious.length > 0 ? "from-red-500 to-red-600" : "from-slate-400 to-slate-500"
                    },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div
                                className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                                <s.icon className="h-5 w-5 text-white"/>
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{statsLoading ? "—" : s.value}</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Suspicious activity banner */}
            {suspicious.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4"/> Suspicious Activity Detected
                        ({suspicious.length} case{suspicious.length > 1 ? "s" : ""})
                    </p>
                    <div className="space-y-1">
                        {suspicious.map((s, i) => (
                            <p key={i} className="text-xs text-red-600 dark:text-red-400">
                                User ID <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{s._id.userId}</code>
                                {" — "}
                                <strong>{s.count} logins</strong> in the last hour from IP{" "}
                                <code className="bg-red-100 dark:bg-red-900 px-1 rounded">{s._id.ip}</code>
                                <button
                                    onClick={() => setFilterIP(s._id.ip)}
                                    className="ml-2 text-red-700 underline hover:no-underline"
                                >
                                    Filter by IP
                                </button>
                            </p>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-4 gap-6">
                {/* ── Main feed ── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex gap-2 flex-wrap">
                                {["", "auth", "blog", "team", "billing", "seo"].map((c) => (
                                    <Button key={c} variant={category === c ? "default" : "outline"} size="sm"
                                            onClick={() => setCategory(c)} className="capitalize">
                                        <Filter className="h-3 w-3 mr-1"/>{c || "All"}
                                    </Button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                <div className="relative">
                                    <Search
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                                    <Input placeholder="Search user..." className="pl-8 text-xs h-8"
                                           value={searchUser} onChange={(e) => setSearchUser(e.target.value)}/>
                                </div>
                                <div className="relative">
                                    <Globe
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                                    <Input placeholder="Filter by IP..." className="pl-8 text-xs h-8"
                                           value={filterIP} onChange={(e) => setFilterIP(e.target.value)}/>
                                </div>
                                <Input type="date" className="text-xs h-8" value={dateFrom}
                                       onChange={(e) => setDateFrom(e.target.value)}/>
                                <Input type="date" className="text-xs h-8" value={dateTo}
                                       onChange={(e) => setDateTo(e.target.value)}/>
                            </div>
                            {(searchUser || filterIP || filterAction || dateFrom || dateTo) && (
                                <button onClick={() => {
                                    setSearchUser("");
                                    setFilterIP("");
                                    setFilterAction("");
                                    setDateFrom("");
                                    setDateTo("");
                                }}
                                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                    <X className="h-3 w-3"/> Clear all filters
                                </button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Log list */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span>Activity Feed</span>
                                <span
                                    className="text-muted-foreground font-normal text-xs">{total} total · showing {filteredLogs.length}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="space-y-0">
                                    {[...Array(8)].map((_, i) => <div key={i}
                                                                      className="h-16 skeleton mx-4 mb-2 rounded-lg"/>)}
                                </div>
                            ) : filteredLogs.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-sm">No activity
                                    found.</div>
                            ) : (
                                <div className="divide-y">
                                    {filteredLogs.map((log) => {
                                        const cfg = ACTION_LABELS[log.action];
                                        const Icon = cfg?.icon ?? Activity;
                                        const isSuspicious = suspicious.some(
                                            (s) => s._id.userId === log.userId?._id && s._id.ip === log.ip
                                        );
                                        return (
                                            <div key={log._id}
                                                 className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors ${isSuspicious ? "bg-red-50/50 dark:bg-red-950/10 border-l-2 border-red-400" : ""}`}>
                                                {/* Action icon */}
                                                <div
                                                    className={`mt-1 shrink-0 ${cfg?.color ?? "text-muted-foreground"}`}>
                                                    <Icon className="h-4 w-4"/>
                                                </div>

                                                {/* Main content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => fetchUserDetail(log.userId?._id)}
                                                            className="font-medium text-sm hover:text-indigo-600 hover:underline transition-colors flex items-center gap-1"
                                                        >
                                                            {log.userId?.image ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={log.userId.image} alt=""
                                                                     className="h-4 w-4 rounded-full object-cover"/>
                                                            ) : (
                                                                <div
                                                                    className="h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[8px] font-bold">
                                                                    {log.userId?.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {log.userId?.name ?? "Unknown"}
                                                            <ChevronRight className="h-3 w-3 opacity-50"/>
                                                        </button>
                                                        <Badge variant={PLAN_COLOR[log.userId?.plan] ?? "secondary"}
                                                               className="text-[10px] px-1.5 py-0 capitalize">
                                                            {log.userId?.plan ?? "free"}
                                                        </Badge>
                                                        <Badge variant={CATEGORY_COLOR[log.category] ?? "secondary"}
                                                               className="text-[10px] px-1.5 py-0 capitalize">
                                                            {log.category}
                                                        </Badge>
                                                        {isSuspicious && (
                                                            <Badge variant="destructive"
                                                                   className="text-[10px] px-1.5 py-0 gap-1">
                                                                <AlertTriangle className="h-2.5 w-2.5"/> Suspicious
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {cfg?.label ?? log.action}
                                                        {!!log.metadata?.title && ` — "${String(log.metadata.title)}"`}
                                                        {!!log.metadata?.invitedEmail && ` → ${String(log.metadata.invitedEmail)}`}
                                                        {!!log.metadata?.newRole && ` to ${String(log.metadata.newRole)}`}
                                                    </p>

                                                    {/* Meta row: time + IP + device + browser + OS */}
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Clock className="h-2.5 w-2.5"/>
                                {formatDate(new Date(log.createdAt), {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </span>
                                                        {log.ip && log.ip !== "unknown" && (
                                                            <button
                                                                onClick={() => setFilterIP(log.ip!)}
                                                                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-indigo-600 transition-colors"
                                                            >
                                                                <Globe className="h-2.5 w-2.5"/> {log.ip}
                                                            </button>
                                                        )}
                                                        {log.parsedUA && (
                                                            <>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  {log.parsedUA.device === "mobile" ? <Smartphone className="h-2.5 w-2.5"/> :
                                      <Monitor className="h-2.5 w-2.5"/>}
                                    {log.parsedUA.device}
                                </span>
                                                                <span className="text-[10px] text-muted-foreground">
                                  {BROWSER_ICONS[log.parsedUA.browser] ?? "🌐"} {log.parsedUA.browser}
                                </span>
                                                                <span className="text-[10px] text-muted-foreground">
                                  {log.parsedUA.os}
                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Sidebar: top IPs + top actions ── */}
                <div className="space-y-4">
                    {/* Top IPs */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs flex items-center gap-2">
                                <Globe className="h-3.5 w-3.5 text-indigo-500"/> Top IPs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {topIPs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No data</p>
                            ) : topIPs.map(({ip, count}) => (
                                <button key={ip} onClick={() => setFilterIP(ip)}
                                        className="w-full flex items-center justify-between text-xs hover:bg-muted/30 rounded p-1.5 transition-colors">
                                    <code className="font-mono text-[10px]">{ip}</code>
                                    <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Top actions */}
                    {stats?.topActions && stats.topActions.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs flex items-center gap-2">
                                    <TrendingUp className="h-3.5 w-3.5 text-indigo-500"/> Top Actions (7d)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {stats.topActions.map((a) => {
                                    const cfg = ACTION_LABELS[a._id];
                                    return (
                                        <button key={a._id} onClick={() => setFilterAction(a._id)}
                                                className="w-full flex items-center justify-between text-xs hover:bg-muted/30 rounded p-1.5 transition-colors">
                                            <span
                                                className="text-muted-foreground truncate">{cfg?.label ?? a._id}</span>
                                            <Badge variant="secondary"
                                                   className="text-[10px] shrink-0 ml-1">{a.count}</Badge>
                                        </button>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* ── User Detail Modal ── */}
            {selectedUser && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => {
                        setSelectedUser(null);
                        setUserDetail(null);
                    }}/>
                    <div
                        className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-background border-l shadow-2xl overflow-y-auto">
                        <div
                            className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
                            <h2 className="font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-500"/> User Activity Profile
                            </h2>
                            <button onClick={() => {
                                setSelectedUser(null);
                                setUserDetail(null);
                            }}
                                    className="h-8 w-8 rounded-lg hover:bg-muted/50 flex items-center justify-center">
                                <X className="h-4 w-4"/>
                            </button>
                        </div>

                        {userDetailLoading ? (
                            <div className="p-6 space-y-3">
                                {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg"/>)}
                            </div>
                        ) : userDetail ? (
                            <div className="p-4 space-y-4">
                                {/* User info */}
                                <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20">
                                    {userDetail.user?.image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={userDetail.user.image} alt=""
                                             className="h-12 w-12 rounded-full object-cover"/>
                                    ) : (
                                        <div
                                            className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold">
                                            {userDetail.user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{userDetail.user?.name}</p>
                                        <p className="text-xs text-muted-foreground">{userDetail.user?.email}</p>
                                        <div className="flex gap-1.5 mt-1 flex-wrap">
                                            <Badge variant={PLAN_COLOR[userDetail.user?.plan] ?? "secondary"}
                                                   className="capitalize text-xs">{userDetail.user?.plan}</Badge>
                                            <Badge variant={userDetail.user?.isActive ? "success" : "destructive"}
                                                   className="text-xs">
                                                {userDetail.user?.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        {label: "Total Actions", value: userDetail.totalActions},
                                        {label: "Unique IPs", value: userDetail.uniqueIPs.length},
                                        {
                                            label: "AI Credits",
                                            value: `${userDetail.user?.aiCreditsUsed}/${userDetail.user?.aiCreditsLimit}`
                                        },
                                    ].map((s) => (
                                        <div key={s.label} className="text-center p-3 rounded-lg border bg-muted/20">
                                            <p className="text-lg font-bold">{s.value}</p>
                                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* IP history */}
                                {userDetail.uniqueIPs.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                                            <Globe className="h-3.5 w-3.5 text-indigo-500"/> Known IP Addresses
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {userDetail.uniqueIPs.map((ip) => (
                                                <code key={ip}
                                                      className="text-[10px] bg-muted px-2 py-1 rounded font-mono">{ip}</code>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Login frequency */}
                                {userDetail.loginStats.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                                            <LogIn className="h-3.5 w-3.5 text-indigo-500"/> Login History (30 days)
                                        </p>
                                        <div className="space-y-1.5">
                                            {userDetail.loginStats.map((s) => (
                                                <div key={s._id} className="flex items-center gap-2">
                                                    <span
                                                        className="text-[10px] text-muted-foreground w-24 shrink-0">{s._id}</span>
                                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                                        <div className="h-full bg-indigo-500 rounded-full"
                                                             style={{width: `${Math.min((s.count / 10) * 100, 100)}%`}}/>
                                                    </div>
                                                    <span
                                                        className="text-[10px] text-muted-foreground w-6 text-right">{s.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent activity */}
                                <div>
                                    <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                                        <Activity className="h-3.5 w-3.5 text-indigo-500"/> Recent Activity
                                    </p>
                                    <div className="space-y-0 divide-y rounded-lg border overflow-hidden">
                                        {userDetail.logs.slice(0, 20).map((log) => {
                                            const cfg = ACTION_LABELS[log.action];
                                            const Icon = cfg?.icon ?? Activity;
                                            return (
                                                <div key={log._id}
                                                     className="flex items-start gap-2 px-3 py-2 hover:bg-muted/20 transition-colors">
                                                    <div
                                                        className={`mt-0.5 shrink-0 ${cfg?.color ?? "text-muted-foreground"}`}>
                                                        <Icon className="h-3.5 w-3.5"/>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs">{cfg?.label ?? log.action}</p>
                                                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(new Date(log.createdAt), {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                              </span>
                                                            {log.ip && log.ip !== "unknown" && (
                                                                <span
                                                                    className="text-[10px] text-muted-foreground font-mono">{log.ip}</span>
                                                            )}
                                                            {log.parsedUA && (
                                                                <span className="text-[10px] text-muted-foreground">
                                  {log.parsedUA.deviceIcon} {log.parsedUA.browser} · {log.parsedUA.os}
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground text-sm">Failed to load user
                                details.</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}


// // app/(dashboard)/dashboard/super-admin/activity/route.ts
// "use client";
// import {useEffect, useState} from "react";
// import {Activity, LogIn, FileText, UserCheck, UserX, Settings, Search, Filter} from "lucide-react";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {Badge} from "@/components/ui/form-elements";
// import {Button} from "@/components/ui/button";
// import {formatDate} from "@/lib/utils";
//
// interface ActivityLog {
//     _id: string;
//     action: string;
//     category: string;
//     metadata?: Record<string, unknown>;
//     ip?: string;
//     createdAt: string;
//     userId: { _id: string; name: string; email: string; image?: string; role: string; plan: string };
// }
//
// const ACTION_LABELS: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
//     "user.login": {label: "Signed in", icon: LogIn, color: "text-emerald-600"},
//     "user.register": {label: "Registered", icon: UserCheck, color: "text-indigo-600"},
//     "blog.created": {label: "Created a blog post", icon: FileText, color: "text-sky-600"},
//     "blog.published": {label: "Published a post", icon: FileText, color: "text-emerald-600"},
//     "blog.deleted": {label: "Deleted a post", icon: FileText, color: "text-red-500"},
//     "blog.ai_generated": {label: "AI generated a post", icon: FileText, color: "text-purple-600"},
//     "team.member_invited": {label: "Invited a member", icon: UserCheck, color: "text-indigo-600"},
//     "team.member_joined": {label: "Joined a team", icon: UserCheck, color: "text-emerald-600"},
//     "team.member_removed": {label: "Removed a member", icon: UserX, color: "text-red-500"},
//     "team.role_changed": {label: "Changed a role", icon: Settings, color: "text-amber-600"},
//     "billing.plan_upgraded": {label: "Upgraded plan", icon: Settings, color: "text-emerald-600"},
//     "seo.keywords_researched": {label: "Researched keywords", icon: Search, color: "text-sky-600"},
// };
//
// const CATEGORY_COLOR: Record<string, "info" | "success" | "warning" | "destructive" | "secondary"> = {
//     auth: "info",
//     blog: "success",
//     team: "warning",
//     billing: "success",
//     seo: "secondary",
//     system: "secondary",
// };
//
// const PLAN_COLOR: Record<string, "secondary" | "info" | "warning" | "success"> = {
//     free: "secondary", silver: "info", gold: "warning", diamond: "success",
// };
//
// export default function SuperAdminActivityPage() {
//     const [logs, setLogs] = useState<ActivityLog[]>([]);
//     const [suspicious, setSuspicious] = useState<{ _id: { userId: string; ip: string }; count: number }[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [category, setCategory] = useState("");
//
//     const fetchLogs = async () => {
//         setIsLoading(true);
//         try {
//             const params = new URLSearchParams({limit: "50"});
//             if (category) params.set("category", category);
//             const res = await fetch(`/api/super-admin/activity?${params}`);
//             const d = await res.json();
//             if (d.success) {
//                 setLogs(d.data ?? []);
//                 setSuspicious(d.suspicious ?? []);
//             }
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     useEffect(() => {
//         fetchLogs();
//     }, [category]); // eslint-disable-line react-hooks/exhaustive-deps
//
//     return (
//         <div className="space-y-6">
//             <div>
//                 <h1 className="text-2xl font-bold flex items-center gap-2">
//                     <Activity className="h-6 w-6 text-indigo-500"/> Platform Activity
//                 </h1>
//                 <p className="text-muted-foreground text-sm">All user activity across the platform</p>
//             </div>
//
//             {/* Suspicious activity banner */}
//             {suspicious.length > 0 && (
//                 <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
//                     <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
//                         ⚠️ Suspicious Activity Detected ({suspicious.length} case{suspicious.length > 1 ? "s" : ""})
//                     </p>
//                     <div className="space-y-1">
//                         {suspicious.map((s, i) => (
//                             <p key={i} className="text-xs text-red-600 dark:text-red-400">
//                                 User <code
//                                 className="bg-red-100 dark:bg-red-900 px-1 rounded">{s._id.userId}</code> — {s.count} logins
//                                 in the last hour from IP <code
//                                 className="bg-red-100 dark:bg-red-900 px-1 rounded">{s._id.ip}</code>
//                             </p>
//                         ))}
//                     </div>
//                 </div>
//             )}
//
//             {/* Filters */}
//             <div className="flex gap-2 flex-wrap">
//                 {["", "auth", "blog", "team", "billing", "seo"].map((c) => (
//                     <Button
//                         key={c}
//                         variant={category === c ? "default" : "outline"}
//                         size="sm"
//                         onClick={() => setCategory(c)}
//                         className="capitalize"
//                     >
//                         <Filter className="h-3 w-3 mr-1"/>
//                         {c || "All"}
//                     </Button>
//                 ))}
//             </div>
//
//             {/* Activity log */}
//             <Card>
//                 <CardHeader className="pb-3">
//                     <CardTitle className="text-sm">Recent Activity ({logs.length})</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     {isLoading ? (
//                         <div className="space-y-3">
//                             {[...Array(8)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg"/>)}
//                         </div>
//                     ) : logs.length === 0 ? (
//                         <div className="text-center py-10 text-muted-foreground text-sm">No activity logged yet.</div>
//                     ) : (
//                         <div className="space-y-0.5">
//                             {logs.map((log) => {
//                                 const cfg = ACTION_LABELS[log.action];
//                                 const Icon = cfg?.icon ?? Activity;
//                                 return (
//                                     <div key={log._id}
//                                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
//                                         <div className={`mt-0.5 shrink-0 ${cfg?.color ?? "text-muted-foreground"}`}>
//                                             <Icon className="h-4 w-4"/>
//                                         </div>
//                                         <div className="flex-1 min-w-0">
//                                             <div className="flex items-center gap-2 flex-wrap">
//                                                 <span
//                                                     className="text-sm font-medium">{log.userId?.name ?? "Unknown"}</span>
//                                                 <Badge variant={PLAN_COLOR[log.userId?.plan] ?? "secondary"}
//                                                        className="text-[10px] capitalize px-1.5 py-0">
//                                                     {log.userId?.plan ?? "free"}
//                                                 </Badge>
//                                                 <Badge variant={CATEGORY_COLOR[log.category] ?? "secondary"}
//                                                        className="text-[10px] capitalize px-1.5 py-0">
//                                                     {log.category}
//                                                 </Badge>
//                                             </div>
//                                             <p className="text-xs text-muted-foreground">
//                                                 {cfg?.label ?? log.action}
//                                                 {!!log.metadata?.title && ` — "${String(log.metadata.title)}"`}
//                                                 {!!log.metadata?.invitedEmail && ` → ${String(log.metadata.invitedEmail)}`}
//                                             </p>
//                                             <div className="flex items-center gap-2 mt-0.5 flex-wrap">
//                         <span className="text-[10px] text-muted-foreground">
//                           {formatDate(new Date(log.createdAt), {
//                               month: "short",
//                               day: "numeric",
//                               hour: "2-digit",
//                               minute: "2-digit"
//                           })}
//                         </span>
//                                                 {log.ip && log.ip !== "unknown" && (
//                                                     <span
//                                                         className="text-[10px] text-muted-foreground">· IP: {log.ip}</span>
//                                                 )}
//                                                 {!!log.metadata?.device && (
//                                                     <span
//                                                         className="text-[10px] text-muted-foreground capitalize">· {String(log.metadata.device)}</span>
//                                                 )}
//                                                 <span
//                                                     className="text-[10px] text-muted-foreground">· {log.userId?.email}</span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }