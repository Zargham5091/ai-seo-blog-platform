import type {Metadata} from "next";
import {generateCMSMetadata, getCMSPage} from "@/components/shared/CMSPageRenderer";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/form-elements";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {
    Sparkles, Search, FileText, BarChart3, Shield, Globe,
    Zap, Users, Code, Image, RefreshCw, Clock, CheckCircle, ArrowRight,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
    return generateCMSMetadata("features", "Features | SEO Platform");
}

const featureGroups = [
    {
        category: "AI-Powered Content",
        color: "from-purple-500 to-indigo-500",
        features: [
            {
                icon: Sparkles,
                title: "AI Blog Generator",
                description: "Generate full SEO-optimized blog posts with a single prompt. GPT-4o-mini produces titles, content, meta tags, and tags automatically."
            },
            {
                icon: Search,
                title: "Keyword Research",
                description: "Discover profitable keywords with AI-estimated search volume, difficulty scores, CPC data, and trend direction."
            },
            {
                icon: Code,
                title: "Schema Markup Generator",
                description: "Auto-generate JSON-LD structured data for Articles, FAQs, HowTos, and more to enhance search visibility."
            },
            {
                icon: RefreshCw,
                title: "Content Optimizer",
                description: "Analyze existing content for SEO score, readability, keyword density, and get AI-powered improvement suggestions."
            },
        ],
    },
    {
        category: "Blog Builder",
        color: "from-sky-500 to-cyan-500",
        features: [
            {
                icon: FileText,
                title: "Drag-and-Drop Builder",
                description: "Build blog posts with 10+ content block types. Reorder blocks with smooth drag-and-drop powered by dnd-kit."
            },
            {
                icon: Image,
                title: "Rich Media Support",
                description: "Embed images, YouTube videos, code snippets, tables, quotes, and custom HTML — all from the editor."
            },
            {
                icon: Clock,
                title: "Auto-Save & Versioning",
                description: "Never lose work. Auto-save every 30 seconds with full version history so you can revert to any previous state."
            },
            {
                icon: Zap,
                title: "Scheduled Publishing",
                description: "Write now, publish later. Schedule blog posts to go live at the perfect time for your audience."
            },
        ],
    },
    {
        category: "SEO & Analytics",
        color: "from-emerald-500 to-teal-500",
        features: [
            {
                icon: BarChart3,
                title: "SEO Score Dashboard",
                description: "Real-time SEO scoring as you write. Visual score circle with actionable suggestions for every post."
            },
            {
                icon: Globe,
                title: "Sitemap & Robots.txt",
                description: "Automatic XML sitemap generation and robots.txt configuration. Always up to date with your published content."
            },
            {
                icon: Search,
                title: "Internal Link Suggestions",
                description: "AI analyzes your content library and suggests relevant internal linking opportunities automatically."
            },
            {
                icon: BarChart3,
                title: "Analytics Dashboard",
                description: "Track page views, published posts, SEO performance, and AI credit usage in one clean dashboard."
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
                description: "Invite team members with Owner, Editor, or Viewer roles. Manage access at the plan level."
            },
            {
                icon: CheckCircle,
                title: "Multi-Tenant Architecture",
                description: "Every subscriber gets an isolated workspace. Data is fully separated between tenants."
            },
            {
                icon: Zap,
                title: "Rate Limiting",
                description: "Upstash Redis-powered rate limiting protects all API endpoints from abuse and ensures fair usage."
            },
        ],
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
                                className="border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/40 gap-2"
                        >
                            <Link href="/demo">Live Demo</Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4">
                {/* CMS-injected content */}
                {page?.content && (
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none mb-16 mx-auto"
                        dangerouslySetInnerHTML={{__html: page.content}}
                    />
                )}

                {/* Feature groups */}
                <div className="space-y-20">
                    {featureGroups.map((group) => (
                        <div key={group.category}>
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${group.color}`}/>
                                <h2 className="text-2xl font-bold">{group.category}</h2>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                    <p className="text-indigo-100 mb-8">Join thousands of creators using AI to dominate their search
                        rankings.</p>
                    <Button asChild size="xl" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
                        <Link href="/register">Start Free — No Credit Card Required</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
