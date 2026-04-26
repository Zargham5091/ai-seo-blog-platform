"use client";
import {useEffect, useState, useRef} from "react";
import {Bell, CheckCircle, X, Settings, Zap, TrendingDown, TrendingUp, Link, Star} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import type {AlertType} from "@/models/Alert";

interface AlertItem {
    _id: string;
    type: AlertType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const ALERT_ICONS: Partial<Record<AlertType, React.ElementType>> = {
    rank_drop: TrendingDown,
    rank_improve: TrendingUp,
    rank_goal_reached: CheckCircle,
    new_backlink: Link,
    featured_approved: Star,
    ai_credits_low: Zap,
    ai_credits_exhausted: Zap,
};

const ALERT_COLORS: Partial<Record<AlertType, string>> = {
    rank_drop: "text-red-500",
    rank_improve: "text-emerald-500",
    rank_goal_reached: "text-emerald-500",
    new_backlink: "text-sky-500",
    featured_approved: "text-indigo-500",
    ai_credits_low: "text-amber-500",
    ai_credits_exhausted: "text-red-500",
};

export function AlertsBell() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const fetchAlerts = async () => {
        const res = await fetch("/api/alerts?limit=10");
        const d = await res.json();
        if (d.success) {
            setAlerts(d.data.alerts);
            setUnreadCount(d.data.unreadCount);
        }
    };

    useEffect(() => {
        fetchAlerts();
        // Poll every 60 seconds
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const markAllRead = async () => {
        await fetch("/api/alerts", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action: "mark_all_read"}),
        });
        setAlerts((prev) => prev.map((a) => ({...a, isRead: true})));
        setUnreadCount(0);
    };

    const markRead = async (id: string) => {
        await fetch("/api/alerts", {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action: "mark_read", id}),
        });
        setAlerts((prev) => prev.map((a) => a._id === id ? {...a, isRead: true} : a));
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
                <Bell className="h-5 w-5 text-muted-foreground"/>
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 w-80 bg-popover border rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-indigo-500"/>
                            <span className="font-semibold text-sm">Notifications</span>
                            {unreadCount > 0 && (
                                <Badge variant="info" className="text-xs px-1.5 py-0.5">{unreadCount}</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                                    Mark all read
                                </Button>
                            )}
                            <a href="/dashboard/admin/settings?tab=alerts">
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Settings className="h-3.5 w-3.5"/>
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <Bell className="h-8 w-8 mb-2 opacity-20"/>
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            alerts.map((alert) => {
                                const Icon = ALERT_ICONS[alert.type] ?? Bell;
                                const iconColor = ALERT_COLORS[alert.type] ?? "text-muted-foreground";
                                return (
                                    <div
                                        key={alert._id}
                                        className={`flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-b last:border-0 ${!alert.isRead ? "bg-indigo-50/50 dark:bg-indigo-950/10" : ""}`}
                                        onClick={() => !alert.isRead && markRead(alert._id)}
                                    >
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 shrink-0 ${iconColor}`}>
                                            <Icon className="h-4 w-4"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${!alert.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                                {alert.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                {new Date(alert.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!alert.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"/>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {alerts.length > 0 && (
                        <div className="border-t px-4 py-2">
                            <a href="/dashboard/admin/settings?tab=alerts"
                               className="text-xs text-indigo-600 hover:underline">
                                Notification settings →
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
