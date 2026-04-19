"use client";
import { useEffect, useState } from "react";
import { Users, CreditCard, DollarSign, UserPlus, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form-elements";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface PlatformStats {
  totalUsers: number;
  activeSubscriptions: number;
  newUsersThisMonth: number;
  totalRevenue: number;
  planDistribution: Record<string, number>;
}
interface TrendPoint { month: string; mrr: number }

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  silver: "#0ea5e9",
  gold: "#f59e0b",
  diamond: "#22c55e",
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [mrrTrend, setMrrTrend] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics?type=super_admin").then((r) => r.json()),
      fetch("/api/analytics?type=mrr_trend").then((r) => r.json()),
    ]).then(([statsRes, mrrRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (mrrRes.success) setMrrTrend(mrrRes.data);
    }).finally(() => setIsLoading(false));
  }, []);

  const planChartData = Object.entries(stats?.planDistribution ?? {}).map(([plan, count]) => ({
    plan: plan.charAt(0).toUpperCase() + plan.slice(1),
    count: count as number,
    color: PLAN_COLORS[plan] ?? "#6366f1",
  }));

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">Platform-wide overview</p>
          </div>
          <Badge variant="info" className="gap-1.5"><Activity className="h-3 w-3" /> Live</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={isLoading ? "—" : formatNumber(stats?.totalUsers ?? 0)} icon={Users} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
          <StatsCard title="Active Subscriptions" value={isLoading ? "—" : stats?.activeSubscriptions ?? 0} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <StatsCard title="New Users (Month)" value={isLoading ? "—" : stats?.newUsersThisMonth ?? 0} icon={UserPlus} gradient="bg-gradient-to-br from-sky-500 to-sky-600" />
          <StatsCard title="Est. Revenue" value={isLoading ? "—" : formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
            <CardContent>
              {mrrTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={mrrTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                          formatter={(v: number) => [`$${v}`, "Revenue"]}
                      />
                      <Line type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: "#4F46E5" }} />
                    </LineChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : "No revenue data yet."}
                  </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-6">
              {planChartData.length > 0 ? (
                  <>
                    <PieChart width={160} height={160}>
                      <Pie data={planChartData} cx={80} cy={80} innerRadius={45} outerRadius={75} dataKey="count">
                        {planChartData.map((d) => <Cell key={d.plan} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                    <div className="flex-1 space-y-2.5">
                      {planChartData.map((d) => (
                          <div key={d.plan} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                              <span className="text-sm font-medium">{d.plan}</span>
                            </div>
                            <span className="text-sm font-bold">{d.count}</span>
                          </div>
                      ))}
                    </div>
                  </>
              ) : (
                  <div className="w-full h-[160px] flex items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : "No users yet."}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Manage Users", href: "/dashboard/super-admin/users", icon: Users, color: "from-indigo-500 to-indigo-600", desc: "View, edit, ban users" },
            { label: "Manage Plans", href: "/dashboard/super-admin/plans", icon: CreditCard, color: "from-sky-500 to-sky-600", desc: "Edit subscription plans" },
            { label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: Activity, color: "from-emerald-500 to-emerald-600", desc: "Edit marketing pages" },
            { label: "Analytics", href: "/dashboard/super-admin/analytics", icon: Activity, color: "from-purple-500 to-purple-600", desc: "Platform metrics" },
          ].map((item) => (
              <a key={item.label} href={item.href} className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} mb-3`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </a>
          ))}
        </div>
      </div>
  );
}

// "use client";
// import { Users, CreditCard, TrendingUp, DollarSign, UserPlus, Activity } from "lucide-react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/form-elements";
// import { StatsCard } from "@/components/dashboard/StatsCard";
// import { useSuperAdminStats } from "@/hooks/useAnalytics";
// import { formatCurrency, formatNumber } from "@/lib/utils";
//
// const mockRevenue = [
//   { month: "Jan", mrr: 2400 }, { month: "Feb", mrr: 3200 }, { month: "Mar", mrr: 2900 },
//   { month: "Apr", mrr: 4100 }, { month: "May", mrr: 4800 }, { month: "Jun", mrr: 5200 },
// ];
//
// const PLAN_COLORS: Record<string, string> = { free: "#94a3b8", silver: "#0ea5e9", gold: "#f59e0b", diamond: "#22c55e" };
//
// export default function SuperAdminDashboard() {
//   const { stats, isLoading } = useSuperAdminStats();
//
//   const planDist = stats?.planDistribution as Record<string, number> ?? {};
//   const planChartData = Object.entries(planDist).map(([plan, count]) => ({ plan: plan.charAt(0).toUpperCase() + plan.slice(1), count, color: PLAN_COLORS[plan] ?? "#6366f1" }));
//
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
//           <p className="text-muted-foreground text-sm">Platform-wide overview and management</p>
//         </div>
//         <Badge variant="info" className="gap-1.5"><Activity className="h-3 w-3" /> Live</Badge>
//       </div>
//
//       {/* Stats */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatsCard title="Total Users" value={isLoading ? "—" : formatNumber(stats?.totalUsers as number ?? 0)} icon={Users} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" trend={{ value: 12, label: "this month" }} />
//         <StatsCard title="Active Subscriptions" value={isLoading ? "—" : stats?.activeSubscriptions as number ?? 0} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
//         <StatsCard title="New Users (Month)" value={isLoading ? "—" : stats?.newUsersThisMonth as number ?? 0} icon={UserPlus} gradient="bg-gradient-to-br from-sky-500 to-sky-600" trend={{ value: 8, label: "vs last month" }} />
//         <StatsCard title="Est. MRR" value={isLoading ? "—" : formatCurrency(stats?.totalRevenue as number ?? 0)} icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-purple-600" trend={{ value: 15, label: "growth" }} />
//       </div>
//
//       <div className="grid lg:grid-cols-2 gap-6">
//         {/* MRR Chart */}
//         <Card>
//           <CardHeader><CardTitle className="text-base">Monthly Recurring Revenue</CardTitle></CardHeader>
//           <CardContent>
//             <ResponsiveContainer width="100%" height={220}>
//               <LineChart data={mockRevenue}>
//                 <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
//                 <XAxis dataKey="month" tick={{ fontSize: 12 }} />
//                 <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
//                 <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`$${v}`, "MRR"]} />
//                 <Line type="monotone" dataKey="mrr" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: "#4F46E5" }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//
//         {/* Plan Distribution */}
//         <Card>
//           <CardHeader><CardTitle className="text-base">Plan Distribution</CardTitle></CardHeader>
//           <CardContent className="flex items-center gap-8">
//             <PieChart width={160} height={160}>
//               <Pie data={planChartData} cx={80} cy={80} innerRadius={45} outerRadius={75} dataKey="count">
//                 {planChartData.map((d) => <Cell key={d.plan} fill={d.color} />)}
//               </Pie>
//             </PieChart>
//             <div className="flex-1 space-y-2.5">
//               {planChartData.map((d) => (
//                 <div key={d.plan} className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
//                     <span className="text-sm font-medium">{d.plan}</span>
//                   </div>
//                   <span className="text-sm font-bold">{d.count}</span>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//
//       {/* Quick management links */}
//       <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {[
//           { label: "Manage Users", href: "/dashboard/super-admin/users", icon: Users, color: "from-indigo-500 to-indigo-600", desc: "View, edit, ban users" },
//           { label: "Manage Plans", href: "/dashboard/super-admin/plans", icon: CreditCard, color: "from-sky-500 to-sky-600", desc: "Edit subscription plans" },
//           { label: "CMS Pages", href: "/dashboard/super-admin/cms", icon: TrendingUp, color: "from-emerald-500 to-emerald-600", desc: "Edit marketing pages" },
//           { label: "Analytics", href: "/dashboard/super-admin/analytics", icon: Activity, color: "from-purple-500 to-purple-600", desc: "Platform-wide metrics" },
//         ].map((item) => (
//           <a key={item.label} href={item.href} className="group rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
//             <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.color} mb-3`}>
//               <item.icon className="h-5 w-5 text-white" />
//             </div>
//             <p className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">{item.label}</p>
//             <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
//           </a>
//         ))}
//       </div>
//     </div>
//   );
// }
