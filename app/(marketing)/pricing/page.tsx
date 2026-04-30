import type {Metadata} from "next";
import Link from "next/link";
import {CheckCircle, X, Zap} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanModel, {IPlanDocument} from "@/models/Plan";
import CMSPageModel from "@/models/CMSPage";

export const metadata: Metadata = {
    title: "Pricing — SEO Platform",
    description: "Simple, transparent pricing plans for every team size.",
};

const DEFAULT_FAQS = [
    {
        q: "Can I switch plans anytime?",
        a: "Yes — upgrade or downgrade at any time. Changes take effect immediately and billing is prorated."
    },
    {
        q: "What payment methods are accepted?",
        a: "All major credit/debit cards via Stripe, and cryptocurrency via Coinbase Commerce."
    },
    {q: "What are AI credits?", a: "Each AI action uses 1 credit. Credits reset monthly."},
    {
        q: "Is there a free trial?",
        a: "The Free plan gives you 10 AI credits and 3 blogs permanently — no credit card required."
    },
    {q: "Can I cancel anytime?", a: "Yes. Cancel from your Settings dashboard anytime."},
];

export default async function PricingPage() {
    await connectDB();

    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;
    const currentPlan = session?.user?.plan ?? null;

    // Load plans AND FAQs from DB in parallel
    const [dbPlans, faqPage] = await Promise.all([
        PlanModel.find({isActive: true}).sort({order: 1}).lean<IPlanDocument[]>(),
        CMSPageModel.findOne({slug: "pricing-faqs", isPublished: true}).lean(),
    ]);

    let faqs = DEFAULT_FAQS;
    if (faqPage?.content) {
        try {
            faqs = JSON.parse(faqPage.content as string);
        } catch { /* use default */
        }
    }

    const planCTAHref = (slug: string, price: number) => {
        if (!isLoggedIn) return price === 0 ? "/register" : `/register?plan=${slug}`;
        if (price === 0) return "/dashboard/admin";
        return currentPlan === slug
            ? "/dashboard/admin/settings"
            : `/dashboard/admin/settings?upgrade=${slug}`;
    };

    return (
        <div className="py-20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <Badge variant="info" className="mb-4"><Zap className="h-3 w-3 mr-1"/>Pricing</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">Simple, transparent pricing</h1>
                    <p className="text-muted-foreground text-lg max-w-xl mx-auto">Start free. Scale as you grow. No
                        hidden fees.</p>
                    {isLoggedIn && currentPlan && (
                        <div
                            className="mt-4 inline-flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800">
                            You are on the <strong className="capitalize">{currentPlan}</strong> plan
                        </div>
                    )}
                </div>

                {dbPlans.length === 0 ? (
                    <p className="text-center text-muted-foreground py-20">
                        No plans configured yet. Super admin can add plans from the dashboard.
                    </p>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
                        {dbPlans.map((plan) => {
                            const isCurrent = isLoggedIn && currentPlan === plan.slug;
                            const f = plan.features;

                            const featureList = [
                                {
                                    label: `${f.aiCreditsPerMonth >= 999999 ? "Unlimited" : f.aiCreditsPerMonth} AI credits/month`,
                                    included: true
                                },
                                {
                                    label: `${f.maxBlogs >= 999999 ? "Unlimited" : `Up to ${f.maxBlogs}`} blogs`,
                                    included: true
                                },
                                {label: "Keyword research", included: !!f.keywordResearch},
                                {label: "Analytics", included: !!f.analytics},
                                {
                                    label: `Team (${f.maxTeamMembers >= 999999 ? "unlimited" : f.maxTeamMembers})`,
                                    included: (f.maxTeamMembers as number) > 1
                                },
                                {label: "Advanced SEO", included: !!f.advancedSEO},
                                {label: "API access", included: !!f.apiAccess},
                                {label: "White label", included: !!f.whiteLabel},
                            ];

                            return (
                                <Card
                                    key={plan._id.toString()}
                                    className={`relative flex flex-col border-2 ${
                                        isCurrent
                                            ? "border-emerald-500 shadow-xl shadow-emerald-500/10"
                                            : plan.isPopular
                                                ? "border-indigo-500 shadow-xl shadow-indigo-500/10"
                                                : "border-border"
                                    }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <Badge className="bg-emerald-500 text-white border-0 px-3">✓ Current</Badge>
                                        </div>
                                    )}
                                    {plan.isPopular && !isCurrent && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <Badge
                                                className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">⭐
                                                Popular</Badge>
                                        </div>
                                    )}
                                    <CardContent className="p-6 flex flex-col flex-1">
                                        <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                                        <div className="mb-6">
                                            <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
                                            {plan.monthlyPrice > 0 &&
                                                <span className="text-muted-foreground text-sm ml-1">/mo</span>}
                                            {plan.yearlyPrice > 0 && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                                    ${plan.yearlyPrice}/yr — save
                                                    ${plan.monthlyPrice * 12 - plan.yearlyPrice}
                                                </p>
                                            )}
                                        </div>
                                        <ul className="space-y-2 mb-8 flex-1">
                                            {featureList.map((feat) => (
                                                <li key={feat.label} className="flex items-start gap-2 text-sm">
                                                    {feat.included
                                                        ? <CheckCircle
                                                            className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"/>
                                                        :
                                                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5"/>}
                                                    <span
                                                        className={feat.included ? "" : "text-muted-foreground/50"}>{feat.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <Button
                                            asChild
                                            variant={isCurrent ? "outline" : plan.isPopular ? "gradient" : "outline"}
                                            className="w-full"
                                            disabled={isCurrent}
                                        >
                                            <Link href={planCTAHref(plan.slug, plan.monthlyPrice)}>
                                                {isCurrent ? "Current Plan" : plan.monthlyPrice === 0 ? "Start Free" : `Get ${plan.name}`}
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <Card key={faq.q}>
                                <CardContent className="p-5">
                                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// import type { Metadata } from "next";
// import Link from "next/link";
// import { CheckCircle, X, Zap } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/form-elements";
// import { Card, CardContent } from "@/components/ui/card";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
//
// export const metadata: Metadata = {
//   title: "Pricing — SEO Platform",
//   description: "Simple, transparent pricing plans for every team size. Start free, upgrade when ready.",
// };
//
// const plans = [
//   {
//     name: "Free", slug: "free", monthlyPrice: 0, yearlyPrice: 0,
//     description: "Perfect for individuals exploring SEO tools.",
//     features: [
//       { label: "10 AI credits / month", included: true },
//       { label: "Up to 3 blogs", included: true },
//       { label: "Basic SEO tools", included: true },
//       { label: "Demo access", included: true },
//       { label: "Keyword research", included: false },
//       { label: "Analytics dashboard", included: false },
//       { label: "Team members", included: false },
//       { label: "API access", included: false },
//     ],
//   },
//   {
//     name: "Silver", slug: "silver", monthlyPrice: 29, yearlyPrice: 290,
//     description: "For creators and freelancers scaling their content.",
//     features: [
//       { label: "100 AI credits / month", included: true },
//       { label: "Up to 25 blogs", included: true },
//       { label: "Keyword research", included: true },
//       { label: "Analytics dashboard", included: true },
//       { label: "3 team members", included: true },
//       { label: "Advanced SEO tools", included: false },
//       { label: "Competitor analysis", included: false },
//       { label: "API access", included: false },
//     ],
//   },
//   {
//     name: "Gold", slug: "gold", monthlyPrice: 79, yearlyPrice: 790,
//     description: "For growing teams needing advanced SEO capabilities.",
//     popular: true,
//     features: [
//       { label: "500 AI credits / month", included: true },
//       { label: "Up to 100 blogs", included: true },
//       { label: "Advanced SEO tools", included: true },
//       { label: "Competitor analysis", included: true },
//       { label: "Schema generator", included: true },
//       { label: "10 team members", included: true },
//       { label: "API access", included: true },
//       { label: "White label", included: false },
//     ],
//   },
//   {
//     name: "Diamond", slug: "diamond", monthlyPrice: 199, yearlyPrice: 1990,
//     description: "For agencies and enterprises needing full platform access.",
//     features: [
//       { label: "2,000 AI credits / month", included: true },
//       { label: "Unlimited blogs", included: true },
//       { label: "Everything in Gold", included: true },
//       { label: "White label", included: true },
//       { label: "Bulk content generation", included: true },
//       { label: "Unlimited team members", included: true },
//       { label: "Priority support", included: true },
//       { label: "Custom domain", included: true },
//     ],
//   },
// ];
//
// const faqs = [
//   { q: "Can I switch plans anytime?", a: "Yes — upgrade or downgrade at any time. Changes take effect immediately and billing is prorated." },
//   { q: "What payment methods are accepted?", a: "We accept-invite all major credit/debit cards via Stripe, and cryptocurrency payments via Coinbase Commerce." },
//   { q: "What are AI credits?", a: "Each AI action (blog generation, keyword research, SEO analysis) uses 1 credit. Credits reset monthly." },
//   { q: "Is there a free trial?", a: "The Free plan gives you 10 AI credits and 3 blogs permanently — no credit card required." },
//   { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your Settings dashboard. Your plan remains active until the end of your billing period." },
// ];
//
// export default async function PricingPage() {
//   const session = await getServerSession(authOptions);
//   const isLoggedIn = !!session;
//   const currentPlan = session?.user?.plan ?? null;
//
//   // Decide where each plan CTA goes depending on login state
//   const planCTAHref = (slug: string) => {
//     if (!isLoggedIn) return slug === "free" ? "/register" : `/register?plan=${slug}`;
//     if (slug === "free") return "/dashboard/admin";
//     // Already on this plan → go to settings; else go to settings with upgrade param
//     return currentPlan === slug
//         ? "/dashboard/admin/settings"
//         : `/dashboard/admin/settings?upgrade=${slug}`;
//   };
//
//   const planCTALabel = (slug: string, defaultLabel: string) => {
//     if (!isLoggedIn) return defaultLabel;
//     if (currentPlan === slug) return "Current Plan";
//     return defaultLabel;
//   };
//
//   return (
//       <div className="py-20">
//         <div className="container mx-auto px-4">
//           {/* Header */}
//           <div className="text-center mb-16">
//             <Badge variant="info" className="mb-4">
//               <Zap className="h-3 w-3 mr-1" />Pricing
//             </Badge>
//             <h1 className="text-4xl md:text-6xl font-bold mb-4">Simple, transparent pricing</h1>
//             <p className="text-muted-foreground text-lg max-w-xl mx-auto">
//               Start free. Scale as you grow. No hidden fees, no surprises.
//             </p>
//             {isLoggedIn && currentPlan && (
//                 <div className="mt-4 inline-flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800">
//                   You are currently on the <strong className="capitalize">{currentPlan}</strong> plan
//                 </div>
//             )}
//           </div>
//
//           {/* Plans grid */}
//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
//             {plans.map((plan) => {
//               const isCurrent = isLoggedIn && currentPlan === plan.slug;
//               return (
//                   <Card
//                       key={plan.name}
//                       className={`relative flex flex-col border-2 ${
//                           isCurrent
//                               ? "border-emerald-500 shadow-xl shadow-emerald-500/10"
//                               : plan.popular
//                                   ? "border-indigo-500 shadow-xl shadow-indigo-500/10"
//                                   : "border-border"
//                       }`}
//                   >
//                     {isCurrent && (
//                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
//                           <Badge className="bg-emerald-500 text-white border-0 px-3">✓ Current Plan</Badge>
//                         </div>
//                     )}
//                     {plan.popular && !isCurrent && (
//                         <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
//                           <Badge className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">
//                             ⭐ Most Popular
//                           </Badge>
//                         </div>
//                     )}
//                     <CardContent className="p-6 flex flex-col flex-1">
//                       <div className="mb-4">
//                         <h3 className="font-bold text-xl">{plan.name}</h3>
//                         <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
//                       </div>
//                       <div className="mb-6">
//                         <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
//                         {plan.monthlyPrice > 0 && (
//                             <span className="text-muted-foreground text-sm ml-1">/month</span>
//                         )}
//                         {plan.yearlyPrice > 0 && (
//                             <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
//                               ${plan.yearlyPrice}/year — save $
//                               {plan.monthlyPrice * 12 - plan.yearlyPrice}
//                             </p>
//                         )}
//                       </div>
//                       <ul className="space-y-2.5 mb-8 flex-1">
//                         {plan.features.map((f) => (
//                             <li key={f.label} className="flex items-start gap-2 text-sm">
//                               {f.included ? (
//                                   <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
//                               ) : (
//                                   <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
//                               )}
//                               <span className={f.included ? "" : "text-muted-foreground/50"}>
//                           {f.label}
//                         </span>
//                             </li>
//                         ))}
//                       </ul>
//                       <Button
//                           asChild
//                           variant={
//                             isCurrent ? "outline" : plan.popular ? "gradient" : "outline"
//                           }
//                           className="w-full"
//                           disabled={isCurrent}
//                       >
//                         <Link href={planCTAHref(plan.slug)}>
//                           {planCTALabel(plan.slug, plan.monthlyPrice === 0 ? "Start Free" : `Get ${plan.name}`)}
//                         </Link>
//                       </Button>
//                     </CardContent>
//                   </Card>
//               );
//             })}
//           </div>
//
//           {/* FAQs */}
//           <div className="max-w-2xl mx-auto">
//             <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
//             <div className="space-y-4">
//               {faqs.map((faq) => (
//                   <Card key={faq.q}>
//                     <CardContent className="p-5">
//                       <h3 className="font-semibold mb-2">{faq.q}</h3>
//                       <p className="text-sm text-muted-foreground">{faq.a}</p>
//                     </CardContent>
//                   </Card>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//   );
// }
//
//
// // import type { Metadata } from "next";
// // import Link from "next/link";
// // import { CheckCircle, X, Zap } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { Badge } from "@/components/ui/form-elements";
// // import { Card, CardContent } from "@/components/ui/card";
// //
// // export const metadata: Metadata = {
// //   title: "Pricing — SEO Platform",
// //   description: "Simple, transparent pricing plans for every team size. Start free, upgrade when ready.",
// // };
// //
// // const plans = [
// //   {
// //     name: "Free", slug: "free", monthlyPrice: 0, yearlyPrice: 0,
// //     description: "Perfect for individuals exploring SEO tools.",
// //     color: "border-border",
// //     features: [
// //       { label: "10 AI credits / month", included: true },
// //       { label: "Up to 3 blogs", included: true },
// //       { label: "Basic SEO tools", included: true },
// //       { label: "Demo access", included: true },
// //       { label: "Keyword research", included: false },
// //       { label: "Analytics dashboard", included: false },
// //       { label: "Team members", included: false },
// //       { label: "API access", included: false },
// //     ],
// //   },
// //   {
// //     name: "Silver", slug: "silver", monthlyPrice: 29, yearlyPrice: 290,
// //     description: "For creators and freelancers scaling their content.",
// //     color: "border-border",
// //     features: [
// //       { label: "100 AI credits / month", included: true },
// //       { label: "Up to 25 blogs", included: true },
// //       { label: "Keyword research", included: true },
// //       { label: "Analytics dashboard", included: true },
// //       { label: "3 team members", included: true },
// //       { label: "Advanced SEO tools", included: false },
// //       { label: "Competitor analysis", included: false },
// //       { label: "API access", included: false },
// //     ],
// //   },
// //   {
// //     name: "Gold", slug: "gold", monthlyPrice: 79, yearlyPrice: 790,
// //     description: "For growing teams needing advanced SEO capabilities.",
// //     color: "border-indigo-500",
// //     popular: true,
// //     features: [
// //       { label: "500 AI credits / month", included: true },
// //       { label: "Up to 100 blogs", included: true },
// //       { label: "Advanced SEO tools", included: true },
// //       { label: "Competitor analysis", included: true },
// //       { label: "Schema generator", included: true },
// //       { label: "10 team members", included: true },
// //       { label: "API access", included: true },
// //       { label: "White label", included: false },
// //     ],
// //   },
// //   {
// //     name: "Diamond", slug: "diamond", monthlyPrice: 199, yearlyPrice: 1990,
// //     description: "For agencies and enterprises needing full platform access.",
// //     color: "border-emerald-500",
// //     features: [
// //       { label: "2,000 AI credits / month", included: true },
// //       { label: "Unlimited blogs", included: true },
// //       { label: "Everything in Gold", included: true },
// //       { label: "White label", included: true },
// //       { label: "Bulk content generation", included: true },
// //       { label: "Unlimited team members", included: true },
// //       { label: "Priority support", included: true },
// //       { label: "Custom domain", included: true },
// //     ],
// //   },
// // ];
// //
// // const faqs = [
// //   { q: "Can I switch plans anytime?", a: "Yes — upgrade or downgrade at any time. Changes take effect immediately and billing is prorated." },
// //   { q: "What payment methods are accepted?", a: "We accept-invite all major credit/debit cards via Stripe, and cryptocurrency payments via Coinbase Commerce." },
// //   { q: "What are AI credits?", a: "Each AI action (blog generation, keyword research, SEO analysis) uses 1 credit. Credits reset monthly." },
// //   { q: "Is there a free trial?", a: "The Free plan gives you 10 AI credits and 3 blogs permanently — no credit card required." },
// //   { q: "Can I cancel anytime?", a: "Yes. Cancel anytime from your Settings dashboard. Your plan remains active until the end of your billing period." },
// // ];
// //
// // export default function PricingPage() {
// //   return (
// //     <div className="py-20">
// //       <div className="container mx-auto px-4">
// //         {/* Header */}
// //         <div className="text-center mb-16">
// //           <Badge variant="info" className="mb-4"><Zap className="h-3 w-3 mr-1" />Pricing</Badge>
// //           <h1 className="text-4xl md:text-6xl font-bold mb-4">Simple, transparent pricing</h1>
// //           <p className="text-muted-foreground text-lg max-w-xl mx-auto">Start free. Scale as you grow. No hidden fees, no surprises.</p>
// //         </div>
// //
// //         {/* Plans grid */}
// //         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
// //           {plans.map((plan) => (
// //             <Card key={plan.name} className={`relative flex flex-col border-2 ${plan.color} ${plan.popular ? "shadow-xl shadow-indigo-500/10" : ""}`}>
// //               {plan.popular && (
// //                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
// //                   <Badge className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 px-3">⭐ Most Popular</Badge>
// //                 </div>
// //               )}
// //               <CardContent className="p-6 flex flex-col flex-1">
// //                 <div className="mb-4">
// //                   <h3 className="font-bold text-xl">{plan.name}</h3>
// //                   <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
// //                 </div>
// //                 <div className="mb-6">
// //                   <span className="text-4xl font-bold">${plan.monthlyPrice}</span>
// //                   {plan.monthlyPrice > 0 && <span className="text-muted-foreground text-sm ml-1">/month</span>}
// //                   {plan.yearlyPrice > 0 && (
// //                     <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
// //                       ${plan.yearlyPrice}/year — save ${plan.monthlyPrice * 12 - plan.yearlyPrice}
// //                     </p>
// //                   )}
// //                 </div>
// //                 <ul className="space-y-2.5 mb-8 flex-1">
// //                   {plan.features.map((f) => (
// //                     <li key={f.label} className="flex items-start gap-2 text-sm">
// //                       {f.included
// //                         ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
// //                         : <X className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />}
// //                       <span className={f.included ? "" : "text-muted-foreground/50"}>{f.label}</span>
// //                     </li>
// //                   ))}
// //                 </ul>
// //                 <Button
// //                   asChild
// //                   variant={plan.popular ? "gradient" : plan.slug === "diamond" ? "default" : "outline"}
// //                   className="w-full"
// //                 >
// //                   <Link href={plan.monthlyPrice === 0 ? "/register" : `/register?plan=${plan.slug}`}>
// //                     {plan.monthlyPrice === 0 ? "Start Free" : `Get ${plan.name}`}
// //                   </Link>
// //                 </Button>
// //               </CardContent>
// //             </Card>
// //           ))}
// //         </div>
// //
// //         {/* FAQs */}
// //         <div className="max-w-2xl mx-auto">
// //           <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
// //           <div className="space-y-4">
// //             {faqs.map((faq) => (
// //               <Card key={faq.q}>
// //                 <CardContent className="p-5">
// //                   <h3 className="font-semibold mb-2">{faq.q}</h3>
// //                   <p className="text-sm text-muted-foreground">{faq.a}</p>
// //                 </CardContent>
// //               </Card>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
