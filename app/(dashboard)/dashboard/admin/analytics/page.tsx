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

// "use client";
// import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
// import { TrendingUp, Eye, FileText, Sparkles } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { StatsCard } from "@/components/dashboard/StatsCard";
// import { useDashboardStats } from "@/hooks/useAnalytics";
// import { formatNumber } from "@/lib/utils";
//
// const mockViews = [
//   { week: "W1", views: 1200 }, { week: "W2", views: 1900 }, { week: "W3", views: 1500 },
//   { week: "W4", views: 2800 }, { week: "W5", views: 2200 }, { week: "W6", views: 3100 },
//   { week: "W7", views: 2700 }, { week: "W8", views: 3500 },
// ];
//
// const mockTopPosts = [
//   { title: "10 SEO Tips for 2025", views: 1240 },
//   { title: "How to Use AI for Content", views: 980 },
//   { title: "Complete Guide to Keyword Research", views: 820 },
//   { title: "On-Page SEO Checklist", views: 640 },
//   { title: "Link Building Strategies", views: 510 },
// ];
//
// const mockDevices = [
//   { name: "Desktop", value: 58, color: "#4F46E5" },
//   { name: "Mobile", value: 34, color: "#0EA5E9" },
//   { name: "Tablet", value: 8, color: "#22C55E" },
// ];
//
// export default function AnalyticsPage() {
//   const { stats, isLoading } = useDashboardStats();
//
//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold">Analytics</h1>
//         <p className="text-muted-foreground text-sm">Track your content performance and SEO metrics</p>
//       </div>
//
//       {/* Stats row */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatsCard title="Total Views" value={isLoading ? "—" : formatNumber(stats?.totalViews ?? 0)} icon={Eye} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" trend={{ value: 18, label: "vs last month" }} />
//         <StatsCard title="Published Posts" value={isLoading ? "—" : stats?.publishedBlogs ?? 0} icon={FileText} gradient="bg-gradient-to-br from-sky-500 to-sky-600" trend={{ value: 5, label: "this month" }} />
//         <StatsCard title="Avg SEO Score" value={isLoading ? "—" : `${stats?.avgSEOScore ?? 0}`} icon={TrendingUp} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
//         <StatsCard title="AI Credits Used" value={isLoading ? "—" : stats?.aiCreditsUsed ?? 0} icon={Sparkles} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
//       </div>
//
//       {/* Views chart */}
//       <Card>
//         <CardHeader><CardTitle className="text-base">Page Views Over Time</CardTitle></CardHeader>
//         <CardContent>
//           <ResponsiveContainer width="100%" height={240}>
//             <AreaChart data={mockViews}>
//               <defs>
//                 <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
//                   <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//               <XAxis dataKey="week" tick={{ fontSize: 12 }} />
//               <YAxis tick={{ fontSize: 12 }} />
//               <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
//               <Area type="monotone" dataKey="views" stroke="#4F46E5" strokeWidth={2} fill="url(#grad)" />
//             </AreaChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>
//
//       <div className="grid lg:grid-cols-3 gap-6">
//         {/* Top posts */}
//         <Card className="lg:col-span-2">
//           <CardHeader><CardTitle className="text-base">Top Performing Posts</CardTitle></CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={220}>
//               <BarChart data={mockTopPosts} layout="vertical">
//                 <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                 <XAxis type="number" tick={{ fontSize: 11 }} />
//                 <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={180} />
//                 <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
//                 <Bar dataKey="views" fill="#4F46E5" radius={[0, 4, 4, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//
//         {/* Device breakdown */}
//         <Card>
//           <CardHeader><CardTitle className="text-base">Device Breakdown</CardTitle></CardHeader>
//           <CardContent className="flex flex-col items-center">
//             <PieChart width={180} height={180}>
//               <Pie data={mockDevices} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="value">
//                 {mockDevices.map((d) => <Cell key={d.name} fill={d.color} />)}
//               </Pie>
//             </PieChart>
//             <div className="space-y-2 w-full mt-2">
//               {mockDevices.map((d) => (
//                 <div key={d.name} className="flex items-center justify-between text-sm">
//                   <div className="flex items-center gap-2">
//                     <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
//                     <span className="text-muted-foreground">{d.name}</span>
//                   </div>
//                   <span className="font-medium">{d.value}%</span>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }
