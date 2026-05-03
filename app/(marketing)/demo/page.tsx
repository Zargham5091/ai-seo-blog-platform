// app/(marketing)/demo/page.tsx
"use client";
import {useState, useEffect} from "react";
import {Sparkles, Search, BarChart3, ArrowRight, Lock, Zap, CheckCircle, AlertCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {SEOScoreCircle} from "@/components/seo/SEOScoreCircle";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BlogResult {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    metaTitle: string;
    metaDescription: string;
    tags: string[];
    outline: string[];
}

interface KeywordResult {
    seedKeyword: string;
    keywords: {
        keyword: string;
        searchVolume: number;
        difficulty: number;
        cpc: number;
        trend: string;
        intent?: string
    }[];
}

interface AnalyzeResult {
    score: number;
    readabilityScore: number;
    keywordDensity: number;
    wordCount: number;
    suggestions: string[];
}

// ── Mock fallback data (shown before any AI call) ─────────────────────────────
const MOCK_KEYWORDS = [
    {keyword: "content marketing strategy", searchVolume: 12400, difficulty: 62, cpc: 4.20, trend: "up"},
    {keyword: "seo for beginners", searchVolume: 22100, difficulty: 45, cpc: 2.80, trend: "up"},
    {keyword: "blog post ideas", searchVolume: 8900, difficulty: 38, cpc: 1.50, trend: "stable"},
    {keyword: "keyword research tools", searchVolume: 6600, difficulty: 71, cpc: 6.90, trend: "up"},
    {keyword: "on page seo checklist", searchVolume: 4400, difficulty: 55, cpc: 3.20, trend: "stable"},
];

const MOCK_BLOG = {
    title: "10 Proven Content Marketing Strategies That Drive Organic Traffic",
    content: `<h2>Introduction</h2><p>Content marketing has become one of the most powerful ways to grow organic traffic. But not all content strategies are created equal.</p><h2>1. Build Topic Clusters</h2><p>Instead of isolated blog posts, create interconnected hubs of content around core topics. This signals topical authority to search engines and keeps readers engaged longer.</p><h2>2. Optimize for Search Intent</h2><p>Understanding <strong>why</strong> someone searches is more important than matching exact keywords. Align your content format and depth with what users actually want to find.</p>`,
    seoScore: 84, tags: ["content marketing", "seo", "organic traffic"],
    metaTitle: "10 Content Marketing Strategies for Organic Traffic | SEO Platform",
    metaDescription: "Discover 10 proven content marketing strategies that drive massive organic traffic.",
};

const MOCK_ANALYSIS = {
    score: 76, readabilityScore: 82, wordCount: 847, keywordDensity: 1.8,
    suggestions: [
        "Add more internal links to related content (currently 0)",
        "Include a table of contents for posts over 1,500 words",
        "Add alt text to all images for better accessibility",
        "Consider adding an FAQ section to target voice search",
        "The meta description could be more compelling — add a CTA",
    ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
    const [activeTab, setActiveTab] = useState<"keywords" | "blog" | "analysis">("keywords");
    const [isLoading, setIsLoading] = useState(false);
    const [demoInput, setDemoInput] = useState("");
    const [analysisContent, setAnalysisContent] = useState("");
    const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
    const [upgradeRequired, setUpgradeRequired] = useState(false);
    const [isReal, setIsReal] = useState(false); // true when showing real AI result

    // Results
    const [blogResult, setBlogResult] = useState<BlogResult | null>(null);
    const [keywordResult, setKeywordResult] = useState<KeywordResult | null>(null);
    const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);

    // Check remaining credits on mount
    useEffect(() => {
        fetch("/api/demo").then((r) => r.json()).then((d) => {
            if (d.success) setCreditsRemaining(d.data.remaining);
        }).catch(() => setCreditsRemaining(3));
    }, []);

    const resetResults = () => {
        setBlogResult(null);
        setKeywordResult(null);
        setAnalyzeResult(null);
        setIsReal(false);
    };

    const runDemo = async () => {
        if (!demoInput.trim()) return;
        setIsLoading(true);
        setUpgradeRequired(false);
        resetResults();

        try {
            const body =
                activeTab === "blog" ? {type: "blog", topic: demoInput}
                    : activeTab === "keywords" ? {type: "keywords", keyword: demoInput}
                        : {type: "analyze", content: analysisContent || demoInput, keyword: demoInput};

            const res = await fetch("/api/demo", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body),
            });
            const d = await res.json();

            if (d.success) {
                setIsReal(true);
                setCreditsRemaining(d.meta.creditsRemaining);
                if (activeTab === "blog") setBlogResult(d.data as BlogResult);
                else if (activeTab === "keywords") setKeywordResult(d.data as KeywordResult);
                else setAnalyzeResult(d.data as AnalyzeResult);
            } else if (d.upgradeRequired) {
                setUpgradeRequired(true);
                // Show mock data as fallback
                setIsReal(false);
            }
        } catch {
            // Fallback to mock data on error
            setIsReal(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabChange = (v: string) => {
        setActiveTab(v as typeof activeTab);
        setDemoInput("");
        resetResults();
        setUpgradeRequired(false);
    };

    // Display data — real if available, mock as fallback
    const displayBlog = blogResult ?? (isReal ? null : MOCK_BLOG);
    const displayKeywords = keywordResult?.keywords ?? MOCK_KEYWORDS;
    const displayAnalysis = analyzeResult ?? (isReal ? null : MOCK_ANALYSIS);
    const seedKw = keywordResult?.seedKeyword ?? (demoInput || "content marketing");

    return (
        <div className="py-16">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-emerald-500 text-white py-20 mb-12">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="bg-white/20 text-white border-0 mb-4">
                        <Zap className="h-3 w-3 mr-1"/> Interactive Demo
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">See SEO Platform in Action</h1>
                    <p className="text-indigo-100 text-lg max-w-xl mx-auto">
                        Try our real AI tools — no account needed. Enter any topic and get actual AI-generated results.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <div className="inline-flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
                            <Sparkles className="h-3.5 w-3.5"/>
                            {creditsRemaining !== null
                                ? `${creditsRemaining} free AI credit${creditsRemaining !== 1 ? "s" : ""} remaining today`
                                : "3 free AI credits per day"}
                        </div>
                        <div className="inline-flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
                            <Lock className="h-3.5 w-3.5"/> Results not saved to database
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 max-w-5xl">

                {/* Credit exhausted banner */}
                {upgradeRequired && (
                    <div
                        className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5"/>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Demo credits used
                                up</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                You&apos;ve used all 3 free demo credits for today. Create a free account to get 10 more
                                AI credits — no credit card needed.
                            </p>
                        </div>
                        <Button asChild variant="gradient" size="sm" className="shrink-0">
                            <Link href="/register">Start Free <ArrowRight className="h-3.5 w-3.5 ml-1"/></Link>
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid grid-cols-3 mb-8 h-12">
                        <TabsTrigger value="keywords" className="gap-2"><Search className="h-4 w-4"/>Keyword
                            Research</TabsTrigger>
                        <TabsTrigger value="blog" className="gap-2"><Sparkles className="h-4 w-4"/>AI Blog
                            Generator</TabsTrigger>
                        <TabsTrigger value="analysis" className="gap-2"><BarChart3 className="h-4 w-4"/>SEO
                            Analyzer</TabsTrigger>
                    </TabsList>

                    {/* ── Keyword Research ── */}
                    <TabsContent value="keywords">
                        <Card className="mb-4">
                            <CardContent className="p-5">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Label className="text-xs mb-1.5">Enter any seed keyword</Label>
                                        <div className="relative">
                                            <Search
                                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                            <Input className="pl-9"
                                                   placeholder="e.g. content marketing, seo tools, blogging..."
                                                   value={demoInput} onChange={(e) => setDemoInput(e.target.value)}
                                                   onKeyDown={(e) => e.key === "Enter" && runDemo()}/>
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <Button onClick={runDemo} isLoading={isLoading} variant="gradient"
                                                className="gap-2"
                                                disabled={upgradeRequired}>
                                            <Sparkles className="h-4 w-4"/>
                                            {creditsRemaining === 0 ? "No Credits" : "Research — 1 Credit"}
                                        </Button>
                                    </div>
                                </div>
                                {!upgradeRequired && creditsRemaining !== null && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {creditsRemaining > 0
                                            ? `${creditsRemaining} demo credit${creditsRemaining !== 1 ? "s" : ""} remaining today · Real AI results`
                                            : "No credits remaining · showing sample data"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">
                                        Keywords for &quot;{seedKw}&quot;
                                    </CardTitle>
                                    <Badge variant={isReal ? "success" : "info"}>
                                        {isReal ? "Real AI Results" : "Sample Data"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b text-muted-foreground text-xs">
                                            <th className="text-left pb-2 font-medium">Keyword</th>
                                            <th className="text-right pb-2 font-medium">Volume</th>
                                            <th className="text-right pb-2 font-medium">Difficulty</th>
                                            <th className="text-right pb-2 font-medium">CPC</th>
                                            <th className="text-center pb-2 font-medium">Trend</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                        {displayKeywords.map((kw) => (
                                            <tr key={kw.keyword} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 font-medium">{kw.keyword}</td>
                                                <td className="py-2.5 text-right text-muted-foreground">
                                                    {typeof kw.searchVolume === "number" ? kw.searchVolume.toLocaleString() : kw.searchVolume}
                                                </td>
                                                <td className={`py-2.5 text-right font-semibold ${kw.difficulty >= 70 ? "text-red-500" : kw.difficulty >= 40 ? "text-yellow-500" : "text-emerald-500"}`}>
                                                    {kw.difficulty}/100
                                                </td>
                                                <td className="py-2.5 text-right text-muted-foreground">
                                                    ${typeof kw.cpc === "number" ? kw.cpc.toFixed(2) : kw.cpc}
                                                </td>
                                                <td className="py-2.5 text-center text-xs">
                                                    {kw.trend === "up" || kw.trend === "rising" ? "📈" : kw.trend === "down" || kw.trend === "declining" ? "📉" : "➡️"}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Blog Generator ── */}
                    <TabsContent value="blog">
                        <Card className="mb-4">
                            <CardContent className="p-5">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Label className="text-xs mb-1.5">Blog topic</Label>
                                        <Input placeholder="e.g. benefits of email marketing, how to rank on Google..."
                                               value={demoInput} onChange={(e) => setDemoInput(e.target.value)}
                                               onKeyDown={(e) => e.key === "Enter" && runDemo()}/>
                                    </div>
                                    <div className="flex items-end">
                                        <Button onClick={runDemo} isLoading={isLoading} variant="gradient"
                                                className="gap-2"
                                                disabled={upgradeRequired}>
                                            <Sparkles className="h-4 w-4"/>
                                            {creditsRemaining === 0 ? "No Credits" : "Generate — 1 Credit"}
                                        </Button>
                                    </div>
                                </div>
                                {!upgradeRequired && creditsRemaining !== null && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {creditsRemaining > 0
                                            ? `${creditsRemaining} demo credit${creditsRemaining !== 1 ? "s" : ""} remaining · Real AI blog post`
                                            : "No credits remaining · showing sample post"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {displayBlog && (
                            <div className="grid lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-sm">Generated Blog Post</CardTitle>
                                                <Badge variant={isReal ? "success" : "info"}>
                                                    {isReal ? "Real AI Output" : "Sample Output"}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <h2 className="text-xl font-bold mb-3">{displayBlog.title}</h2>
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {displayBlog.tags?.map((tag) => (
                                                    <Badge key={tag} variant="outline"
                                                           className="text-xs capitalize">{tag}</Badge>
                                                ))}
                                            </div>
                                            <div className="prose prose-sm dark:prose-invert max-w-none"
                                                 dangerouslySetInnerHTML={{__html: displayBlog.content}}/>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="space-y-4">
                                    <Card>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">SEO Score</p>
                                                <p className="text-xs text-muted-foreground">Content quality</p>
                                            </div>
                                            <SEOScoreCircle
                                                score={"seoScore" in displayBlog ? (displayBlog as typeof MOCK_BLOG).seoScore : 80}
                                                size="md"/>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta
                                                Tags</p>
                                            {"metaTitle" in displayBlog &&
                                                <p className="text-xs font-semibold">{displayBlog.metaTitle}</p>}
                                            {"metaDescription" in displayBlog &&
                                                <p className="text-xs text-muted-foreground">{displayBlog.metaDescription}</p>}
                                        </CardContent>
                                    </Card>
                                    {isReal && blogResult?.outline && blogResult.outline.length > 0 && (
                                        <Card>
                                            <CardContent className="p-4 space-y-1.5">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Outline</p>
                                                {blogResult.outline.map((item, i) => (
                                                    <div key={i}
                                                         className="flex items-start gap-2 text-xs text-muted-foreground">
                                                        <CheckCircle
                                                            className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5"/>
                                                        {item}
                                                    </div>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* ── SEO Analysis ── */}
                    <TabsContent value="analysis">
                        <Card className="mb-4">
                            <CardContent className="p-5 space-y-3">
                                <div>
                                    <Label className="text-xs mb-1.5">Target keyword</Label>
                                    <Input placeholder="e.g. content marketing, seo audit..."
                                           value={demoInput} onChange={(e) => setDemoInput(e.target.value)}/>
                                </div>
                                <div>
                                    <Label className="text-xs mb-1.5">Paste content to analyze (or leave blank for
                                        sample)</Label>
                                    <textarea
                                        className="w-full rounded-lg border bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                        rows={4}
                                        placeholder="Paste your blog content here..."
                                        value={analysisContent}
                                        onChange={(e) => setAnalysisContent(e.target.value)}
                                    />
                                </div>
                                <Button onClick={runDemo} isLoading={isLoading} variant="gradient" className="gap-2"
                                        disabled={upgradeRequired}>
                                    <BarChart3 className="h-4 w-4"/>
                                    {creditsRemaining === 0 ? "No Credits" : "Analyze — 1 Credit"}
                                </Button>
                                {!upgradeRequired && creditsRemaining !== null && (
                                    <p className="text-xs text-muted-foreground">
                                        {creditsRemaining > 0 ? `${creditsRemaining} demo credits remaining` : "No credits remaining · showing sample analysis"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {displayAnalysis && (
                            <div className="grid md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                                        <SEOScoreCircle score={displayAnalysis.score} size="lg"/>
                                        <p className="font-semibold">SEO Score</p>
                                        <p className="text-xs text-muted-foreground">
                                            {displayAnalysis.wordCount} words · {displayAnalysis.keywordDensity}%
                                            density
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                                        <SEOScoreCircle score={displayAnalysis.readabilityScore} size="lg"/>
                                        <p className="font-semibold">Readability</p>
                                        <p className="text-xs text-muted-foreground">
                                            {displayAnalysis.readabilityScore >= 80 ? "Excellent" : displayAnalysis.readabilityScore >= 60 ? "Good" : "Needs work"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2"><CardTitle className="text-sm">Suggestions</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        {displayAnalysis.suggestions.slice(0, 4).map((s, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs">
                                                <span
                                                    className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold shrink-0 text-[10px]">{i + 1}</span>
                                                <span className="text-muted-foreground">{s}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Upgrade CTA */}
                <div
                    className="mt-12 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-8 text-center">
                    <Badge variant="info" className="mb-3">Unlock Full Access</Badge>
                    <h3 className="text-2xl font-bold mb-2">Ready for real results?</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create a free account to get 10 AI credits, save your content, connect your domain, and access
                        all SEO tools.
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <Button asChild variant="gradient" size="lg" className="gap-2">
                            <Link href="/register">Start Free <ArrowRight className="h-4 w-4"/></Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href="/pricing">View Plans</Link>
                        </Button>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">No credit card · 10 free AI credits · Cancel
                        anytime</p>
                </div>
            </div>
        </div>
    );
}
// "use client";
// import { useState } from "react";
// import { Sparkles, Search, BarChart3, FileText, ArrowRight, Lock, Zap } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
// import { SEOScoreCircle } from "@/components/seo/SEOScoreCircle";
// import Link from "next/link";
//
// // ─── Mock demo data (nothing saved to DB) ─────────────────────────────────────
// const DEMO_KEYWORDS = [
//   { keyword: "content marketing strategy", searchVolume: 12400, difficulty: 62, cpc: 4.20, trend: "up" },
//   { keyword: "seo for beginners", searchVolume: 22100, difficulty: 45, cpc: 2.80, trend: "up" },
//   { keyword: "blog post ideas", searchVolume: 8900, difficulty: 38, cpc: 1.50, trend: "stable" },
//   { keyword: "keyword research tools", searchVolume: 6600, difficulty: 71, cpc: 6.90, trend: "up" },
//   { keyword: "on page seo checklist", searchVolume: 4400, difficulty: 55, cpc: 3.20, trend: "stable" },
// ];
//
// const DEMO_BLOG = {
//   title: "10 Proven Content Marketing Strategies That Drive Organic Traffic",
//   excerpt: "Discover the most effective content marketing strategies used by top brands to drive massive organic traffic in 2025.",
//   content: `<h2>Introduction</h2><p>Content marketing has become one of the most powerful ways to grow organic traffic. But not all content strategies are created equal.</p><h2>1. Build Topic Clusters</h2><p>Instead of isolated blog posts, create interconnected hubs of content around core topics. This signals topical authority to search engines and keeps readers engaged longer.</p><h2>2. Optimize for Search Intent</h2><p>Understanding <strong>why</strong> someone searches is more important than matching exact keywords. Align your content format and depth with what users actually want to find.</p><h2>3. Create Data-Driven Content</h2><p>Original research, surveys, and proprietary data earn natural backlinks and establish authority in your niche.</p>`,
//   seoScore: 84,
//   readabilityScore: 78,
//   metaTitle: "10 Content Marketing Strategies for Organic Traffic | SEO Platform",
//   metaDescription: "Discover 10 proven content marketing strategies that drive massive organic traffic. From topic clusters to data-driven content.",
//   tags: ["content marketing", "seo", "organic traffic"],
// };
//
// const DEMO_ANALYSIS = {
//   score: 76,
//   readabilityScore: 82,
//   wordCount: 847,
//   keywordDensity: 1.8,
//   suggestions: [
//     "Add more internal links to related content (currently 0)",
//     "Include a table of contents for posts over 1,500 words",
//     "Add alt text to all images for better accessibility",
//     "Consider adding an FAQ section to target voice search",
//     "The meta description could be more compelling — add a CTA",
//   ],
// };
//
// export default function DemoPage() {
//   const [activeDemo, setActiveDemo] = useState<"keywords" | "blog" | "analysis">("keywords");
//   const [isSimulating, setIsSimulating] = useState(false);
//   const [showResult, setShowResult] = useState(false);
//   const [demoInput, setDemoInput] = useState("");
//
//   const simulateGeneration = async () => {
//     if (!demoInput.trim()) return;
//     setIsSimulating(true);
//     setShowResult(false);
//     await new Promise((r) => setTimeout(r, 1800));
//     setShowResult(true);
//     setIsSimulating(false);
//   };
//
//   return (
//     <div className="py-16">
//       {/* Header */}
//       <div className="bg-gradient-to-br from-indigo-600 to-emerald-500 text-white py-20 mb-12">
//         <div className="container mx-auto px-4 text-center">
//           <Badge className="bg-white/20 text-white border-0 mb-4">
//             <Zap className="h-3 w-3 mr-1" /> Live Demo — No Login Required
//           </Badge>
//           <h1 className="text-4xl md:text-5xl font-bold mb-4">See SEO Platform in Action</h1>
//           <p className="text-indigo-100 text-lg max-w-xl mx-auto">
//             Explore our AI-powered tools with pre-loaded demo data. No account needed — this is a sandbox environment.
//           </p>
//           <div className="mt-6 inline-flex items-center gap-2 text-sm bg-white/10 rounded-full px-4 py-2">
//             <Lock className="h-3.5 w-3.5" /> Demo data is not saved to any database
//           </div>
//         </div>
//       </div>
//
//       <div className="container mx-auto px-4 max-w-5xl">
//         <Tabs value={activeDemo} onValueChange={(v) => { setActiveDemo(v as typeof activeDemo); setShowResult(false); }}>
//           <TabsList className="grid grid-cols-3 mb-8 h-12">
//             <TabsTrigger value="keywords" className="gap-2"><Search className="h-4 w-4" />Keyword Research</TabsTrigger>
//             <TabsTrigger value="blog" className="gap-2"><Sparkles className="h-4 w-4" />AI Blog Generator</TabsTrigger>
//             <TabsTrigger value="analysis" className="gap-2"><BarChart3 className="h-4 w-4" />SEO Analyzer</TabsTrigger>
//           </TabsList>
//
//           {/* Keyword Research Demo */}
//           <TabsContent value="keywords">
//             <Card className="mb-4">
//               <CardContent className="p-5">
//                 <div className="flex gap-3">
//                   <div className="flex-1">
//                     <Label className="text-xs mb-1.5">Try a seed keyword</Label>
//                     <div className="relative">
//                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                       <Input
//                         className="pl-9"
//                         placeholder="e.g. content marketing, seo tools, blogging..."
//                         value={demoInput}
//                         onChange={(e) => setDemoInput(e.target.value)}
//                         onKeyDown={(e) => e.key === "Enter" && simulateGeneration()}
//                       />
//                     </div>
//                   </div>
//                   <div className="flex items-end">
//                     <Button onClick={simulateGeneration} isLoading={isSimulating} variant="gradient" className="gap-2">
//                       <Sparkles className="h-4 w-4" /> Research
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//
//             {(showResult || !demoInput) && (
//               <Card>
//                 <CardHeader className="pb-3">
//                   <div className="flex items-center justify-between">
//                     <CardTitle className="text-sm">{showResult ? "AI-Generated Results" : "Sample Results"}</CardTitle>
//                     <Badge variant="info">Demo Data</Badge>
//                   </div>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="overflow-x-auto">
//                     <table className="w-full text-sm">
//                       <thead>
//                         <tr className="border-b text-muted-foreground text-xs">
//                           <th className="text-left pb-2 font-medium">Keyword</th>
//                           <th className="text-right pb-2 font-medium">Volume</th>
//                           <th className="text-right pb-2 font-medium">Difficulty</th>
//                           <th className="text-right pb-2 font-medium">CPC</th>
//                           <th className="text-center pb-2 font-medium">Trend</th>
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y">
//                         {DEMO_KEYWORDS.map((kw) => (
//                           <tr key={kw.keyword} className="hover:bg-muted/30 transition-colors">
//                             <td className="py-2.5 font-medium">{showResult && demoInput ? demoInput + " " + kw.keyword.split(" ").slice(-1)[0] : kw.keyword}</td>
//                             <td className="py-2.5 text-right text-muted-foreground">{kw.searchVolume.toLocaleString()}</td>
//                             <td className={`py-2.5 text-right font-semibold ${kw.difficulty >= 70 ? "text-red-500" : kw.difficulty >= 40 ? "text-yellow-500" : "text-emerald-500"}`}>{kw.difficulty}/100</td>
//                             <td className="py-2.5 text-right text-muted-foreground">${kw.cpc.toFixed(2)}</td>
//                             <td className="py-2.5 text-center text-xs">{kw.trend === "up" ? "📈" : kw.trend === "down" ? "📉" : "➡️"}</td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}
//           </TabsContent>
//
//           {/* Blog Generator Demo */}
//           <TabsContent value="blog">
//             <Card className="mb-4">
//               <CardContent className="p-5">
//                 <div className="flex gap-3">
//                   <div className="flex-1">
//                     <Label className="text-xs mb-1.5">Blog topic</Label>
//                     <Input
//                       placeholder="e.g. benefits of email marketing, how to rank on Google..."
//                       value={demoInput}
//                       onChange={(e) => setDemoInput(e.target.value)}
//                       onKeyDown={(e) => e.key === "Enter" && simulateGeneration()}
//                     />
//                   </div>
//                   <div className="flex items-end">
//                     <Button onClick={simulateGeneration} isLoading={isSimulating} variant="gradient" className="gap-2">
//                       <Sparkles className="h-4 w-4" /> Generate
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//
//             {(showResult || !demoInput) && (
//               <div className="grid lg:grid-cols-3 gap-4">
//                 <div className="lg:col-span-2">
//                   <Card>
//                     <CardHeader className="pb-3">
//                       <div className="flex items-center justify-between">
//                         <CardTitle className="text-sm">Generated Blog Post</CardTitle>
//                         <Badge variant="info">Demo Output</Badge>
//                       </div>
//                     </CardHeader>
//                     <CardContent>
//                       <h2 className="text-xl font-bold mb-3">{showResult && demoInput ? `How to Master ${demoInput} for Better SEO Results` : DEMO_BLOG.title}</h2>
//                       <div className="flex flex-wrap gap-1.5 mb-4">
//                         {DEMO_BLOG.tags.map((tag) => <Badge key={tag} variant="outline" className="text-xs capitalize">{tag}</Badge>)}
//                       </div>
//                       <div
//                         className="prose prose-sm dark:prose-invert max-w-none"
//                         dangerouslySetInnerHTML={{ __html: DEMO_BLOG.content }}
//                       />
//                     </CardContent>
//                   </Card>
//                 </div>
//                 <div className="space-y-4">
//                   <Card>
//                     <CardContent className="p-4 flex items-center justify-between">
//                       <div>
//                         <p className="text-sm font-semibold">SEO Score</p>
//                         <p className="text-xs text-muted-foreground">Content quality</p>
//                       </div>
//                       <SEOScoreCircle score={DEMO_BLOG.seoScore} size="md" />
//                     </CardContent>
//                   </Card>
//                   <Card>
//                     <CardContent className="p-4 space-y-2">
//                       <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meta Tags</p>
//                       <p className="text-xs font-semibold">{DEMO_BLOG.metaTitle}</p>
//                       <p className="text-xs text-muted-foreground">{DEMO_BLOG.metaDescription}</p>
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>
//             )}
//           </TabsContent>
//
//           {/* SEO Analysis Demo */}
//           <TabsContent value="analysis">
//             <Card className="mb-4">
//               <CardContent className="p-5">
//                 <div className="flex gap-3">
//                   <div className="flex-1">
//                     <Label className="text-xs mb-1.5">Target keyword to analyze</Label>
//                     <Input
//                       placeholder="e.g. content marketing, seo audit..."
//                       value={demoInput}
//                       onChange={(e) => setDemoInput(e.target.value)}
//                       onKeyDown={(e) => e.key === "Enter" && simulateGeneration()}
//                     />
//                   </div>
//                   <div className="flex items-end">
//                     <Button onClick={simulateGeneration} isLoading={isSimulating} variant="gradient" className="gap-2">
//                       <BarChart3 className="h-4 w-4" /> Analyze
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//
//             {(showResult || !demoInput) && (
//               <div className="grid md:grid-cols-3 gap-4">
//                 <Card>
//                   <CardContent className="p-5 flex flex-col items-center text-center gap-3">
//                     <SEOScoreCircle score={DEMO_ANALYSIS.score} size="lg" />
//                     <p className="font-semibold">SEO Score</p>
//                     <p className="text-xs text-muted-foreground">{DEMO_ANALYSIS.wordCount} words · {DEMO_ANALYSIS.keywordDensity}% density</p>
//                   </CardContent>
//                 </Card>
//                 <Card>
//                   <CardContent className="p-5 flex flex-col items-center text-center gap-3">
//                     <SEOScoreCircle score={DEMO_ANALYSIS.readabilityScore} size="lg" />
//                     <p className="font-semibold">Readability</p>
//                     <p className="text-xs text-muted-foreground">Good reading level</p>
//                   </CardContent>
//                 </Card>
//                 <Card>
//                   <CardHeader className="pb-2"><CardTitle className="text-sm">Suggestions</CardTitle></CardHeader>
//                   <CardContent className="space-y-2">
//                     {DEMO_ANALYSIS.suggestions.slice(0, 3).map((s, i) => (
//                       <div key={i} className="flex items-start gap-2 text-xs">
//                         <span className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-bold shrink-0 text-[10px]">{i + 1}</span>
//                         <span className="text-muted-foreground">{s}</span>
//                       </div>
//                     ))}
//                   </CardContent>
//                 </Card>
//               </div>
//             )}
//           </TabsContent>
//         </Tabs>
//
//         {/* Upgrade CTA */}
//         <div className="mt-12 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-8 text-center">
//           <Badge variant="info" className="mb-3">Unlock Full Access</Badge>
//           <h3 className="text-2xl font-bold mb-2">Ready for real results?</h3>
//           <p className="text-muted-foreground mb-6 max-w-md mx-auto">
//             Create an account to save your work, connect your real keywords, and generate unlimited SEO content.
//           </p>
//           <div className="flex gap-3 justify-center">
//             <Button asChild variant="gradient" size="lg" className="gap-2">
//               <Link href="/register">Start Free <ArrowRight className="h-4 w-4" /></Link>
//             </Button>
//             <Button asChild variant="outline" size="lg">
//               <Link href="/pricing">View Plans</Link>
//             </Button>
//           </div>
//           <p className="mt-3 text-xs text-muted-foreground">No credit card · 10 free AI credits · Cancel anytime</p>
//         </div>
//       </div>
//     </div>
//   );
// }
