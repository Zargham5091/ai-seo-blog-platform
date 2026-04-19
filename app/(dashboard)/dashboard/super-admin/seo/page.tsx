"use client";
import { useEffect, useState } from "react";
import {
    Globe, FileText, Search, CheckCircle, AlertTriangle,
    RefreshCw, Copy, Check, ExternalLink, BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Badge } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
import { Progress } from "@/components/ui/misc";

interface SitemapEntry {
    url: string;
    lastmod: string;
    title: string;
}

interface SEOStats {
    totalPages: number;
    publishedPages: number;
    avgSEOScore: number;
    indexedPercent: number;
}

interface MetaSettings {
    siteTitle: string;
    siteDescription: string;
    ogImage: string;
    twitterHandle: string;
    googleVerification: string;
    bingVerification: string;
    canonicalBase: string;
}

export default function SuperAdminSEOPage() {
    const [sitemapEntries, setSitemapEntries] = useState<SitemapEntry[]>([]);
    const [seoStats, setSeoStats] = useState<SEOStats | null>(null);
    const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [copied, setCopied] = useState(false);
    const [metaSaved, setMetaSaved] = useState(false);
    const [robotsSaved, setRobotsSaved] = useState(false);

    const [meta, setMeta] = useState<MetaSettings>({
        siteTitle: "SEO Platform — AI-Powered SEO & Blog Builder",
        siteDescription: "Enterprise-grade AI-powered SEO platform. Generate content, research keywords, and optimize rankings.",
        ogImage: "",
        twitterHandle: "@seoplatform",
        googleVerification: "",
        bingVerification: "",
        canonicalBase: process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com",
    });

    const [robotsTxt, setRobotsTxt] = useState(
        `User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /api/\nDisallow: /login\nDisallow: /register\n\nSitemap: ${process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/sitemap.xml`
    );

    useEffect(() => {
        fetch("/api/seo?type=stats")
            .then((r) => r.json())
            .then((d) => { if (d.success) setSeoStats(d.data); })
            .finally(() => setIsLoadingStats(false));
    }, []);

    const loadSitemap = async () => {
        setIsLoadingSitemap(true);
        const res = await fetch("/api/seo?type=sitemap");
        const d = await res.json();
        if (d.success) setSitemapEntries(d.data.entries);
        setIsLoadingSitemap(false);
    };

    const copySitemapUrl = () => {
        const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";
        navigator.clipboard.writeText(`${base}/sitemap.xml`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const saveMeta = async () => {
        // In a real implementation this would save to CMS/DB
        // For now we save to the CMS system
        await fetch("/api/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slug: "seo-settings",
                title: "SEO Settings",
                content: JSON.stringify(meta),
                isPublished: true,
            }),
        });
        setMetaSaved(true);
        setTimeout(() => setMetaSaved(false), 2000);
    };

    const saveRobots = async () => {
        await fetch("/api/cms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                slug: "robots-settings",
                title: "Robots.txt",
                content: robotsTxt,
                isPublished: true,
            }),
        });
        setRobotsSaved(true);
        setTimeout(() => setRobotsSaved(false), 2000);
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Platform SEO</h1>
                <p className="text-muted-foreground text-sm">
                    Manage global SEO settings, sitemap, robots.txt, and meta tags
                </p>
            </div>

            {/* SEO Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Pages",
                        value: isLoadingStats ? "—" : seoStats?.totalPages ?? 0,
                        icon: FileText,
                        color: "from-indigo-500 to-indigo-600",
                    },
                    {
                        label: "Published",
                        value: isLoadingStats ? "—" : seoStats?.publishedPages ?? 0,
                        icon: Globe,
                        color: "from-emerald-500 to-emerald-600",
                    },
                    {
                        label: "Avg SEO Score",
                        value: isLoadingStats ? "—" : `${seoStats?.avgSEOScore ?? 0}/100`,
                        icon: BarChart3,
                        color: "from-sky-500 to-sky-600",
                    },
                    {
                        label: "Indexed %",
                        value: isLoadingStats ? "—" : `${seoStats?.indexedPercent ?? 0}%`,
                        icon: Search,
                        color: "from-purple-500 to-purple-600",
                    },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} shrink-0`}>
                                <s.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                                <p className="text-2xl font-bold">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="meta">
                <TabsList className="grid grid-cols-4 w-full max-w-lg">
                    <TabsTrigger value="meta">Meta Tags</TabsTrigger>
                    <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
                    <TabsTrigger value="robots">Robots.txt</TabsTrigger>
                    <TabsTrigger value="verification">Verification</TabsTrigger>
                </TabsList>

                {/* ── Meta Tags ─────────────────────────────────────────────────── */}
                <TabsContent value="meta" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Global Meta Tags</CardTitle>
                            <CardDescription>
                                Default meta tags used across all platform pages
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Site Title</Label>
                                <Input
                                    value={meta.siteTitle}
                                    onChange={(e) => setMeta({ ...meta, siteTitle: e.target.value })}
                                    placeholder="Your Platform Name"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {meta.siteTitle.length}/60 characters
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Site Description</Label>
                                <textarea
                                    value={meta.siteDescription}
                                    onChange={(e) => setMeta({ ...meta, siteDescription: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    placeholder="Describe your platform in under 160 characters"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {meta.siteDescription.length}/160 characters
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Default OG Image URL</Label>
                                    <Input
                                        value={meta.ogImage}
                                        onChange={(e) => setMeta({ ...meta, ogImage: e.target.value })}
                                        placeholder="https://yourdomain.com/og-image.png"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Twitter Handle</Label>
                                    <Input
                                        value={meta.twitterHandle}
                                        onChange={(e) => setMeta({ ...meta, twitterHandle: e.target.value })}
                                        placeholder="@yourhandle"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Canonical Base URL</Label>
                                <Input
                                    value={meta.canonicalBase}
                                    onChange={(e) => setMeta({ ...meta, canonicalBase: e.target.value })}
                                    placeholder="https://yourdomain.com"
                                />
                            </div>

                            {/* Preview */}
                            <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Google Search Preview
                                </p>
                                <div>
                                    <p className="text-sky-600 text-base font-medium truncate">{meta.siteTitle}</p>
                                    <p className="text-emerald-700 dark:text-emerald-500 text-xs">{appUrl}</p>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{meta.siteDescription}</p>
                                </div>
                            </div>

                            <Button
                                variant="gradient"
                                onClick={saveMeta}
                                className="gap-2"
                            >
                                {metaSaved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Meta Settings"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Sitemap ───────────────────────────────────────────────────── */}
                <TabsContent value="sitemap" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>XML Sitemap</CardTitle>
                            <CardDescription>
                                Auto-generated from all published blog posts and static pages
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                                <Globe className="h-5 w-5 text-indigo-500 shrink-0" />
                                <code className="text-sm flex-1 truncate">{appUrl}/sitemap.xml</code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 shrink-0"
                                    onClick={copySitemapUrl}
                                >
                                    {copied
                                        ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied</>
                                        : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                                </Button>
                                <Button variant="outline" size="sm" asChild className="shrink-0">
                                    <a href={`${appUrl}/sitemap.xml`} target="_blank" rel="noreferrer" className="gap-1.5">
                                        <ExternalLink className="h-3.5 w-3.5" /> View
                                    </a>
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="h-4 w-4" />
                                Sitemap is auto-generated on every build and updates with ISR
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={loadSitemap}
                                    isLoading={isLoadingSitemap}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {isLoadingSitemap ? "Loading..." : "Preview Sitemap Entries"}
                                </Button>
                            </div>

                            {sitemapEntries.length > 0 && (
                                <div className="border rounded-xl overflow-hidden">
                                    <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-b">
                                        <p className="text-sm font-medium">{sitemapEntries.length} URLs indexed</p>
                                        <Badge variant="success">Live</Badge>
                                    </div>
                                    <div className="divide-y max-h-64 overflow-y-auto">
                                        {sitemapEntries.map((entry) => (
                                            <div key={entry.url} className="px-4 py-2.5 flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{entry.title || entry.url}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{entry.url}</p>
                                                </div>
                                                <p className="text-xs text-muted-foreground shrink-0">{entry.lastmod}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 p-4">
                                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                                    Submit to Search Engines
                                </p>
                                <p className="text-xs text-muted-foreground mb-3">
                                    After publishing new content, submit your sitemap to Google Search Console and Bing Webmaster Tools.
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href="https://search.google.com/search-console"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="gap-1.5"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" /> Google Search Console
                                        </a>
                                    </Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href="https://www.bing.com/webmasters"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="gap-1.5"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" /> Bing Webmaster Tools
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Robots.txt ────────────────────────────────────────────────── */}
                <TabsContent value="robots" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Robots.txt</CardTitle>
                            <CardDescription>
                                Controls which pages search engine crawlers can access
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                                <Globe className="h-5 w-5 text-indigo-500 shrink-0" />
                                <code className="text-sm flex-1">{appUrl}/robots.txt</code>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`${appUrl}/robots.txt`} target="_blank" rel="noreferrer" className="gap-1.5">
                                        <ExternalLink className="h-3.5 w-3.5" /> View Live
                                    </a>
                                </Button>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Edit robots.txt content</Label>
                                <textarea
                                    value={robotsTxt}
                                    onChange={(e) => setRobotsTxt(e.target.value)}
                                    rows={12}
                                    className="w-full rounded-md border bg-zinc-950 text-emerald-400 font-mono px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>
                  The robots.txt file is auto-generated from <code className="bg-muted px-1 rounded">app/robots.ts</code>.
                  Changes here are stored in the CMS. To permanently change the live file, edit <code className="bg-muted px-1 rounded">app/robots.ts</code> directly.
                </span>
                            </div>

                            <Button variant="gradient" onClick={saveRobots} className="gap-2">
                                {robotsSaved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Robots.txt"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Verification ──────────────────────────────────────────────── */}
                <TabsContent value="verification" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search Engine Verification</CardTitle>
                            <CardDescription>
                                Add verification meta tags to prove ownership of your domain
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Google Search Console Verification Code</Label>
                                <Input
                                    value={meta.googleVerification}
                                    onChange={(e) => setMeta({ ...meta, googleVerification: e.target.value })}
                                    placeholder="e.g. abc123def456..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Found in Google Search Console → Settings → Ownership verification → HTML tag. Copy the content= value only.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Bing Webmaster Tools Verification Code</Label>
                                <Input
                                    value={meta.bingVerification}
                                    onChange={(e) => setMeta({ ...meta, bingVerification: e.target.value })}
                                    placeholder="e.g. ABC123..."
                                />
                                <p className="text-xs text-muted-foreground">
                                    Found in Bing Webmaster Tools → Settings → Site verification → HTML meta tag. Copy the content= value only.
                                </p>
                            </div>

                            {(meta.googleVerification || meta.bingVerification) && (
                                <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Generated Meta Tags
                                    </p>
                                    {meta.googleVerification && (
                                        <code className="block text-xs bg-zinc-950 text-emerald-400 rounded p-2">
                                            {`<meta name="google-site-verification" content="${meta.googleVerification}" />`}
                                        </code>
                                    )}
                                    {meta.bingVerification && (
                                        <code className="block text-xs bg-zinc-950 text-emerald-400 rounded p-2">
                                            {`<meta name="msvalidate.01" content="${meta.bingVerification}" />`}
                                        </code>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Add these to <code className="bg-muted px-1 rounded">app/layout.tsx</code> inside the metadata export.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <p className="text-sm font-medium">Quick Links</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { label: "Google Search Console", url: "https://search.google.com/search-console" },
                                        { label: "Bing Webmaster Tools", url: "https://www.bing.com/webmasters" },
                                        { label: "Google PageSpeed", url: "https://pagespeed.web.dev" },
                                        { label: "Schema Markup Validator", url: "https://validator.schema.org" },
                                    ].map((link) => (
                                        <a
                                            key={link.label}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/30 transition-colors text-sm"
                                        >
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <Button variant="gradient" onClick={saveMeta} className="gap-2">
                                {metaSaved ? <><Check className="h-4 w-4" /> Saved!</> : "Save Verification Codes"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}