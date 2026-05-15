"use client";
import {useEffect, useState} from "react";
import {useSession} from "next-auth/react";
import {
    Globe, CheckCircle, Copy, Check, ExternalLink,
    AlertTriangle, Palette, Link as LinkIcon, Save,
    RefreshCw, Shield,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";

interface DomainSettings {
    subdomain: string;
    customDomain: string;
    customDomainVerified: boolean;
    customDomainVerifyToken: string;
    siteName: string;
    siteDescription: string;
    siteLogo: string;
    primaryColor: string;
    siteTheme: "light" | "dark" | "auto";
    navLinks: { label: string; href: string }[];
    social: { twitter: string; linkedin: string; github: string; website: string };
    defaultMetaTitle: string;
    defaultMetaDescription: string;
    defaultOgImage: string;
}

const DEFAULT: DomainSettings = {
    subdomain: "", customDomain: "", customDomainVerified: false, customDomainVerifyToken: "",
    siteName: "", siteDescription: "", siteLogo: "", primaryColor: "#4F46E5", siteTheme: "auto",
    navLinks: [], social: {twitter: "", linkedin: "", github: "", website: ""},
    defaultMetaTitle: "", defaultMetaDescription: "", defaultOgImage: "",
};

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const IS_LOCALHOST = ROOT_DOMAIN.startsWith("localhost") || ROOT_DOMAIN.startsWith("127.0.0.1");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function DomainSettingsPage() {
    const {data: session} = useSession();
    const [settings, setSettings] = useState<DomainSettings>(DEFAULT);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [verifyMsg, setVerifyMsg] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState<"url" | "token" | null>(null);
    const [newNavLabel, setNewNavLabel] = useState("");
    const [newNavHref, setNewNavHref] = useState("");

    const isPaidPlan = session?.user?.plan !== "free";
    // On localhost: use /preview/subdomain path (subdomains don't work on localhost)
    // On production: use real subdomain URL
    const subdomainUrl = settings.subdomain
        ? IS_LOCALHOST
            ? `${APP_URL}/preview/${settings.subdomain}`
            : `https://${settings.subdomain}.${ROOT_DOMAIN}`
        : null;
    const customDomainUrl = settings.customDomain ? `https://${settings.customDomain}` : null;

    useEffect(() => {
        fetch("/api/domains")
            .then((r) => r.json())
            .then((d) => {
                if (d.success && d.data) setSettings({...DEFAULT, ...d.data});
            })
            .finally(() => setIsLoading(false));
    }, []);

    const save = async () => {
        setIsSaving(true);
        setError("");
        const res = await fetch("/api/domains", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(settings),
        });
        const d = await res.json();
        if (d.success) {
            setSettings({...DEFAULT, ...d.data});
            setSaveMsg("Saved!");
            setTimeout(() => setSaveMsg(""), 3000);
        } else {
            setError(d.error);
        }
        setIsSaving(false);
    };

    const verifyCustomDomain = async () => {
        setIsVerifying(true);
        setVerifyMsg("");
        const res = await fetch("/api/domains/verify", {method: "POST"});
        const d = await res.json();
        setVerifyMsg(d.success ? `✅ ${d.message}` : `❌ ${d.error}`);
        if (d.success) setSettings((s) => ({...s, customDomainVerified: true}));
        setIsVerifying(false);
    };

    const copyText = (text: string, kind: "url" | "token") => {
        navigator.clipboard.writeText(text);
        setCopied(kind);
        setTimeout(() => setCopied(null), 2000);
    };

    const addNavLink = () => {
        if (!newNavLabel || !newNavHref) return;
        setSettings((s) => ({...s, navLinks: [...s.navLinks, {label: newNavLabel, href: newNavHref}]}));
        setNewNavLabel("");
        setNewNavHref("");
    };

    if (!isPaidPlan) {
        return (
            <div className="max-w-2xl space-y-4">
                <h1 className="text-2xl font-bold">Your Public Domain</h1>
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="p-6 flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5"/>
                        <div>
                            <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Paid plan required</p>
                            <p className="text-sm text-muted-foreground mb-4">
                                Upgrade to Silver, Gold, or Diamond to publish your blog at{" "}
                                {IS_LOCALHOST
                                    ? <><code
                                        className="bg-muted px-1 rounded">localhost:3000/preview/yourname</code> (local)
                                        or <code
                                            className="bg-muted px-1 rounded">yourname.yourdomain.com</code> (production)</>
                                    : <code className="bg-muted px-1 rounded">yourname.{ROOT_DOMAIN}</code>
                                }{" "}
                                or connect your own custom domain like <code
                                className="bg-muted px-1 rounded">blog.lisa.com</code>.
                            </p>
                            <Button asChild variant="gradient"><a href="/pricing">Upgrade Now</a></Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading domain
            settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold">Your Public Domain</h1>
                    <p className="text-muted-foreground text-sm">
                        Configure where your blog is published.{" "}
                        {IS_LOCALHOST
                            ? <>On localhost, preview at <code
                                className="bg-muted px-1 rounded">localhost:3000/preview/yourname</code></>
                            : <>Your blog will be live at <code
                                className="bg-muted px-1 rounded">yourname.{ROOT_DOMAIN}</code></>
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    {subdomainUrl && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <a href={subdomainUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5"/> Subdomain
                            </a>
                        </Button>
                    )}
                    {customDomainUrl && settings.customDomainVerified && (
                        <Button asChild variant="outline" size="sm" className="gap-1.5">
                            <a href={customDomainUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5"/> Custom Domain
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div
                    className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
            )}

            {/* Active URLs */}
            {(subdomainUrl || customDomainUrl) && (
                <div className="space-y-2">
                    {subdomainUrl && (
                        <Card
                            className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20">
                            <CardContent className="p-3 flex items-center gap-3">
                                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0"/>
                                <span className="text-xs text-muted-foreground">Subdomain:</span>
                                <code className="text-sm flex-1">{subdomainUrl}</code>
                                <Button variant="ghost" size="sm" onClick={() => copyText(subdomainUrl, "url")}
                                        className="h-7 gap-1 text-xs">
                                    {copied === "url" ? <><Check className="h-3 w-3"/> Copied</> : <><Copy
                                        className="h-3 w-3"/> Copy</>}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    {customDomainUrl && (
                        <Card
                            className={`border-${settings.customDomainVerified ? "emerald" : "amber"}-200 dark:border-${settings.customDomainVerified ? "emerald" : "amber"}-800`}>
                            <CardContent className="p-3 flex items-center gap-3">
                                {settings.customDomainVerified
                                    ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0"/>
                                    : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0"/>}
                                <span className="text-xs text-muted-foreground">Custom:</span>
                                <code className="text-sm flex-1">{customDomainUrl}</code>
                                <Badge variant={settings.customDomainVerified ? "success" : "warning"}
                                       className="text-xs">
                                    {settings.customDomainVerified ? "Verified" : "Unverified"}
                                </Badge>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <Tabs defaultValue="subdomain">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="subdomain"><Globe className="h-3.5 w-3.5 mr-1.5"/>Subdomain</TabsTrigger>
                    <TabsTrigger value="custom"><Shield className="h-3.5 w-3.5 mr-1.5"/>Custom Domain</TabsTrigger>
                    <TabsTrigger value="appearance"><Palette className="h-3.5 w-3.5 mr-1.5"/>Appearance</TabsTrigger>
                    <TabsTrigger value="nav"><LinkIcon className="h-3.5 w-3.5 mr-1.5"/>Navigation</TabsTrigger>
                </TabsList>

                {/* Subdomain */}
                <TabsContent value="subdomain" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Free Subdomain</CardTitle>
                            <CardDescription>Instantly available — no DNS setup needed</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Your Subdomain</Label>
                                <div className="flex">
                                    <Input
                                        value={settings.subdomain}
                                        onChange={(e) => setSettings((s) => ({
                                            ...s,
                                            subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                                        }))}
                                        placeholder="yourname"
                                        className="rounded-r-none border-r-0"
                                    />
                                    <span
                                        className="flex items-center border rounded-r-md px-3 h-10 bg-muted text-sm text-muted-foreground whitespace-nowrap">
                    .{ROOT_DOMAIN}
                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {IS_LOCALHOST
                                        ? <>Local preview: <code
                                            className="bg-muted px-1 rounded">localhost:3000/preview/yourname</code></>
                                        : <>Live at: <code
                                            className="bg-muted px-1 rounded">yourname.{ROOT_DOMAIN}</code></>
                                    } · Lowercase, numbers, hyphens only.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Site Name</Label>
                                <Input value={settings.siteName}
                                       onChange={(e) => setSettings((s) => ({...s, siteName: e.target.value}))}
                                       placeholder="My Awesome Blog"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Site Description</Label>
                                <textarea value={settings.siteDescription} onChange={(e) => setSettings((s) => ({
                                    ...s,
                                    siteDescription: e.target.value
                                }))} placeholder="Describe your blog..." rows={3}
                                          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Social Links</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["twitter", "linkedin", "github", "website"] as const).map((key) => (
                                        <div key={key}>
                                            <p className="text-xs text-muted-foreground capitalize mb-1">{key}</p>
                                            <Input value={settings.social[key]} onChange={(e) => setSettings((s) => ({
                                                ...s,
                                                social: {...s.social, [key]: e.target.value}
                                            }))} placeholder={`https://${key}.com/...`} className="text-sm"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Custom Domain */}
                <TabsContent value="custom" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Domain</CardTitle>
                            <CardDescription>
                                Use your own domain like <strong>blog.lisa.com</strong> or <strong>jisson.com</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Your Domain</Label>
                                <Input
                                    value={settings.customDomain}
                                    onChange={(e) => setSettings((s) => ({
                                        ...s,
                                        customDomain: e.target.value.toLowerCase().trim()
                                    }))}
                                    placeholder="blog.yourdomain.com"
                                />
                            </div>

                            {/* Step-by-step instructions */}
                            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                                <p className="text-sm font-semibold">How to connect your domain</p>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex gap-3">
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold shrink-0 mt-0.5">1</span>
                                        <span>Save your custom domain above</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold shrink-0 mt-0.5">2</span>
                                        <div>
                                            <p>Add a <strong>CNAME record</strong> in your DNS provider pointing to:</p>
                                            <code
                                                className="block bg-zinc-950 text-emerald-400 text-xs rounded p-2 mt-1 font-mono">
                                                {ROOT_DOMAIN.replace(/:\d+$/, "")}
                                            </code>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold shrink-0 mt-0.5">3</span>
                                        <div>
                                            <p>Add a <strong>TXT record</strong> to prove you own the domain:</p>
                                            {settings.customDomainVerifyToken ? (
                                                <div className="mt-1 flex items-center gap-2">
                                                    <code
                                                        className="flex-1 bg-zinc-950 text-emerald-400 text-xs rounded p-2 font-mono break-all">
                                                        {settings.customDomainVerifyToken}
                                                    </code>
                                                    <Button variant="ghost" size="sm" className="h-7 shrink-0"
                                                            onClick={() => copyText(settings.customDomainVerifyToken, "token")}>
                                                        {copied === "token" ?
                                                            <Check className="h-3.5 w-3.5 text-emerald-500"/> :
                                                            <Copy className="h-3.5 w-3.5"/>}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <p className="text-xs mt-1 text-amber-600">Save your domain first to get
                                                    the verification token</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <span
                                            className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-xs font-bold shrink-0 mt-0.5">4</span>
                                        <span>Click Verify below once DNS has propagated (up to 24h)</span>
                                    </div>
                                </div>
                            </div>

                            {settings.customDomain && settings.customDomainVerifyToken && (
                                <div className="space-y-2">
                                    <Button
                                        variant={settings.customDomainVerified ? "outline" : "gradient"}
                                        onClick={verifyCustomDomain}
                                        isLoading={isVerifying}
                                        className="gap-2"
                                        disabled={settings.customDomainVerified}
                                    >
                                        <RefreshCw className="h-4 w-4"/>
                                        {settings.customDomainVerified ? "Domain Verified ✓" : "Verify Domain"}
                                    </Button>
                                    {verifyMsg && (
                                        <p className={`text-sm ${verifyMsg.startsWith("✅") ? "text-emerald-600" : "text-destructive"} whitespace-pre-line`}>
                                            {verifyMsg}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance */}
                <TabsContent value="appearance" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Site Appearance</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Primary Brand Color</Label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={settings.primaryColor}
                                           onChange={(e) => setSettings((s) => ({...s, primaryColor: e.target.value}))}
                                           className="h-10 w-16 rounded-md border cursor-pointer"/>
                                    <Input value={settings.primaryColor}
                                           onChange={(e) => setSettings((s) => ({...s, primaryColor: e.target.value}))}
                                           className="max-w-[140px] font-mono text-sm"/>
                                    <div
                                        className="h-10 w-24 rounded-lg text-white text-xs flex items-center justify-center font-medium"
                                        style={{background: settings.primaryColor}}>Preview
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Logo URL <span
                                    className="text-muted-foreground text-xs">(optional)</span></Label>
                                <Input value={settings.siteLogo}
                                       onChange={(e) => setSettings((s) => ({...s, siteLogo: e.target.value}))}
                                       placeholder="https://..."/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Default Theme</Label>
                                <div className="flex gap-3">
                                    {(["light", "dark", "auto"] as const).map((t) => (
                                        <button key={t} onClick={() => setSettings((s) => ({...s, siteTheme: t}))}
                                                className={`flex-1 py-2.5 rounded-lg border text-sm capitalize transition-all ${settings.siteTheme === t ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium" : "hover:bg-muted/50"}`}>
                                            {t === "auto" ? "🔄 System" : t === "light" ? "☀️ Light" : "🌙 Dark"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Navigation */}
                <TabsContent value="nav" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle>Navigation Links</CardTitle><CardDescription>Add custom links to your
                            blog header</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {settings.navLinks.map((link, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg border">
                                        <span className="text-sm font-medium flex-1">{link.label}</span>
                                        <span
                                            className="text-xs text-muted-foreground flex-1 truncate">{link.href}</span>
                                        <button onClick={() => setSettings((s) => ({
                                            ...s,
                                            navLinks: s.navLinks.filter((_, idx) => idx !== i)
                                        }))}
                                                className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input value={newNavLabel} onChange={(e) => setNewNavLabel(e.target.value)}
                                       placeholder="Label e.g. About"/>
                                <Input value={newNavHref} onChange={(e) => setNewNavHref(e.target.value)}
                                       placeholder="URL e.g. https://..."/>
                            </div>
                            <Button variant="outline" size="sm" onClick={addNavLink} className="gap-1.5"><LinkIcon
                                className="h-3.5 w-3.5"/> Add Link</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex items-center gap-3 pt-2">
                <Button variant="gradient" onClick={save} isLoading={isSaving} className="gap-2">
                    <Save className="h-4 w-4"/> {isSaving ? "Saving..." : "Save All Settings"}
                </Button>
                {saveMsg && <span className="text-sm text-emerald-600 flex items-center gap-1.5"><CheckCircle
                    className="h-4 w-4"/> {saveMsg}</span>}
            </div>
        </div>
    );
}

