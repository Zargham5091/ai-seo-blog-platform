"use client";
import {useState} from "react";
import {Link2, Search, TrendingUp, Shield, ExternalLink, AlertTriangle, CheckCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {BacklinkAnalysis, BacklinkResult} from "@/app/api/backlinks/route";
import CharacterLoader from "@/components/loader/CharacterLoader";

export default function BacklinksPage() {
    const [url, setUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<BacklinkAnalysis | null>(null);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const analyze = async () => {
        try {
            setIsLoading(true);

            if (!url.trim()) return;
            setIsAnalyzing(true);
            setError("");
            setResult(null);
            const res = await fetch("/api/backlinks", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({url}),
            });
            const d = await res.json();
            setIsLoading(false);

            if (d.success) setResult(d.data);
            else setError(d.error);
            setIsAnalyzing(false);
        } catch (error) {
           console.log(error);
        }finally {
            setIsLoading(false);
        }
    };

    const daColor = (da: number) =>
        da >= 70 ? "text-emerald-600" : da >= 40 ? "text-yellow-600" : "text-red-500";

    const spamColor = (score: number) =>
        score <= 2 ? "text-emerald-600" : score <= 5 ? "text-yellow-600" : "text-red-500";
    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <CharacterLoader/>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Link2 className="h-6 w-6 text-indigo-500"/> Backlink Monitor
                </h1>
                <p className="text-muted-foreground text-sm">Analyze backlink profiles and find outreach
                    opportunities</p>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://yourdomain.com or competitor URL"
                                onKeyDown={(e) => e.key === "Enter" && analyze()}
                            />
                        </div>
                        <Button variant="gradient" onClick={analyze} isLoading={isAnalyzing} className="gap-2 shrink-0">
                            <Search className="h-4 w-4"/> Analyze — 1 Credit
                        </Button>
                    </div>
                    {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-6">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Est. Backlinks",
                                value: result.totalEstimated.toLocaleString(),
                                icon: Link2,
                                color: "from-indigo-500 to-indigo-600"
                            },
                            {
                                label: "High Value",
                                value: result.highValueCount,
                                icon: TrendingUp,
                                color: "from-emerald-500 to-emerald-600"
                            },
                            {
                                label: "Avg Domain Auth",
                                value: result.averageDA,
                                icon: Shield,
                                color: "from-sky-500 to-sky-600"
                            },
                            {
                                label: "Outreach Targets",
                                value: result.outreachTargets.length,
                                icon: ExternalLink,
                                color: "from-purple-500 to-purple-600"
                            },
                        ].map((s) => (
                            <Card key={s.label}>
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div
                                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color}`}>
                                        <s.icon className="h-5 w-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{s.label}</p>
                                        <p className="text-xl font-bold">{s.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Backlinks table */}
                        <div className="lg:col-span-2 space-y-3">
                            <h2 className="font-semibold">Top Backlinks</h2>
                            {result.topBacklinks.map((bl: BacklinkResult, i) => (
                                <Card key={i}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <a href={bl.url} target="_blank" rel="noreferrer"
                                                   className="text-sm font-medium text-indigo-600 hover:underline truncate block">
                                                    {bl.url}
                                                </a>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Anchor: <em>&quot;{bl.anchorText}&quot;</em> · {bl.industry}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">DA</p>
                                                    <p className={`font-bold text-sm ${daColor(bl.domainAuthority)}`}>{bl.domainAuthority}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-muted-foreground">Spam</p>
                                                    <p className={`font-bold text-sm ${spamColor(bl.spamScore)}`}>{bl.spamScore}</p>
                                                </div>
                                                <Badge variant={bl.linkType === "dofollow" ? "success" : "secondary"}
                                                       className="text-xs">
                                                    {bl.linkType}
                                                </Badge>
                                                {bl.recommendation === "disavow"
                                                    ? <AlertTriangle className="h-4 w-4 text-red-500"/>
                                                    : <CheckCircle className="h-4 w-4 text-emerald-500"/>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-sm">Key
                                    Insights</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {result.insights.map((insight, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <span className="text-indigo-500 mt-0.5 shrink-0">→</span>
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-sm">Outreach
                                    Opportunities</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    {result.outreachTargets.map((target, i) => (
                                        <div key={i} className="rounded-lg border p-3 space-y-1">
                                            <p className="font-medium text-sm text-indigo-600">{target.domain}</p>
                                            <p className="text-xs text-muted-foreground">{target.reason}</p>
                                            <p className="text-xs text-muted-foreground italic">{target.contactHint}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
