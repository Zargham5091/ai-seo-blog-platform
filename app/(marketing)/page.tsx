// app/(marketing)/page.tsx
import type {Metadata} from "next";
import Link from "next/link";
import {
    ArrowRight, CheckCircle, Zap, Sparkles, Search, BarChart3,
    FileText, Shield, Globe, Users, Code, RefreshCw, Clock,
    TrendingUp, Link2, Calendar, Mail, Star, ChevronDown,
    Play, Layers,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanModel from "@/models/Plan";
import CMSPageModel from "@/models/CMSPage";
import {
    AnimatedAIMockup,
    AnimatedKeywordsMockup,
    AnimatedAnalyticsMockup,
    RankTrackingMockup,
    BulkGenerateMockup,
} from "@/components/marketing/AnimatedAIMockup";

export const metadata: Metadata = {
    title: "AI-Powered SEO Platform — Generate, Optimize & Publish",
    description: "The all-in-one SEO platform powered by AI. Generate optimized blog content, research keywords, track rankings, and publish beautiful blogs at scale.",
};

const DEFAULT_STATS = [
    {value: "10x", label: "Faster content creation"},
    {value: "85%", label: "Avg SEO score improvement"},
    {value: "50+", label: "SEO checks per post"},
    {value: "Free", label: "To get started"},
];

const FEATURE_SECTIONS = [
    {
        badge: "AI Content",
        title: "Generate entire blog posts in seconds",
        description: "Enter a topic and target keywords — AI writes a full SEO-optimized post with headings, meta tags, FAQ sections, and schema markup. Watch the animation — that's exactly what it does.",
        highlights: [
            "Full HTML with proper H2/H3 structure",
            "Auto-generated meta title & description",
            "FAQ section for voice search & AEO",
            "Internal link placeholders included",
        ],
        gradient: "from-purple-500/10 to-indigo-500/10",
        accentColor: "text-purple-600",
        badgeVariant: "info" as const,
        Mockup: AnimatedAIMockup,
    },
    {
        badge: "Keyword Research",
        title: "Find keywords your competitors are missing",
        description: "AI-powered keyword discovery with search volume, difficulty scores, CPC, and trend direction — plus automatic content idea generation. Enter any seed keyword and see results instantly.",
        highlights: [
            "Search volume & difficulty scores",
            "CPC and commercial intent analysis",
            "Rising vs declining trend detection",
            "Content ideas auto-generated",
        ],
        gradient: "from-sky-500/10 to-cyan-500/10",
        accentColor: "text-sky-600",
        badgeVariant: "info" as const,
        Mockup: AnimatedKeywordsMockup,
    },
    {
        badge: "Analytics",
        title: "Track everything that matters",
        description: "Real-time SEO scoring, rank tracking, backlink monitoring, and content performance — all in one dashboard. Google Search Console integration included.",
        highlights: [
            "Live SEO score as you write",
            "Keyword rank tracking",
            "Backlink monitoring",
            "Google Search Console sync",
        ],
        gradient: "from-emerald-500/10 to-teal-500/10",
        accentColor: "text-emerald-600",
        badgeVariant: "success" as const,
        Mockup: AnimatedAnalyticsMockup,
    },
    {
        badge: "Rank Tracking",
        title: "Know exactly where you rank",
        description: "Track your keyword positions in Google and Bing. See position changes over time, set target positions, and get alerts when rankings move significantly.",
        highlights: [
            "Google & Bing rank tracking",
            "Position change history",
            "Target position alerts",
            "Up to 500 keywords on Diamond",
        ],
        gradient: "from-orange-500/10 to-amber-500/10",
        accentColor: "text-orange-600",
        badgeVariant: "warning" as const,
        Mockup: RankTrackingMockup,
    },
    {
        badge: "Bulk Generate",
        title: "Create 10 posts at once — Diamond plan",
        description: "Queue up to 10 blog topics and generate them all automatically. Each post is saved as a draft for review. Perfect for agencies and high-volume content teams.",
        highlights: [
            "Generate up to 10 posts per batch",
            "All saved as drafts automatically",
            "Progress tracking per post",
            "Diamond plan exclusive feature",
        ],
        gradient: "from-violet-500/10 to-purple-500/10",
        accentColor: "text-violet-600",
        badgeVariant: "info" as const,
        Mockup: BulkGenerateMockup,
    },
];

const TESTIMONIALS = [
    {
        name: "Sarah Chen",
        role: "Content Marketing Manager",
        company: "TechStartup",
        text: "We cut content creation time by 80%. The AI generates posts that actually rank — not just fluff.",
        rating: 5
    },
    {
        name: "Marcus Rodriguez",
        role: "SEO Consultant",
        company: "GrowthAgency",
        text: "The keyword research tool alone is worth the subscription. My clients' organic traffic is up 3x in 6 months.",
        rating: 5
    },
    {
        name: "Priya Patel",
        role: "Founder",
        company: "SaaS Blog",
        text: "Finally an SEO platform that doesn't require a PhD. The team collaboration features are genuinely useful.",
        rating: 5
    },
];

const FAQ_ITEMS = [
    {
        q: "Do I need technical SEO knowledge?",
        a: "No. The platform guides you through every step. AI handles the technical parts — schema markup, meta tags, keyword density — automatically."
    },
    {
        q: "Is the AI content unique?",
        a: "Yes. Every piece is generated fresh for your specific topic and keywords. Unique content, not duplicated templates."
    },
    {
        q: "Can I connect my own domain?",
        a: "Yes. Silver plan and above allows you to connect a custom domain or use a free subdomain (yourbrand.seoplatform.com)."
    },
    {
        q: "What happens to my content if I cancel?",
        a: "Your published blogs stay live for 30 days after cancellation. Export all content as HTML anytime before that."
    },
    {
        q: "Does it integrate with Google Search Console?",
        a: "Yes. Connect GSC in Settings to pull real search performance data — impressions, clicks, CTR, and ranking positions."
    },
    {
        q: "Can team members use AI credits?",
        a: "Yes. As account owner you can allocate a specific number of AI credits to each team member from your plan's pool."
    },
];

export default async function HomePage() {
    await connectDB();
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;
    const dashboardUrl =
        session?.user?.role === "super_admin" ? "/dashboard/super-admin"
            : session?.user?.role === "product_admin" ? "/dashboard/admin"
                : "/dashboard/user";

    const [dbPlans, homePage] = await Promise.all([
        PlanModel.find({isActive: true}).sort({order: 1}).limit(4).lean(),
        CMSPageModel.findOne({slug: "home", isPublished: true}).lean(),
    ]);

    const statsPage = await CMSPageModel.findOne({slug: "home-stats", isPublished: true}).lean();
    const stats = statsPage?.content
        ? (() => {
            try {
                return JSON.parse(statsPage.content as string);
            } catch {
                return DEFAULT_STATS;
            }
        })()
        : DEFAULT_STATS;

    const planCTAHref = (slug: string, price: number) => {
        if (!isLoggedIn) return price === 0 ? "/register" : `/register?plan=${slug}`;
        if (price === 0) return dashboardUrl;
        return `/dashboard/admin/settings?upgrade=${slug}`;
    };

    return (
        <div className="flex flex-col">

            {/* ── Hero ── */}
            <section id="hero" className="relative overflow-hidden py-20 md:py-32">
                <div className="absolute inset-0 -z-10">
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl"/>
                </div>
                <div className="container mx-auto px-4 text-center">
                    <Badge variant="info" className="mb-6 gap-1.5 px-3 py-1 text-xs">
                        <Zap className="h-3 w-3"/> Powered by GPT-4o-mini · New: Team Collaboration + Real AI Demo
                    </Badge>

                    {homePage?.content ? (
                        <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto mb-8"
                             dangerouslySetInnerHTML={{__html: homePage.content as string}}/>
                    ) : (
                        <>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
                                The{" "}
                                <span
                                    className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  AI-Powered SEO Platform
                </span>{" "}
                                for Modern Teams
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                                Generate optimized content, research keywords, track rankings, and publish beautiful
                                blogs — all with AI. From solo creators to enterprise teams.
                            </p>
                        </>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {isLoggedIn ? (
                            <>
                                <Button asChild size="lg" variant="gradient" className="gap-2 text-base px-8">
                                    <Link href={dashboardUrl}>Go to Dashboard <ArrowRight className="h-4 w-4"/></Link>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
                                    <Link href="/demo"><Play className="h-4 w-4"/> Interactive Demo</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild size="lg" variant="gradient" className="gap-2 text-base px-8">
                                    <Link href="/register">Start Free Today <ArrowRight className="h-4 w-4"/></Link>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
                                    <Link href="/demo"><Play className="h-4 w-4"/> Try Real AI Demo</Link>
                                </Button>
                            </>
                        )}
                    </div>
                    {!isLoggedIn && (
                        <p className="mt-4 text-sm text-muted-foreground">No credit card required · 10 free AI credits ·
                            Cancel anytime</p>
                    )}
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="py-12 border-y bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((s: { value: string; label: string }) => (
                            <div key={s.label}>
                                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">{s.value}</p>
                                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Animated Feature Sections ── */}
            <section id="features" className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <Badge variant="info" className="mb-4">Features</Badge>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Watch the platform in action</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Every animation below is a real simulation of the actual interface. No mockups — this is
                            what you get.
                        </p>
                    </div>

                    <div className="space-y-32">
                        {FEATURE_SECTIONS.map((section, i) => {
                            const isEven = i % 2 === 0;
                            return (
                                <div key={section.title}
                                     className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${!isEven ? "lg:grid-flow-dense" : ""}`}>
                                    {/* Text */}
                                    <div className={!isEven ? "lg:col-start-2" : ""}>
                                        <Badge variant={section.badgeVariant} className="mb-4">{section.badge}</Badge>
                                        <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{section.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed mb-6">{section.description}</p>
                                        <ul className="space-y-2.5">
                                            {section.highlights.map((h) => (
                                                <li key={h} className="flex items-center gap-3 text-sm">
                                                    <CheckCircle className={`h-4 w-4 shrink-0 ${section.accentColor}`}/>
                                                    {h}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-6">
                                            <Button asChild variant="outline" size="sm" className="gap-2">
                                                <Link href="/demo">Try it yourself <ArrowRight className="h-3.5 w-3.5"/></Link>
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Animated mockup */}
                                    <div className={`relative ${!isEven ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                                        <div
                                            className={`absolute -inset-6 bg-gradient-to-br ${section.gradient} rounded-3xl blur-2xl`}/>
                                        <div className="relative">
                                            <section.Mockup/>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── All features grid ── */}
            <section className="py-24 bg-muted/20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge variant="info" className="mb-4">Complete Platform</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">40+ features included in every plan</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                        {[
                            {icon: Sparkles, label: "AI Blog Generator"},
                            {icon: Search, label: "Keyword Research"},
                            {icon: BarChart3, label: "SEO Analytics"},
                            {icon: TrendingUp, label: "Rank Tracking"},
                            {icon: Link2, label: "Backlink Monitor"},
                            {icon: Code, label: "Schema Generator"},
                            {icon: FileText, label: "Content Calendar"},
                            {icon: RefreshCw, label: "Content Repurposer"},
                            {icon: Users, label: "Team Collaboration"},
                            {icon: Globe, label: "Custom Domain"},
                            {icon: Calendar, label: "Scheduled Publishing"},
                            {icon: Mail, label: "Newsletter Tool"},
                            {icon: Shield, label: "Role-Based Access"},
                            {icon: Clock, label: "Auto-Save & Versioning"},
                            {icon: Layers, label: "A/B Testing"},
                            {icon: Zap, label: "AEO Optimizer"},
                        ].map(({icon: Icon, label}) => (
                            <div key={label}
                                 className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:shadow-sm transition-shadow">
                                <div
                                    className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                                    <Icon className="h-4 w-4 text-indigo-600"/>
                                </div>
                                <span className="text-sm font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Button asChild variant="outline">
                            <Link href="/features">View all features →</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge variant="info" className="mb-4">Testimonials</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by SEO professionals</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {TESTIMONIALS.map((t) => (
                            <Card key={t.name} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex gap-0.5 mb-4">
                                        {[...Array(t.rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400"/>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                                    <div>
                                        <p className="text-sm font-semibold">{t.name}</p>
                                        <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            {dbPlans.length > 0 && (
                <section id="pricing" className="py-24 bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <Badge variant="info" className="mb-4">Pricing</Badge>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
                            <p className="text-muted-foreground text-lg">Start free. Upgrade when ready. Cancel
                                anytime.</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {dbPlans.map((plan) => {
                                const f = plan.features;
                                const highlights = [
                                    `${f.aiCreditsPerMonth >= 999999 ? "Unlimited" : f.aiCreditsPerMonth} AI credits/mo`,
                                    `${f.maxBlogs >= 999999 ? "Unlimited" : f.maxBlogs} blog posts`,
                                    f.keywordResearch ? "Keyword research" : null,
                                    f.maxTeamMembers > 1 ? `${f.maxTeamMembers} team members` : null,
                                    f.customDomain ? "Custom domain" : null,
                                ].filter(Boolean) as string[];
                                return (
                                    <Card key={plan._id.toString()}
                                          className={`relative flex flex-col ${plan.isPopular ? "border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]" : ""}`}>
                                        {plan.isPopular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <Badge variant="default"
                                                       className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">Most
                                                    Popular</Badge>
                                            </div>
                                        )}
                                        <CardContent className="p-6 flex flex-col flex-1">
                                            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                                            <div className="mb-4">
                                                <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                                                {plan.monthlyPrice > 0 &&
                                                    <span className="text-muted-foreground text-sm">/mo</span>}
                                            </div>
                                            <ul className="space-y-2 mb-6 flex-1">
                                                {highlights.slice(0, 5).map((h) => (
                                                    <li key={h} className="flex items-start gap-2 text-sm">
                                                        <CheckCircle
                                                            className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                                                        <span className="text-muted-foreground">{h}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Button asChild variant={plan.isPopular ? "gradient" : "outline"}
                                                    className="w-full">
                                                <Link href={planCTAHref(plan.slug, plan.monthlyPrice)}>
                                                    {plan.monthlyPrice === 0 ? "Start Free" : `Get ${plan.name}`}
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        <div className="text-center mt-8">
                            <Link href="/pricing" className="text-sm text-indigo-600 hover:underline">View full pricing
                                details →</Link>
                        </div>
                    </div>
                </section>
            )}

            {/* ── FAQ ── */}
            <section id="faq" className="py-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-16">
                        <Badge variant="info" className="mb-4">FAQ</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
                    </div>
                    <div className="space-y-3">
                        {FAQ_ITEMS.map((item) => (
                            <details key={item.q} className="group rounded-xl border bg-background overflow-hidden">
                                <summary
                                    className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-sm hover:bg-muted/30 transition-colors">
                                    {item.q}
                                    <ChevronDown
                                        className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180"/>
                                </summary>
                                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t pt-4">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section id="cta" className="py-24 bg-muted/20">
                <div className="container mx-auto px-4 text-center">
                    <div
                        className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to supercharge your SEO?</h2>
                        <p className="text-indigo-100 mb-8 text-lg">Join content teams using AI to dominate search
                            rankings.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button asChild size="lg"
                                    className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
                                <Link href={isLoggedIn ? dashboardUrl : "/register"}>
                                    {isLoggedIn ? "Go to Dashboard" : "Get Started Free"} <ArrowRight
                                    className="h-4 w-4 ml-2"/>
                                </Link>
                            </Button>
                            <Button asChild size="lg" variant="outline"
                                    className="border-white/30 text-white hover:bg-white/10">
                                <Link href="/demo"><Play className="h-4 w-4 mr-2"/> Try Real AI Demo</Link>
                            </Button>
                        </div>
                        <p className="mt-4 text-xs text-indigo-200">No credit card required · 10 free AI credits ·
                            Cancel anytime</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
// // app/(marketing)/page.tsx
// import type {Metadata} from "next";
// import Link from "next/link";
// import {
//     ArrowRight, CheckCircle, Zap, Sparkles, Search, BarChart3,
//     FileText, Shield, Globe, Users, Code, RefreshCw, Clock,
//     TrendingUp, Link2, Calendar, Mail, Star, ChevronDown,
//     Play, Layers,
// } from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Badge} from "@/components/ui/form-elements";
// import {Card, CardContent} from "@/components/ui/card";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import PlanModel from "@/models/Plan";
// import CMSPageModel from "@/models/CMSPage";
//
// export const metadata: Metadata = {
//     title: "AI-Powered SEO Platform — Generate, Optimize & Publish",
//     description: "The all-in-one SEO platform powered by AI. Generate optimized blog content, research keywords, track rankings, and publish beautiful blogs at scale.",
// };
//
// const DEFAULT_STATS = [
//     {value: "10x", label: "Faster content creation"},
//     {value: "85%", label: "SEO score improvement"},
//     {value: "50+", label: "SEO checks per post"},
//     {value: "Free", label: "To get started"},
// ];
//
// // ── Feature sections with visual mockups ─────────────────────────────────────
// const FEATURE_SECTIONS = [
//     {
//         badge: "AI Content",
//         title: "Generate entire blog posts in seconds",
//         description: "Enter a topic and target keywords — GPT-4o-mini writes a full SEO-optimized post complete with headings, meta tags, FAQ sections, and schema markup. No writer's block ever again.",
//         highlights: ["Full HTML content with proper H2/H3 structure", "Auto-generated meta title & description", "FAQ section for voice search", "Internal link placeholders"],
//         gradient: "from-purple-500/10 to-indigo-500/10",
//         accentColor: "text-purple-600",
//         badgeVariant: "info" as const,
//         mockup: "ai-generate",
//     },
//     {
//         badge: "Keyword Research",
//         title: "Find keywords your competitors are missing",
//         description: "AI-powered keyword discovery with search volume estimates, difficulty scores, CPC data, and trend direction. Get content ideas and long-tail opportunities in one click.",
//         highlights: ["Search volume & difficulty scores", "CPC and commercial intent analysis", "Rising vs declining trend detection", "Content ideas generated automatically"],
//         gradient: "from-sky-500/10 to-cyan-500/10",
//         accentColor: "text-sky-600",
//         badgeVariant: "info" as const,
//         mockup: "keywords",
//     },
//     {
//         badge: "SEO Analytics",
//         title: "Track everything that matters",
//         description: "Real-time SEO scoring, rank tracking, backlink monitoring, and content performance analytics — all in one dashboard. Know exactly what's working and what needs attention.",
//         highlights: ["Live SEO score as you write", "Keyword rank tracking", "Backlink monitoring", "Google Search Console integration"],
//         gradient: "from-emerald-500/10 to-teal-500/10",
//         accentColor: "text-emerald-600",
//         badgeVariant: "success" as const,
//         mockup: "analytics",
//     },
//     {
//         badge: "Team Collaboration",
//         title: "Built for teams of any size",
//         description: "Invite team members with role-based permissions. Control exactly what editors, viewers, and admins can access. Track every action in the activity feed.",
//         highlights: ["Role-based access (Member/Editor/Admin)", "Per-member AI credit allocation", "Page-level permission control", "Full activity audit log"],
//         gradient: "from-orange-500/10 to-amber-500/10",
//         accentColor: "text-orange-600",
//         badgeVariant: "warning" as const,
//         mockup: "team",
//     },
// ];
//
// const TESTIMONIALS = [
//     {
//         name: "Sarah Chen",
//         role: "Content Marketing Manager",
//         company: "TechStartup",
//         text: "We cut our content creation time by 80%. The AI generates posts that actually rank — not just fluff.",
//         rating: 5
//     },
//     {
//         name: "Marcus Rodriguez",
//         role: "SEO Consultant",
//         company: "GrowthAgency",
//         text: "The keyword research tool alone is worth the subscription. My clients' organic traffic is up 3x in 6 months.",
//         rating: 5
//     },
//     {
//         name: "Priya Patel",
//         role: "Founder",
//         company: "SaaS Blog",
//         text: "Finally an SEO platform that doesn't require a PhD. The team collaboration features are genuinely useful.",
//         rating: 5
//     },
// ];
//
// const FAQ_ITEMS = [
//     {
//         q: "Do I need technical SEO knowledge to use this?",
//         a: "No. The platform guides you through every step. AI handles the technical parts — schema markup, meta tags, keyword density — automatically. You just write topics.",
//     },
//     {
//         q: "Is the content actually unique or does Google penalize it?",
//         a: "Every piece of content is generated fresh for your specific topic and keywords. It's unique content, not duplicated. Thousands of users generate content daily without ranking issues.",
//     },
//     {
//         q: "Can I connect my own domain?",
//         a: "Yes. Silver plan and above allows you to connect a custom domain or use a free subdomain (yourbrand.seoplatform.com) for your public blog.",
//     },
//     {
//         q: "What happens to my content if I cancel?",
//         a: "Your published blogs remain live for 30 days after cancellation. You can export all your content as HTML anytime before that.",
//     },
//     {
//         q: "Does it integrate with Google Search Console?",
//         a: "Yes. Connect GSC in Settings to pull your real search performance data — impressions, clicks, CTR, and ranking positions — directly into your analytics dashboard.",
//     },
//     {
//         q: "Can team members use AI credits independently?",
//         a: "Yes. As the account owner you can allocate a specific number of AI credits to each team member from your plan's pool. They can only use what you've allocated.",
//     },
// ];
//
// // ── Inline SVG mockups (CSS-only, no images needed) ──────────────────────────
// function AIMockup() {
//     return (
//         <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden">
//             <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
//                 <div className="h-3 w-3 rounded-full bg-red-400"/>
//                 <div className="h-3 w-3 rounded-full bg-yellow-400"/>
//                 <div className="h-3 w-3 rounded-full bg-green-400"/>
//                 <span className="ml-3 text-xs text-muted-foreground font-mono">AI Blog Generator</span>
//             </div>
//             <div className="p-4 space-y-3">
//                 <div className="rounded-lg border bg-muted/20 p-3">
//                     <p className="text-xs text-muted-foreground mb-1">Topic</p>
//                     <p className="text-sm font-medium">10 SEO Strategies for SaaS Companies in 2025</p>
//                 </div>
//                 <div className="flex gap-2">
//                     <div className="flex-1 rounded-lg border bg-muted/20 p-2 text-center">
//                         <p className="text-[10px] text-muted-foreground">Keywords</p>
//                         <p className="text-xs font-bold">saas seo, b2b seo</p>
//                     </div>
//                     <div className="flex-1 rounded-lg border bg-muted/20 p-2 text-center">
//                         <p className="text-[10px] text-muted-foreground">Tone</p>
//                         <p className="text-xs font-bold">Professional</p>
//                     </div>
//                     <div className="flex-1 rounded-lg border bg-muted/20 p-2 text-center">
//                         <p className="text-[10px] text-muted-foreground">Words</p>
//                         <p className="text-xs font-bold">1,200</p>
//                     </div>
//                 </div>
//                 <div className="rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20 p-3 space-y-2">
//                     <div className="flex items-center gap-2">
//                         <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse"/>
//                         <span
//                             className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Generated Output</span>
//                         <Badge variant="info" className="text-[10px] ml-auto">SEO Score: 91/100</Badge>
//                     </div>
//                     <p className="text-xs font-bold">10 Proven SEO Strategies for SaaS Companies</p>
//                     <div className="space-y-1">
//                         {["Introduction: Why SaaS SEO is different", "1. Build product-led content clusters", "2. Target bottom-of-funnel keywords", "3. Create integration pages for each tool"].map((line, i) => (
//                             <div key={i} className="flex items-center gap-2">
//                                 <div className="h-1 w-1 rounded-full bg-indigo-400 shrink-0"/>
//                                 <p className="text-[10px] text-muted-foreground">{line}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//                 <div className="flex gap-2">
//                     <div className="flex-1 h-2 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"/>
//                     <span className="text-[10px] text-muted-foreground">1 credit used</span>
//                 </div>
//             </div>
//         </div>
//     );
// }
//
// function KeywordsMockup() {
//     const kws = [
//         {kw: "saas seo strategy", vol: "8,100", diff: 52, trend: "↑"},
//         {kw: "b2b content marketing", vol: "12,400", diff: 68, trend: "↑"},
//         {kw: "seo for startups", vol: "4,400", diff: 38, trend: "↑"},
//         {kw: "product led growth seo", vol: "2,900", diff: 29, trend: "↑"},
//         {kw: "saas blog strategy", vol: "1,600", diff: 22, trend: "→"},
//     ];
//     return (
//         <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden">
//             <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
//                 <div className="h-3 w-3 rounded-full bg-red-400"/>
//                 <div className="h-3 w-3 rounded-full bg-yellow-400"/>
//                 <div className="h-3 w-3 rounded-full bg-green-400"/>
//                 <span className="ml-3 text-xs text-muted-foreground font-mono">Keyword Research</span>
//             </div>
//             <div className="p-4 space-y-3">
//                 <div className="flex gap-2">
//                     <div className="flex-1 rounded-lg border bg-muted/20 p-2 flex items-center gap-2">
//                         <Search className="h-3 w-3 text-muted-foreground"/>
//                         <span className="text-xs text-muted-foreground">saas seo</span>
//                     </div>
//                     <div className="rounded-lg bg-indigo-600 px-3 flex items-center">
//                         <Sparkles className="h-3 w-3 text-white"/>
//                     </div>
//                 </div>
//                 <div className="rounded-xl border overflow-hidden">
//                     <div
//                         className="grid grid-cols-4 bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground font-medium">
//                         <span>Keyword</span><span className="text-right">Volume</span><span
//                         className="text-right">Diff</span><span className="text-right">Trend</span>
//                     </div>
//                     {kws.map((k) => (
//                         <div key={k.kw}
//                              className="grid grid-cols-4 px-3 py-2 text-xs border-t hover:bg-muted/20 transition-colors">
//                             <span className="font-medium truncate">{k.kw}</span>
//                             <span className="text-right text-muted-foreground">{k.vol}</span>
//                             <span
//                                 className={`text-right font-semibold ${k.diff < 30 ? "text-emerald-500" : k.diff < 60 ? "text-yellow-500" : "text-red-500"}`}>{k.diff}</span>
//                             <span className="text-right text-emerald-500">{k.trend}</span>
//                         </div>
//                     ))}
//                 </div>
//                 <div className="rounded-lg border bg-sky-50 dark:bg-sky-950/20 p-2.5">
//                     <p className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 mb-1.5">💡 Content Ideas</p>
//                     {["How SaaS companies can rank without backlinks", "The complete guide to product-led SEO"].map((idea, i) => (
//                         <div key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground py-0.5">
//                             <div className="h-1 w-1 rounded-full bg-sky-400"/>
//                             {idea}
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }
//
// function AnalyticsMockup() {
//     return (
//         <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden">
//             <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
//                 <div className="h-3 w-3 rounded-full bg-red-400"/>
//                 <div className="h-3 w-3 rounded-full bg-yellow-400"/>
//                 <div className="h-3 w-3 rounded-full bg-green-400"/>
//                 <span className="ml-3 text-xs text-muted-foreground font-mono">Analytics Dashboard</span>
//             </div>
//             <div className="p-4 space-y-3">
//                 <div className="grid grid-cols-3 gap-2">
//                     {[{label: "Total Views", value: "48,291", up: true}, {
//                         label: "Published",
//                         value: "127",
//                         up: true
//                     }, {label: "Avg SEO", value: "84/100", up: false}].map((s) => (
//                         <div key={s.label} className="rounded-lg border bg-muted/20 p-2.5 text-center">
//                             <p className="text-sm font-bold">{s.value}</p>
//                             <p className="text-[10px] text-muted-foreground">{s.label}</p>
//                         </div>
//                     ))}
//                 </div>
//                 <div className="rounded-xl border p-3">
//                     <p className="text-[10px] font-medium text-muted-foreground mb-2">Views (Last 30 Days)</p>
//                     <div className="flex items-end gap-1 h-16">
//                         {[30, 45, 38, 62, 55, 71, 68, 80, 75, 92, 88, 95].map((h, i) => (
//                             <div key={i} className="flex-1 rounded-t"
//                                  style={{
//                                      height: `${h}%`,
//                                      background: `linear-gradient(to top, #4F46E5, #0EA5E9)`,
//                                      opacity: 0.7 + (i / 20)
//                                  }}/>
//                         ))}
//                     </div>
//                 </div>
//                 <div className="space-y-1.5">
//                     <p className="text-[10px] font-medium text-muted-foreground">Top Posts</p>
//                     {[{title: "10 SEO Tips for 2025", views: "12,400"}, {
//                         title: "Keyword Research Guide",
//                         views: "8,900"
//                     }, {title: "On-Page SEO Checklist", views: "6,200"}].map((p) => (
//                         <div key={p.title} className="flex items-center justify-between text-xs">
//                             <span className="truncate text-muted-foreground">{p.title}</span>
//                             <span className="font-semibold shrink-0 ml-2">{p.views}</span>
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );
// }
//
// function TeamMockup() {
//     const members = [
//         {name: "Alex K.", role: "Editor", pages: 8, credits: "40/50"},
//         {name: "Priya S.", role: "Admin", pages: 0, credits: "80/100"},
//         {name: "Tom B.", role: "Member", pages: 3, credits: "10/20"},
//     ];
//     return (
//         <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden">
//             <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
//                 <div className="h-3 w-3 rounded-full bg-red-400"/>
//                 <div className="h-3 w-3 rounded-full bg-yellow-400"/>
//                 <div className="h-3 w-3 rounded-full bg-green-400"/>
//                 <span className="ml-3 text-xs text-muted-foreground font-mono">Team Management</span>
//             </div>
//             <div className="p-4 space-y-3">
//                 <div className="flex items-center justify-between">
//                     <p className="text-xs font-semibold">3 / 10 members · Gold Plan</p>
//                     <div
//                         className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] text-white flex items-center gap-1">
//                         <Users className="h-2.5 w-2.5"/> Invite
//                     </div>
//                 </div>
//                 {members.map((m) => (
//                     <div key={m.name} className="rounded-xl border p-3 space-y-2">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center gap-2">
//                                 <div
//                                     className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-[10px] font-bold">
//                                     {m.name[0]}
//                                 </div>
//                                 <div>
//                                     <p className="text-xs font-semibold">{m.name}</p>
//                                     <Badge
//                                         variant={m.role === "Admin" ? "warning" : m.role === "Editor" ? "info" : "secondary"}
//                                         className="text-[9px] px-1 py-0">{m.role}</Badge>
//                                 </div>
//                             </div>
//                             <p className="text-[10px] text-muted-foreground">{m.credits} credits</p>
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
//                                 <div className="h-full bg-indigo-500 rounded-full"
//                                      style={{width: `${(parseInt(m.credits) / parseInt(m.credits.split("/")[1])) * 100}%`}}/>
//                             </div>
//                             {m.pages > 0 &&
//                                 <p className="text-[10px] text-amber-600 shrink-0">{m.pages} page limits</p>}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }
//
// const MOCKUP_MAP: Record<string, React.FC> = {
//     "ai-generate": AIMockup,
//     "keywords": KeywordsMockup,
//     "analytics": AnalyticsMockup,
//     "team": TeamMockup,
// };
//
// // ── Main component ────────────────────────────────────────────────────────────
// export default async function HomePage() {
//     await connectDB();
//     const session = await getServerSession(authOptions);
//     const isLoggedIn = !!session;
//     const dashboardUrl =
//         session?.user?.role === "super_admin" ? "/dashboard/super-admin"
//             : session?.user?.role === "product_admin" ? "/dashboard/admin"
//                 : "/dashboard/user";
//
//     const [dbPlans, homePage] = await Promise.all([
//         PlanModel.find({isActive: true}).sort({order: 1}).limit(4).lean(),
//         CMSPageModel.findOne({slug: "home", isPublished: true}).lean(),
//     ]);
//
//     const statsPage = await CMSPageModel.findOne({slug: "home-stats", isPublished: true}).lean();
//     const stats = statsPage?.content
//         ? (() => {
//             try {
//                 return JSON.parse(statsPage.content as string);
//             } catch {
//                 return DEFAULT_STATS;
//             }
//         })()
//         : DEFAULT_STATS;
//
//     const planCTAHref = (slug: string, price: number) => {
//         if (!isLoggedIn) return price === 0 ? "/register" : `/register?plan=${slug}`;
//         if (price === 0) return dashboardUrl;
//         return `/dashboard/admin/settings?upgrade=${slug}`;
//     };
//
//     return (
//         <div className="flex flex-col">
//
//             {/* ── Hero ── */}
//             <section className="relative overflow-hidden py-20 md:py-32">
//                 <div className="absolute inset-0 -z-10">
//                     <div
//                         className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent rounded-full blur-3xl"/>
//                     <div className="absolute top-32 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-2xl"/>
//                 </div>
//                 <div className="container mx-auto px-4 text-center">
//                     <Badge variant="info" className="mb-6 gap-1.5 px-3 py-1 text-xs animate-pulse">
//                         <Zap className="h-3 w-3"/> Powered by GPT-4o-mini · New: Team Collaboration
//                     </Badge>
//
//                     {homePage?.content ? (
//                         <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto mb-8"
//                              dangerouslySetInnerHTML={{__html: homePage.content as string}}/>
//                     ) : (
//                         <>
//                             <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl mx-auto leading-[1.1]">
//                                 The{" "}
//                                 <span
//                                     className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
//                   AI-Powered SEO Platform
//                 </span>{" "}
//                                 for Modern Teams
//                             </h1>
//                             <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
//                                 Generate optimized content, research keywords, track rankings, and publish beautiful
//                                 blogs — all with AI. From solo creators to enterprise teams.
//                             </p>
//                         </>
//                     )}
//
//                     <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                         {isLoggedIn ? (
//                             <>
//                                 <Button asChild size="lg" variant="gradient" className="gap-2 text-base px-8">
//                                     <Link href={dashboardUrl}>Go to Dashboard <ArrowRight className="h-4 w-4"/></Link>
//                                 </Button>
//                                 <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
//                                     <Link href="/demo"><Play className="h-4 w-4"/> View Live Demo</Link>
//                                 </Button>
//                             </>
//                         ) : (
//                             <>
//                                 <Button asChild size="lg" variant="gradient" className="gap-2 text-base px-8">
//                                     <Link href="/register">Start Free Today <ArrowRight className="h-4 w-4"/></Link>
//                                 </Button>
//                                 <Button asChild size="lg" variant="outline" className="gap-2 text-base px-8">
//                                     <Link href="/demo"><Play className="h-4 w-4"/> Live Demo</Link>
//                                 </Button>
//                             </>
//                         )}
//                     </div>
//                     {!isLoggedIn && (
//                         <p className="mt-4 text-sm text-muted-foreground">No credit card required · 10 free AI credits ·
//                             Cancel anytime</p>
//                     )}
//
//                     {/* Hero mockup preview */}
//                     <div className="mt-16 max-w-4xl mx-auto relative">
//                         <div
//                             className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-sky-500/20 rounded-3xl blur-2xl"/>
//                         <div className="relative rounded-2xl border bg-background shadow-2xl overflow-hidden">
//                             <div className="flex items-center gap-1.5 px-4 py-3 border-b bg-muted/30">
//                                 <div className="h-3 w-3 rounded-full bg-red-400"/>
//                                 <div className="h-3 w-3 rounded-full bg-yellow-400"/>
//                                 <div className="h-3 w-3 rounded-full bg-green-400"/>
//                                 <span className="ml-3 text-xs text-muted-foreground">SEO Platform Dashboard</span>
//                                 <div className="ml-auto flex items-center gap-2">
//                                     <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/>
//                                     <span className="text-[10px] text-muted-foreground">Live</span>
//                                 </div>
//                             </div>
//                             <div className="grid grid-cols-4 gap-0 divide-x">
//                                 {[
//                                     {label: "AI Credits", value: "847", sub: "of 2,000 used", color: "text-indigo-600"},
//                                     {
//                                         label: "Published Posts",
//                                         value: "127",
//                                         sub: "+12 this month",
//                                         color: "text-emerald-600"
//                                     },
//                                     {
//                                         label: "Total Views",
//                                         value: "48.2K",
//                                         sub: "+23% vs last month",
//                                         color: "text-sky-600"
//                                     },
//                                     {label: "Avg SEO Score", value: "84", sub: "Excellent", color: "text-purple-600"},
//                                 ].map((s) => (
//                                     <div key={s.label} className="p-4 text-center">
//                                         <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
//                                         <p className="text-xs font-medium mt-0.5">{s.label}</p>
//                                         <p className="text-[10px] text-muted-foreground">{s.sub}</p>
//                                     </div>
//                                 ))}
//                             </div>
//                             <div className="p-4 grid grid-cols-3 gap-3 border-t bg-muted/10">
//                                 {["AI Blog Generator", "Keyword Research", "SEO Analytics", "Rank Tracking", "Team Management", "Content Calendar"].map((f) => (
//                                     <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
//                                         <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0"/>
//                                         {f}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── Stats ── */}
//             <section className="py-12 border-y bg-muted/20">
//                 <div className="container mx-auto px-4">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//                         {stats.map((s: { value: string; label: string }) => (
//                             <div key={s.label}>
//                                 <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">{s.value}</p>
//                                 <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── Feature Sections (alternating layout with mockups) ── */}
//             <section className="py-24">
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-20">
//                         <Badge variant="info" className="mb-4">Features</Badge>
//                         <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to dominate SEO</h2>
//                         <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
//                             A complete platform to research, create, optimize, publish, and track — powered by AI.
//                         </p>
//                     </div>
//
//                     <div className="space-y-32">
//                         {FEATURE_SECTIONS.map((section, i) => {
//                             const MockupComponent = MOCKUP_MAP[section.mockup];
//                             const isEven = i % 2 === 0;
//                             return (
//                                 <div key={section.title}
//                                      className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${!isEven ? "lg:grid-flow-dense" : ""}`}>
//                                     {/* Text */}
//                                     <div className={!isEven ? "lg:col-start-2" : ""}>
//                                         <Badge variant={section.badgeVariant} className="mb-4">{section.badge}</Badge>
//                                         <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{section.title}</h3>
//                                         <p className="text-muted-foreground leading-relaxed mb-6">{section.description}</p>
//                                         <ul className="space-y-2.5">
//                                             {section.highlights.map((h) => (
//                                                 <li key={h} className="flex items-center gap-3 text-sm">
//                                                     <CheckCircle className={`h-4 w-4 shrink-0 ${section.accentColor}`}/>
//                                                     {h}
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     </div>
//                                     {/* Mockup */}
//                                     <div className={`relative ${!isEven ? "lg:col-start-1 lg:row-start-1" : ""}`}>
//                                         <div
//                                             className={`absolute -inset-6 bg-gradient-to-br ${section.gradient} rounded-3xl blur-2xl`}/>
//                                         <div className="relative">
//                                             <MockupComponent/>
//                                         </div>
//                                     </div>
//                                 </div>
//                             );
//                         })}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── All features grid ── */}
//             <section className="py-24 bg-muted/20">
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-16">
//                         <Badge variant="info" className="mb-4">Complete Platform</Badge>
//                         <h2 className="text-3xl md:text-4xl font-bold mb-4">40+ features included in every plan</h2>
//                     </div>
//                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
//                         {[
//                             {icon: Sparkles, label: "AI Blog Generator"},
//                             {icon: Search, label: "Keyword Research"},
//                             {icon: BarChart3, label: "SEO Analytics"},
//                             {icon: TrendingUp, label: "Rank Tracking"},
//                             {icon: Link2, label: "Backlink Monitor"},
//                             {icon: Code, label: "Schema Generator"},
//                             {icon: FileText, label: "Content Calendar"},
//                             {icon: RefreshCw, label: "Content Repurposer"},
//                             {icon: Users, label: "Team Collaboration"},
//                             {icon: Globe, label: "Custom Domain"},
//                             {icon: Calendar, label: "Scheduled Publishing"},
//                             {icon: Mail, label: "Newsletter Tool"},
//                             {icon: Shield, label: "Role-Based Access"},
//                             {icon: Clock, label: "Auto-Save & Versioning"},
//                             {icon: Layers, label: "A/B Testing"},
//                             {icon: Zap, label: "AEO Optimizer"},
//                         ].map(({icon: Icon, label}) => (
//                             <div key={label}
//                                  className="flex items-center gap-3 p-3 rounded-xl border bg-background hover:shadow-sm transition-shadow">
//                                 <div
//                                     className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
//                                     <Icon className="h-4 w-4 text-indigo-600"/>
//                                 </div>
//                                 <span className="text-sm font-medium">{label}</span>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── Testimonials ── */}
//             <section className="py-24">
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-16">
//                         <Badge variant="info" className="mb-4">Testimonials</Badge>
//                         <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by SEO professionals</h2>
//                     </div>
//                     <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
//                         {TESTIMONIALS.map((t) => (
//                             <Card key={t.name} className="hover:shadow-md transition-shadow">
//                                 <CardContent className="p-6">
//                                     <div className="flex gap-0.5 mb-4">
//                                         {[...Array(t.rating)].map((_, i) => (
//                                             <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400"/>
//                                         ))}
//                                     </div>
//                                     <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
//                                     <div>
//                                         <p className="text-sm font-semibold">{t.name}</p>
//                                         <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── Pricing preview ── */}
//             {dbPlans.length > 0 && (
//                 <section className="py-24 bg-muted/20">
//                     <div className="container mx-auto px-4">
//                         <div className="text-center mb-16">
//                             <Badge variant="info" className="mb-4">Pricing</Badge>
//                             <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
//                             <p className="text-muted-foreground text-lg">Start free. Upgrade when ready. Cancel
//                                 anytime.</p>
//                         </div>
//                         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
//                             {dbPlans.map((plan) => {
//                                 const f = plan.features;
//                                 const highlights = [
//                                     `${f.aiCreditsPerMonth >= 999999 ? "Unlimited" : f.aiCreditsPerMonth} AI credits`,
//                                     `${f.maxBlogs >= 999999 ? "Unlimited" : f.maxBlogs} blogs`,
//                                     f.keywordResearch ? "Keyword research" : null,
//                                     f.advancedSEO ? "Advanced SEO" : null,
//                                     f.whiteLabel ? "White label" : null,
//                                 ].filter(Boolean) as string[];
//                                 return (
//                                     <Card key={plan._id.toString()}
//                                           className={`relative flex flex-col ${plan.isPopular ? "border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]" : ""}`}>
//                                         {plan.isPopular && (
//                                             <div className="absolute -top-3 left-1/2 -translate-x-1/2">
//                                                 <Badge variant="default"
//                                                        className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">Most
//                                                     Popular</Badge>
//                                             </div>
//                                         )}
//                                         <CardContent className="p-6 flex flex-col flex-1">
//                                             <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
//                                             <div className="mb-4">
//                                                 <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
//                                                 {plan.monthlyPrice > 0 &&
//                                                     <span className="text-muted-foreground text-sm">/mo</span>}
//                                             </div>
//                                             <ul className="space-y-2 mb-6 flex-1">
//                                                 {highlights.slice(0, 5).map((h) => (
//                                                     <li key={h} className="flex items-start gap-2 text-sm">
//                                                         <CheckCircle
//                                                             className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
//                                                         <span className="text-muted-foreground">{h}</span>
//                                                     </li>
//                                                 ))}
//                                             </ul>
//                                             <Button asChild variant={plan.isPopular ? "gradient" : "outline"}
//                                                     className="w-full">
//                                                 <Link href={planCTAHref(plan.slug, plan.monthlyPrice)}>
//                                                     {plan.monthlyPrice === 0 ? "Start Free" : `Get ${plan.name}`}
//                                                 </Link>
//                                             </Button>
//                                         </CardContent>
//                                     </Card>
//                                 );
//                             })}
//                         </div>
//                         <div className="text-center mt-8">
//                             <Link href="/pricing" className="text-sm text-indigo-600 hover:underline">View full pricing
//                                 details →</Link>
//                         </div>
//                     </div>
//                 </section>
//             )}
//
//             {/* ── FAQ ── */}
//             <section className="py-24">
//                 <div className="container mx-auto px-4 max-w-3xl">
//                     <div className="text-center mb-16">
//                         <Badge variant="info" className="mb-4">FAQ</Badge>
//                         <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
//                     </div>
//                     <div className="space-y-3">
//                         {FAQ_ITEMS.map((item) => (
//                             <details key={item.q} className="group rounded-xl border bg-background overflow-hidden">
//                                 <summary
//                                     className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-sm hover:bg-muted/30 transition-colors">
//                                     {item.q}
//                                     <ChevronDown
//                                         className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180"/>
//                                 </summary>
//                                 <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t pt-4">
//                                     {item.a}
//                                 </div>
//                             </details>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//
//             {/* ── Final CTA ── */}
//             <section className="py-24 bg-muted/20">
//                 <div className="container mx-auto px-4 text-center">
//                     <div
//                         className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
//                         <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to supercharge your SEO?</h2>
//                         <p className="text-indigo-100 mb-8 text-lg">Join content teams using AI to dominate search
//                             rankings.</p>
//                         <div className="flex flex-col sm:flex-row gap-3 justify-center">
//                             <Button asChild size="lg"
//                                     className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
//                                 <Link href={isLoggedIn ? dashboardUrl : "/register"}>
//                                     {isLoggedIn ? "Go to Dashboard" : "Get Started Free"} <ArrowRight
//                                     className="h-4 w-4 ml-2"/>
//                                 </Link>
//                             </Button>
//                             <Button asChild size="lg" variant="outline"
//                                     className="border-white/30 text-white hover:bg-white/10">
//                                 <Link href="/demo"><Play className="h-4 w-4 mr-2"/> Try Demo</Link>
//                             </Button>
//                         </div>
//                         <p className="mt-4 text-xs text-indigo-200">No credit card required · 10 free AI credits ·
//                             Cancel anytime</p>
//                     </div>
//                 </div>
//             </section>
//         </div>
//     );
// }
//
