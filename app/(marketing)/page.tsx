import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/form-elements";
import { Card, CardContent } from "@/components/ui/card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PlanModel from "@/models/Plan";
import CMSPageModel from "@/models/CMSPage";

export const metadata: Metadata = {
  title: "AI-Powered SEO Platform — Generate, Optimize & Publish",
  description: "The all-in-one SEO platform powered by AI.",
};

// Home page hero/features section is editable from CMS
// Stats are from CMS too (super admin sets them)
const DEFAULT_STATS = [
  { value: "10x", label: "Faster content creation" },
  { value: "85%", label: "SEO score improvement" },
  { value: "50+", label: "SEO checks per post" },
  { value: "Free", label: "To get started" },
];

export default async function HomePage() {
  await connectDB();

  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;
  const dashboardUrl =
      session?.user?.role === "super_admin"
          ? "/dashboard/super-admin"
          : session?.user?.role === "product_admin"
              ? "/dashboard/admin"
              : "/dashboard/user";

  // Load top 4 plans from DB
  const [dbPlans, homePage] = await Promise.all([
    PlanModel.find({ isActive: true }).sort({ order: 1 }).limit(4).lean(),
    CMSPageModel.findOne({ slug: "home", isPublished: true }).lean(),
  ]);

  // Super admin can set custom stats via CMS slug "home-stats"
  // If not set we fall back to defaults
  const statsPage = await CMSPageModel.findOne({ slug: "home-stats", isPublished: true }).lean();
  const stats = statsPage?.content
      ? (() => { try { return JSON.parse(statsPage.content as string); } catch { return DEFAULT_STATS; } })()
      : DEFAULT_STATS;

  const planCTAHref = (slug: string, price: number) => {
    if (!isLoggedIn) return price === 0 ? "/register" : `/register?plan=${slug}`;
    if (price === 0) return dashboardUrl;
    return `/dashboard/admin/settings?upgrade=${slug}`;
  };

  return (
      <div className="flex flex-col">
        {/* Hero — content editable from CMS */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl" />
          </div>
          <div className="container mx-auto px-4 text-center">
            <Badge variant="info" className="mb-6 gap-1.5 px-3 py-1 text-xs">
              <Zap className="h-3 w-3" /> Powered by GPT-4o-mini
            </Badge>

            {/* If CMS has custom home content, render it; otherwise use default */}
            {homePage?.content ? (
                <div
                    className="prose prose-lg dark:prose-invert max-w-4xl mx-auto mb-8"
                    dangerouslySetInnerHTML={{ __html: homePage.content as string }}
                />
            ) : (
                <>
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl mx-auto">
                    The{" "}
                    <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
                  AI-Powered SEO Platform
                </span>{" "}
                    for Modern Teams
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                    Generate optimized content, research keywords, analyze competitors, and publish beautiful blogs — all with AI assistance.
                  </p>
                </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoggedIn ? (
                  <>
                    <Button asChild size="xl" variant="gradient" className="gap-2">
                      <Link href={dashboardUrl}>Go to Dashboard <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild size="xl" variant="outline">
                      <Link href="/demo">View Live Demo</Link>
                    </Button>
                  </>
              ) : (
                  <>
                    <Button asChild size="xl" variant="gradient" className="gap-2">
                      <Link href="/register">Start Free Today <ArrowRight className="h-4 w-4" /></Link>
                    </Button>
                    <Button asChild size="xl" variant="outline">
                      <Link href="/demo">View Live Demo</Link>
                    </Button>
                  </>
              )}
            </div>
            {!isLoggedIn && (
                <p className="mt-4 text-sm text-muted-foreground">No credit card required · Cancel anytime</p>
            )}
          </div>
        </section>

        {/* Stats — from CMS or defaults */}
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

        {/* Pricing preview — from DB */}
        {dbPlans.length > 0 && (
            <section className="py-24 bg-muted/20">
              <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                  <Badge variant="info" className="mb-4">Pricing</Badge>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
                  <p className="text-muted-foreground text-lg">Start free. Upgrade when ready. Cancel anytime.</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                  {dbPlans.map((plan) => {
                    const f = plan.features;
                    const highlights = [
                      `${f.aiCreditsPerMonth >= 999999 ? "Unlimited" : f.aiCreditsPerMonth} AI credits`,
                      `${f.maxBlogs >= 999999 ? "Unlimited" : `${f.maxBlogs}`} blogs`,
                      f.keywordResearch ? "Keyword research" : null,
                      f.advancedSEO ? "Advanced SEO" : null,
                      f.whiteLabel ? "White label" : null,
                    ].filter(Boolean) as string[];

                    return (
                        <Card key={plan._id.toString()} className={`relative flex flex-col ${plan.isPopular ? "border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]" : ""}`}>
                          {plan.isPopular && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge variant="default" className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">Most Popular</Badge>
                              </div>
                          )}
                          <CardContent className="p-6 flex flex-col flex-1">
                            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                            <div className="mb-4">
                              <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                              {plan.monthlyPrice > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
                            </div>
                            <ul className="space-y-2 mb-6 flex-1">
                              {highlights.slice(0, 5).map((h) => (
                                  <li key={h} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">{h}</span>
                                  </li>
                              ))}
                            </ul>
                            <Button asChild variant={plan.isPopular ? "gradient" : "outline"} className="w-full">
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
                  <Link href="/pricing" className="text-sm text-indigo-600 hover:underline">
                    View full pricing details →
                  </Link>
                </div>
              </div>
            </section>
        )}

        {/* CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to supercharge your SEO?</h2>
              <p className="text-indigo-100 mb-8 text-lg">Join thousands of creators using AI to dominate search rankings.</p>
              <Button asChild size="xl" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
                <Link href={isLoggedIn ? dashboardUrl : "/register"}>
                  {isLoggedIn ? "Go to Dashboard" : "Get Started Free"} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
  );
}


// import type { Metadata } from "next";
// import Link from "next/link";
// import { ArrowRight, Sparkles, Search, BarChart3, FileText, Shield, Zap, Globe, CheckCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/form-elements";
// import { Card, CardContent } from "@/components/ui/card";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
//
// export const metadata: Metadata = {
//   title: "AI-Powered SEO Platform — Generate, Optimize & Publish",
//   description: "The all-in-one SEO platform powered by AI. Generate optimized blog content, research keywords, analyze competitors, and publish with our drag-and-drop builder.",
// };
//
// const features = [
//   { icon: Sparkles, title: "AI Content Generation", description: "Generate full SEO-optimized blog posts in seconds with GPT-4o-mini. Complete with meta tags, schema markup, and keyword optimization.", color: "from-purple-500 to-indigo-500" },
//   { icon: Search, title: "Keyword Research", description: "Discover high-value keywords with search volume, difficulty scores, CPC data, and trend analysis — all AI-powered.", color: "from-indigo-500 to-sky-500" },
//   { icon: FileText, title: "Drag-and-Drop Blog Builder", description: "Build beautiful blog posts with 10+ content blocks. Reorder, customize and preview in real time with Tiptap editor.", color: "from-sky-500 to-emerald-500" },
//   { icon: BarChart3, title: "SEO Analytics", description: "Track your SEO performance, monitor keyword rankings, analyze traffic patterns and measure content effectiveness.", color: "from-emerald-500 to-teal-500" },
//   { icon: Shield, title: "Role-Based Access", description: "Multi-tenant architecture with Super Admin, Product Admin, and User roles. Full RBAC with subscription-gated features.", color: "from-orange-500 to-red-500" },
//   { icon: Globe, title: "Schema & Sitemap", description: "Auto-generate JSON-LD structured data, XML sitemaps, and robots.txt for maximum search engine visibility.", color: "from-pink-500 to-rose-500" },
// ];
//
// const plans = [
//   { name: "Free", price: 0, features: ["10 AI credits/month", "3 blogs", "Basic SEO tools", "Demo access"], cta: "Start Free", slug: "free" },
//   { name: "Silver", price: 29, features: ["100 AI credits/month", "25 blogs", "Keyword research", "Analytics dashboard", "Team (3 members)"], cta: "Get Silver", slug: "silver" },
//   { name: "Gold", price: 79, features: ["500 AI credits/month", "100 blogs", "Advanced AI tools", "Analytics", "API access", "Team (10 members)"], cta: "Get Gold", slug: "gold", popular: true },
//   { name: "Diamond", price: 199, features: ["2000 AI credits/month", "Unlimited blogs", "Everything in Gold", "White label", "Priority support"], cta: "Get Diamond", slug: "diamond" },
// ];
//
// const stats = [
//   { value: "10x", label: "Faster content creation" },
//   { value: "85%", label: "Average SEO score improvement" },
//   { value: "50+", label: "SEO checks per post" },
//   { value: "4.9★", label: "Average user rating" },
// ];
//
// export default async function HomePage() {
//   const session = await getServerSession(authOptions);
//   const isLoggedIn = !!session;
//
//   const dashboardUrl =
//       session?.user?.role === "super_admin"
//           ? "/dashboard/super-admin"
//           : session?.user?.role === "product_admin"
//               ? "/dashboard/admin"
//               : "/dashboard/user";
//
//   // If logged in → go to settings upgrade page. If not → go to register with plan pre-selected.
//   const planCTAHref = (slug: string) => {
//     if (slug === "free") return isLoggedIn ? dashboardUrl : "/register";
//     return isLoggedIn
//         ? `/dashboard/admin/settings?upgrade=${slug}`
//         : `/register?plan=${slug}`;
//   };
//
//   return (
//       <div className="flex flex-col">
//         {/* Hero */}
//         <section className="relative overflow-hidden py-20 md:py-32">
//           <div className="absolute inset-0 -z-10">
//             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl" />
//           </div>
//           <div className="container mx-auto px-4 text-center">
//             <Badge variant="info" className="mb-6 gap-1.5 px-3 py-1 text-xs">
//               <Zap className="h-3 w-3" /> Powered by GPT-4o-mini & Next.js 14
//             </Badge>
//             <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl mx-auto">
//               The{" "}
//               <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
//               AI-Powered SEO Platform
//             </span>{" "}
//               for Modern Teams
//             </h1>
//             <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
//               Generate optimized content, research keywords, analyze competitors, and publish beautiful blogs — all with AI assistance and a drag-and-drop builder.
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               {isLoggedIn ? (
//                   <>
//                     <Button asChild size="xl" variant="gradient" className="gap-2">
//                       <Link href={dashboardUrl}>
//                         Go to Dashboard <ArrowRight className="h-4 w-4" />
//                       </Link>
//                     </Button>
//                     <Button asChild size="xl" variant="outline">
//                       <Link href="/demo">View Live Demo</Link>
//                     </Button>
//                   </>
//               ) : (
//                   <>
//                     <Button asChild size="xl" variant="gradient" className="gap-2">
//                       <Link href="/register">
//                         Start Free Today <ArrowRight className="h-4 w-4" />
//                       </Link>
//                     </Button>
//                     <Button asChild size="xl" variant="outline">
//                       <Link href="/demo">View Live Demo</Link>
//                     </Button>
//                   </>
//               )}
//             </div>
//             {!isLoggedIn && (
//                 <p className="mt-4 text-sm text-muted-foreground">
//                   No credit card required · 10 free AI credits · Cancel anytime
//                 </p>
//             )}
//           </div>
//         </section>
//
//         {/* Stats */}
//         <section className="py-12 border-y bg-muted/20">
//           <div className="container mx-auto px-4">
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//               {stats.map((s) => (
//                   <div key={s.label}>
//                     <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
//                       {s.value}
//                     </p>
//                     <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
//                   </div>
//               ))}
//             </div>
//           </div>
//         </section>
//
//         {/* Features */}
//         <section className="py-24">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-16">
//               <Badge variant="info" className="mb-4">Features</Badge>
//               <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to dominate SEO</h2>
//               <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
//                 A complete suite of AI-powered tools to research, create, optimize, and publish SEO content at scale.
//               </p>
//             </div>
//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {features.map((f) => (
//                   <Card key={f.title} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
//                     <CardContent className="p-6">
//                       <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
//                         <f.icon className="h-5 w-5 text-white" />
//                       </div>
//                       <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
//                       <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
//                     </CardContent>
//                   </Card>
//               ))}
//             </div>
//           </div>
//         </section>
//
//         {/* Pricing */}
//         <section className="py-24 bg-muted/20">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-16">
//               <Badge variant="info" className="mb-4">Pricing</Badge>
//               <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
//               <p className="text-muted-foreground text-lg">
//                 Start free. Upgrade when you&apos;re ready. Cancel anytime.
//               </p>
//             </div>
//             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
//               {plans.map((plan) => (
//                   <Card
//                       key={plan.name}
//                       className={`relative flex flex-col ${
//                           plan.popular ? "border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]" : ""
//                       }`}
//                   >
//                     {plan.popular && (
//                         <div className="absolute -top-3 left-1/2 -translate-x-1/2">
//                           <Badge variant="default" className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">
//                             Most Popular
//                           </Badge>
//                         </div>
//                     )}
//                     <CardContent className="p-6 flex flex-col flex-1">
//                       <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
//                       <div className="mb-4">
//                         <span className="text-3xl font-bold">${plan.price}</span>
//                         {plan.price > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
//                       </div>
//                       <ul className="space-y-2 mb-6 flex-1">
//                         {plan.features.map((f) => (
//                             <li key={f} className="flex items-start gap-2 text-sm">
//                               <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
//                               <span className="text-muted-foreground">{f}</span>
//                             </li>
//                         ))}
//                       </ul>
//                       <Button
//                           asChild
//                           variant={plan.popular ? "gradient" : "outline"}
//                           className="w-full"
//                       >
//                         <Link href={planCTAHref(plan.slug)}>{plan.cta}</Link>
//                       </Button>
//                     </CardContent>
//                   </Card>
//               ))}
//             </div>
//           </div>
//         </section>
//
//         {/* CTA */}
//         <section className="py-24">
//           <div className="container mx-auto px-4 text-center">
//             <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
//               <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to supercharge your SEO?</h2>
//               <p className="text-indigo-100 mb-8 text-lg">
//                 Join thousands of creators and businesses using AI to dominate search rankings.
//               </p>
//               <Button
//                   asChild
//                   size="xl"
//                   className="bg-white text-indigo-600 hover:bg-white/90 font-semibold"
//               >
//                 <Link href={isLoggedIn ? dashboardUrl : "/register"}>
//                   {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}{" "}
//                   <ArrowRight className="h-4 w-4 ml-2" />
//                 </Link>
//               </Button>
//             </div>
//           </div>
//         </section>
//       </div>
//   );
// }
//
//
//
//
//
//
// // import type { Metadata } from "next";
// // import Link from "next/link";
// // import { ArrowRight, Sparkles, Search, BarChart3, FileText, Shield, Zap, Globe, CheckCircle } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/form-elements";
// // import { Card, CardContent } from "@/components/ui/card";
// //
// // export const metadata: Metadata = {
// //   title: "AI-Powered SEO Platform — Generate, Optimize & Publish",
// //   description: "The all-in-one SEO platform powered by AI. Generate optimized blog content, research keywords, analyze competitors, and publish with our drag-and-drop builder.",
// // };
// //
// // const features = [
// //   { icon: Sparkles, title: "AI Content Generation", description: "Generate full SEO-optimized blog posts in seconds with GPT-4o-mini. Complete with meta tags, schema markup, and keyword optimization.", color: "from-purple-500 to-indigo-500" },
// //   { icon: Search, title: "Keyword Research", description: "Discover high-value keywords with search volume, difficulty scores, CPC data, and trend analysis — all AI-powered.", color: "from-indigo-500 to-sky-500" },
// //   { icon: FileText, title: "Drag-and-Drop Blog Builder", description: "Build beautiful blog posts with 10+ content blocks. Reorder, customize and preview in real time with Tiptap editor.", color: "from-sky-500 to-emerald-500" },
// //   { icon: BarChart3, title: "SEO Analytics", description: "Track your SEO performance, monitor keyword rankings, analyze traffic patterns and measure content effectiveness.", color: "from-emerald-500 to-teal-500" },
// //   { icon: Shield, title: "Role-Based Access", description: "Multi-tenant architecture with Super Admin, Product Admin, and User roles. Full RBAC with subscription-gated features.", color: "from-orange-500 to-red-500" },
// //   { icon: Globe, title: "Schema & Sitemap", description: "Auto-generate JSON-LD structured data, XML sitemaps, and robots.txt for maximum search engine visibility.", color: "from-pink-500 to-rose-500" },
// // ];
// //
// // const plans = [
// //   { name: "Free", price: 0, features: ["10 AI credits/month", "3 blogs", "Basic SEO tools", "Demo access"], cta: "Start Free", href: "/register", popular: false },
// //   { name: "Silver", price: 29, features: ["100 AI credits/month", "25 blogs", "Keyword research", "Analytics dashboard", "Team (3 members)"], cta: "Get Silver", href: "/register?plan=silver", popular: false },
// //   { name: "Gold", price: 79, features: ["500 AI credits/month", "100 blogs", "Advanced SEO", "Competitor analysis", "Schema generator", "API access", "Team (10 members)"], cta: "Get Gold", href: "/register?plan=gold", popular: true },
// //   { name: "Diamond", price: 199, features: ["2000 AI credits/month", "Unlimited blogs", "Everything in Gold", "White label", "Bulk generation", "Priority support", "Custom domain"], cta: "Get Diamond", href: "/register?plan=diamond", popular: false },
// // ];
// //
// // const stats = [
// //   { value: "10x", label: "Faster content creation" },
// //   { value: "85%", label: "Average SEO score improvement" },
// //   { value: "50+", label: "SEO checks per post" },
// //   { value: "4.9★", label: "Average user rating" },
// // ];
// //
// // export default function HomePage() {
// //   return (
// //     <div className="flex flex-col">
// //       {/* Hero */}
// //       <section className="relative overflow-hidden py-20 md:py-32">
// //         <div className="absolute inset-0 -z-10">
// //           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/10 to-transparent rounded-full blur-3xl" />
// //         </div>
// //         <div className="container mx-auto px-4 text-center">
// //           <Badge variant="info" className="mb-6 gap-1.5 px-3 py-1 text-xs">
// //             <Zap className="h-3 w-3" /> Powered by GPT-4o-mini & Next.js 14
// //           </Badge>
// //           <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-5xl mx-auto">
// //             The{" "}
// //             <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
// //               AI-Powered SEO Platform
// //             </span>{" "}
// //             for Modern Teams
// //           </h1>
// //           <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
// //             Generate optimized content, research keywords, analyze competitors, and publish beautiful blogs — all with AI assistance and a drag-and-drop builder.
// //           </p>
// //           <div className="flex flex-col sm:flex-row gap-4 justify-center">
// //             <Button asChild size="xl" variant="gradient" className="gap-2">
// //               <Link href="/register">
// //                 Start Free Today <ArrowRight className="h-4 w-4" />
// //               </Link>
// //             </Button>
// //             <Button asChild size="xl" variant="outline">
// //               <Link href="/demo">View Live Demo</Link>
// //             </Button>
// //           </div>
// //           <p className="mt-4 text-sm text-muted-foreground">No credit card required · 10 free AI credits · Cancel anytime</p>
// //         </div>
// //       </section>
// //
// //       {/* Stats */}
// //       <section className="py-12 border-y bg-muted/20">
// //         <div className="container mx-auto px-4">
// //           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
// //             {stats.map((s) => (
// //               <div key={s.label}>
// //                 <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">{s.value}</p>
// //                 <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </section>
// //
// //       {/* Features */}
// //       <section className="py-24">
// //         <div className="container mx-auto px-4">
// //           <div className="text-center mb-16">
// //             <Badge variant="info" className="mb-4">Features</Badge>
// //             <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to dominate SEO</h2>
// //             <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
// //               A complete suite of AI-powered tools to research, create, optimize, and publish SEO content at scale.
// //             </p>
// //           </div>
// //           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
// //             {features.map((f) => (
// //               <Card key={f.title} className="group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
// //                 <CardContent className="p-6">
// //                   <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-4`}>
// //                     <f.icon className="h-5 w-5 text-white" />
// //                   </div>
// //                   <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
// //                   <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
// //                 </CardContent>
// //               </Card>
// //             ))}
// //           </div>
// //         </div>
// //       </section>
// //
// //       {/* Pricing */}
// //       <section className="py-24 bg-muted/20">
// //         <div className="container mx-auto px-4">
// //           <div className="text-center mb-16">
// //             <Badge variant="info" className="mb-4">Pricing</Badge>
// //             <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
// //             <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready. Cancel anytime.</p>
// //           </div>
// //           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
// //             {plans.map((plan) => (
// //               <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? "border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]" : ""}`}>
// //                 {plan.popular && (
// //                   <div className="absolute -top-3 left-1/2 -translate-x-1/2">
// //                     <Badge variant="default" className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">Most Popular</Badge>
// //                   </div>
// //                 )}
// //                 <CardContent className="p-6 flex flex-col flex-1">
// //                   <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
// //                   <div className="mb-4">
// //                     <span className="text-3xl font-bold">${plan.price}</span>
// //                     {plan.price > 0 && <span className="text-muted-foreground text-sm">/mo</span>}
// //                   </div>
// //                   <ul className="space-y-2 mb-6 flex-1">
// //                     {plan.features.map((f) => (
// //                       <li key={f} className="flex items-start gap-2 text-sm">
// //                         <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
// //                         <span className="text-muted-foreground">{f}</span>
// //                       </li>
// //                     ))}
// //                   </ul>
// //                   <Button asChild variant={plan.popular ? "gradient" : "outline"} className="w-full">
// //                     <Link href={plan.href}>{plan.cta}</Link>
// //                   </Button>
// //                 </CardContent>
// //               </Card>
// //             ))}
// //           </div>
// //         </div>
// //       </section>
// //
// //       {/* CTA */}
// //       <section className="py-24">
// //         <div className="container mx-auto px-4 text-center">
// //           <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-600 to-sky-500 rounded-2xl p-12 text-white">
// //             <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to supercharge your SEO?</h2>
// //             <p className="text-indigo-100 mb-8 text-lg">Join thousands of creators and businesses using AI to dominate search rankings.</p>
// //             <Button asChild size="xl" className="bg-white text-indigo-600 hover:bg-white/90 font-semibold">
// //               <Link href="/register">Get Started Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
// //             </Button>
// //           </div>
// //         </div>
// //       </section>
// //     </div>
// //   );
// // }
