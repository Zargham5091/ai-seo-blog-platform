"use client";
import {useEffect, useState} from "react";
import Link from "next/link";
import {Search, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Code, Zap} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell} from "recharts";

interface SEOOverview {
    avgSEOScore: number;
    totalPages: number;
    publishedPages: number;
    blogs: { title: string; slug: string; seo: { seoScore: number; keywords: string[] }; viewCount: number }[];
    lowScoreCount: number;
}

const SCORE_COLOR = (score: number) =>
    score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

export default function SEOPage() {
    const [data, setData] = useState<SEOOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/seo?type=overview")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setData(d.data);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const chartData = data?.blogs.slice(0, 8).map((b) => ({
        name: b.title.length > 20 ? b.title.slice(0, 20) + "…" : b.title,
        score: b.seo?.seoScore ?? 0,
        views: b.viewCount,
    })) ?? [];

    const TOOLS = [
        {
            label: "Keyword Research",
            href: "/dashboard/admin/seo/keywords",
            icon: Search,
            desc: "Find high-value keywords with volume and difficulty data",
            badge: null
        },
        {
            label: "Schema Generator",
            href: "/dashboard/admin/seo/schema",
            icon: Code,
            desc: "Auto-generate JSON-LD structured data for rich results",
            badge: null
        },
        {
            label: "Rank Tracking",
            href: "/dashboard/admin/rank-tracking",
            icon: TrendingUp,
            desc: "Monitor your keyword positions over time",
            badge: null
        },
        {
            label: "AEO Optimizer",
            href: "/dashboard/admin/aeo",
            icon: Zap,
            desc: "Optimize content for ChatGPT, Perplexity, and AI answers",
            badge: "New"
        },
        {
            label: "A/B Testing",
            href: "/dashboard/admin/ab-test",
            icon: CheckCircle,
            desc: "Test headlines and meta titles to improve CTR",
            badge: null
        },
        {
            label: "Backlink Monitor",
            href: "/dashboard/admin/backlinks",
            icon: ArrowRight,
            desc: "Analyze backlink profiles and find outreach opportunities",
            badge: null
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">SEO Tools</h1>
                <p className="text-muted-foreground text-sm">Everything you need to dominate search rankings</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Avg SEO Score",
                        value: isLoading ? "—" : `${data?.avgSEOScore ?? 0}/100`,
                        color: data?.avgSEOScore && data.avgSEOScore >= 70 ? "text-emerald-600" : "text-amber-600"
                    },
                    {
                        label: "Published Pages",
                        value: isLoading ? "—" : data?.publishedPages ?? 0,
                        color: "text-indigo-600"
                    },
                    {label: "Need Attention", value: isLoading ? "—" : data?.lowScoreCount ?? 0, color: "text-red-500"},
                    {label: "Total Pages", value: isLoading ? "—" : data?.totalPages ?? 0, color: "text-foreground"},
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* SEO Score chart */}
            {chartData.length > 0 && (
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">SEO Scores by
                        Post</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                <XAxis type="number" domain={[0, 100]} tick={{fontSize: 11}}/>
                                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 11}}/>
                                <Tooltip
                                    contentStyle={{
                                        background: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: 8
                                    }}
                                    formatter={(v: number) => [`${v}/100`, "SEO Score"]}
                                />
                                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, i) => <Cell key={i} fill={SCORE_COLOR(entry.score)}/>)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Low score warnings */}
            {data && data.lowScoreCount > 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0"/>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{data.lowScoreCount} posts need SEO attention</p>
                            <p className="text-xs text-muted-foreground">These posts have SEO scores below 50 and may be
                                missing keyword optimization</p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/dashboard/admin/blogs">Review Posts</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Tools grid */}
            <div>
                <h2 className="font-semibold mb-4">SEO Tools</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {TOOLS.map((tool) => (
                        <Link key={tool.href} href={tool.href} className="group">
                            <Card className="h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                                            <tool.icon className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400"/>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">{tool.label}</span>
                                            {tool.badge &&
                                                <Badge variant="info" className="text-xs">{tool.badge}</Badge>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}


// "use client";
// import { useState } from "react";
// import { Search, TrendingUp, TrendingDown, Minus, BookmarkPlus, Sparkles, BarChart3 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
// import { SEOScoreCircle } from "@/components/seo/SEOScoreCircle";
//
// interface Keyword { keyword: string; searchVolume: number; difficulty: number; cpc: number; trend: string; }
// interface SEOAnalysis { score: number; readabilityScore: number; suggestions: string[]; keywordDensity: number; wordCount: number; }
//
// const DIFF_COLOR = (d: number) => d >= 70 ? "text-red-500" : d >= 40 ? "text-yellow-500" : "text-emerald-500";
// const TREND_ICON = (t: string) => t === "up" ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> : t === "down" ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
//
// export default function SEOToolsPage() {
//   const [kwSeed, setKwSeed] = useState("");
//   const [keywords, setKeywords] = useState<Keyword[]>([]);
//   const [kwLoading, setKwLoading] = useState(false);
//   const [kwError, setKwError] = useState("");
//
//   const [analyzeContent, setAnalyzeContent] = useState("");
//   const [analyzeKw, setAnalyzeKw] = useState("");
//   const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
//   const [analyzeLoading, setAnalyzeLoading] = useState(false);
//
//   const [savedMsg, setSavedMsg] = useState("");
//
//   const searchKeywords = async () => {
//     if (!kwSeed) return;
//     setKwLoading(true); setKwError("");
//     try {
//       const res = await fetch("/api/ai/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: kwSeed, count: 10 }) });
//       const d = await res.json();
//       if (d.success) setKeywords(Array.isArray(d.data) ? d.data : []);
//       else setKwError(d.error);
//     } catch { setKwError("Request failed"); }
//     finally { setKwLoading(false); }
//   };
//
//   const saveKeywords = async () => {
//     const res = await fetch("/api/ai/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: kwSeed, count: 10, save: true }) });
//     if ((await res.json()).success) { setSavedMsg("Saved!"); setTimeout(() => setSavedMsg(""), 2000); }
//   };
//
//   const analyzeContent_ = async () => {
//     if (!analyzeContent || !analyzeKw) return;
//     setAnalyzeLoading(true);
//     try {
//       const res = await fetch("/api/ai/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: analyzeContent, targetKeyword: analyzeKw, generateMeta: true }) });
//       const d = await res.json();
//       if (d.success) setAnalysis(d.data.analysis);
//     } finally { setAnalyzeLoading(false); }
//   };
//
//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold">SEO Tools</h1>
//         <p className="text-muted-foreground text-sm">AI-powered keyword research and content analysis</p>
//       </div>
//
//       <Tabs defaultValue="keywords">
//         <TabsList>
//           <TabsTrigger value="keywords" className="gap-2"><Search className="h-3.5 w-3.5" />Keyword Research</TabsTrigger>
//           <TabsTrigger value="analyze" className="gap-2"><BarChart3 className="h-3.5 w-3.5" />Content Analyzer</TabsTrigger>
//         </TabsList>
//
//         {/* Keyword Research */}
//         <TabsContent value="keywords" className="space-y-4 mt-4">
//           <Card>
//             <CardContent className="p-4 space-y-3">
//               <div className="flex gap-3">
//                 <div className="flex-1">
//                   <Label className="text-xs mb-1.5">Seed Keyword</Label>
//                   <div className="relative">
//                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                     <Input value={kwSeed} onChange={(e) => setKwSeed(e.target.value)} placeholder="e.g. content marketing, seo tools..." className="pl-9" onKeyDown={(e) => e.key === "Enter" && searchKeywords()} />
//                   </div>
//                 </div>
//                 <div className="flex items-end">
//                   <Button onClick={searchKeywords} isLoading={kwLoading} variant="gradient" className="gap-2">
//                     <Sparkles className="h-4 w-4" /> Research
//                   </Button>
//                 </div>
//               </div>
//               {kwError && <p className="text-sm text-destructive">{kwError}</p>}
//             </CardContent>
//           </Card>
//
//           {keywords.length > 0 && (
//             <Card>
//               <CardHeader className="pb-3">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="text-sm">{keywords.length} Keywords Found</CardTitle>
//                   <Button variant="outline" size="sm" onClick={saveKeywords} className="gap-1.5 text-xs">
//                     <BookmarkPlus className="h-3.5 w-3.5" /> {savedMsg || "Save All"}
//                   </Button>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead>
//                       <tr className="border-b text-muted-foreground text-xs">
//                         <th className="text-left pb-2 font-medium">Keyword</th>
//                         <th className="text-right pb-2 font-medium">Volume</th>
//                         <th className="text-right pb-2 font-medium">Difficulty</th>
//                         <th className="text-right pb-2 font-medium">CPC</th>
//                         <th className="text-center pb-2 font-medium">Trend</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y">
//                       {keywords.map((kw) => (
//                         <tr key={kw.keyword} className="hover:bg-muted/30 transition-colors">
//                           <td className="py-2.5 font-medium">{kw.keyword}</td>
//                           <td className="py-2.5 text-right text-muted-foreground">{kw.searchVolume?.toLocaleString() ?? "—"}</td>
//                           <td className={`py-2.5 text-right font-semibold ${DIFF_COLOR(kw.difficulty)}`}>{kw.difficulty}/100</td>
//                           <td className="py-2.5 text-right text-muted-foreground">${kw.cpc?.toFixed(2) ?? "—"}</td>
//                           <td className="py-2.5 text-center flex justify-center">{TREND_ICON(kw.trend)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </TabsContent>
//
//         {/* Content Analyzer */}
//         <TabsContent value="analyze" className="space-y-4 mt-4">
//           <div className="grid lg:grid-cols-2 gap-6">
//             <Card>
//               <CardHeader className="pb-3"><CardTitle className="text-sm">Content Input</CardTitle></CardHeader>
//               <CardContent className="space-y-3">
//                 <div>
//                   <Label className="text-xs mb-1.5">Target Keyword</Label>
//                   <Input value={analyzeKw} onChange={(e) => setAnalyzeKw(e.target.value)} placeholder="Primary keyword to analyze..." />
//                 </div>
//                 <div>
//                   <Label className="text-xs mb-1.5">Content to Analyze</Label>
//                   <textarea
//                     value={analyzeContent}
//                     onChange={(e) => setAnalyzeContent(e.target.value)}
//                     placeholder="Paste your blog content here..."
//                     rows={10}
//                     className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
//                   />
//                 </div>
//                 <Button onClick={analyzeContent_} isLoading={analyzeLoading} variant="gradient" className="w-full gap-2">
//                   <Sparkles className="h-4 w-4" /> Analyze SEO
//                 </Button>
//               </CardContent>
//             </Card>
//
//             {analysis ? (
//               <div className="space-y-4">
//                 <Card>
//                   <CardContent className="p-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-semibold">Overall SEO Score</p>
//                       <p className="text-xs text-muted-foreground">{analysis.wordCount} words · {analysis.keywordDensity}% density</p>
//                     </div>
//                     <SEOScoreCircle score={analysis.score} size="lg" />
//                   </CardContent>
//                 </Card>
//                 <Card>
//                   <CardContent className="p-4 flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-semibold">Readability Score</p>
//                       <p className="text-xs text-muted-foreground">Flesch–Kincaid style</p>
//                     </div>
//                     <SEOScoreCircle score={analysis.readabilityScore} size="lg" />
//                   </CardContent>
//                 </Card>
//                 {analysis.suggestions?.length > 0 && (
//                   <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-sm">Improvement Suggestions</CardTitle></CardHeader>
//                     <CardContent>
//                       <ul className="space-y-2">
//                         {analysis.suggestions.map((s, i) => (
//                           <li key={i} className="flex items-start gap-2 text-sm">
//                             <span className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
//                             <span className="text-muted-foreground">{s}</span>
//                           </li>
//                         ))}
//                       </ul>
//                     </CardContent>
//                   </Card>
//                 )}
//               </div>
//             ) : (
//               <div className="flex items-center justify-center border-2 border-dashed rounded-xl text-muted-foreground text-sm">
//                 Paste content and click Analyze to see your SEO score
//               </div>
//             )}
//           </div>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
