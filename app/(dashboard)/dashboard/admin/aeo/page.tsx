"use client";
import {useEffect, useState} from "react";
import {Zap, Sparkles, Copy, Check, AlertTriangle, CheckCircle, BarChart3} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Progress} from "@/components/ui/misc";
import type {AEOAnalysisResult} from "@/app/api/aeo/route";

interface Blog {
    _id: string;
    title: string;
    content: string;
    status: string
}

const LIKELIHOOD_CONFIG = {
    high: {
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
        label: "High Citation Likelihood"
    },
    medium: {
        color: "text-yellow-600",
        bg: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
        label: "Medium Citation Likelihood"
    },
    low: {
        color: "text-red-500",
        bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        label: "Low Citation Likelihood"
    },
};

export default function AEOPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [keyword, setKeyword] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AEOAnalysisResult | null>(null);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/blog")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setBlogs(d.data.filter((b: Blog) => b.status === "published"));
            });
    }, []);

    const selectedBlog = blogs.find((b) => b._id === selectedId);

    const analyze = async () => {
        if (!selectedBlog || !keyword.trim()) return;
        setIsAnalyzing(true);
        setError("");
        setResult(null);

        const res = await fetch("/api/aeo", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                content: selectedBlog.content.replace(/<[^>]*>/g, ""),
                title: selectedBlog.title,
                targetKeyword: keyword,
            }),
        });
        const d = await res.json();
        if (d.success) setResult(d.data);
        else setError(d.error);
        setIsAnalyzing(false);
    };

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Zap className="h-6 w-6 text-indigo-500"/> AEO Optimizer
                    <Badge variant="info" className="text-xs">New</Badge>
                </h1>
                <p className="text-muted-foreground text-sm">
                    Optimize your content to be cited by ChatGPT, Perplexity, Google AI Overviews, and other AI answer
                    engines
                </p>
            </div>

            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Select Published Blog *</Label>
                            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="">Choose a blog post...</option>
                                {blogs.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Target Query / Keyword *</Label>
                            <Input value={keyword} onChange={(e) => setKeyword(e.target.value)}
                                   placeholder="e.g. what is SEO optimization"/>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button variant="gradient" onClick={analyze} isLoading={isAnalyzing}
                            disabled={!selectedId || !keyword.trim()} className="gap-2">
                        <Sparkles className="h-4 w-4"/>
                        {isAnalyzing ? "Analyzing for AI engines..." : "Analyze AEO Score — 1 AI Credit"}
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Score cards */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            {label: "AEO Score", value: result.aeoScore, desc: "AI citation potential"},
                            {label: "GEO Score", value: result.geoScore, desc: "Generative engine optimization"},
                            {label: "Citation Likelihood", value: null, desc: result.citationLikelihood},
                        ].map((s, i) => (
                            <Card key={i}
                                  className={s.value === null ? LIKELIHOOD_CONFIG[result.citationLikelihood].bg : ""}>
                                <CardContent className="p-4 text-center">
                                    {s.value !== null ? (
                                        <>
                                            <p className="text-3xl font-bold">{s.value}</p>
                                            <Progress value={s.value} className="h-1.5 mt-2 mb-1"/>
                                        </>
                                    ) : (
                                        <p className={`text-xl font-bold capitalize ${LIKELIHOOD_CONFIG[result.citationLikelihood].color}`}>
                                            {result.citationLikelihood}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground font-medium mt-1">{s.label}</p>
                                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Structure score */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Content
                                Structure</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(result.structureScore).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-muted-foreground">
                        {key.replace(/has/, "Has ").replace(/([A-Z])/g, " $1").trim()}
                      </span>
                                            {val
                                                ? <CheckCircle className="h-4 w-4 text-emerald-500"/>
                                                : <AlertTriangle className="h-4 w-4 text-amber-400"/>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Issues */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Issues &
                                Fixes</CardTitle></CardHeader>
                            <CardContent>
                                {result.issues.length === 0 ? (
                                    <div className="flex items-center gap-2 text-emerald-600 text-sm">
                                        <CheckCircle className="h-4 w-4"/> No critical issues found
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {result.issues.slice(0, 5).map((issue, i) => (
                                            <div key={i} className="p-2.5 rounded-lg border bg-muted/20">
                                                <p className="text-xs font-medium">{issue.message}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Fix: {issue.fix}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Optimized snippets */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="h-4 w-4 text-indigo-500"/> AI-Ready Snippets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                {
                                    key: "directAnswer",
                                    label: "Direct Answer (ChatGPT/Perplexity format)",
                                    value: result.optimizedSnippets.directAnswer
                                },
                                {
                                    key: "featuredSnippet",
                                    label: "Featured Snippet (Google AI Overview format)",
                                    value: result.optimizedSnippets.featuredSnippet
                                },
                                {
                                    key: "definitionBlock",
                                    label: "Definition Block",
                                    value: result.optimizedSnippets.definitionBlock
                                },
                            ].map((s) => (
                                <div key={s.key} className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground">{s.label}</Label>
                                        <button onClick={() => copy(s.value, s.key)}
                                                className="text-muted-foreground hover:text-indigo-600 transition-colors">
                                            {copied === s.key ? <Check className="h-3.5 w-3.5 text-emerald-500"/> :
                                                <Copy className="h-3.5 w-3.5"/>}
                                        </button>
                                    </div>
                                    <p className="text-sm bg-muted/30 rounded-lg px-3 py-2.5 border">{s.value}</p>
                                </div>
                            ))}

                            {result.optimizedSnippets.faqPairs.length > 0 && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">FAQ Pairs (add to your
                                        post)</Label>
                                    <div className="space-y-2">
                                        {result.optimizedSnippets.faqPairs.map((pair, i) => (
                                            <div key={i} className="rounded-lg border p-3 bg-muted/20">
                                                <p className="text-xs font-semibold">Q: {pair.question}</p>
                                                <p className="text-xs text-muted-foreground mt-1">A: {pair.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Missing entities + suggestions */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {result.missingEntities.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-sm">Missing
                                    Topics</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missingEntities.map((e, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">{e}</Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">Add coverage of these topics to
                                        improve AI citation chances</p>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Top
                                Suggestions</CardTitle></CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {result.suggestions.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-indigo-500 font-bold shrink-0">{i + 1}.</span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

// "use client";
// import {useEffect, useState} from "react";
// import {Brain, CheckCircle, X, AlertTriangle, Copy, Check, RefreshCw, Zap} from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Label, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {Progress} from "@/components/ui/misc";
// import type {AEOAnalysisResult} from "@/app/api/aeo/route";
//
// interface Blog {
//     _id: string;
//     title: string;
//     content: string;
//     status: string
// }
//
// export default function AEOPage() {
//     const [blogs, setBlogs] = useState<Blog[]>([]);
//     const [selectedBlogId, setSelectedBlogId] = useState("");
//     const [targetKeyword, setTargetKeyword] = useState("");
//     const [isAnalyzing, setIsAnalyzing] = useState(false);
//     const [result, setResult] = useState<AEOAnalysisResult | null>(null);
//     const [error, setError] = useState("");
//     const [copied, setCopied] = useState<string | null>(null);
//
//     useEffect(() => {
//         fetch("/api/blog")
//             .then((r) => r.json())
//             .then((d) => {
//                 if (d.success) setBlogs(d.data);
//             });
//     }, []);
//
//     const selectedBlog = blogs.find((b) => b._id === selectedBlogId);
//
//     const handleAnalyze = async () => {
//         if (!selectedBlog || !targetKeyword.trim()) {
//             setError("Select a blog post and enter a target keyword");
//             return;
//         }
//         setIsAnalyzing(true);
//         setError("");
//         setResult(null);
//
//         const res = await fetch("/api/aeo", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({
//                 content: selectedBlog.content,
//                 title: selectedBlog.title,
//                 targetKeyword: targetKeyword.trim(),
//             }),
//         });
//         const d = await res.json();
//         if (d.success) setResult(d.data);
//         else setError(d.error);
//         setIsAnalyzing(false);
//     };
//
//     const copy = (text: string, key: string) => {
//         navigator.clipboard.writeText(text);
//         setCopied(key);
//         setTimeout(() => setCopied(null), 2000);
//     };
//
//     const scoreColor = (score: number) =>
//         score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-red-500";
//
//     const scoreGradient = (score: number) =>
//         score >= 70 ? "from-emerald-500 to-teal-500" : score >= 40 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";
//
//     return (
//         <div className="space-y-6">
//             <div>
//                 <h1 className="text-2xl font-bold flex items-center gap-2">
//                     <Brain className="h-6 w-6 text-indigo-500"/> AEO Analyzer
//                 </h1>
//                 <p className="text-muted-foreground text-sm">
//                     Optimize your content to be cited by ChatGPT, Perplexity, and Google AI Overviews
//                 </p>
//             </div>
//
//             <Card>
//                 <CardContent className="p-5 space-y-4">
//                     <div className="grid md:grid-cols-2 gap-4">
//                         <div className="space-y-1.5">
//                             <Label className="text-xs">Blog Post</Label>
//                             <select
//                                 value={selectedBlogId}
//                                 onChange={(e) => setSelectedBlogId(e.target.value)}
//                                 className="w-full h-9 rounded-md border bg-background px-3 text-sm"
//                             >
//                                 <option value="">Select a blog post...</option>
//                                 {blogs.map((b) => (
//                                     <option key={b._id} value={b._id}>{b.title}</option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div className="space-y-1.5">
//                             <Label className="text-xs">Target Keyword / Query</Label>
//                             <Input
//                                 value={targetKeyword}
//                                 onChange={(e) => setTargetKeyword(e.target.value)}
//                                 placeholder="e.g. best SEO tools for beginners"
//                                 onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
//                             />
//                         </div>
//                     </div>
//                     {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
//                     <Button variant="gradient" onClick={handleAnalyze} isLoading={isAnalyzing} className="gap-2">
//                         <Brain className="h-4 w-4"/>
//                         {isAnalyzing ? "Analyzing for AI engines..." : "Analyze AEO Score — 1 Credit"}
//                     </Button>
//                 </CardContent>
//             </Card>
//
//             {result && (
//                 <div className="space-y-5">
//                     {/* Score cards */}
//                     <div className="grid md:grid-cols-3 gap-4">
//                         <Card>
//                             <CardContent className="p-5 text-center">
//                                 <p className="text-xs text-muted-foreground mb-2">AEO Score</p>
//                                 <p className={`text-5xl font-bold ${scoreColor(result.aeoScore)}`}>{result.aeoScore}</p>
//                                 <p className="text-xs text-muted-foreground mt-1">/ 100</p>
//                                 <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
//                                     <div
//                                         className={`h-full bg-gradient-to-r ${scoreGradient(result.aeoScore)} rounded-full transition-all`}
//                                         style={{width: `${result.aeoScore}%`}}/>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="p-5 text-center">
//                                 <p className="text-xs text-muted-foreground mb-2">GEO Score</p>
//                                 <p className={`text-5xl font-bold ${scoreColor(result.geoScore)}`}>{result.geoScore}</p>
//                                 <p className="text-xs text-muted-foreground mt-1">/ 100</p>
//                                 <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
//                                     <div
//                                         className={`h-full bg-gradient-to-r ${scoreGradient(result.geoScore)} rounded-full transition-all`}
//                                         style={{width: `${result.geoScore}%`}}/>
//                                 </div>
//                             </CardContent>
//                         </Card>
//                         <Card>
//                             <CardContent className="p-5 text-center">
//                                 <p className="text-xs text-muted-foreground mb-2">Citation Likelihood</p>
//                                 <Badge
//                                     variant={result.citationLikelihood === "high" ? "success" : result.citationLikelihood === "medium" ? "warning" : "destructive"}
//                                     className="text-base px-4 py-2 mt-2 capitalize"
//                                 >
//                                     {result.citationLikelihood}
//                                 </Badge>
//                                 <p className="text-xs text-muted-foreground mt-3">AI engine citation chance</p>
//                             </CardContent>
//                         </Card>
//                     </div>
//
//                     {/* Structure checklist */}
//                     <Card>
//                         <CardHeader className="pb-3"><CardTitle className="text-sm">Content Structure Check</CardTitle></CardHeader>
//                         <CardContent>
//                             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//                                 {Object.entries(result.structureScore).map(([key, val]) => (
//                                     <div key={key}
//                                          className={`flex items-center gap-2 p-2.5 rounded-lg border ${val ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-red-100 bg-red-50/50 dark:bg-red-950/20"}`}>
//                                         {val
//                                             ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0"/>
//                                             : <X className="h-4 w-4 text-red-400 shrink-0"/>}
//                                         <span
//                                             className="text-xs capitalize">{key.replace(/([A-Z])/g, " $1").replace("has ", "")}</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         </CardContent>
//                     </Card>
//
//                     <div className="grid md:grid-cols-2 gap-5">
//                         {/* Issues */}
//                         {result.issues.length > 0 && (
//                             <Card>
//                                 <CardHeader className="pb-3"><CardTitle
//                                     className="text-sm flex items-center gap-2"><AlertTriangle
//                                     className="h-4 w-4 text-amber-500"/>Issues to Fix</CardTitle></CardHeader>
//                                 <CardContent className="space-y-3">
//                                     {result.issues.map((issue, i) => (
//                                         <div key={i}
//                                              className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800">
//                                             <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{issue.message}</p>
//                                             <p className="text-xs text-muted-foreground mt-1">
//                                                 <strong>Fix:</strong> {issue.fix}</p>
//                                         </div>
//                                     ))}
//                                 </CardContent>
//                             </Card>
//                         )}
//
//                         {/* Suggestions */}
//                         {result.suggestions.length > 0 && (
//                             <Card>
//                                 <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Zap
//                                     className="h-4 w-4 text-indigo-500"/>Improvements</CardTitle></CardHeader>
//                                 <CardContent>
//                                     <ul className="space-y-2">
//                                         {result.suggestions.map((s, i) => (
//                                             <li key={i} className="flex items-start gap-2 text-sm">
//                                                 <span
//                                                     className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
//                                                 <span className="text-muted-foreground">{s}</span>
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 </CardContent>
//                             </Card>
//                         )}
//                     </div>
//
//                     {/* Optimized snippets */}
//                     <Card>
//                         <CardHeader className="pb-3"><CardTitle className="text-sm">AI-Optimized
//                             Snippets</CardTitle></CardHeader>
//                         <CardContent className="space-y-4">
//                             {[
//                                 {key: "directAnswer", label: "Direct Answer"},
//                                 {key: "featuredSnippet", label: "Featured Snippet"},
//                                 {key: "definitionBlock", label: "Definition Block"},
//                             ].map(({key, label}) => {
//                                 const text = result.optimizedSnippets[key as keyof typeof result.optimizedSnippets] as string;
//                                 if (!text) return null;
//                                 return (
//                                     <div key={key} className="space-y-1.5">
//                                         <div className="flex items-center justify-between">
//                                             <Label className="text-xs">{label}</Label>
//                                             <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs"
//                                                     onClick={() => copy(text, key)}>
//                                                 {copied === key ? <><Check
//                                                     className="h-3 w-3 text-emerald-500"/>Copied</> : <><Copy
//                                                     className="h-3 w-3"/>Copy</>}
//                                             </Button>
//                                         </div>
//                                         <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm">{text}</div>
//                                     </div>
//                                 );
//                             })}
//
//                             {result.optimizedSnippets.faqPairs?.length > 0 && (
//                                 <div className="space-y-2">
//                                     <Label className="text-xs">FAQ Pairs (add to your post)</Label>
//                                     {result.optimizedSnippets.faqPairs.map((pair, i) => (
//                                         <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1">
//                                             <p className="text-sm font-medium">Q: {pair.question}</p>
//                                             <p className="text-sm text-muted-foreground">A: {pair.answer}</p>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//
//                     {/* Missing entities */}
//                     {result.missingEntities.length > 0 && (
//                         <Card>
//                             <CardHeader className="pb-3"><CardTitle className="text-sm">Missing Entities /
//                                 Topics</CardTitle></CardHeader>
//                             <CardContent>
//                                 <div className="flex flex-wrap gap-2">
//                                     {result.missingEntities.map((e) => (
//                                         <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
//                                     ))}
//                                 </div>
//                                 <p className="text-xs text-muted-foreground mt-3">Add coverage of these topics to
//                                     improve AI citation chances</p>
//                             </CardContent>
//                         </Card>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }
