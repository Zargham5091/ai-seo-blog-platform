"use client";
import {useEffect, useState} from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import {TrendingUp, Eye, FileText, Sparkles} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {StatsCard} from "@/components/dashboard/StatsCard";
import {formatNumber} from "@/lib/utils";


interface DashboardStats {
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    totalViews: number;
    avgSEOScore: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
}

interface ViewPoint {
    date: string;
    views: number
}

interface TopPost {
    title: string;
    viewCount: number;
    slug: string
}

const TOOLTIP_STYLE = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
};

const DEVICE_COLORS = ["#4F46E5", "#0EA5E9", "#22C55E"];

export default function AnalyticsPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [viewData, setViewData] = useState<ViewPoint[]>([]);
    const [topPosts, setTopPosts] = useState<TopPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/analytics?type=dashboard").then((r) => r.json()),
            fetch("/api/analytics?type=views").then((r) => r.json()),
            fetch("/api/analytics?type=top_posts").then((r) => r.json()),
        ]).then(([s, v, t]) => {
            if (s.success) setStats(s.data);
            if (v.success) setViewData(v.data);
            if (t.success) setTopPosts(t.data);
        }).finally(() => setIsLoading(false));
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-muted-foreground text-sm">Your content performance</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Views" value={isLoading ? "—" : formatNumber(stats?.totalViews ?? 0)} icon={Eye}
                           gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
                <StatsCard title="Published Posts" value={isLoading ? "—" : stats?.publishedBlogs ?? 0} icon={FileText}
                           gradient="bg-gradient-to-br from-sky-500 to-sky-600"/>
                <StatsCard title="Avg SEO Score" value={isLoading ? "—" : stats?.avgSEOScore ?? 0} icon={TrendingUp}
                           gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
                <StatsCard title="AI Credits Used" value={isLoading ? "—" : stats?.aiCreditsUsed ?? 0} icon={Sparkles}
                           gradient="bg-gradient-to-br from-purple-500 to-purple-600"/>
            </div>

            {/* Views chart */}
            <Card>
                <CardHeader><CardTitle className="text-base">Views by Post</CardTitle></CardHeader>
                <CardContent>
                    {viewData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={viewData}>
                                <defs>
                                    <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                <XAxis dataKey="date" tick={{fontSize: 11}}/>
                                <YAxis tick={{fontSize: 11}}/>
                                <Tooltip contentStyle={TOOLTIP_STYLE}/>
                                <Area type="monotone" dataKey="views" stroke="#4F46E5" strokeWidth={2}
                                      fill="url(#vGrad)"/>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
                            {isLoading ? "Loading..." : "No view data yet. Publish posts to start tracking."}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top posts */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Top Performing Posts</CardTitle></CardHeader>
                    <CardContent>
                        {topPosts.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={topPosts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                    <XAxis type="number" tick={{fontSize: 11}}/>
                                    <YAxis
                                        dataKey="title"
                                        type="category"
                                        tick={{fontSize: 11}}
                                        width={160}
                                        tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + "…" : v}
                                    />
                                    <Tooltip contentStyle={TOOLTIP_STYLE}/>
                                    <Bar dataKey="viewCount" fill="#4F46E5" radius={[0, 4, 4, 0]} name="Views"/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                                {isLoading ? "Loading..." : "No published posts yet."}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* SEO score breakdown */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Content Status</CardTitle></CardHeader>
                    <CardContent className="flex items-center gap-6">
                        {stats ? (
                            <>
                                <PieChart width={160} height={160}>
                                    <Pie
                                        data={[
                                            {name: "Published", value: stats.publishedBlogs, color: "#22c55e"},
                                            {name: "Draft", value: stats.draftBlogs, color: "#f59e0b"},
                                        ].filter((d) => d.value > 0)}
                                        cx={80} cy={80} innerRadius={45} outerRadius={75} dataKey="value"
                                    >
                                        {[
                                            {name: "Published", value: stats.publishedBlogs, color: "#22c55e"},
                                            {name: "Draft", value: stats.draftBlogs, color: "#f59e0b"},
                                        ].map((d) => <Cell key={d.name} fill={d.color}/>)}
                                    </Pie>
                                </PieChart>
                                <div className="space-y-3 flex-1">
                                    {[
                                        {label: "Published", value: stats.publishedBlogs, color: "#22c55e"},
                                        {label: "Draft", value: stats.draftBlogs, color: "#f59e0b"},
                                        {label: "Total", value: stats.totalBlogs, color: "#4F46E5"},
                                    ].map((s) => (
                                        <div key={s.label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full" style={{background: s.color}}/>
                                                <span className="text-sm">{s.label}</span>
                                            </div>
                                            <span className="text-sm font-bold">{s.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div
                                className="w-full h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                                {isLoading ? "Loading..." : "No data yet."}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
