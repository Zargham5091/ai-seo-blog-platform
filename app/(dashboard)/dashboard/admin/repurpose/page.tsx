"use client";
import {useEffect, useState} from "react";
import {Sparkles, Copy, Check, Twitter, Linkedin, Instagram, Mail, Facebook, Video} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Blog {
    _id: string;
    title: string;
    content: string;
    status: string;
}

type RepurposeFormat =
    "twitter_thread"
    | "linkedin_post"
    | "instagram_caption"
    | "newsletter"
    | "facebook_post"
    | "tiktok_script";

interface RepurposedContent {
    twitter_thread?: string[];
    linkedin_post?: string;
    instagram_caption?: string;
    newsletter?: string;
    facebook_post?: string;
    tiktok_script?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FORMAT_CONFIG: { key: RepurposeFormat; label: string; icon: React.ElementType; color: string }[] = [
    {key: "twitter_thread", label: "Twitter/X Thread", icon: Twitter, color: "bg-sky-500"},
    {key: "linkedin_post", label: "LinkedIn Post", icon: Linkedin, color: "bg-blue-700"},
    {key: "instagram_caption", label: "Instagram", icon: Instagram, color: "bg-pink-500"},
    {key: "newsletter", label: "Newsletter", icon: Mail, color: "bg-indigo-500"},
    {key: "facebook_post", label: "Facebook", icon: Facebook, color: "bg-blue-600"},
    {key: "tiktok_script", label: "TikTok Script", icon: Video, color: "bg-black"},
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function RepurposePage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [selectedBlogId, setSelectedBlogId] = useState("");
    const [customContent, setCustomContent] = useState("");
    const [customTitle, setCustomTitle] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [selectedFormats, setSelectedFormats] = useState<RepurposeFormat[]>(["twitter_thread", "linkedin_post"]);
    const [tone, setTone] = useState<"professional" | "casual" | "educational" | "inspirational" | "humorous">("professional");
    const [brandName, setBrandName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<RepurposedContent | null>(null);
    const [error, setError] = useState("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/blog")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setBlogs(d.data.filter((b: Blog) => b.status === "published"));
            });
    }, []);

    const selectedBlog = blogs.find((b) => b._id === selectedBlogId);

    const toggleFormat = (format: RepurposeFormat) => {
        setSelectedFormats((prev) =>
            prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
        );
    };

    const handleGenerate = async () => {
        const content = useCustom ? customContent : (selectedBlog?.content.replace(/<[^>]*>/g, "") ?? "");
        const title = useCustom ? customTitle : (selectedBlog?.title ?? "");

        if (!content || !title) {
            setError("Please select a blog or enter content.");
            return;
        }
        if (selectedFormats.length === 0) {
            setError("Select at least one format.");
            return;
        }

        setIsGenerating(true);
        setError("");
        setResults(null);

        const res = await fetch("/api/repurpose", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({content, title, formats: selectedFormats, tone, brandName: brandName || undefined}),
        });
        const d = await res.json();
        if (d.success) setResults(d.data);
        else setError(d.error);
        setIsGenerating(false);
    };

    const copy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-indigo-500"/> Content Repurposing
                </h1>
                <p className="text-muted-foreground text-sm">
                    Turn one blog post into Twitter threads, LinkedIn posts, newsletters, TikTok scripts, and more
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Input */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Content
                            Source</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Button variant={!useCustom ? "default" : "outline"} size="sm"
                                        onClick={() => setUseCustom(false)}>
                                    From Blog
                                </Button>
                                <Button variant={useCustom ? "default" : "outline"} size="sm"
                                        onClick={() => setUseCustom(true)}>
                                    Custom Text
                                </Button>
                            </div>

                            {!useCustom ? (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Select Published Blog</Label>
                                    <select
                                        value={selectedBlogId}
                                        onChange={(e) => setSelectedBlogId(e.target.value)}
                                        className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                    >
                                        <option value="">Choose a blog post...</option>
                                        {blogs.map((b) => (
                                            <option key={b._id} value={b._id}>{b.title}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Title</Label>
                                        <Input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                                               placeholder="Content title..."/>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Content</Label>
                                        <textarea
                                            value={customContent}
                                            onChange={(e) => setCustomContent(e.target.value)}
                                            placeholder="Paste your content here..."
                                            rows={6}
                                            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Output
                            Formats</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2">
                                {FORMAT_CONFIG.map(({key, label, icon: Icon, color}) => (
                                    <button
                                        key={key}
                                        onClick={() => toggleFormat(key)}
                                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-sm transition-all ${
                                            selectedFormats.includes(key)
                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                                                : "border-border hover:border-indigo-200 hover:bg-muted/30"
                                        }`}
                                    >
                                        <div
                                            className={`flex h-7 w-7 items-center justify-center rounded-lg ${color} shrink-0`}>
                                            <Icon className="h-3.5 w-3.5 text-white"/>
                                        </div>
                                        <span className="font-medium text-xs">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Options</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Tone</Label>
                                <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}
                                        className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                    <option value="professional">Professional</option>
                                    <option value="casual">Casual</option>
                                    <option value="educational">Educational</option>
                                    <option value="inspirational">Inspirational</option>
                                    <option value="humorous">Humorous</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Brand Name (optional)</Label>
                                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)}
                                       placeholder="Your brand name..."/>
                            </div>
                        </CardContent>
                    </Card>

                    {error &&
                        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}

                    <Button variant="gradient" className="w-full gap-2 h-11" onClick={handleGenerate}
                            isLoading={isGenerating}>
                        <Sparkles className="h-4 w-4"/>
                        {isGenerating ? "Repurposing content..." : `Generate ${selectedFormats.length} Formats — 1 AI Credit`}
                    </Button>
                </div>

                {/* Results */}
                <div>
                    {results ? (
                        <Tabs defaultValue={selectedFormats[0]}>
                            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                                {selectedFormats.map((f) => {
                                    const config = FORMAT_CONFIG.find((c) => c.key === f);
                                    if (!config) return null;
                                    const Icon = config.icon;
                                    return (
                                        <TabsTrigger key={f} value={f} className="gap-1.5 text-xs">
                                            <Icon className="h-3.5 w-3.5"/> {config.label}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>

                            {FORMAT_CONFIG.map(({key, label, icon: Icon}) => {
                                const content = results[key];
                                if (!content) return null;

                                return (
                                    <TabsContent key={key} value={key}>
                                        <Card>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="text-sm flex items-center gap-2">
                                                        <Icon className="h-4 w-4"/> {label}
                                                    </CardTitle>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="gap-1.5 text-xs"
                                                        onClick={() => copy(
                                                            Array.isArray(content) ? content.join("\n\n") : content,
                                                            key
                                                        )}
                                                    >
                                                        {copiedKey === key
                                                            ? <><Check
                                                                className="h-3.5 w-3.5 text-emerald-500"/> Copied!</>
                                                            : <><Copy className="h-3.5 w-3.5"/> Copy All</>}
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                {Array.isArray(content) ? (
                                                    // Twitter thread
                                                    <div className="space-y-3">
                                                        {content.map((tweet, i) => (
                                                            <div key={i}
                                                                 className="group relative p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                                                                <p className="text-sm pr-8">{tweet}</p>
                                                                <div className="flex items-center justify-between mt-2">
                                  <span
                                      className={`text-xs ${tweet.length > 260 ? "text-red-500" : "text-muted-foreground"}`}>
                                    {tweet.length}/280
                                  </span>
                                                                    <button
                                                                        onClick={() => copy(tweet, `${key}-${i}`)}
                                                                        className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
                                                                    >
                                                                        {copiedKey === `${key}-${i}`
                                                                            ? <Check
                                                                                className="h-3.5 w-3.5 text-emerald-500"/>
                                                                            : <Copy className="h-3.5 w-3.5"/>}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                            <pre
                                className="whitespace-pre-wrap text-sm font-sans leading-relaxed bg-muted/20 rounded-xl p-4">
                              {content}
                            </pre>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    ) : (
                        <div
                            className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-2xl text-muted-foreground text-center p-8">
                            <Sparkles className="h-12 w-12 mb-4 opacity-20"/>
                            <p className="font-medium">Your repurposed content will appear here</p>
                            <p className="text-sm mt-1">Select formats and click Generate</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
