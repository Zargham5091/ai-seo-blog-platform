"use client";
import {useState} from "react";
import {Search, Sparkles, Copy, Check, TrendingUp, Plus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface Keyword {
    keyword: string;
    searchVolume: number;
    difficulty: number; // 0-100
    cpc: number;
    intent: "informational" | "commercial" | "transactional" | "navigational";
    trend: "rising" | "stable" | "declining";
    relatedKeywords: string[];
}

interface KeywordResult {
    seedKeyword: string;
    keywords: Keyword[];
    contentIdeas: string[];
}

const DIFFICULTY_COLOR = (d: number) =>
    d <= 30 ? "text-emerald-600" : d <= 60 ? "text-yellow-600" : "text-red-500";
const DIFFICULTY_LABEL = (d: number) =>
    d <= 30 ? "Easy" : d <= 60 ? "Medium" : "Hard";
const INTENT_BADGE: Record<string, "info" | "warning" | "success" | "secondary"> = {
    informational: "info", commercial: "warning", transactional: "success", navigational: "secondary",
};
const TREND_ICON: Record<string, string> = {rising: "↑", stable: "→", declining: "↓"};
const TREND_COLOR: Record<string, string> = {
    rising: "text-emerald-600", stable: "text-muted-foreground", declining: "text-red-500",
};

export default function KeywordsPage() {
    const [seed, setSeed] = useState("");
    const [niche, setNiche] = useState("");
    const [isResearching, setIsResearching] = useState(false);
    const [result, setResult] = useState<KeywordResult | null>(null);
    const [error, setError] = useState("");
    const [copiedKw, setCopiedKw] = useState<string | null>(null);

    const research = async () => {
        if (!seed.trim()) return;
        setIsResearching(true);
        setError("");
        setResult(null);

        const res = await fetch("/api/ai/keywords", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({keyword: seed, niche: niche || undefined, count: 15}),
        });
        const d = await res.json();
        if (d.success) setResult(d.data);
        else setError(d.error);
        setIsResearching(false);
    };

    const copy = (kw: string) => {
        navigator.clipboard.writeText(kw);
        setCopiedKw(kw);
        setTimeout(() => setCopiedKw(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Search className="h-6 w-6 text-indigo-500"/> Keyword Research
                </h1>
                <p className="text-muted-foreground text-sm">Find high-value keywords with AI-powered analysis</p>
            </div>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs">Seed Keyword *</Label>
                            <Input
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                placeholder="e.g. SEO tools, content marketing, web design..."
                                onKeyDown={(e) => e.key === "Enter" && research()}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Niche/Industry (optional)</Label>
                            <Input value={niche} onChange={(e) => setNiche(e.target.value)}
                                   placeholder="e.g. SaaS, e-commerce..."/>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button variant="gradient" onClick={research} isLoading={isResearching} className="gap-2">
                        <Sparkles className="h-4 w-4"/>
                        {isResearching ? "Researching keywords..." : "Research Keywords — 1 AI Credit"}
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Content ideas */}
                    {result.contentIdeas.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-500"/> Blog Post Ideas
                                    for &quot;{result.seedKeyword}&quot;
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-2">
                                    {result.contentIdeas.map((idea, i) => (
                                        <div key={i}
                                             className="flex items-center justify-between gap-2 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors group">
                                            <span className="text-sm">{idea}</span>
                                            <div
                                                className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => copy(idea)}
                                                        className="text-muted-foreground hover:text-indigo-600 transition-colors">
                                                    {copiedKw === idea ?
                                                        <Check className="h-3.5 w-3.5 text-emerald-500"/> :
                                                        <Copy className="h-3.5 w-3.5"/>}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Keywords table */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">{result.keywords.length} Keywords Found</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-xl border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Keyword</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Volume</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Difficulty</th>
                                            <th className="text-right px-4 py-3 font-medium text-muted-foreground">CPC</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Intent</th>
                                            <th className="text-center px-4 py-3 font-medium text-muted-foreground">Trend</th>
                                            <th className="px-4 py-3"/>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                        {result.keywords.map((kw) => (
                                            <tr key={kw.keyword} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                                                <td className="px-4 py-3 text-right font-mono">{kw.searchVolume.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <div
                                                            className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${kw.difficulty}%`,
                                                                    background: kw.difficulty <= 30 ? "#22c55e" : kw.difficulty <= 60 ? "#f59e0b" : "#ef4444",
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            className={`text-xs font-medium ${DIFFICULTY_COLOR(kw.difficulty)}`}>
                                {DIFFICULTY_LABEL(kw.difficulty)}
                              </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">${kw.cpc.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant={INTENT_BADGE[kw.intent] ?? "secondary"}
                                                           className="text-xs capitalize">
                                                        {kw.intent}
                                                    </Badge>
                                                </td>
                                                <td className={`px-4 py-3 text-center font-medium text-sm ${TREND_COLOR[kw.trend]}`}>
                                                    {TREND_ICON[kw.trend]} {kw.trend}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => copy(kw.keyword)}
                                                            className="text-muted-foreground hover:text-indigo-600 transition-colors">
                                                        {copiedKw === kw.keyword ?
                                                            <Check className="h-3.5 w-3.5 text-emerald-500"/> :
                                                            <Copy className="h-3.5 w-3.5"/>}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

// "use client";
// import { useEffect, useState } from "react";
// import { Trash2, Search, TrendingUp, TrendingDown, Minus, BookmarkCheck, Plus } from "lucide-react";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Input, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent } from "@/components/ui/card";
// import { EmptyState } from "@/components/shared/EmptyState";
// import { InlineLoader } from "@/components/shared/PageLoader";
//
// interface Keyword {
//   _id: string;
//   keyword: string;
//   searchVolume: number;
//   difficulty: number;
//   cpc: number;
//   trend: "up" | "down" | "stable";
//   createdAt: string;
// }
//
// const TREND_ICON = (t: string) =>
//   t === "up" ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
//     : t === "down" ? <TrendingDown className="h-3.5 w-3.5 text-red-500" />
//       : <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
//
// const DIFF_COLOR = (d: number) =>
//   d >= 70 ? "text-red-500" : d >= 40 ? "text-yellow-500" : "text-emerald-500";
//
// export default function SavedKeywordsPage() {
//   const [keywords, setKeywords] = useState<Keyword[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [search, setSearch] = useState("");
//
//   useEffect(() => {
//     fetch("/api/ai/keywords")
//       .then((r) => r.json())
//       .then((d) => { if (d.success) setKeywords(d.data); })
//       .finally(() => setIsLoading(false));
//   }, []);
//
//   const handleDelete = async (id: string) => {
//     await fetch(`/api/ai/keywords?id=${id}`, { method: "DELETE" });
//     setKeywords((prev) => prev.filter((k) => k._id !== id));
//   };
//
//   const filtered = keywords.filter((k) =>
//     k.keyword.toLowerCase().includes(search.toLowerCase())
//   );
//
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Saved Keywords</h1>
//           <p className="text-muted-foreground text-sm">{keywords.length} keywords saved</p>
//         </div>
//         <Button asChild variant="gradient" className="gap-2">
//           <Link href="/dashboard/admin/seo">
//             <Plus className="h-4 w-4" /> Research More
//           </Link>
//         </Button>
//       </div>
//
//       {keywords.length > 0 && (
//         <div className="relative max-w-sm">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//           <Input
//             placeholder="Filter keywords..."
//             className="pl-9"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>
//       )}
//
//       {isLoading ? (
//         <InlineLoader />
//       ) : filtered.length === 0 ? (
//         <EmptyState
//           icon={BookmarkCheck}
//           title="No saved keywords"
//           description="Research keywords using AI and save the ones you want to target."
//           action={{ label: "Research Keywords", href: "/dashboard/admin/seo" }}
//         />
//       ) : (
//         <Card>
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead className="border-b bg-muted/30">
//                   <tr>
//                     <th className="text-left px-4 py-3 font-medium text-muted-foreground">Keyword</th>
//                     <th className="text-right px-4 py-3 font-medium text-muted-foreground">Volume</th>
//                     <th className="text-right px-4 py-3 font-medium text-muted-foreground">Difficulty</th>
//                     <th className="text-right px-4 py-3 font-medium text-muted-foreground">CPC</th>
//                     <th className="text-center px-4 py-3 font-medium text-muted-foreground">Trend</th>
//                     <th className="px-4 py-3" />
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y">
//                   {filtered.map((kw) => (
//                     <tr key={kw._id} className="hover:bg-muted/20 transition-colors">
//                       <td className="px-4 py-3 font-medium">{kw.keyword}</td>
//                       <td className="px-4 py-3 text-right text-muted-foreground">
//                         {kw.searchVolume?.toLocaleString() ?? "—"}
//                       </td>
//                       <td className={`px-4 py-3 text-right font-semibold ${DIFF_COLOR(kw.difficulty)}`}>
//                         {kw.difficulty}/100
//                       </td>
//                       <td className="px-4 py-3 text-right text-muted-foreground">
//                         ${kw.cpc?.toFixed(2) ?? "—"}
//                       </td>
//                       <td className="px-4 py-3 text-center flex justify-center">
//                         {TREND_ICON(kw.trend)}
//                       </td>
//                       <td className="px-4 py-3 text-right">
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           className="h-7 w-7 text-muted-foreground hover:text-destructive"
//                           onClick={() => handleDelete(kw._id)}
//                         >
//                           <Trash2 className="h-3.5 w-3.5" />
//                         </Button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }
