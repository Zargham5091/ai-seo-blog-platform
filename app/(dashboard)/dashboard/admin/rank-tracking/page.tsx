"use client";
import {useEffect, useState} from "react";
import {Plus, Trash2, TrendingUp, TrendingDown, Minus, Target, RefreshCw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";

interface RankSnapshot {
    date: string;
    position: number | null;
}

interface TrackedKeyword {
    _id: string;
    keyword: string;
    targetUrl?: string;
    targetPosition?: number;
    currentPosition: number | null;
    previousPosition: number | null;
    bestPosition: number | null;
    searchVolume?: number;
    lastCheckedAt?: string;
    snapshots: RankSnapshot[];
}

const TOOLTIP_STYLE = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
};

function PositionBadge({current, previous}: { current: number | null; previous: number | null }) {
    if (current === null) return <Badge variant="secondary" className="text-xs">Not ranking</Badge>;

    const diff = previous !== null ? previous - current : 0;
    const color = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-muted-foreground";
    const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;

    return (
        <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">#{current}</span>
            {diff !== 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
          <Icon className="h-3.5 w-3.5"/>
                    {Math.abs(diff)}
        </span>
            )}
        </div>
    );
}

export default function RankTrackingPage() {
    const [keywords, setKeywords] = useState<TrackedKeyword[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newKeyword, setNewKeyword] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [newGoal, setNewGoal] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [selectedKeyword, setSelectedKeyword] = useState<TrackedKeyword | null>(null);
    const [error, setError] = useState("");

    const fetchKeywords = async () => {
        setIsLoading(true);
        const res = await fetch("/api/rank-tracking");
        const d = await res.json();
        if (d.success) setKeywords(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchKeywords();
    }, []);

    const handleAdd = async () => {
        if (!newKeyword.trim()) return;
        setIsAdding(true);
        setError("");
        const res = await fetch("/api/rank-tracking", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                keyword: newKeyword.trim(),
                targetUrl: newUrl || undefined,
                targetPosition: newGoal ? parseInt(newGoal) : undefined,
            }),
        });
        const d = await res.json();
        if (d.success) {
            setNewKeyword("");
            setNewUrl("");
            setNewGoal("");
            setShowAdd(false);
            fetchKeywords();
        } else {
            setError(d.error);
        }
        setIsAdding(false);
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/rank-tracking?id=${id}`, {method: "DELETE"});
        setKeywords((prev) => prev.filter((k) => k._id !== id));
        if (selectedKeyword?._id === id) setSelectedKeyword(null);
    };

    const chartData = selectedKeyword?.snapshots
        .slice(-14)
        .map((s) => ({
            date: new Date(s.date).toLocaleDateString("en-US", {month: "short", day: "numeric"}),
            position: s.position,
        })) ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Target className="h-6 w-6 text-indigo-500"/> Rank Tracking
                    </h1>
                    <p className="text-muted-foreground text-sm">Monitor your keyword positions over time</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchKeywords} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5"/> Refresh
                    </Button>
                    <Button variant="gradient" className="gap-2" onClick={() => setShowAdd(true)}>
                        <Plus className="h-4 w-4"/> Track Keyword
                    </Button>
                </div>
            </div>

            {showAdd && (
                <Card className="border-indigo-200 dark:border-indigo-800">
                    <CardContent className="p-4 space-y-3">
                        {error &&
                            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Keyword *</Label>
                                <Input
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    placeholder="e.g. best seo tools"
                                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Target URL (optional)</Label>
                                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                                       placeholder="https://..."/>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Goal Position (optional)</Label>
                                <Input type="number" min={1} max={100} value={newGoal}
                                       onChange={(e) => setNewGoal(e.target.value)} placeholder="e.g. 3"/>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="gradient" onClick={handleAdd} isLoading={isAdding} className="gap-2">
                                <Plus className="h-4 w-4"/> Add Keyword
                            </Button>
                            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Keywords list */}
                <div className="lg:col-span-1 space-y-2">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-xl"/>)
                    ) : keywords.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Target className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                                <p className="font-semibold text-sm">No keywords tracked</p>
                                <p className="text-xs text-muted-foreground mt-1">Add keywords to start monitoring
                                    rankings</p>
                            </CardContent>
                        </Card>
                    ) : (
                        keywords.map((kw) => (
                            <div
                                key={kw._id}
                                onClick={() => setSelectedKeyword(kw)}
                                className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm ${
                                    selectedKeyword?._id === kw._id
                                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
                                        : "border-border hover:border-indigo-200"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{kw.keyword}</p>
                                        {kw.targetPosition && (
                                            <p className="text-xs text-muted-foreground mt-0.5">Goal:
                                                Top {kw.targetPosition}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                            {kw.currentPosition !== null ? (
                                                <span className="text-lg font-bold">#{kw.currentPosition}</span>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">N/R</Badge>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(kw._id);
                                            }}
                                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                        >
                                            <Trash2 className="h-3.5 w-3.5"/>
                                        </button>
                                    </div>
                                </div>
                                {/* Mini progress bar if goal set */}
                                {kw.targetPosition && kw.currentPosition !== null && (
                                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                                            style={{width: `${Math.min(100, (kw.targetPosition / kw.currentPosition) * 100)}%`}}
                                        />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Detail chart */}
                <div className="lg:col-span-2">
                    {selectedKeyword ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{selectedKeyword.keyword}</CardTitle>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Current</p>
                                        <PositionBadge
                                            current={selectedKeyword.currentPosition}
                                            previous={selectedKeyword.previousPosition}
                                        />
                                    </div>
                                    {selectedKeyword.bestPosition !== null && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Best Ever</p>
                                            <p className="text-2xl font-bold text-emerald-600">#{selectedKeyword.bestPosition}</p>
                                        </div>
                                    )}
                                    {selectedKeyword.targetPosition && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Goal</p>
                                            <p className="text-2xl font-bold text-indigo-600">#{selectedKeyword.targetPosition}</p>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {chartData.length > 1 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-border"/>
                                            <XAxis dataKey="date" tick={{fontSize: 11}}/>
                                            <YAxis reversed tick={{fontSize: 11}} domain={["auto", "auto"]}/>
                                            <Tooltip
                                                contentStyle={TOOLTIP_STYLE}
                                                formatter={(v: number) => [`#${v}`, "Position"]}
                                            />
                                            <Line type="monotone" dataKey="position" stroke="#4F46E5" strokeWidth={2.5}
                                                  dot={{fill: "#4F46E5", r: 4}}/>
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div
                                        className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                                        Not enough data yet. Rankings are checked daily.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-2xl text-muted-foreground text-center p-8">
                            <TrendingUp className="h-12 w-12 mb-4 opacity-20"/>
                            <p className="font-medium">Select a keyword to see its rank history</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
