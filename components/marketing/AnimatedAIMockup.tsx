// components/marketing/AnimatedAIMockup.tsx
"use client";
import {useEffect, useState, useRef} from "react";
import {Sparkles, Search, BarChart3, TrendingUp, CheckCircle} from "lucide-react";
import {Badge} from "@/components/ui/form-elements";

// ── Hardcoded demo examples ────────────────────────────────────────────────────
const BLOG_EXAMPLE = {
    topic: "How to rank on Google in 2025",
    title: "How to Rank on Google in 2025: The Complete Guide",
    content: [
        {tag: "h2", text: "Introduction"},
        {
            tag: "p",
            text: "Google's algorithm has evolved dramatically. In 2025, ranking requires a combination of technical excellence, E-E-A-T signals, and AI-optimized content structure."
        },
        {tag: "h2", text: "1. Master Core Web Vitals"},
        {
            tag: "p",
            text: "Page experience signals now directly impact rankings. Focus on LCP under 2.5s, FID under 100ms, and CLS under 0.1 for every page."
        },
        {tag: "h2", text: "2. Build Topical Authority"},
        {
            tag: "p",
            text: "Create comprehensive content clusters around your niche. Google rewards sites that demonstrate deep expertise across related topics."
        },
        {tag: "h2", text: "3. Optimize for AI Overviews"},
        {
            tag: "p",
            text: "Structure content with direct answers, clear definitions, and FAQ sections. AI-generated overviews favor concise, authoritative responses."
        },
    ],
    tags: ["seo", "google ranking", "content strategy"],
    seoScore: 91,
    metaTitle: "How to Rank on Google in 2025: Complete Guide",
    metaDescription: "Learn the proven strategies to rank on Google in 2025 — from Core Web Vitals to topical authority and AI optimization.",
};

const KEYWORD_EXAMPLE = {
    seed: "content marketing",
    keywords: [
        {
            keyword: "content marketing strategy",
            volume: "12,400",
            difficulty: 62,
            cpc: "$4.20",
            trend: "↑",
            intent: "commercial"
        },
        {
            keyword: "content marketing examples",
            volume: "8,100",
            difficulty: 44,
            cpc: "$2.80",
            trend: "↑",
            intent: "informational"
        },
        {
            keyword: "b2b content marketing",
            volume: "6,600",
            difficulty: 58,
            cpc: "$5.90",
            trend: "↑",
            intent: "commercial"
        },
        {
            keyword: "content marketing tools",
            volume: "4,400",
            difficulty: 52,
            cpc: "$6.10",
            trend: "→",
            intent: "commercial"
        },
        {
            keyword: "content marketing for seo",
            volume: "3,200",
            difficulty: 39,
            cpc: "$3.40",
            trend: "↑",
            intent: "informational"
        },
    ],
    ideas: [
        "The Ultimate Content Marketing Strategy Guide for 2025",
        "10 Content Marketing Examples That Drove Massive Traffic",
        "Best Content Marketing Tools Compared (Free & Paid)",
    ],
};

const ANALYTICS_EXAMPLE = {
    stats: [
        {label: "Total Views", value: "48,291", change: "+23%", color: "text-indigo-600"},
        {label: "Published Posts", value: "127", change: "+12 this month", color: "text-emerald-600"},
        {label: "Avg SEO Score", value: "84/100", change: "Excellent", color: "text-sky-600"},
        {label: "AI Credits", value: "847/2000", change: "Used this month", color: "text-purple-600"},
    ],
    topPosts: [
        {title: "10 SEO Tips for 2025", views: "12,400", score: 94},
        {title: "Keyword Research Guide", views: "8,900", score: 88},
        {title: "On-Page SEO Checklist", views: "6,200", score: 91},
        {title: "Link Building Strategies", views: "4,800", score: 79},
    ],
    chartBars: [28, 35, 42, 38, 55, 61, 58, 72, 68, 85, 79, 92],
};

// ── Typing animation hook ─────────────────────────────────────────────────────
function useTypingEffect(text: string, speed = 40, started = true) {
    const [displayed, setDisplayed] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!started) {
            setDisplayed("");
            setDone(false);
            return;
        }
        setDisplayed("");
        setDone(false);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setDone(true);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed, started]);

    return {displayed, done};
}

// ── AI Blog Mockup ────────────────────────────────────────────────────────────
export function AnimatedAIMockup() {
    const [phase, setPhase] = useState<"idle" | "typing" | "loading" | "result" | "scroll">("idle");
    const [inputVal, setInputVal] = useState("");
    const [visibleLines, setVisibleLines] = useState(0);
    const [scrollPos, setScrollPos] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const {displayed: typedInput, done: typingDone} = useTypingEffect(
        BLOG_EXAMPLE.topic, 50, phase === "typing"
    );

    // Auto-start animation loop
    useEffect(() => {
        const start = setTimeout(() => setPhase("typing"), 800);
        return () => clearTimeout(start);
    }, []);

    // Phase transitions
    useEffect(() => {
        if (phase === "typing") setInputVal(typedInput);
    }, [typedInput, phase]);

    useEffect(() => {
        if (phase === "typing" && typingDone) {
            setTimeout(() => setPhase("loading"), 400);
        }
    }, [phase, typingDone]);

    useEffect(() => {
        if (phase === "loading") {
            setTimeout(() => {
                setPhase("result");
                setVisibleLines(0);
            }, 1800);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === "result") {
            let line = 0;
            const interval = setInterval(() => {
                line++;
                setVisibleLines(line);
                if (line >= BLOG_EXAMPLE.content.length) {
                    clearInterval(interval);
                    setTimeout(() => setPhase("scroll"), 600);
                }
            }, 280);
            return () => clearInterval(interval);
        }
    }, [phase]);

    // Simulate scroll
    useEffect(() => {
        if (phase === "scroll") {
            let pos = 0;
            const interval = setInterval(() => {
                pos += 4;
                setScrollPos(pos);
                if (pos >= 120) {
                    clearInterval(interval);
                    // Restart loop
                    setTimeout(() => {
                        setPhase("idle");
                        setInputVal("");
                        setVisibleLines(0);
                        setScrollPos(0);
                        setTimeout(() => setPhase("typing"), 500);
                    }, 2000);
                }
            }, 20);
            return () => clearInterval(interval);
        }
    }, [phase]);

    return (
        <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden select-none">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30 shrink-0">
                <div className="h-3 w-3 rounded-full bg-red-400"/>
                <div className="h-3 w-3 rounded-full bg-yellow-400"/>
                <div className="h-3 w-3 rounded-full bg-green-400"/>
                <span className="ml-3 text-xs text-muted-foreground font-mono">AI Blog Generator</span>
                {phase === "loading" && (
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"
                             style={{animationDelay: "0ms"}}/>
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"
                             style={{animationDelay: "150ms"}}/>
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"
                             style={{animationDelay: "300ms"}}/>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-3">
                {/* Input row */}
                <div className="flex gap-2">
                    <div
                        className="flex-1 rounded-lg border bg-muted/20 px-3 py-2 text-sm min-h-[36px] flex items-center">
                        <span>{inputVal}</span>
                        {(phase === "typing") && (
                            <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse"/>
                        )}
                    </div>
                    <button
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium transition-all ${
                            phase === "loading" ? "bg-indigo-400" : "bg-gradient-to-r from-indigo-600 to-sky-500"
                        }`}
                    >
                        <Sparkles className={`h-3.5 w-3.5 ${phase === "loading" ? "animate-spin" : ""}`}/>
                        {phase === "loading" ? "Generating..." : "Generate"}
                    </button>
                </div>

                {/* Settings row */}
                <div className="flex gap-2">
                    {["Professional", "1,200 words", "SEO-Optimized"].map((tag) => (
                        <div key={tag}
                             className="flex-1 rounded border bg-muted/10 px-2 py-1 text-[10px] text-center text-muted-foreground">
                            {tag}
                        </div>
                    ))}
                </div>

                {/* Result */}
                {(phase === "result" || phase === "scroll") && (
                    <div
                        ref={containerRef}
                        className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/10 p-3 overflow-hidden"
                        style={{maxHeight: "200px"}}
                    >
                        {/* Score badge */}
                        <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3"/> Generated
              </span>
                            <Badge variant="success" className="text-[10px]">SEO {BLOG_EXAMPLE.seoScore}/100</Badge>
                        </div>

                        {/* Scrolling content */}
                        <div style={{transform: `translateY(-${scrollPos}px)`, transition: "transform 0.1s linear"}}>
                            <p className="text-xs font-bold mb-2">{BLOG_EXAMPLE.title}</p>
                            <div className="flex gap-1 mb-2 flex-wrap">
                                {BLOG_EXAMPLE.tags.map((t) => (
                                    <span key={t}
                                          className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">{t}</span>
                                ))}
                            </div>
                            {BLOG_EXAMPLE.content.slice(0, visibleLines).map((line, i) => (
                                <div key={i}
                                     className={`${line.tag === "h2" ? "font-semibold text-xs mt-2 mb-0.5" : "text-[10px] text-muted-foreground mb-1.5"}`}>
                                    {line.text}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {phase === "loading" && (
                    <div
                        className="rounded-xl border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/10 p-4 flex flex-col items-center gap-3">
                        <div className="flex gap-1.5">
                            {["Analyzing topic", "Researching keywords", "Writing content"].map((step, i) => (
                                <div key={step}
                                     className="flex items-center gap-1 text-[9px] text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"
                                         style={{animationDelay: `${i * 200}ms`}}/>
                                    {step}
                                </div>
                            ))}
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full animate-[loading_1.8s_ease-in-out_forwards]"
                                style={{animation: "width 1.8s ease-out forwards", width: "0%"}}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Animated Keywords Mockup ───────────────────────────────────────────────────
export function AnimatedKeywordsMockup() {
    const [phase, setPhase] = useState<"idle" | "typing" | "loading" | "result">("idle");
    const [inputVal, setInputVal] = useState("");
    const [visibleRows, setVisibleRows] = useState(0);

    const {displayed: typedInput, done: typingDone} = useTypingEffect(
        KEYWORD_EXAMPLE.seed, 60, phase === "typing"
    );

    useEffect(() => {
        const start = setTimeout(() => setPhase("typing"), 1000);
        return () => clearTimeout(start);
    }, []);

    useEffect(() => {
        if (phase === "typing") setInputVal(typedInput);
    }, [typedInput, phase]);

    useEffect(() => {
        if (phase === "typing" && typingDone) setTimeout(() => setPhase("loading"), 300);
    }, [phase, typingDone]);

    useEffect(() => {
        if (phase === "loading") setTimeout(() => {
            setPhase("result");
            setVisibleRows(0);
        }, 1600);
    }, [phase]);

    useEffect(() => {
        if (phase === "result") {
            let row = 0;
            const interval = setInterval(() => {
                row++;
                setVisibleRows(row);
                if (row >= KEYWORD_EXAMPLE.keywords.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setPhase("idle");
                        setInputVal("");
                        setVisibleRows(0);
                        setTimeout(() => setPhase("typing"), 800);
                    }, 4000);
                }
            }, 200);
            return () => clearInterval(interval);
        }
    }, [phase]);

    return (
        <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden select-none">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                <div className="h-3 w-3 rounded-full bg-red-400"/>
                <div className="h-3 w-3 rounded-full bg-yellow-400"/>
                <div className="h-3 w-3 rounded-full bg-green-400"/>
                <span className="ml-3 text-xs text-muted-foreground font-mono">Keyword Research</span>
            </div>
            <div className="p-4 space-y-3">
                {/* Input */}
                <div className="flex gap-2">
                    <div
                        className="flex-1 rounded-lg border bg-muted/20 px-3 py-2 text-sm flex items-center gap-2 min-h-[36px]">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
                        <span>{inputVal}</span>
                        {phase === "typing" && <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse"/>}
                    </div>
                    <button
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium ${phase === "loading" ? "bg-indigo-400" : "bg-gradient-to-r from-indigo-600 to-sky-500"}`}>
                        <Sparkles className={`h-3.5 w-3.5 ${phase === "loading" ? "animate-spin" : ""}`}/>
                        Research
                    </button>
                </div>

                {/* Table */}
                {(phase === "result") && (
                    <div className="rounded-xl border overflow-hidden">
                        <div
                            className="grid grid-cols-5 bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground font-medium">
                            <span className="col-span-2">Keyword</span>
                            <span className="text-right">Volume</span>
                            <span className="text-right">Diff</span>
                            <span className="text-right">CPC</span>
                        </div>
                        {KEYWORD_EXAMPLE.keywords.slice(0, visibleRows).map((kw, i) => (
                            <div key={i}
                                 className="grid grid-cols-5 px-3 py-2 text-xs border-t hover:bg-muted/20 transition-colors items-center">
                                <span className="col-span-2 font-medium truncate">{kw.keyword}</span>
                                <span className="text-right text-muted-foreground">{kw.volume}</span>
                                <span
                                    className={`text-right font-semibold ${kw.difficulty < 40 ? "text-emerald-500" : kw.difficulty < 60 ? "text-yellow-500" : "text-red-500"}`}>{kw.difficulty}</span>
                                <span className="text-right text-muted-foreground">{kw.cpc}</span>
                            </div>
                        ))}
                    </div>
                )}

                {phase === "loading" && (
                    <div className="rounded-xl border bg-sky-50/50 dark:bg-sky-950/10 p-3 space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-6 rounded bg-sky-100 dark:bg-sky-900/20 animate-pulse"
                                 style={{animationDelay: `${i * 150}ms`, width: `${80 - i * 10}%`}}/>
                        ))}
                    </div>
                )}

                {/* Content ideas */}
                {phase === "result" && visibleRows >= KEYWORD_EXAMPLE.keywords.length && (
                    <div className="rounded-lg border bg-sky-50 dark:bg-sky-950/20 p-2.5">
                        <p className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 mb-1.5 flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5"/> Content Ideas
                        </p>
                        {KEYWORD_EXAMPLE.ideas.map((idea, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground py-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-sky-400 mt-1 shrink-0"/>
                                {idea}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Animated Analytics Mockup ──────────────────────────────────────────────────
export function AnimatedAnalyticsMockup() {
    const [visible, setVisible] = useState(0);
    const [barsVisible, setBarsVisible] = useState(0);

    useEffect(() => {
        // Animate stat cards in
        const interval = setInterval(() => {
            setVisible((v) => {
                if (v >= ANALYTICS_EXAMPLE.stats.length) {
                    clearInterval(interval);
                    return v;
                }
                return v + 1;
            });
        }, 300);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (visible >= ANALYTICS_EXAMPLE.stats.length) {
            const interval = setInterval(() => {
                setBarsVisible((v) => {
                    if (v >= ANALYTICS_EXAMPLE.chartBars.length) {
                        clearInterval(interval);
                        return v;
                    }
                    return v + 1;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [visible]);

    return (
        <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden select-none">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                <div className="h-3 w-3 rounded-full bg-red-400"/>
                <div className="h-3 w-3 rounded-full bg-yellow-400"/>
                <div className="h-3 w-3 rounded-full bg-green-400"/>
                <span className="ml-3 text-xs text-muted-foreground font-mono">Analytics Dashboard</span>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                    <span className="text-[10px] text-muted-foreground">Live</span>
                </div>
            </div>
            <div className="p-4 space-y-3">
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-2">
                    {ANALYTICS_EXAMPLE.stats.slice(0, visible).map((s) => (
                        <div key={s.label} className="rounded-lg border bg-muted/20 p-2.5">
                            <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            <p className="text-[9px] text-emerald-600 mt-0.5">{s.change}</p>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                {barsVisible > 0 && (
                    <div className="rounded-xl border p-3">
                        <p className="text-[10px] font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <BarChart3 className="h-3 w-3"/> Views (Last 30 Days)
                        </p>
                        <div className="flex items-end gap-1 h-14">
                            {ANALYTICS_EXAMPLE.chartBars.slice(0, barsVisible).map((h, i) => (
                                <div key={i} className="flex-1 rounded-t transition-all duration-300"
                                     style={{
                                         height: `${h}%`,
                                         background: "linear-gradient(to top, #4F46E5, #0EA5E9)",
                                         opacity: 0.6 + (i / 20),
                                     }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Top posts */}
                {barsVisible >= ANALYTICS_EXAMPLE.chartBars.length && (
                    <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3"/> Top Posts
                        </p>
                        {ANALYTICS_EXAMPLE.topPosts.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 text-[10px]">
                                <span className="truncate flex-1 text-muted-foreground">{p.title}</span>
                                <span className="font-semibold shrink-0">{p.views}</span>
                                <span
                                    className={`shrink-0 font-bold ${p.score >= 90 ? "text-emerald-500" : p.score >= 75 ? "text-yellow-500" : "text-red-500"}`}>{p.score}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Rank Tracking Mockup ───────────────────────────────────────────────────────
export function RankTrackingMockup() {
    const keywords = [
        {kw: "seo platform", pos: 3, change: 2, vol: "2,400"},
        {kw: "ai blog generator", pos: 7, change: 5, vol: "1,900"},
        {kw: "keyword research tool", pos: 12, change: -1, vol: "8,100"},
        {kw: "content seo tool", pos: 4, change: 3, vol: "3,200"},
    ];
    const [visible, setVisible] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setVisible((v) => {
                if (v >= keywords.length) {
                    clearInterval(interval);
                    return v;
                }
                return v + 1;
            });
        }, 400);
        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden select-none">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                <div className="h-3 w-3 rounded-full bg-red-400"/>
                <div className="h-3 w-3 rounded-full bg-yellow-400"/>
                <div className="h-3 w-3 rounded-full bg-green-400"/>
                <span className="ml-3 text-xs text-muted-foreground font-mono">Rank Tracking</span>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Tracked Keywords</p>
                    <Badge variant="info" className="text-[10px]">4 / 25</Badge>
                </div>
                <div className="rounded-xl border overflow-hidden">
                    <div
                        className="grid grid-cols-4 bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground font-medium">
                        <span className="col-span-2">Keyword</span>
                        <span className="text-center">Position</span>
                        <span className="text-right">Change</span>
                    </div>
                    {keywords.slice(0, visible).map((k, i) => (
                        <div key={i}
                             className="grid grid-cols-4 px-3 py-2.5 border-t text-xs items-center hover:bg-muted/20 transition-colors">
                            <span className="col-span-2 font-medium truncate">{k.kw}</span>
                            <span className="text-center font-bold text-indigo-600">#{k.pos}</span>
                            <span
                                className={`text-right font-semibold flex items-center justify-end gap-0.5 ${k.change > 0 ? "text-emerald-500" : k.change < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                {k.change > 0 ? "↑" : k.change < 0 ? "↓" : "→"}{Math.abs(k.change)}
              </span>
                        </div>
                    ))}
                </div>
                {visible >= keywords.length && (
                    <div className="grid grid-cols-3 gap-2">
                        {[{label: "Top 3", value: "1", color: "text-emerald-600"}, {
                            label: "Top 10",
                            value: "2",
                            color: "text-sky-600"
                        }, {label: "Top 20", value: "1", color: "text-yellow-600"}].map((s) => (
                            <div key={s.label} className="rounded-lg border bg-muted/20 p-2 text-center">
                                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Bulk Generate Mockup ───────────────────────────────────────────────────────
export function BulkGenerateMockup() {
    const topics = [
        "10 SEO Mistakes to Avoid in 2025",
        "How to Write Meta Descriptions That Convert",
        "Complete Guide to Internal Linking Strategy",
        "What is E-E-A-T and Why It Matters",
    ];
    const [phase, setPhase] = useState<"idle" | "generating" | "done">("idle");
    const [completed, setCompleted] = useState(0);

    useEffect(() => {
        const start = setTimeout(() => setPhase("generating"), 1200);
        return () => clearTimeout(start);
    }, []);

    useEffect(() => {
        if (phase === "generating") {
            let c = 0;
            const interval = setInterval(() => {
                c++;
                setCompleted(c);
                if (c >= topics.length) {
                    clearInterval(interval);
                    setTimeout(() => setPhase("done"), 400);
                    setTimeout(() => {
                        setPhase("idle");
                        setCompleted(0);
                        setTimeout(() => setPhase("generating"), 800);
                    }, 5000);
                }
            }, 700);
            return () => clearInterval(interval);
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden select-none">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
                <div className="h-3 w-3 rounded-full bg-red-400"/>
                <div className="h-3 w-3 rounded-full bg-yellow-400"/>
                <div className="h-3 w-3 rounded-full bg-green-400"/>
                <span className="ml-3 text-xs text-muted-foreground font-mono">Bulk Generate</span>
                <Badge variant="warning" className="ml-auto text-[10px]">💎 Diamond</Badge>
            </div>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{topics.length} topics queued</p>
                    {phase === "generating" && (
                        <span
                            className="text-[10px] text-indigo-600 animate-pulse">Generating {completed}/{topics.length}...</span>
                    )}
                    {phase === "done" && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle
                            className="h-3 w-3"/> All done!</span>
                    )}
                </div>
                <div className="space-y-2">
                    {topics.map((topic, i) => (
                        <div key={i}
                             className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-all ${i < completed ? "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10" : i === completed && phase === "generating" ? "border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/10" : "border-border bg-muted/10 opacity-60"}`}>
                            {i < completed ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0"/>
                            ) : i === completed && phase === "generating" ? (
                                <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 animate-pulse"/>
                            ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0"/>
                            )}
                            <span
                                className={i < completed ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}>{topic}</span>
                            {i < completed &&
                                <Badge variant="success" className="ml-auto text-[9px]">Draft saved</Badge>}
                        </div>
                    ))}
                </div>
                {phase !== "idle" && (
                    <div className="rounded-lg bg-muted/30 border p-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{completed}/{topics.length} posts</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{width: `${(completed / topics.length) * 100}%`}}/>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}