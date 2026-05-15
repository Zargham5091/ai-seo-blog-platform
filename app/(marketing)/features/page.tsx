// app/(marketing)/features/route.ts
import type {Metadata} from "next";
import {generateCMSMetadata, getCMSPage} from "@/components/shared/CMSPageRenderer";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {
    Sparkles, Search, FileText, BarChart3, Shield, Globe,
    Zap, Users, Code, RefreshCw, Clock, CheckCircle, ArrowRight,
    TrendingUp, Link2, Calendar, Mail, Layers, FlaskConical,
    Bell, Gift, Cpu, Repeat2, Star,
} from "lucide-react";
import {
    AnimatedAIMockup,
    AnimatedKeywordsMockup,
    AnimatedAnalyticsMockup,
    BulkGenerateMockup,
} from "@/components/marketing/AnimatedAIMockup";

export async function generateMetadata(): Promise<Metadata> {
    return generateCMSMetadata("features", "Features | SEO Platform");
}

// ── Feature groups ────────────────────────────────────────────────────────────
const featureGroups = [
    {
        category: "AI-Powered Content",
        color: "from-purple-500 to-indigo-500",
        features: [
            {
                icon: Sparkles,
                title: "AI Blog Generator",
                description: "Generate full SEO-optimized blog posts with one prompt. GPT-4o-mini produces titles, HTML content, meta tags, FAQ sections, and internal link placeholders automatically."
            },
            {
                icon: Search,
                title: "Keyword Research",
                description: "AI-estimated search volume, difficulty, CPC, trend direction, and search intent for any seed keyword — plus automatic content idea generation."
            },
            {
                icon: Code,
                title: "Schema Markup Generator",
                description: "Auto-generate JSON-LD structured data for Articles, FAQs, HowTos, Products, and more with one click."
            },
            {
                icon: RefreshCw,
                title: "Content Repurposer",
                description: "Convert blog posts into Twitter threads, LinkedIn posts, newsletters, Instagram captions, and TikTok scripts instantly."
            },
            {
                icon: Zap,
                title: "AEO Optimizer",
                description: "Optimize content for AI answer engines like Perplexity and ChatGPT. Get an AEO score and suggested direct-answer snippets."
            },
            {
                icon: Layers,
                title: "Bulk Content Generator",
                description: "Queue up to 10 blog topics and generate them all at once. All saved as drafts for review. Diamond plan exclusive."
            },
        ],
    },
    {
        category: "Blog & Publishing",
        color: "from-sky-500 to-cyan-500",
        features: [
            {
                icon: FileText,
                title: "Drag-and-Drop Builder",
                description: "Build posts with 10+ block types. Reorder with smooth drag-and-drop. Rich text, images, videos, code, tables, quotes, and custom HTML."
            },
            {
                icon: Clock,
                title: "Auto-Save & Versioning",
                description: "Auto-save every 30 seconds. Full version history — restore any previous state of your content."
            },
            {
                icon: Calendar,
                title: "Scheduled Publishing",
                description: "Write now, publish later. Schedule posts to go live at any time with full calendar view."
            },
            {
                icon: Globe,
                title: "Custom Domain & Subdomain",
                description: "Publish your blog at yourbrand.com or yourbrand.seoplatform.com. DNS management and SSL included."
            },
            {
                icon: Cpu,
                title: "Site Builder",
                description: "Customize your public blog's design, colors, fonts, and layout. Multiple templates to choose from."
            },
            {
                icon: Mail,
                title: "Newsletter Tool",
                description: "Collect subscriber emails and send newsletters directly from the platform. Track opens and clicks."
            },
        ],
    },
    {
        category: "SEO & Analytics",
        color: "from-emerald-500 to-teal-500",
        features: [
            {
                icon: BarChart3,
                title: "SEO Analytics Dashboard",
                description: "Real-time SEO scoring as you write. Track views, published posts, AI credit usage, and average SEO scores across all content."
            },
            {
                icon: TrendingUp,
                title: "Rank Tracking",
                description: "Monitor keyword positions in Google and Bing. Track up to 500 keywords with daily position snapshots."
            },
            {
                icon: Link2,
                title: "Backlink Monitor",
                description: "Track inbound links to your blog. Get alerts for new and lost backlinks automatically."
            },
            {
                icon: Globe,
                title: "Sitemap & Robots.txt",
                description: "Auto-generated XML sitemap always in sync with published content. Configurable robots.txt."
            },
            {
                icon: Search,
                title: "Google Search Console",
                description: "Connect GSC to see impressions, clicks, CTR, and ranking positions for every page inside your dashboard."
            },
            {
                icon: FlaskConical,
                title: "A/B Testing",
                description: "Test different headlines, meta descriptions, and CTAs. Compare performance across post variants."
            },
        ],
    },
    {
        category: "Platform & Security",
        color: "from-orange-500 to-red-500",
        features: [
            {
                icon: Shield,
                title: "Role-Based Access Control",
                description: "Three-tier RBAC: Super Admin, Product Admin, User. Every route and API is protected by role and plan."
            },
            {
                icon: Users,
                title: "Team Collaboration",
                description: "Invite members as Member, Editor, or Admin. Control page-level access. Allocate AI credits per member."
            },
            {
                icon: CheckCircle,
                title: "Multi-Tenant Architecture",
                description: "Every subscriber gets a fully isolated workspace. Data is completely separated between tenants."
            },
            {
                icon: Bell,
                title: "Smart Alerts",
                description: "Get notified for rank drops, new backlinks, low AI credits, plan expiry, and team events. Email or in-app."
            },
            {
                icon: Gift,
                title: "Referral Program",
                description: "Earn commission by referring new subscribers. Track referral signups and earned commissions in your dashboard."
            },
            {
                icon: Star,
                title: "Featured Posts",
                description: "Submit posts to be featured on the platform's blog directory. Approved posts get extra visibility."
            },
        ],
    },
];

// ── Live demo sections (features with animated previews) ──────────────────────
const DEMO_SECTIONS = [
    {
        title: "AI Blog Generator — live preview",
        description: "Watch the AI type out a real blog post structure in real time. This is exactly what happens when you click Generate.",
        Mockup: AnimatedAIMockup,
        href: "/demo",
        ctaLabel: "Try it now — 3 free AI credits",
        gradient: "from-purple-500/10 to-indigo-500/10",
    },
    {
        title: "Keyword Research — live preview",
        description: "See keyword results appear row by row as the AI completes the analysis. Search volume, difficulty, CPC, and trend for every keyword.",
        Mockup: AnimatedKeywordsMockup,
        href: "/demo",
        ctaLabel: "Research keywords free",
        gradient: "from-sky-500/10 to-cyan-500/10",
    },
    {
        title: "Analytics Dashboard — live preview",
        description: "Real stats cards, live chart, and top-performing posts all load in sequence. This is your dashboard after publishing content.",
        Mockup: AnimatedAnalyticsMockup,
        href: "/register",
        ctaLabel: "Start tracking your content",
        gradient: "from-emerald-500/10 to-teal-500/10",
    },
    {
        title: "Bulk Generate — live preview",
        description: "Queue 10 topics and watch each post generate and save as a draft automatically. Diamond plan exclusive feature.",
        Mockup: BulkGenerateMockup,
        href: "/pricing",
        ctaLabel: "View Diamond plan",
        gradient: "from-violet-500/10 to-purple-500/10",
    },
];

export default async function FeaturesPage() {
    const page = await getCMSPage("features");

    return (
        <div className="py-16">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-sky-500 text-white py-20 mb-16">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="bg-white/20 text-white border-0 mb-4">
                        <Zap className="h-3 w-3 mr-1"/> Full Feature List
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        {page?.title || "Everything you need to dominate SEO"}
                    </h1>
                    <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
                        A complete suite of AI-powered tools built for creators, marketers, and agencies who are serious
                        about search rankings.
                    </p>
                    <div className="flex gap-4 justify-center mt-8">
                        <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
                            <Link href="/register">Start Free <ArrowRight className="h-4 w-4 ml-2"/></Link>
                        </Button>
                        <Button asChild size="lg" variant="outline"
                                className="border-white/30 text-white bg-white/10 hover:bg-white/20">
                            <Link href="/demo">Interactive Demo</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {/* CMS content */}
                {page?.content && (
                    <div className="prose prose-lg dark:prose-invert max-w-none mb-16 mx-auto"
                         dangerouslySetInnerHTML={{__html: page.content}}/>
                )}

                {/* ── Live animated previews ── */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <Badge variant="info" className="mb-4">Live Previews</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">See the features in action</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            These are real simulations of the actual interface — not screenshots or videos.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {DEMO_SECTIONS.map((section) => (
                            <div key={section.title} className="space-y-4">
                                <div className={`relative rounded-2xl bg-gradient-to-br ${section.gradient} p-1`}>
                                    <section.Mockup/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base mb-1">{section.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                                    <Button asChild variant="outline" size="sm" className="gap-2">
                                        <Link href={section.href}>{section.ctaLabel} <ArrowRight
                                            className="h-3.5 w-3.5"/></Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Feature groups ── */}
                <div className="space-y-20">
                    {featureGroups.map((group) => (
                        <div key={group.category}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${group.color}`}/>
                                <h2 className="text-2xl font-bold">{group.category}</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {group.features.map((feature) => (
                                    <Card key={feature.title}
                                          className="group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                                        <CardContent className="p-5">
                                            <div
                                                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${group.color} mb-4`}>
                                                <feature.icon className="h-5 w-5 text-white"/>
                                            </div>
                                            <h3 className="font-semibold mb-2 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div
                    className="mt-20 text-center bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
                    <p className="text-indigo-100 mb-8">Start free — no credit card required. Upgrade anytime.</p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
                            <Link href="/register">Start Free — 10 AI Credits</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline"
                                className="border-white/30 text-white hover:bg-white/10">
                            <Link href="/pricing">View Pricing</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
// import type {Metadata} from "next";
// import {generateCMSMetadata, getCMSPage} from "@/components/shared/CMSPageRenderer";
// import {Card, CardContent} from "@/components/ui/card";
// import {Badge} from "@/components/ui/form-elements";
// import {Button} from "@/components/ui/button";
// import Link from "next/link";
// import {
//     Sparkles, Search, FileText, BarChart3, Shield, Globe,
//     Zap, Users, Code, Image, RefreshCw, Clock, CheckCircle, ArrowRight,
// } from "lucide-react";
//
// export async function generateMetadata(): Promise<Metadata> {
//     return generateCMSMetadata("features", "Features | SEO Platform");
// }
//
// const featureGroups = [
//     {
//         category: "AI-Powered Content",
//         color: "from-purple-500 to-indigo-500",
//         features: [
//             {
//                 icon: Sparkles,
//                 title: "AI Blog Generator",
//                 description: "Generate full SEO-optimized blog posts with a single prompt. GPT-4o-mini produces titles, content, meta tags, and tags automatically."
//             },
//             {
//                 icon: Search,
//                 title: "Keyword Research",
//                 description: "Discover profitable keywords with AI-estimated search volume, difficulty scores, CPC data, and trend direction."
//             },
//             {
//                 icon: Code,
//                 title: "Schema Markup Generator",
//                 description: "Auto-generate JSON-LD structured data for Articles, FAQs, HowTos, and more to enhance search visibility."
//             },
//             {
//                 icon: RefreshCw,
//                 title: "Content Optimizer",
//                 description: "Analyze existing content for SEO score, readability, keyword density, and get AI-powered improvement suggestions."
//             },
//         ],
//     },
//     {
//         category: "Blog Builder",
//         color: "from-sky-500 to-cyan-500",
//         features: [
//             {
//                 icon: FileText,
//                 title: "Drag-and-Drop Builder",
//                 description: "Build blog posts with 10+ content block types. Reorder blocks with smooth drag-and-drop powered by dnd-kit."
//             },
//             {
//                 icon: Image,
//                 title: "Rich Media Support",
//                 description: "Embed images, YouTube videos, code snippets, tables, quotes, and custom HTML — all from the editor."
//             },
//             {
//                 icon: Clock,
//                 title: "Auto-Save & Versioning",
//                 description: "Never lose work. Auto-save every 30 seconds with full version history so you can revert to any previous state."
//             },
//             {
//                 icon: Zap,
//                 title: "Scheduled Publishing",
//                 description: "Write now, publish later. Schedule blog posts to go live at the perfect time for your audience."
//             },
//         ],
//     },
//     {
//         category: "SEO & Analytics",
//         color: "from-emerald-500 to-teal-500",
//         features: [
//             {
//                 icon: BarChart3,
//                 title: "SEO Score Dashboard",
//                 description: "Real-time SEO scoring as you write. Visual score circle with actionable suggestions for every post."
//             },
//             {
//                 icon: Globe,
//                 title: "Sitemap & Robots.txt",
//                 description: "Automatic XML sitemap generation and robots.txt configuration. Always up to date with your published content."
//             },
//             {
//                 icon: Search,
//                 title: "Internal Link Suggestions",
//                 description: "AI analyzes your content library and suggests relevant internal linking opportunities automatically."
//             },
//             {
//                 icon: BarChart3,
//                 title: "Analytics Dashboard",
//                 description: "Track page views, published posts, SEO performance, and AI credit usage in one clean dashboard."
//             },
//         ],
//     },
//     {
//         category: "Platform & Security",
//         color: "from-orange-500 to-red-500",
//         features: [
//             {
//                 icon: Shield,
//                 title: "Role-Based Access Control",
//                 description: "Three-tier RBAC: Super Admin, Product Admin, User. Every route and API is protected by role and plan."
//             },
//             {
//                 icon: Users,
//                 title: "Team Collaboration",
//                 description: "Invite team members with Owner, Editor, or Viewer roles. Manage access at the plan level."
//             },
//             {
//                 icon: CheckCircle,
//                 title: "Multi-Tenant Architecture",
//                 description: "Every subscriber gets an isolated workspace. Data is fully separated between tenants."
//             },
//             {
//                 icon: Zap,
//                 title: "Rate Limiting",
//                 description: "Upstash Redis-powered rate limiting protects all API endpoints from abuse and ensures fair usage."
//             },
//         ],
//     },
// ];
//
// export default async function FeaturesPage() {
//     const page = await getCMSPage("features");
//
//     return (
//         <div className="py-16">
//             {/* Header */}
//             <div className="bg-gradient-to-br from-indigo-600 to-sky-500 text-white py-20 mb-16">
//                 <div className="container mx-auto px-4 text-center">
//                     <Badge className="bg-white/20 text-white border-0 mb-4">
//                         <Zap className="h-3 w-3 mr-1"/> Full Feature List
//                     </Badge>
//                     <h1 className="text-4xl md:text-6xl font-bold mb-4">
//                         {page?.title || "Everything you need to dominate SEO"}
//                     </h1>
//                     <p className="text-indigo-100 text-lg max-w-2xl mx-auto">
//                         A complete suite of AI-powered tools built for creators, marketers, and agencies who are serious
//                         about search rankings.
//                     </p>
//                     <div className="flex gap-4 justify-center mt-8">
//                         <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
//                             <Link href="/register">Start Free <ArrowRight className="h-4 w-4 ml-2"/></Link>
//                         </Button>
//                         <Button asChild size="lg" variant="outline"
//                                 className="border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/40 gap-2"
//                         >
//                             <Link href="/demo">Live Demo</Link>
//                         </Button>
//                     </div>
//                 </div>
//             </div>
//
//             <div className="container mx-auto px-4">
//                 {/* CMS-injected content */}
//                 {page?.content && (
//                     <div
//                         className="prose prose-lg dark:prose-invert max-w-none mb-16 mx-auto"
//                         dangerouslySetInnerHTML={{__html: page.content}}
//                     />
//                 )}
//
//                 {/* Feature groups */}
//                 <div className="space-y-20">
//                     {featureGroups.map((group) => (
//                         <div key={group.category}>
//                             <div className="flex items-center gap-3 mb-8">
//                                 <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${group.color}`}/>
//                                 <h2 className="text-2xl font-bold">{group.category}</h2>
//                             </div>
//                             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
//                                 {group.features.map((feature) => (
//                                     <Card key={feature.title}
//                                           className="group hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
//                                         <CardContent className="p-5">
//                                             <div
//                                                 className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${group.color} mb-4`}>
//                                                 <feature.icon className="h-5 w-5 text-white"/>
//                                             </div>
//                                             <h3 className="font-semibold mb-2 group-hover:text-indigo-600 transition-colors">{feature.title}</h3>
//                                             <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
//                                         </CardContent>
//                                     </Card>
//                                 ))}
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//
//                 {/* CTA */}
//                 <div
//                     className="mt-20 text-center bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
//                     <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
//                     <p className="text-indigo-100 mb-8">Join thousands of creators using AI to dominate their search
//                         rankings.</p>
//                     <Button asChild size="xl" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
//                         <Link href="/register">Start Free — No Credit Card Required</Link>
//                     </Button>
//                 </div>
//             </div>
//         </div>
//     );
// }
