"use client";
import {useEffect, useState} from "react";
import {Palette, Globe, CheckCircle, Sparkles, ExternalLink, Lock} from "lucide-react";
import {useSession} from "next-auth/react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";

interface Template {
    _id: string;
    name: string;
    description: string;
    theme: string;
    style: string;
    previewImage?: string;
    minPlan: string;
    colors: { primary: string; secondary: string; background: string };
    isFeatured: boolean;
}

interface UserSite {
    templateId?: { _id: string; name: string; theme: string; previewImage?: string };
    primaryColor: string;
    fontFamily: string;
    navStyle: string;
}

const PLAN_ORDER: Record<string, number> = {free: 0, silver: 1, gold: 2, diamond: 3};
const THEME_EMOJI: Record<string, string> = {
    light: "☀️", dark: "🌙", glassmorphism: "🔮",
    sketch: "✏️", brutalist: "🔲", minimal: "⬜", bold: "🎨",
};

export default function SiteBuilderPage() {
    const {data: session} = useSession();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [userSite, setUserSite] = useState<UserSite | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [filterTheme, setFilterTheme] = useState<string>("all");

    const userPlanLevel = PLAN_ORDER[session?.user?.plan ?? "free"] ?? 0;
    const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
    const IS_LOCALHOST = ROOT_DOMAIN.startsWith("localhost");

    useEffect(() => {
        Promise.all([
            fetch("/api/templates").then((r) => r.json()),
            fetch("/api/site").then((r) => r.json()),
        ]).then(([t, s]) => {
            if (t.success) setTemplates(t.data);
            if (s.success) setUserSite(s.data);
        }).finally(() => setIsLoading(false));
    }, []);

    const applyTemplate = async (templateId: string) => {
        setApplying(templateId);
        const res = await fetch(`/api/templates/${templateId}/apply`, {method: "POST"});
        const d = await res.json();
        if (d.success) {
            const s = await fetch("/api/site").then((r) => r.json());
            if (s.success) setUserSite(s.data);
        }
        setApplying(null);
    };

    const themes = ["all", ...Array.from(new Set(templates.map((t) => t.theme)))];
    const filtered = filterTheme === "all" ? templates : templates.filter((t) => t.theme === filterTheme);

    const previewUrl = IS_LOCALHOST
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/preview/your-subdomain`
        : `https://your-subdomain.${ROOT_DOMAIN}`;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Palette className="h-6 w-6 text-indigo-500"/> Site Builder
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Choose a template for your public blog site
                    </p>
                </div>
                {userSite?.templateId && (
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                        <a href={previewUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5"/> Preview Site
                        </a>
                    </Button>
                )}
            </div>

            {/* Current template */}
            {userSite?.templateId && (
                <div
                    className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0"/>
                    <div>
                        <p className="font-semibold text-sm">Active Template: {userSite.templateId.name}</p>
                        <p className="text-xs text-muted-foreground">Theme: {userSite.templateId.theme}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="ml-auto gap-1.5">
                        <Link href="/dashboard/admin/domain">
                            <Globe className="h-3.5 w-3.5"/> Customize Domain
                        </Link>
                    </Button>
                </div>
            )}

            {/* Theme filter */}
            <div className="flex gap-2 flex-wrap">
                {themes.map((t) => (
                    <Button
                        key={t}
                        variant={filterTheme === t ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterTheme(t)}
                        className="capitalize gap-1.5"
                    >
                        {t !== "all" && THEME_EMOJI[t]} {t}
                    </Button>
                ))}
            </div>

            {/* Templates grid */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl"/>)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    <Palette className="h-10 w-10 mx-auto mb-3 opacity-30"/>
                    <p>No templates available yet. Super admin can create templates from the Component Library.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((template) => {
                        const requiredLevel = PLAN_ORDER[template.minPlan] ?? 1;
                        const canAccess = userPlanLevel >= requiredLevel;
                        const isActive = userSite?.templateId?._id === template._id;

                        return (
                            <Card key={template._id}
                                  className={`group relative overflow-hidden transition-all hover:shadow-md ${isActive ? "border-emerald-500 shadow-md shadow-emerald-500/10" : ""} ${!canAccess ? "opacity-75" : ""}`}>
                                {template.isFeatured && (
                                    <div className="absolute top-2 left-2 z-10">
                                        <Badge
                                            className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 text-xs gap-1">
                                            <Sparkles className="h-2.5 w-2.5"/> Featured
                                        </Badge>
                                    </div>
                                )}
                                {!canAccess && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <Badge variant="secondary" className="capitalize text-xs gap-1">
                                            <Lock className="h-2.5 w-2.5"/> {template.minPlan}+
                                        </Badge>
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute top-2 right-2 z-10">
                                        <Badge variant="success" className="text-xs gap-1">
                                            <CheckCircle className="h-2.5 w-2.5"/> Active
                                        </Badge>
                                    </div>
                                )}

                                {/* Preview */}
                                {template.previewImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={template.previewImage} alt={template.name}
                                         className="w-full h-44 object-cover"/>
                                ) : (
                                    <div
                                        className="w-full h-44 flex items-center justify-center text-4xl"
                                        style={{background: `linear-gradient(135deg, ${template.colors.primary}30, ${template.colors.secondary}20)`}}
                                    >
                                        {THEME_EMOJI[template.theme]}
                                    </div>
                                )}

                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h3 className="font-semibold text-sm">{template.name}</h3>
                                            <p className="text-xs text-muted-foreground capitalize">{template.theme} · {template.style}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            {Object.values(template.colors).slice(0, 3).map((c, i) => (
                                                <div key={i}
                                                     className="h-4 w-4 rounded-full border border-background shadow-sm"
                                                     style={{background: c}}/>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{template.description}</p>

                                    {canAccess ? (
                                        <Button
                                            variant={isActive ? "outline" : "gradient"}
                                            size="sm"
                                            className="w-full"
                                            onClick={() => !isActive && applyTemplate(template._id)}
                                            isLoading={applying === template._id}
                                            disabled={isActive}
                                        >
                                            {isActive ? "✓ Currently Active" : applying === template._id ? "Applying..." : "Apply Template"}
                                        </Button>
                                    ) : (
                                        <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                                            <Link href="/dashboard/admin/settings?tab=billing">
                                                <Lock className="h-3.5 w-3.5"/> Upgrade to {template.minPlan}
                                            </Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
