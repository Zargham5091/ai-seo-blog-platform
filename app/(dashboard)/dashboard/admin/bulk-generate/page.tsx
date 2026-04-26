"use client";
import {useState} from "react";
import {useSession} from "next-auth/react";
import {Sparkles, Plus, X, CheckCircle, AlertCircle, Loader2, FileText} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

interface GenerateResult {
    topic: string;
    success: boolean;
    blogId?: string;
    error?: string;
}

export default function BulkGeneratePage() {
    const {data: session} = useSession();
    const [topics, setTopics] = useState<string[]>([""]);
    const [tone, setTone] = useState<"professional" | "casual" | "educational">("professional");
    const [wordCount, setWordCount] = useState(800);
    const [keywords, setKeywords] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<GenerateResult[]>([]);
    const [error, setError] = useState("");

    const isPremium = session?.user?.plan === "diamond";

    const addTopic = () => setTopics([...topics, ""]);
    const removeTopic = (i: number) => setTopics(topics.filter((_, idx) => idx !== i));
    const updateTopic = (i: number, val: string) => {
        const t = [...topics];
        t[i] = val;
        setTopics(t);
    };

    const handleGenerate = async () => {
        const validTopics = topics.filter((t) => t.trim().length > 2);
        if (validTopics.length === 0) return;
        setIsGenerating(true);
        setError("");
        setResults([]);

        const res = await fetch("/api/ai/bulk-generate", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                topics: validTopics,
                tone,
                wordCount,
                targetKeywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
                saveAsDraft: true,
            }),
        });
        const d = await res.json();
        if (d.success) setResults(d.data);
        else setError(d.error);
        setIsGenerating(false);
    };

    if (!isPremium) {
        return (
            <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
                <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mx-auto">
                    <Sparkles className="h-8 w-8 text-white"/>
                </div>
                <h1 className="text-2xl font-bold">Bulk Content Generation</h1>
                <p className="text-muted-foreground">
                    Generate up to 10 SEO-optimized blog posts at once with one click. Available on the Diamond plan.
                </p>
                <Button asChild variant="gradient" className="gap-2">
                    <Link href="/dashboard/admin/settings?tab=billing">
                        <Sparkles className="h-4 w-4"/> Upgrade to Diamond
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-indigo-500"/> Bulk Content Generation
                </h1>
                <p className="text-muted-foreground text-sm">
                    Generate up to 10 blog posts at once. Each post uses 1 AI credit.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Blog Topics</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {topics.map((t, i) => (
                        <div key={i} className="flex gap-2">
                            <span
                                className="flex h-9 w-7 items-center justify-center text-xs text-muted-foreground shrink-0 font-mono">{i + 1}.</span>
                            <Input
                                value={t}
                                onChange={(e) => updateTopic(i, e.target.value)}
                                placeholder={`Topic ${i + 1} e.g. "Best SEO tools for beginners"`}
                                className="flex-1"
                            />
                            {topics.length > 1 && (
                                <button onClick={() => removeTopic(i)}
                                        className="text-muted-foreground hover:text-destructive transition-colors">
                                    <X className="h-4 w-4"/>
                                </button>
                            )}
                        </div>
                    ))}
                    {topics.length < 10 && (
                        <Button variant="outline" size="sm" onClick={addTopic} className="gap-1.5">
                            <Plus className="h-3.5 w-3.5"/> Add Topic
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm">Generation Settings</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Tone</Label>
                            <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="professional">Professional</option>
                                <option value="casual">Casual</option>
                                <option value="educational">Educational</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Word Count</Label>
                            <select value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))}
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                <option value={400}>~400 words</option>
                                <option value={800}>~800 words</option>
                                <option value={1200}>~1200 words</option>
                                <option value={2000}>~2000 words</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Target Keywords</Label>
                            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)}
                                   placeholder="kw1, kw2..."/>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                        <div>
                            <p className="text-sm font-medium">Credits required</p>
                            <p className="text-xs text-muted-foreground">{topics.filter((t) => t.trim().length > 2).length} posts
                                × 1 credit each</p>
                        </div>
                        <Badge variant="info" className="text-sm font-bold">
                            {topics.filter((t) => t.trim().length > 2).length} credits
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3">{error}</div>}

            <Button
                variant="gradient"
                className="w-full h-11 gap-2 text-base"
                onClick={handleGenerate}
                isLoading={isGenerating}
                disabled={topics.filter((t) => t.trim().length > 2).length === 0}
            >
                {isGenerating
                    ? <><Loader2
                        className="h-4 w-4 animate-spin"/> Generating {topics.filter((t) => t.trim()).length} posts...</>
                    : <><Sparkles className="h-4 w-4"/> Generate {topics.filter((t) => t.trim().length > 2).length} Blog
                        Posts</>}
            </Button>

            {results.length > 0 && (
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Generation
                        Results</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border">
                                {r.success
                                    ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0"/>
                                    : <AlertCircle className="h-4 w-4 text-destructive shrink-0"/>}
                                <span className="text-sm flex-1 truncate">{r.topic}</span>
                                {r.success && r.blogId ? (
                                    <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs shrink-0">
                                        <Link href={`/dashboard/admin/blogs/${r.blogId}`}>
                                            <FileText className="h-3.5 w-3.5"/> Edit Post
                                        </Link>
                                    </Button>
                                ) : !r.success ? (
                                    <span className="text-xs text-destructive shrink-0">{r.error}</span>
                                ) : null}
                            </div>
                        ))}
                        <div className="pt-2 flex items-center justify-between text-sm">
                            <span
                                className="text-muted-foreground">{results.filter((r) => r.success).length}/{results.length} generated successfully</span>
                            <Button asChild variant="outline" size="sm">
                                <Link href="/dashboard/admin/blogs">View All Drafts</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
