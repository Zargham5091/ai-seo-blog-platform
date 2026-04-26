"use client";
import {useEffect, useState, useCallback, useRef} from "react";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {
    Save, Eye, EyeOff, Sparkles, X, ChevronDown,
    Settings2, ArrowLeft, BarChart3, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {useBlogEditorStore} from "@/store/blog-editor";
import {useAutoSave} from "@/hooks/useAutoSave";
import {slugify} from "@/lib/utils";
import {TiptapEditor} from "@/components/blog/TiptapEditor";
import {BlogBlockBuilder} from "@/components/blog/BlogBlockBuilder";
import {SEOScoreCircle} from "@/components/seo/SEOScoreCircle";
import {Button} from "@/components/ui/button";
import {Input, Label, Textarea, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {Progress} from "@/components/ui/misc";

interface Category {
    _id: string;
    name: string;
    slug: string
}

export default function BlogEditorPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    // "new" route and [id] route both use this component
    const routeId = params.id as string | undefined;
    const isNewRoute = !routeId || routeId === "new";
    const isAIMode = searchParams.get("ai") === "true";

    const store = useBlogEditorStore();

    // Pass null for new posts — useAutoSave manages the ID after first save
    const {save, blogId, setBlogId, isSaving, lastSaved} = useAutoSave(
        isNewRoute ? null : (routeId ?? null)
    );

    const [categories, setCategories] = useState<Category[]>([]);
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiKeywords, setAiKeywords] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [editorMode, setEditorMode] = useState<"blocks" | "rich">("rich");
    const [isSEOOpen, setIsSEOOpen] = useState(false);
    const [publishLoading, setPublishLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const analyzeTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [suggestedImages, setSuggestedImages] = useState<string[]>([]);
    const [isFetchingImages, setIsFetchingImages] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const imageFetchTimer = useRef<NodeJS.Timeout | null>(null);


    // Load existing blog if editing
    useEffect(() => {
        if (isNewRoute) {
            store.reset();
            return;
        }
        fetch(`/api/blog/${routeId}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) store.hydrate(d.data);
                setTimeout(() => {
                    if (d.data?.content?.length > 100) {
                        analyzeContent();
                    }
                }, 500);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeId]);

    // Load categories from DB
    useEffect(() => {
        fetch("/api/categories")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setCategories(d.data);
            });
    }, []);

    // Auto-analyze SEO when content changes (debounced 5s to avoid too many API calls)
    const analyzeContent = useCallback(async () => {
        if (!store.content || store.content.length < 100) return;
        const primaryKw = store.seo.keywords[0] || store.title;
        if (!primaryKw) return;

        setIsAnalyzing(true);
        try {
            const res = await fetch("/api/ai/analyze", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    content: store.content.replace(/<[^>]*>/g, ""), // strip HTML for analysis
                    targetKeyword: primaryKw,
                }),
            });
            const data = await res.json();
            if (data.success && data.data?.analysis) {
                store.setSEO({
                    seoScore: data.data.analysis.score,
                    readabilityScore: data.data.analysis.readabilityScore,
                });
            }
        } catch { /* silent */
        } finally {
            setIsAnalyzing(false);
        }
    }, [store.content, store.title, store.seo.keywords]);

    // useEffect for fetch unsplah images
    useEffect(() => {
        if (!store.title || store.title.length < 5) return;
        if (imageFetchTimer.current) clearTimeout(imageFetchTimer.current);
        imageFetchTimer.current = setTimeout(() => {
            // Only fetch if no cover image already set
            if (!store.coverImage) {
                fetchSuggestedImages(store.title);
            }
        }, 1500); // 1.5s debounce after user stops typing
        return () => {
            if (imageFetchTimer.current) clearTimeout(imageFetchTimer.current);
        };
    }, [store.title, store.coverImage]);

    // Unsplash image get
    const fetchSuggestedImages = useCallback(async (topic: string) => {
        if (!topic || topic.length < 5) return;
        setIsFetchingImages(true);
        setShowImagePicker(false);
        try {
// Strip common words, keep only meaningful keywords
            const stopWords = ["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall", "can", "need", "dare", "ought", "used", "best", "top", "most", "new", "latest", "right", "now", "taking", "over", "world"];

            const meaningful = topic
                .toLowerCase()
                .split(" ")
                .filter(word => !stopWords.includes(word) && word.length > 2)
                .slice(0, 3)
                .join(" ");

            const query = encodeURIComponent(meaningful || topic.split(" ").slice(0, 3).join(" "));
            const res = await fetch(
                `https://api.unsplash.com/photos/random?query=${query}&count=6&orientation=landscape`,
                {
                    headers: {
                        Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
                    },
                }
            );
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setSuggestedImages(
                    data.map((img: any) => `${img.urls.raw}&w=1200&h=630&fit=crop&auto=format`)
                );
                setShowImagePicker(true);
            }
        } catch { /* silent */
        } finally {
            setIsFetchingImages(false);
        }
    }, []);

    useEffect(() => {
        if (!store.content || store.content.length < 100) return;
        if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = setTimeout(analyzeContent, 5000);
        return () => {
            if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store.content]);

    // Generate with AI
    const handleGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        setAiError("");
        try {
            const res = await fetch("/api/ai/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    topic: aiPrompt,
                    keywords: aiKeywords.split(",").map((k) => k.trim()).filter(Boolean),
                    tone: "professional",
                    wordCount: 1200,
                }),
            });
            const data = await res.json();
            if (!data.success) {
                setAiError(data.error);
                return;
            }
            const r = data.data;
            store.setTitle(r.title);
            store.setSlug(slugify(r.title));
            store.setContent(r.content);
            store.setExcerpt(r.excerpt);
            store.setTags(r.tags ?? []);
            store.setSEO({
                metaTitle: r.metaTitle,
                metaDescription: r.metaDescription,
                keywords: aiKeywords.split(",").map((k) => k.trim()).filter(Boolean),
            });
        } catch {
            setAiError("Generation failed. Check your AI credits.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Publish — uses blogId from useAutoSave (never creates a duplicate)
    const handlePublish = async () => {
        setPublishLoading(true);
        const payload = {
            title: store.title,
            slug: store.slug,
            excerpt: store.excerpt,
            content: store.content,
            blocks: store.blocks,
            coverImage: store.coverImage,
            tags: store.tags,
            categories: store.categories,
            seo: store.seo,
            status: "published",
        };

        try {
            let url: string;
            let method: string;

            if (blogId) {
                // Already saved at least once — just update
                url = `/api/blog/${blogId}`;
                method = "PUT";
            } else {
                // Never saved — create for the first time
                url = "/api/blog";
                method = "POST";
            }

            const res = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
            const d = await res.json();
            if (d.success) {
                router.push("/dashboard/admin/blogs");
            }
        } finally {
            setPublishLoading(false);
        }
    };

    // Manual save draft
    const handleSaveDraft = async () => {
        store.setStatus("draft");
        await save();
    };

    const addTag = () => {
        if (tagInput.trim() && !store.tags.includes(tagInput.trim())) {
            store.setTags([...store.tags, tagInput.trim()]);
            setTagInput("");
        }
    };

    const toggleCategory = (name: string) => {
        const current = store.categories;
        if (current.includes(name)) {
            store.setCategories(current.filter((c) => c !== name));
        } else {
            store.setCategories([...current, name]);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/dashboard/admin/blogs"><ArrowLeft className="h-4 w-4"/></Link>
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold">{isNewRoute && !blogId ? "New Post" : "Edit Post"}</h1>
                        <p className="text-xs text-muted-foreground">
                            {isSaving
                                ? "Saving..."
                                : lastSaved
                                    ? `Saved ${lastSaved.toLocaleTimeString()}`
                                    : "Not saved yet"}
                            {blogId && <span className="ml-2 text-muted-foreground/60">ID: {blogId.slice(-6)}</span>}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => store.togglePreviewMode()}>
                        {store.previewMode ? <EyeOff className="h-4 w-4 mr-1.5"/> : <Eye className="h-4 w-4 mr-1.5"/>}
                        {store.previewMode ? "Edit" : "Preview"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSaveDraft} isLoading={isSaving}>
                        <Save className="h-4 w-4 mr-1.5"/> Save Draft
                    </Button>
                    <Button variant="gradient" size="sm" onClick={handlePublish} isLoading={publishLoading}>
                        Publish
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 flex-1">
                {/* Main editor */}
                <div className="lg:col-span-2 space-y-4">
                    {/* AI Generator panel */}
                    {isAIMode && (
                        <Card
                            className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-sky-50/50 dark:from-indigo-950/20 dark:to-sky-950/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-indigo-500"/> AI Blog Generator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {aiError && <div
                                    className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{aiError}</div>}
                                <Input placeholder="Blog topic or title..." value={aiPrompt}
                                       onChange={(e) => setAiPrompt(e.target.value)}/>
                                <Input placeholder="Target keywords (comma separated)..." value={aiKeywords}
                                       onChange={(e) => setAiKeywords(e.target.value)}/>
                                <Button onClick={handleGenerate} isLoading={isGenerating} variant="gradient" size="sm"
                                        className="gap-2">
                                    <Sparkles
                                        className="h-3.5 w-3.5"/> {isGenerating ? "Generating..." : "Generate Blog Post"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Title */}
                    <Input
                        value={store.title}
                        onChange={(e) => {
                            store.setTitle(e.target.value);
                            if (!blogId) store.setSlug(slugify(e.target.value));
                        }}
                        placeholder="Post title..."
                        className="text-2xl font-bold h-auto py-3 border-0 border-b rounded-none focus-visible:ring-0 px-0"
                    />

                    {/* Slug */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="shrink-0">slug:</span>
                        <Input
                            value={store.slug}
                            onChange={(e) => store.setSlug(slugify(e.target.value))}
                            placeholder="url-friendly-slug"
                            className="h-7 text-xs font-mono"
                        />
                    </div>

                    {/* Editor mode tabs */}
                    <div className="flex items-center gap-4 border-b pb-2">
                        <button
                            onClick={() => setEditorMode("rich")}
                            className={`text-sm pb-2 border-b-2 transition-colors ${editorMode === "rich" ? "border-indigo-500 text-indigo-600 font-medium" : "border-transparent text-muted-foreground"}`}
                        >
                            Rich Text
                        </button>
                        <button
                            onClick={() => setEditorMode("blocks")}
                            className={`text-sm pb-2 border-b-2 transition-colors ${editorMode === "blocks" ? "border-indigo-500 text-indigo-600 font-medium" : "border-transparent text-muted-foreground"}`}
                        >
                            Block Builder
                        </button>
                    </div>

                    {editorMode === "rich" ? (
                        <TiptapEditor
                            key={routeId ?? "new"}
                            content={store.content}
                            onChange={store.setContent}
                            editable={!store.previewMode}
                        />
                    ) : (
                        <BlogBlockBuilder/>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {/* SEO Score — auto-updates when content changes */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-medium">SEO Score</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isAnalyzing
                                            ? "Analyzing content..."
                                            : store.seo.seoScore > 0
                                                ? "Auto-updated as you write"
                                                : "Write 100+ chars to trigger analysis"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isAnalyzing &&
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground"/>}
                                    <SEOScoreCircle score={store.seo.seoScore} size="md"/>
                                </div>
                            </div>
                            {store.seo.readabilityScore > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Readability</span>
                                        <span>{store.seo.readabilityScore}/100</span>
                                    </div>
                                    <Progress value={store.seo.readabilityScore} className="h-1.5"/>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-3 gap-2"
                                onClick={analyzeContent}
                                isLoading={isAnalyzing}
                            >
                                <BarChart3 className="h-3.5 w-3.5"/> Analyze Now
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Publish settings */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Publish
                            Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Status</Label>
                                <select
                                    value={store.status}
                                    onChange={(e) => store.setStatus(e.target.value as "draft" | "published" | "scheduled" | "archived")}
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                            {store.status === "scheduled" && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Schedule Date</Label>
                                    <Input type="datetime-local" value={store.scheduledAt}
                                           onChange={(e) => store.setScheduledAt(e.target.value)}/>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label className="text-xs">Excerpt</Label>
                                <Textarea value={store.excerpt} onChange={(e) => store.setExcerpt(e.target.value)}
                                          placeholder="Brief summary..." rows={3} className="text-sm"/>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Cover Image</Label>
                                    {store.title?.length >= 5 && (
                                        <button
                                            type="button"
                                            onClick={() => fetchSuggestedImages(store.title)}
                                            disabled={isFetchingImages}
                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isFetchingImages ? (
                                                <><RefreshCw className="h-3 w-3 animate-spin"/> Fetching...</>
                                            ) : (
                                                <><Sparkles className="h-3 w-3"/> Suggest Images</>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Manual URL Input */}
                                <Input
                                    value={store.coverImage}
                                    onChange={(e) => {
                                        store.setCoverImage(e.target.value);
                                        setShowImagePicker(false);
                                    }}
                                    placeholder="Paste URL or use suggestions below..."
                                    className="text-xs"
                                />

                                {/* Current Image Preview */}
                                {store.coverImage && (
                                    <div className="relative group rounded-md overflow-hidden border border-border">
                                        <img
                                            src={store.coverImage}
                                            alt="Cover preview"
                                            className="w-full h-32 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = "none";
                                            }}
                                        />
                                        <div
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    store.setCoverImage("");
                                                    setShowImagePicker(true);
                                                }}
                                                className="text-white text-xs bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                                            >
                                                Remove
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fetchSuggestedImages(store.title)}
                                                className="text-white text-xs bg-indigo-500 hover:bg-indigo-600 px-2 py-1 rounded"
                                            >
                                                Change
                                            </button>
                                        </div>
                                        <div
                                            className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                            Cover ✓
                                        </div>
                                    </div>
                                )}

                                {/* Dynamic Image Picker Grid */}
                                {showImagePicker && !store.coverImage && suggestedImages.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-indigo-500"/>
                                            Click to select a cover image
                                        </p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {suggestedImages.map((url, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => {
                                                        store.setCoverImage(url);
                                                        setShowImagePicker(false);
                                                    }}
                                                    className="relative group rounded overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all"
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Suggestion ${i + 1}`}
                                                        className="w-full h-16 object-cover"
                                                        loading="lazy"
                                                    />
                                                    <div
                                                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <span className="text-white text-xs font-medium">Select</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fetchSuggestedImages(store.title)}
                                            className="text-xs text-indigo-600 hover:underline w-full text-center mt-1"
                                        >
                                            ↻ Load different images
                                        </button>
                                    </div>
                                )}

                                {/* Loading skeleton */}
                                {isFetchingImages && (
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="h-16 rounded bg-muted animate-pulse"/>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/*<div className="space-y-1.5">*/}
                            {/*  <Label className="text-xs">Cover Image URL</Label>*/}
                            {/*  <Input value={store.coverImage} onChange={(e) => store.setCoverImage(e.target.value)} placeholder="https://..." />*/}
                            {/*</div>*/}
                        </CardContent>
                    </Card>

                    {/* Tags */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    placeholder="Add tag..."
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    className="text-sm"
                                />
                                <Button size="sm" variant="outline" onClick={addTag}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {store.tags.map((tag) => (
                                    <span key={tag}
                                          className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-2.5 py-1">
                    {tag}
                                        <button onClick={() => store.setTags(store.tags.filter((t) => t !== tag))}>
                      <X className="h-3 w-3"/>
                    </button>
                  </span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Categories — from DB */}
                    {categories.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3"><CardTitle
                                className="text-sm">Categories</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat._id}
                                            onClick={() => toggleCategory(cat.name)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                                store.categories.includes(cat.name)
                                                    ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-medium"
                                                    : "border-border hover:bg-muted/50 text-muted-foreground"
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    <Link href="/dashboard/admin/categories"
                                          className="text-indigo-600 hover:underline">
                                        Manage categories →
                                    </Link>
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* SEO Settings panel */}
                    <Card>
                        <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsSEOOpen((v) => !v)}>
                            <CardTitle className="text-sm flex items-center justify-between">
                                <span className="flex items-center gap-2"><Settings2 className="h-3.5 w-3.5"/>SEO Settings</span>
                                <ChevronDown
                                    className={`h-4 w-4 transition-transform ${isSEOOpen ? "rotate-180" : ""}`}/>
                            </CardTitle>
                        </CardHeader>
                        {isSEOOpen && (
                            <CardContent className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Meta Title{" "}
                                        <span
                                            className={`${store.seo.metaTitle.length > 55 ? "text-amber-500" : "text-muted-foreground"}`}>
                      ({store.seo.metaTitle.length}/60)
                    </span>
                                    </Label>
                                    <Input
                                        value={store.seo.metaTitle}
                                        onChange={(e) => store.setSEO({metaTitle: e.target.value})}
                                        placeholder="SEO title..."
                                        maxLength={60}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">
                                        Meta Description{" "}
                                        <span
                                            className={`${store.seo.metaDescription.length > 150 ? "text-amber-500" : "text-muted-foreground"}`}>
                      ({store.seo.metaDescription.length}/160)
                    </span>
                                    </Label>
                                    <Textarea
                                        value={store.seo.metaDescription}
                                        onChange={(e) => store.setSEO({metaDescription: e.target.value})}
                                        placeholder="Meta description..."
                                        rows={3}
                                        maxLength={160}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Focus Keywords</Label>
                                    <Input
                                        value={store.seo.keywords.join(", ")}
                                        onChange={(e) => store.setSEO({keywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean)})}
                                        placeholder="keyword1, keyword2..."
                                    />
                                    <p className="text-xs text-muted-foreground">First keyword is used for SEO
                                        analysis</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">OG Image URL</Label>
                                    <Input
                                        value={store.seo.ogImage ?? ""}
                                        onChange={(e) => store.setSEO({ogImage: e.target.value})}
                                        placeholder="https://..."
                                    />
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

// "use client";
// import { useEffect, useState } from "react";
// import { useParams, useRouter, useSearchParams } from "next/navigation";
// import { Save, Eye, EyeOff, Sparkles, X, ChevronDown, Settings2, ArrowLeft } from "lucide-react";
// import Link from "next/link";
// import { useBlogEditorStore } from "@/store/blog-editor";
// import { useAutoSave } from "@/hooks/useAutoSave";
// import { slugify } from "@/lib/utils";
// import { TiptapEditor } from "@/components/blog/TiptapEditor";
// import { BlogBlockBuilder } from "@/components/blog/BlogBlockBuilder";
// import { SEOScoreCircle } from "@/components/seo/SEOScoreCircle";
// import { Button } from "@/components/ui/button";
// import { Input, Label, Textarea, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
//
// export default function BlogEditorPage() {
//   const params = useParams();
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const isNew = !params.id || params.id === "new";
//   const isAIMode = searchParams.get("ai") === "true";
//
//   const store = useBlogEditorStore();
//   const { save, isSaving, lastSaved } = useAutoSave(isNew ? null : params.id as string);
//
//   const [aiPrompt, setAiPrompt] = useState("");
//   const [aiKeywords, setAiKeywords] = useState("");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [aiError, setAiError] = useState("");
//   const [tagInput, setTagInput] = useState("");
//   const [editorMode, setEditorMode] = useState<"blocks" | "rich">("rich");
//   const [isSEOOpen, setIsSEOOpen] = useState(false);
//   const [publishLoading, setPublishLoading] = useState(false);
//
//   useEffect(() => {
//     if (isNew) { store.reset(); return; }
//     fetch(`/api/blog/${params.id}`)
//       .then((r) => r.json())
//       .then((d) => { if (d.success) store.hydrate(d.data); });
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [params.id]);
//
//   const handleGenerate = async () => {
//     if (!aiPrompt) return;
//     setIsGenerating(true);
//     setAiError("");
//     try {
//       const res = await fetch("/api/ai/generate", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           topic: aiPrompt,
//           keywords: aiKeywords.split(",").map((k) => k.trim()).filter(Boolean),
//           tone: "professional",
//           wordCount: 1200,
//         }),
//       });
//       const data = await res.json();
//       if (!data.success) { setAiError(data.error); return; }
//       const r = data.data;
//       store.setTitle(r.title);
//       store.setSlug(slugify(r.title));
//       store.setContent(r.content);
//       store.setExcerpt(r.excerpt);
//       store.setTags(r.tags ?? []);
//       store.setSEO({ metaTitle: r.metaTitle, metaDescription: r.metaDescription, keywords: aiKeywords.split(",").map((k) => k.trim()).filter(Boolean) });
//     } catch {
//       setAiError("Generation failed. Check your AI credits.");
//     } finally {
//       setIsGenerating(false);
//     }
//   };
//
//   const handlePublish = async () => {
//     setPublishLoading(true);
//     store.setStatus("published");
//     const payload = {
//       title: store.title, slug: store.slug, excerpt: store.excerpt,
//       content: store.content, blocks: store.blocks, coverImage: store.coverImage,
//       tags: store.tags, categories: store.categories, seo: store.seo,
//       status: "published",
//     };
//     try {
//       const url = isNew ? "/api/blog" : `/api/blog/${params.id}`;
//       const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
//       const d = await res.json();
//       if (d.success) router.push("/dashboard/admin/blogs");
//     } finally {
//       setPublishLoading(false);
//     }
//   };
//
//   const addTag = () => {
//     if (tagInput.trim() && !store.tags.includes(tagInput.trim())) {
//       store.setTags([...store.tags, tagInput.trim()]);
//       setTagInput("");
//     }
//   };
//
//   return (
//     <div className="flex flex-col h-full">
//       {/* Top bar */}
//       <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
//         <div className="flex items-center gap-3">
//           <Button asChild variant="ghost" size="icon"><Link href="/dashboard/admin/blogs"><ArrowLeft className="h-4 w-4" /></Link></Button>
//           <div>
//             <h1 className="text-lg font-bold">{isNew ? "New Post" : "Edit Post"}</h1>
//             {lastSaved && <p className="text-xs text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</p>}
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button variant="outline" size="sm" onClick={() => store.togglePreviewMode()}>
//             {store.previewMode ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
//             {store.previewMode ? "Edit" : "Preview"}
//           </Button>
//           <Button variant="outline" size="sm" onClick={save} isLoading={isSaving}>
//             <Save className="h-4 w-4 mr-1.5" /> Save Draft
//           </Button>
//           <Button variant="gradient" size="sm" onClick={handlePublish} isLoading={publishLoading}>
//             Publish
//           </Button>
//         </div>
//       </div>
//
//       <div className="grid lg:grid-cols-3 gap-6 flex-1">
//         {/* Main editor */}
//         <div className="lg:col-span-2 space-y-4">
//           {/* AI Generator panel */}
//           {isAIMode && (
//             <Card className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-sky-50/50 dark:from-indigo-950/20 dark:to-sky-950/20">
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm flex items-center gap-2">
//                   <Sparkles className="h-4 w-4 text-indigo-500" /> AI Blog Generator
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 {aiError && <div className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{aiError}</div>}
//                 <div className="flex gap-2">
//                   <Input placeholder="Blog topic or title..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="flex-1" />
//                 </div>
//                 <Input placeholder="Target keywords (comma separated)..." value={aiKeywords} onChange={(e) => setAiKeywords(e.target.value)} />
//                 <Button onClick={handleGenerate} isLoading={isGenerating} variant="gradient" size="sm" className="gap-2">
//                   <Sparkles className="h-3.5 w-3.5" /> {isGenerating ? "Generating..." : "Generate Blog Post"}
//                 </Button>
//               </CardContent>
//             </Card>
//           )}
//
//           {/* Title */}
//           <div>
//             <Input
//               value={store.title}
//               onChange={(e) => { store.setTitle(e.target.value); if (!store.slug) store.setSlug(slugify(e.target.value)); }}
//               placeholder="Post title..."
//               className="text-2xl font-bold h-auto py-3 border-0 border-b rounded-none focus-visible:ring-0 px-0 text-3xl"
//             />
//           </div>
//
//           {/* Slug */}
//           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//             <span className="shrink-0">slug:</span>
//             <Input
//               value={store.slug}
//               onChange={(e) => store.setSlug(slugify(e.target.value))}
//               placeholder="url-friendly-slug"
//               className="h-7 text-xs font-mono"
//             />
//           </div>
//
//           {/* Editor mode tabs */}
//           <div className="flex items-center gap-2 border-b pb-2">
//             <button onClick={() => setEditorMode("rich")} className={`text-sm pb-2 border-b-2 transition-colors ${editorMode === "rich" ? "border-indigo-500 text-indigo-600 font-medium" : "border-transparent text-muted-foreground"}`}>Rich Text</button>
//             <button onClick={() => setEditorMode("blocks")} className={`text-sm pb-2 border-b-2 transition-colors ${editorMode === "blocks" ? "border-indigo-500 text-indigo-600 font-medium" : "border-transparent text-muted-foreground"}`}>Block Builder</button>
//           </div>
//
//           {editorMode === "rich" ? (
//             <TiptapEditor content={store.content} onChange={store.setContent} editable={!store.previewMode} />
//           ) : (
//             <BlogBlockBuilder />
//           )}
//         </div>
//
//         {/* Right sidebar */}
//         <div className="space-y-4">
//           {/* SEO Score */}
//           <Card>
//             <CardContent className="p-4 flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium">SEO Score</p>
//                 <p className="text-xs text-muted-foreground">Based on content analysis</p>
//               </div>
//               <SEOScoreCircle score={store.seo.seoScore} size="md" />
//             </CardContent>
//           </Card>
//
//           {/* Publish settings */}
//           <Card>
//             <CardHeader className="pb-3"><CardTitle className="text-sm">Publish Settings</CardTitle></CardHeader>
//             <CardContent className="space-y-3">
//               <div className="space-y-1.5">
//                 <Label className="text-xs">Status</Label>
//                 <select
//                   value={store.status}
//                   onChange={(e) => store.setStatus(e.target.value as "draft" | "published" | "scheduled" | "archived")}
//                   className="w-full h-9 rounded-md border bg-background px-3 text-sm"
//                 >
//                   <option value="draft">Draft</option>
//                   <option value="published">Published</option>
//                   <option value="scheduled">Scheduled</option>
//                   <option value="archived">Archived</option>
//                 </select>
//               </div>
//               {store.status === "scheduled" && (
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Schedule Date</Label>
//                   <Input type="datetime-local" value={store.scheduledAt} onChange={(e) => store.setScheduledAt(e.target.value)} />
//                 </div>
//               )}
//               <div className="space-y-1.5">
//                 <Label className="text-xs">Excerpt</Label>
//                 <Textarea value={store.excerpt} onChange={(e) => store.setExcerpt(e.target.value)} placeholder="Brief summary..." rows={3} className="text-sm" />
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-xs">Cover Image URL</Label>
//                 <Input value={store.coverImage} onChange={(e) => store.setCoverImage(e.target.value)} placeholder="https://..." />
//               </div>
//             </CardContent>
//           </Card>
//
//           {/* Tags */}
//           <Card>
//             <CardHeader className="pb-3"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
//             <CardContent className="space-y-2">
//               <div className="flex gap-2">
//                 <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={(e) => e.key === "Enter" && addTag()} className="text-sm" />
//                 <Button size="sm" variant="outline" onClick={addTag}>Add</Button>
//               </div>
//               <div className="flex flex-wrap gap-1.5">
//                 {store.tags.map((tag) => (
//                   <span key={tag} className="inline-flex items-center gap-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full px-2.5 py-1">
//                     {tag}
//                     <button onClick={() => store.setTags(store.tags.filter((t) => t !== tag))}><X className="h-3 w-3" /></button>
//                   </span>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//
//           {/* SEO Panel */}
//           <Card>
//             <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsSEOOpen((v) => !v)}>
//               <CardTitle className="text-sm flex items-center justify-between">
//                 <span className="flex items-center gap-2"><Settings2 className="h-3.5 w-3.5" />SEO Settings</span>
//                 <ChevronDown className={`h-4 w-4 transition-transform ${isSEOOpen ? "rotate-180" : ""}`} />
//               </CardTitle>
//             </CardHeader>
//             {isSEOOpen && (
//               <CardContent className="space-y-3">
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Meta Title <span className="text-muted-foreground">({store.seo.metaTitle.length}/60)</span></Label>
//                   <Input value={store.seo.metaTitle} onChange={(e) => store.setSEO({ metaTitle: e.target.value })} placeholder="SEO title..." maxLength={60} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Meta Description <span className="text-muted-foreground">({store.seo.metaDescription.length}/160)</span></Label>
//                   <Textarea value={store.seo.metaDescription} onChange={(e) => store.setSEO({ metaDescription: e.target.value })} placeholder="Meta description..." rows={3} maxLength={160} className="text-sm" />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Keywords</Label>
//                   <Input value={store.seo.keywords.join(", ")} onChange={(e) => store.setSEO({ keywords: e.target.value.split(",").map((k) => k.trim()) })} placeholder="keyword1, keyword2..." />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">OG Image URL</Label>
//                   <Input value={store.seo.ogImage ?? ""} onChange={(e) => store.setSEO({ ogImage: e.target.value })} placeholder="https://..." />
//                 </div>
//               </CardContent>
//             )}
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
