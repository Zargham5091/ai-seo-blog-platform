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
    Cell,
    LineChart,
    Line
} from "recharts";
import {DollarSign, Users, CreditCard, UserPlus, TrendingUp, FileText} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {StatsCard} from "@/components/dashboard/StatsCard";
import {formatCurrency, formatNumber} from "@/lib/utils";

const PLAN_COLORS: Record<string, string> = {
    free: "#94a3b8", silver: "#0ea5e9", gold: "#f59e0b", diamond: "#22c55e",
};

const T_STYLE = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
};

export default function SuperAdminAnalyticsPage() {
    const [stats, setStats] = useState<Record<string, unknown> | null>(null);
    const [mrrTrend, setMrrTrend] = useState<{ month: string; mrr: number; newSubs: number }[]>([]);
    const [userGrowth, setUserGrowth] = useState<{ month: string; users: number }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/analytics?type=super_admin").then((r) => r.json()),
            fetch("/api/analytics?type=mrr_trend").then((r) => r.json()),
            fetch("/api/analytics?type=user_growth").then((r) => r.json()),
        ]).then(([s, m, u]) => {
            if (s.success) setStats(s.data);
            if (m.success) setMrrTrend(m.data);
            if (u.success) setUserGrowth(u.data);
        }).finally(() => setIsLoading(false));
    }, []);

    const planDist = (stats?.planDistribution as Record<string, number>) ?? {};
    const planChartData = Object.entries(planDist).map(([plan, count]) => ({
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        count: count as number,
        color: PLAN_COLORS[plan] ?? "#6366f1",
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Platform Analytics</h1>
                    <p className="text-muted-foreground text-sm">Real-time platform performance</p>
                </div>
                <Badge variant="success">Live Data</Badge>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Users"
                           value={isLoading ? "—" : formatNumber((stats?.totalUsers as number) ?? 0)} icon={Users}
                           gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
                <StatsCard title="Active Subs" value={isLoading ? "—" : (stats?.activeSubscriptions as number) ?? 0}
                           icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
                <StatsCard title="New (Month)" value={isLoading ? "—" : (stats?.newUsersThisMonth as number) ?? 0}
                           icon={UserPlus} gradient="bg-gradient-to-br from-sky-500 to-sky-600"/>
                <StatsCard title="Revenue"
                           value={isLoading ? "—" : formatCurrency((stats?.totalRevenue as number) ?? 0)}
                           icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-purple-600"/>
            </div>

            <Tabs defaultValue="revenue">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="plans">Plans</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Monthly Revenue & New
                            Subscriptions</CardTitle></CardHeader>
                        <CardContent>
                            {mrrTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart data={mrrTrend}>
                                        <defs>
                                            <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                        <XAxis dataKey="month" tick={{fontSize: 12}}/>
                                        <YAxis tick={{fontSize: 12}} tickFormatter={(v) => `$${v}`}/>
                                        <Tooltip contentStyle={T_STYLE}
                                                 formatter={(v: number, name: string) => [name === "mrr" ? `$${v}` : v, name === "mrr" ? "Revenue" : "New Subs"]}/>
                                        <Area type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5}
                                              fill="url(#mrrG)"/>
                                        <Line type="monotone" dataKey="newSubs" stroke="#0EA5E9" strokeWidth={2}
                                              strokeDasharray="4 2" dot={false}/>
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div
                                    className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                                    {isLoading ? "Loading..." : "No revenue data yet."}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader>
                        <CardContent>
                            {userGrowth.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={userGrowth}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                        <XAxis dataKey="month" tick={{fontSize: 12}}/>
                                        <YAxis tick={{fontSize: 12}}/>
                                        <Tooltip contentStyle={T_STYLE}/>
                                        <Bar dataKey="users" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="New Users"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div
                                    className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                                    {isLoading ? "Loading..." : "No user growth data yet."}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans" className="mt-4">
                    <div className="grid lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
                            <CardContent className="flex items-center gap-6">
                                {planChartData.length > 0 ? (
                                    <>
                                        <PieChart width={160} height={160}>
                                            <Pie data={planChartData} cx={80} cy={80} innerRadius={50} outerRadius={75}
                                                 dataKey="count">
                                                {planChartData.map((d) => <Cell key={d.plan} fill={d.color}/>)}
                                            </Pie>
                                        </PieChart>
                                        <div className="flex-1 space-y-2.5">
                                            {planChartData.map((d) => (
                                                <div key={d.plan} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full"
                                                             style={{background: d.color}}/>
                                                        <span className="text-sm font-medium">{d.plan}</span>
                                                    </div>
                                                    <span className="text-sm font-bold">{d.count} users</span>
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

                        <Card>
                            <CardHeader><CardTitle className="text-base">Users by Plan</CardTitle></CardHeader>
                            <CardContent>
                                {planChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={planChartData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                            <XAxis type="number" tick={{fontSize: 11}}/>
                                            <YAxis dataKey="plan" type="category" tick={{fontSize: 12}} width={65}/>
                                            <Tooltip contentStyle={T_STYLE}/>
                                            <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Users">
                                                {planChartData.map((d) => <Cell key={d.plan} fill={d.color}/>)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div
                                        className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                                        {isLoading ? "Loading..." : "No data yet."}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// "use client";
// import { useEffect, useState } from "react";
// import {
//   LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
//   Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
// } from "recharts";
// import { DollarSign, Users, CreditCard, UserPlus } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/form-elements";
// import { StatsCard } from "@/components/dashboard/StatsCard";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
// import { formatCurrency, formatNumber } from "@/lib/utils";
//
// const PLAN_COLORS: Record<string, string> = {
//   free: "#94a3b8",
//   silver: "#0ea5e9",
//   gold: "#f59e0b",
//   diamond: "#22c55e",
// };
//
// const TOOLTIP_STYLE = {
//   background: "hsl(var(--card))",
//   border: "1px solid hsl(var(--border))",
//   borderRadius: 8,
// };
//
// export default function SuperAdminAnalyticsPage() {
//   const [stats, setStats] = useState<Record<string, unknown> | null>(null);
//   const [mrrTrend, setMrrTrend] = useState<{ month: string; mrr: number }[]>([]);
//   const [userGrowth, setUserGrowth] = useState<{ month: string; users: number }[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//
//   useEffect(() => {
//     Promise.all([
//       fetch("/api/analytics?type=super_admin").then((r) => r.json()),
//       fetch("/api/analytics?type=mrr_trend").then((r) => r.json()),
//       fetch("/api/analytics?type=user_growth").then((r) => r.json()),
//     ]).then(([s, m, u]) => {
//       if (s.success) setStats(s.data);
//       if (m.success) setMrrTrend(m.data);
//       if (u.success) setUserGrowth(u.data);
//     }).finally(() => setIsLoading(false));
//   }, []);
//
//   const planDist = (stats?.planDistribution as Record<string, number>) ?? {};
//   const planChartData = Object.entries(planDist).map(([plan, count]) => ({
//     plan: plan.charAt(0).toUpperCase() + plan.slice(1),
//     count,
//     color: PLAN_COLORS[plan] ?? "#6366f1",
//   }));
//
//   return (
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-bold">Platform Analytics</h1>
//             <p className="text-muted-foreground text-sm">Real-time platform performance</p>
//           </div>
//           <Badge variant="success">Live Data</Badge>
//         </div>
//
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatsCard title="Total Users" value={isLoading ? "—" : formatNumber((stats?.totalUsers as number) ?? 0)} icon={Users} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
//           <StatsCard title="Active Subs" value={isLoading ? "—" : (stats?.activeSubscriptions as number) ?? 0} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
//           <StatsCard title="New (Month)" value={isLoading ? "—" : (stats?.newUsersThisMonth as number) ?? 0} icon={UserPlus} gradient="bg-gradient-to-br from-sky-500 to-sky-600" />
//           <StatsCard title="Revenue" value={isLoading ? "—" : formatCurrency((stats?.totalRevenue as number) ?? 0)} icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
//         </div>
//
//         <Tabs defaultValue="revenue">
//           <TabsList>
//             <TabsTrigger value="revenue">Revenue</TabsTrigger>
//             <TabsTrigger value="users">Users</TabsTrigger>
//             <TabsTrigger value="distribution">Plans</TabsTrigger>
//           </TabsList>
//
//           <TabsContent value="revenue" className="mt-4">
//             <Card>
//               <CardHeader><CardTitle className="text-base">Monthly Revenue Trend</CardTitle></CardHeader>
//               <CardContent>
//                 {mrrTrend.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={260}>
//                       <AreaChart data={mrrTrend}>
//                         <defs>
//                           <linearGradient id="mrrG" x1="0" y1="0" x2="0" y2="1">
//                             <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
//                             <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
//                           </linearGradient>
//                         </defs>
//                         <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                         <XAxis dataKey="month" tick={{ fontSize: 12 }} />
//                         <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
//                         <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`$${v}`, "Revenue"]} />
//                         <Area type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5} fill="url(#mrrG)" />
//                       </AreaChart>
//                     </ResponsiveContainer>
//                 ) : (
//                     <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
//                       {isLoading ? "Loading..." : "No revenue data yet."}
//                     </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>
//
//           <TabsContent value="users" className="mt-4">
//             <Card>
//               <CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader>
//               <CardContent>
//                 {userGrowth.length > 0 ? (
//                     <ResponsiveContainer width="100%" height={260}>
//                       <BarChart data={userGrowth}>
//                         <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                         <XAxis dataKey="month" tick={{ fontSize: 12 }} />
//                         <YAxis tick={{ fontSize: 12 }} />
//                         <Tooltip contentStyle={TOOLTIP_STYLE} />
//                         <Bar dataKey="users" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
//                       </BarChart>
//                     </ResponsiveContainer>
//                 ) : (
//                     <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
//                       {isLoading ? "Loading..." : "No user growth data yet."}
//                     </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>
//
//           <TabsContent value="distribution" className="mt-4">
//             <div className="grid lg:grid-cols-2 gap-6">
//               <Card>
//                 <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
//                 <CardContent className="flex items-center gap-6">
//                   {planChartData.length > 0 ? (
//                       <>
//                         <PieChart width={160} height={160}>
//                           <Pie data={planChartData} cx={80} cy={80} innerRadius={50} outerRadius={75} dataKey="count">
//                             {planChartData.map((d) => <Cell key={d.plan} fill={d.color} />)}
//                           </Pie>
//                         </PieChart>
//                         <div className="flex-1 space-y-2.5">
//                           {planChartData.map((d) => (
//                               <div key={d.plan} className="flex items-center justify-between">
//                                 <div className="flex items-center gap-2">
//                                   <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
//                                   <span className="text-sm font-medium">{d.plan}</span>
//                                 </div>
//                                 <span className="text-sm font-bold">{d.count} users</span>
//                               </div>
//                           ))}
//                         </div>
//                       </>
//                   ) : (
//                       <div className="w-full h-[160px] flex items-center justify-center text-sm text-muted-foreground">
//                         {isLoading ? "Loading..." : "No data yet."}
//                       </div>
//                   )}
//                 </CardContent>
//               </Card>
//
//               <Card>
//                 <CardHeader><CardTitle className="text-base">Users by Plan</CardTitle></CardHeader>
//                 <CardContent>
//                   {planChartData.length > 0 ? (
//                       <ResponsiveContainer width="100%" height={200}>
//                         <BarChart data={planChartData} layout="vertical">
//                           <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                           <XAxis type="number" tick={{ fontSize: 11 }} />
//                           <YAxis dataKey="plan" type="category" tick={{ fontSize: 12 }} width={65} />
//                           <Tooltip contentStyle={TOOLTIP_STYLE} />
//                           <Bar dataKey="count" radius={[0, 4, 4, 0]}>
//                             {planChartData.map((d) => <Cell key={d.plan} fill={d.color} />)}
//                           </Bar>
//                         </BarChart>
//                       </ResponsiveContainer>
//                   ) : (
//                       <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
//                         {isLoading ? "Loading..." : "No data yet."}
//                       </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//   );
// }
//
//
// // "use client";
// // import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
// // import { DollarSign, Users, TrendingUp, TrendingDown, CreditCard, UserPlus } from "lucide-react";
// // import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// // import { StatsCard } from "@/components/dashboard/StatsCard";
// // import { Badge } from "@/components/ui/form-elements";
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
// // import { useSuperAdminStats } from "@/hooks/useAnalytics";
// // import { formatCurrency, formatNumber } from "@/lib/utils";
// //
// // const mockMRR = [
// //   { month: "Jul", mrr: 1800, users: 24 }, { month: "Aug", mrr: 2400, users: 31 },
// //   { month: "Sep", mrr: 2100, users: 28 }, { month: "Oct", mrr: 3400, users: 45 },
// //   { month: "Nov", mrr: 4200, users: 58 }, { month: "Dec", mrr: 4800, users: 67 },
// //   { month: "Jan", mrr: 5200, users: 74 }, { month: "Feb", mrr: 6100, users: 88 },
// // ];
// //
// // const mockChurn = [
// //   { month: "Oct", churn: 2.1 }, { month: "Nov", churn: 1.8 },
// //   { month: "Dec", churn: 1.5 }, { month: "Jan", churn: 1.9 },
// //   { month: "Feb", churn: 1.3 }, { month: "Mar", churn: 1.1 },
// // ];
// //
// // const mockTopCountries = [
// //   { country: "🇺🇸 United States", users: 342 },
// //   { country: "🇬🇧 United Kingdom", users: 128 },
// //   { country: "🇮🇳 India", users: 118 },
// //   { country: "🇨🇦 Canada", users: 94 },
// //   { country: "🇦🇺 Australia", users: 76 },
// //   { country: "🇵🇰 Pakistan", users: 64 },
// // ];
// //
// // const PLAN_COLORS: Record<string, string> = { free: "#94a3b8", silver: "#0ea5e9", gold: "#f59e0b", diamond: "#22c55e" };
// //
// // export default function SuperAdminAnalyticsPage() {
// //   const { stats, isLoading } = useSuperAdminStats();
// //   const planDist = stats?.planDistribution as Record<string, number> ?? {};
// //   const planChartData = Object.entries(planDist).map(([plan, count]) => ({
// //     plan: plan.charAt(0).toUpperCase() + plan.slice(1), count, color: PLAN_COLORS[plan] ?? "#6366f1",
// //   }));
// //
// //   return (
// //     <div className="space-y-6">
// //       <div className="flex items-center justify-between">
// //         <div>
// //           <h1 className="text-2xl font-bold">Platform Analytics</h1>
// //           <p className="text-muted-foreground text-sm">Full platform performance and revenue insights</p>
// //         </div>
// //         <Badge variant="success" className="gap-1.5">Live Data</Badge>
// //       </div>
// //
// //       {/* KPI cards */}
// //       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
// //         <StatsCard title="Total Users" value={isLoading ? "—" : formatNumber(stats?.totalUsers as number ?? 0)} icon={Users} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" trend={{ value: 12, label: "MoM" }} />
// //         <StatsCard title="Active Subs" value={isLoading ? "—" : stats?.activeSubscriptions as number ?? 0} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" trend={{ value: 8, label: "MoM" }} />
// //         <StatsCard title="New (Month)" value={isLoading ? "—" : stats?.newUsersThisMonth as number ?? 0} icon={UserPlus} gradient="bg-gradient-to-br from-sky-500 to-sky-600" trend={{ value: 15, label: "vs last month" }} />
// //         <StatsCard title="Est. MRR" value={isLoading ? "—" : formatCurrency(stats?.totalRevenue as number ?? 0)} icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-purple-600" trend={{ value: 20, label: "growth" }} />
// //       </div>
// //
// //       <Tabs defaultValue="revenue">
// //         <TabsList>
// //           <TabsTrigger value="revenue">Revenue</TabsTrigger>
// //           <TabsTrigger value="users">Users</TabsTrigger>
// //           <TabsTrigger value="distribution">Distribution</TabsTrigger>
// //         </TabsList>
// //
// //         {/* Revenue tab */}
// //         <TabsContent value="revenue" className="mt-4 space-y-6">
// //           <div className="grid lg:grid-cols-2 gap-6">
// //             <Card>
// //               <CardHeader><CardTitle className="text-base">Monthly Recurring Revenue</CardTitle></CardHeader>
// //               <CardContent>
// //                 <ResponsiveContainer width="100%" height={240}>
// //                   <AreaChart data={mockMRR}>
// //                     <defs>
// //                       <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
// //                         <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
// //                         <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
// //                       </linearGradient>
// //                     </defs>
// //                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
// //                     <XAxis dataKey="month" tick={{ fontSize: 12 }} />
// //                     <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
// //                     <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v}`, "MRR"]} />
// //                     <Area type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5} fill="url(#mrrGrad)" />
// //                   </AreaChart>
// //                 </ResponsiveContainer>
// //               </CardContent>
// //             </Card>
// //
// //             <Card>
// //               <CardHeader><CardTitle className="text-base">Churn Rate (%)</CardTitle></CardHeader>
// //               <CardContent>
// //                 <ResponsiveContainer width="100%" height={240}>
// //                   <LineChart data={mockChurn}>
// //                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
// //                     <XAxis dataKey="month" tick={{ fontSize: 12 }} />
// //                     <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
// //                     <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`${v}%`, "Churn"]} />
// //                     <Line type="monotone" dataKey="churn" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: "#22c55e" }} />
// //                   </LineChart>
// //                 </ResponsiveContainer>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         </TabsContent>
// //
// //         {/* Users tab */}
// //         <TabsContent value="users" className="mt-4 space-y-6">
// //           <div className="grid lg:grid-cols-2 gap-6">
// //             <Card>
// //               <CardHeader><CardTitle className="text-base">User Growth</CardTitle></CardHeader>
// //               <CardContent>
// //                 <ResponsiveContainer width="100%" height={240}>
// //                   <BarChart data={mockMRR}>
// //                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
// //                     <XAxis dataKey="month" tick={{ fontSize: 12 }} />
// //                     <YAxis tick={{ fontSize: 12 }} />
// //                     <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
// //                     <Bar dataKey="users" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
// //                   </BarChart>
// //                 </ResponsiveContainer>
// //               </CardContent>
// //             </Card>
// //
// //             <Card>
// //               <CardHeader><CardTitle className="text-base">Top Countries</CardTitle></CardHeader>
// //               <CardContent>
// //                 <div className="space-y-3">
// //                   {mockTopCountries.map((c, i) => (
// //                     <div key={c.country} className="flex items-center gap-3">
// //                       <span className="text-sm text-muted-foreground w-4">{i + 1}</span>
// //                       <span className="text-sm flex-1">{c.country}</span>
// //                       <div className="flex items-center gap-2">
// //                         <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
// //                           <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.users / mockTopCountries[0].users) * 100}%` }} />
// //                         </div>
// //                         <span className="text-sm font-medium w-8 text-right">{c.users}</span>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         </TabsContent>
// //
// //         {/* Distribution tab */}
// //         <TabsContent value="distribution" className="mt-4">
// //           <div className="grid lg:grid-cols-2 gap-6">
// //             <Card>
// //               <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
// //               <CardContent className="flex items-center gap-8">
// //                 <PieChart width={180} height={180}>
// //                   <Pie data={planChartData} cx={90} cy={90} innerRadius={50} outerRadius={80} dataKey="count">
// //                     {planChartData.map((d) => <Cell key={d.plan} fill={d.color} />)}
// //                   </Pie>
// //                 </PieChart>
// //                 <div className="flex-1 space-y-3">
// //                   {planChartData.map((d) => (
// //                     <div key={d.plan} className="flex items-center justify-between">
// //                       <div className="flex items-center gap-2">
// //                         <div className="h-3 w-3 rounded-full shrink-0" style={{ background: d.color }} />
// //                         <span className="text-sm font-medium">{d.plan}</span>
// //                       </div>
// //                       <div className="text-right">
// //                         <span className="text-sm font-bold">{d.count}</span>
// //                         <span className="text-xs text-muted-foreground ml-1">users</span>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </CardContent>
// //             </Card>
// //
// //             <Card>
// //               <CardHeader><CardTitle className="text-base">Revenue by Plan</CardTitle></CardHeader>
// //               <CardContent>
// //                 <ResponsiveContainer width="100%" height={220}>
// //                   <BarChart data={planChartData} layout="vertical">
// //                     <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
// //                     <XAxis type="number" tick={{ fontSize: 11 }} />
// //                     <YAxis dataKey="plan" type="category" tick={{ fontSize: 12 }} width={60} />
// //                     <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
// //                     <Bar dataKey="count" radius={[0, 4, 4, 0]}>
// //                       {planChartData.map((d) => <Cell key={d.plan} fill={d.color} />)}
// //                     </Bar>
// //                   </BarChart>
// //                 </ResponsiveContainer>
// //               </CardContent>
// //             </Card>
// //           </div>
// //         </TabsContent>
// //       </Tabs>
// //     </div>
// //   );
// // }
