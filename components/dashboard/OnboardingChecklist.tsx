// components/dashboard/OnboardingChecklist.tsx
"use client";
import {useState, useEffect} from "react";
import {CheckCircle, Circle, X, Sparkles, Globe, FileText, Search, ChevronRight} from "lucide-react";
import Link from "next/link";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useSession} from "next-auth/react";

interface Step {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: typeof Sparkles;
    done: boolean;
}

const STORAGE_KEY = "onboarding_dismissed";

export function OnboardingChecklist() {
    const {data: session} = useSession();
    const [dismissed, setDismissed] = useState(false);
    const [blogCount, setBlogCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY) === "true") {
            setDismissed(true);
            return;
        }
        // Fetch blog count to check if user has published
        fetch("/api/blog?limit=1")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setBlogCount(d.pagination?.total ?? 0);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setDismissed(true);
    };

    const plan = session?.user?.plan ?? "free";
    const hasAvatar = !!session?.user?.image;

    const steps: Step[] = [
        {
            id: "account",
            label: "Create your account",
            description: "You're here! Account created successfully.",
            href: "/dashboard/admin",
            icon: CheckCircle,
            done: true,
        },
        {
            id: "first_post",
            label: "Create your first blog post",
            description: "Write manually or use AI to generate a full post in seconds.",
            href: "/dashboard/admin/blogs/new",
            icon: FileText,
            done: blogCount > 0,
        },
        {
            id: "ai_generate",
            label: "Try AI blog generation",
            description: "Generate a complete SEO-optimized post with one click.",
            href: "/dashboard/admin/blogs/new?ai=true",
            icon: Sparkles,
            done: false, // can't easily track this without DB flag
        },
        {
            id: "keywords",
            label: "Research keywords",
            description: "Find profitable keywords for your niche.",
            href: plan === "free" ? "/pricing" : "/dashboard/admin/seo/keywords",
            icon: Search,
            done: false,
        },
        {
            id: "domain",
            label: "Set up your blog domain",
            description: "Connect a custom domain or use your free subdomain.",
            href: "/dashboard/admin/domain",
            icon: Globe,
            done: false,
        },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const allDone = completedCount === steps.length;

    if (dismissed || allDone || isLoading) return null;

    return (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/10">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-base">Getting Started</CardTitle>
                        <span
                            className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
              {completedCount}/{steps.length} done
            </span>
                    </div>
                    <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4"/>
                    </button>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full mt-2 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-500"
                        style={{width: `${(completedCount / steps.length) * 100}%`}}
                    />
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {steps.map((step) => (
                    <Link
                        key={step.id}
                        href={step.done ? "#" : step.href}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            step.done
                                ? "opacity-60 cursor-default"
                                : "hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 cursor-pointer group"
                        }`}
                    >
                        {step.done ? (
                            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0"/>
                        ) : (
                            <Circle
                                className="h-5 w-5 text-indigo-300 dark:text-indigo-700 shrink-0 group-hover:text-indigo-500 transition-colors"/>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>
                                {step.label}
                            </p>
                            {!step.done && (
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                            )}
                        </div>
                        {!step.done && (
                            <ChevronRight
                                className="h-4 w-4 text-muted-foreground group-hover:text-indigo-500 shrink-0 transition-colors"/>
                        )}
                    </Link>
                ))}
                <div className="pt-2 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Complete setup to unlock your platform&apos;s full
                        potential</p>
                    <Button variant="ghost" size="sm" onClick={dismiss} className="text-xs text-muted-foreground">
                        Dismiss
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}