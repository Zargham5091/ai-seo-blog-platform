import type { Metadata } from "next";
import { getCMSPage } from "@/components/shared/CMSPageRenderer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/form-elements";
import { BookOpen, Zap, CreditCard, Search, FileText, Shield, Code, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentation | SEO Platform",
  description: "Complete documentation for SEO Platform — setup guides, API reference, and feature tutorials.",
};

const docSections = [
  {
    icon: Zap,
    title: "Getting Started",
    color: "from-indigo-500 to-indigo-600",
    articles: [
      { title: "Quick Start Guide", desc: "Set up your account and create your first blog post" },
      { title: "Environment Setup", desc: "Configure .env variables and connect your services" },
      { title: "Database Seeding", desc: "Populate your database with demo data" },
    ],
  },
  {
    icon: FileText,
    title: "Blog Builder",
    color: "from-sky-500 to-sky-600",
    articles: [
      { title: "Creating Blog Posts", desc: "Using the drag-and-drop block builder" },
      { title: "Tiptap Rich Text Editor", desc: "Full toolbar guide and keyboard shortcuts" },
      { title: "Auto-Save & Versioning", desc: "How drafts and version history work" },
      { title: "Scheduling Posts", desc: "How to schedule blog posts for future publishing" },
    ],
  },
  {
    icon: Search,
    title: "SEO Tools",
    color: "from-emerald-500 to-emerald-600",
    articles: [
      { title: "Keyword Research", desc: "Finding and saving high-value keywords with AI" },
      { title: "SEO Score Explained", desc: "How the 0-100 score is calculated" },
      { title: "Schema Markup Generator", desc: "Auto-generating JSON-LD structured data" },
      { title: "Sitemap & Robots.txt", desc: "Automatic generation and submission" },
    ],
  },
  {
    icon: Zap,
    title: "AI Features",
    color: "from-purple-500 to-purple-600",
    articles: [
      { title: "AI Blog Generation", desc: "Generating complete posts with a single prompt" },
      { title: "Content Analysis", desc: "Analyzing and improving existing content" },
      { title: "AI Credits System", desc: "How credits work and plan limits" },
      { title: "Internal Link Suggestions", desc: "AI-powered internal linking recommendations" },
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Subscriptions",
    color: "from-orange-500 to-orange-600",
    articles: [
      { title: "Subscription Plans", desc: "Free, Silver, Gold, and Diamond plan comparison" },
      { title: "Stripe Payments", desc: "Setting up card-based subscriptions" },
      { title: "Crypto Payments", desc: "Paying with Coinbase Commerce" },
      { title: "Upgrading & Downgrading", desc: "How plan changes are handled" },
    ],
  },
  {
    icon: Shield,
    title: "Admin & Security",
    color: "from-red-500 to-red-600",
    articles: [
      { title: "User Roles Explained", desc: "Super Admin, Product Admin, and User roles" },
      { title: "Super Admin Guide", desc: "Managing users, plans, and CMS pages" },
      { title: "Team Management", desc: "Inviting and managing team members" },
      { title: "Rate Limiting", desc: "How Upstash Redis protects your API" },
    ],
  },
  {
    icon: Code,
    title: "API Reference",
    color: "from-slate-500 to-slate-700",
    articles: [
      { title: "Authentication", desc: "NextAuth.js v4 JWT session handling" },
      { title: "Blog API", desc: "CRUD operations for blog posts" },
      { title: "AI API", desc: "Generate, analyze, and research endpoints" },
      { title: "Webhooks", desc: "Stripe and Coinbase webhook handling" },
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics",
    color: "from-teal-500 to-teal-600",
    articles: [
      { title: "Dashboard Overview", desc: "Understanding your analytics dashboard" },
      { title: "Super Admin Analytics", desc: "Platform-wide metrics and MRR tracking" },
      { title: "Google Analytics Setup", desc: "Connecting GA4 to your platform" },
    ],
  },
];

export default async function DocumentationPage() {
  const page = await getCMSPage("documentation");

  return (
    <div className="py-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-slate-800 text-white py-20 mb-12">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-white/20 text-white border-0 mb-4">
            <BookOpen className="h-3 w-3 mr-1" /> Documentation
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{page?.title || "SEO Platform Documentation"}</h1>
          <p className="text-indigo-200 text-lg max-w-xl mx-auto">
            Everything you need to set up, configure, and get the most out of SEO Platform.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        {/* CMS injected content */}
        {page?.content && (
          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )}

        {/* Quick links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { label: "Quick Start", desc: "Get running in 5 minutes", href: "#getting-started", icon: Zap, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" },
            { label: "API Reference", desc: "Full endpoint documentation", href: "#api-reference", icon: Code, color: "text-slate-600 bg-slate-50 dark:bg-slate-900/30" },
            { label: "Video Tutorials", desc: "Step-by-step walkthroughs", href: "/demo", icon: BarChart3, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" },
          ].map((q) => (
            <Link key={q.label} href={q.href} className="group flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition-all">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${q.color}`}>
                <q.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-indigo-600 transition-colors">{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Doc sections grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {docSections.map((section) => (
            <Card key={section.title} id={section.title.toLowerCase().replace(/\s+/g, "-")} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${section.color} shrink-0`}>
                    <section.icon className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="font-bold text-base">{section.title}</h2>
                </div>
                <ul className="space-y-2.5">
                  {section.articles.map((article) => (
                    <li key={article.title}>
                      <div className="flex items-start gap-2 group cursor-pointer">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-indigo-600 transition-colors mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{article.title}</p>
                          <p className="text-xs text-muted-foreground">{article.desc}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help CTA */}
        <div className="mt-12 text-center p-8 rounded-2xl bg-muted/30 border">
          <h3 className="font-bold text-xl mb-2">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-4">Our support team is here to help.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            Contact Support <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
