"use client";
import { useEffect, useState } from "react";
import { FileText, Eye, Sparkles, TrendingUp, Plus, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form-elements";
import { Progress } from "@/components/ui/misc";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatNumber } from "@/lib/utils";
import {OnboardingChecklist} from "@/components/dashboard/OnboardingChecklist";
import {PageLoader} from "@/components/loader/pageLoading";

interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  avgSEOScore: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

interface ViewPoint { date: string; views: number }

const quickActions = [
  { label: "New Blog Post", href: "/dashboard/admin/blogs/new", icon: Plus, color: "bg-indigo-500" },
  { label: "AI Generate", href: "/dashboard/admin/blogs/new?ai=true", icon: Sparkles, color: "bg-purple-500" },
  { label: "Keyword Research", href: "/dashboard/admin/seo/keywords", icon: Search, color: "bg-sky-500" },
  { label: "View Analytics", href: "/dashboard/admin/analytics", icon: TrendingUp, color: "bg-emerald-500" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [viewData, setViewData] = useState<ViewPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics?type=dashboard").then((r) => r.json()),
      fetch("/api/analytics?type=views").then((r) => r.json()),
    ]).then(([statsRes, viewsRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (viewsRes.success) setViewData(viewsRes.data);
    }).finally(() => setIsLoading(false));
  }, []);

  const creditPct = stats ? Math.round((stats.aiCreditsUsed / stats.aiCreditsLimit) * 100) : 0;

  return (
      <>
        <OnboardingChecklist/>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back!</p>
          </div>
          <Button asChild variant="gradient" className="gap-2">
            <Link href="/dashboard/admin/blogs/new"><Plus className="h-4 w-4" /> New Post</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
              <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.color} shrink-0`}>
                  <a.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{a.label}</span>
              </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Blogs" value={isLoading ? "—" : stats?.totalBlogs ?? 0} icon={FileText} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
          <StatsCard title="Published" value={isLoading ? "—" : stats?.publishedBlogs ?? 0} icon={ArrowRight} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <StatsCard title="Total Views" value={isLoading ? "—" : formatNumber(stats?.totalViews ?? 0)} icon={Eye} gradient="bg-gradient-to-br from-sky-500 to-sky-600" />
          <StatsCard title="Avg SEO Score" value={isLoading ? "—" : `${stats?.avgSEOScore ?? 0}/100`} icon={TrendingUp} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-semibold">Page Views</CardTitle></CardHeader>
            <CardContent>
              {viewData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={viewData}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="views" stroke="#4F46E5" strokeWidth={2} fill="url(#viewsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
              ) : (
                  <PageLoader fullPage  text="Loading Dashboard…" />
                  // <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                  //   {isLoading ? "Loading..." : "No view data yet. Publish posts to start tracking."}
                  // </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> AI Credits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used this month</span>
                  <span className="font-semibold">{stats?.aiCreditsUsed ?? 0} / {stats?.aiCreditsLimit ?? 10}</span>
                </div>
                <Progress value={creditPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{100 - creditPct}% remaining</p>
              </div>
              {creditPct >= 80 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Running low on credits</p>
                    <Link href="/pricing" className="text-xs text-indigo-600 hover:underline font-medium">Upgrade plan →</Link>
                  </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href="/dashboard/admin/blogs/new?ai=true"><Sparkles className="h-3.5 w-3.5" /> Generate Content</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Content Overview</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-indigo-600">
                <Link href="/dashboard/admin/blogs">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Published", value: stats?.publishedBlogs ?? 0, color: "text-emerald-600", badge: "success" as const },
                { label: "Drafts", value: stats?.draftBlogs ?? 0, color: "text-yellow-600", badge: "warning" as const },
                { label: "Total", value: stats?.totalBlogs ?? 0, color: "text-indigo-600", badge: "info" as const },
              ].map((s) => (
                  <div key={s.label} className="rounded-xl border p-4">
                    <p className={`text-3xl font-bold ${s.color}`}>{isLoading ? "—" : s.value}</p>
                    <Badge variant={s.badge} className="mt-2">{s.label}</Badge>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>
  );
}