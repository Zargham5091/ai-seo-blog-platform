"use client";
import {useEffect, useState} from "react";
import {Bell, CheckCheck, Settings, Mail, Monitor} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {formatDate} from "@/lib/utils";
import type {AlertType} from "@/models/Alert";

interface AlertItem {
    _id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

interface AlertSettings {
    enabledAlerts: AlertType[];
    channel: "in_app" | "email" | "both";
    emailAddress: string;
    rankDropThreshold: number;
    creditThreshold: number;
}

const ALL_ALERT_TYPES: { key: AlertType; label: string; description: string }[] = [
    {key: "rank_drop", label: "Rank Drop", description: "When a tracked keyword drops significantly"},
    {key: "rank_improve", label: "Rank Improvement", description: "When a keyword moves up in rankings"},
    {key: "rank_goal_reached", label: "Goal Reached", description: "When a keyword hits your target position"},
    {key: "new_backlink", label: "New Backlink", description: "When you earn a new inbound link"},
    {key: "lost_backlink", label: "Lost Backlink", description: "When a backlink is removed"},
    {key: "keyword_spike", label: "Keyword Spike", description: "When a keyword's search volume spikes"},
    {key: "ai_credits_low", label: "Low AI Credits", description: "When credits fall below threshold"},
    {key: "ai_credits_exhausted", label: "Credits Exhausted", description: "When all credits are used"},
    {key: "plan_expiring", label: "Plan Expiring", description: "7 days before subscription renewal"},
    {key: "featured_approved", label: "Post Featured", description: "When admin approves your feature request"},
    {key: "featured_rejected", label: "Feature Rejected", description: "When admin rejects your feature request"},
];

const TYPE_ICONS: Record<string, string> = {
    rank_drop: "📉", rank_improve: "📈", rank_goal_reached: "🎯",
    new_backlink: "🔗", lost_backlink: "🔓", keyword_spike: "⚡",
    ai_credits_low: "⚠️", ai_credits_exhausted: "🚫",
    plan_expiring: "⏰", featured_approved: "⭐", featured_rejected: "❌", team_invite: "👥",
};

const DEFAULT_SETTINGS: AlertSettings = {
    enabledAlerts: ["rank_drop", "ai_credits_low", "plan_expiring", "featured_approved"],
    channel: "in_app",
    emailAddress: "",
    rankDropThreshold: 5,
    creditThreshold: 20,
};

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [settings, setSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const fetchAlerts = async () => {
        setIsLoading(true);
        const res = await fetch("/api/alerts");
        const d = await res.json();
        if (d.success) {
            setAlerts(d.data.alerts);
            setUnreadCount(d.data.unreadCount);
            if (d.data.settings) setSettings({...DEFAULT_SETTINGS, ...d.data.settings});
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const markAllRead = async () => {
        await fetch("/api/alerts", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action: "mark_all_read"}),
        });
        fetchAlerts();
    };

    const markRead = async (id: string) => {
        await fetch("/api/alerts", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action: "mark_read", id}),
        });
        setAlerts((prev) => prev.map((a) => a._id === id ? {...a, isRead: true} : a));
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    const saveSettings = async () => {
        setIsSaving(true);
        await fetch("/api/alerts", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action: "update_settings", ...settings}),
        });
        setSaveMsg("Settings saved!");
        setTimeout(() => setSaveMsg(""), 2000);
        setIsSaving(false);
    };

    const toggleAlert = (key: AlertType) => {
        setSettings((s) => ({
            ...s,
            enabledAlerts: s.enabledAlerts.includes(key)
                ? s.enabledAlerts.filter((a) => a !== key)
                : [...s.enabledAlerts, key],
        }));
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bell className="h-6 w-6 text-indigo-500"/> Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-1">{unreadCount} unread</Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-sm">Manage your alerts and notification preferences</p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
                        <CheckCheck className="h-4 w-4"/> Mark All Read
                    </Button>
                )}
            </div>

            <Tabs defaultValue="notifications">
                <TabsList>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-3.5 w-3.5"/> Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings className="h-3.5 w-3.5"/> Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="mt-4">
                    {isLoading ? (
                        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i}
                                                                                     className="h-16 skeleton rounded-xl"/>)}</div>
                    ) : alerts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center py-16 text-center">
                                <Bell className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                                <p className="font-semibold">No notifications yet</p>
                                <p className="text-sm text-muted-foreground">Alerts will appear here when triggered</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {alerts.map((alert) => (
                                <Card
                                    key={alert._id}
                                    className={`cursor-pointer transition-all hover:shadow-sm ${!alert.isRead ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10" : ""}`}
                                    onClick={() => !alert.isRead && markRead(alert._id)}
                                >
                                    <CardContent className="p-4 flex items-start gap-3">
                                        <span className="text-xl shrink-0">{TYPE_ICONS[alert.type] ?? "🔔"}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm">{alert.title}</p>
                                                {!alert.isRead &&
                                                    <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0"/>}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {formatDate(new Date(alert.createdAt), {
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Delivery Channel</CardTitle>
                            <CardDescription>How you want to receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3">
                                {(["in_app", "email", "both"] as const).map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setSettings((s) => ({...s, channel: c}))}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                            settings.channel === c
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                                : "border-border hover:border-indigo-200"
                                        }`}
                                    >
                                        {c === "in_app" && <Monitor className="h-4 w-4"/>}
                                        {c === "email" && <Mail className="h-4 w-4"/>}
                                        {c === "both" && <Bell className="h-4 w-4"/>}
                                        {c === "in_app" ? "In App" : c === "email" ? "Email Only" : "Both"}
                                    </button>
                                ))}
                            </div>
                            {settings.channel !== "in_app" && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Notification Email</Label>
                                    <Input
                                        type="email"
                                        value={settings.emailAddress}
                                        onChange={(e) => setSettings((s) => ({...s, emailAddress: e.target.value}))}
                                        placeholder="alerts@yourdomain.com"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Alert Thresholds</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Rank Drop Alert (spots)</Label>
                                <Input
                                    type="number"
                                    min={1} max={50}
                                    value={settings.rankDropThreshold}
                                    onChange={(e) => setSettings((s) => ({
                                        ...s,
                                        rankDropThreshold: Number(e.target.value)
                                    }))}
                                />
                                <p className="text-xs text-muted-foreground">Alert when position drops by this many
                                    spots</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Low Credits Alert (%)</Label>
                                <Input
                                    type="number"
                                    min={5} max={80}
                                    value={settings.creditThreshold}
                                    onChange={(e) => setSettings((s) => ({
                                        ...s,
                                        creditThreshold: Number(e.target.value)
                                    }))}
                                />
                                <p className="text-xs text-muted-foreground">Alert when credits fall below this %</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Alert Types</CardTitle>
                            <CardDescription>Choose which events trigger notifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {ALL_ALERT_TYPES.map(({key, label, description}) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 cursor-pointer"
                                        onClick={() => toggleAlert(key)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span>{TYPE_ICONS[key] ?? "🔔"}</span>
                                            <div>
                                                <p className="text-sm font-medium">{label}</p>
                                                <p className="text-xs text-muted-foreground">{description}</p>
                                            </div>
                                        </div>
                                        <div
                                            className={`h-5 w-9 rounded-full transition-colors ${settings.enabledAlerts.includes(key) ? "bg-indigo-500" : "bg-muted"}`}>
                                            <div
                                                className={`h-4 w-4 rounded-full bg-white m-0.5 transition-transform ${settings.enabledAlerts.includes(key) ? "translate-x-4" : ""}`}/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center gap-3">
                        <Button variant="gradient" onClick={saveSettings} isLoading={isSaving}>Save Settings</Button>
                        {saveMsg && <span className="text-sm text-emerald-600">{saveMsg}</span>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
