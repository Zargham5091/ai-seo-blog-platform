"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Sparkles, Search, FileText, BarChart3, Lock, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/form-elements";
import { Progress } from "@/components/ui/misc";

const DEMO_FEATURES = [
  { icon: Sparkles, label: "AI Blog Generator", desc: "Generate full blog posts with one prompt", locked: true },
  { icon: Search, label: "Keyword Research", desc: "Find high-value, low-competition keywords", locked: true },
  { icon: FileText, label: "Blog Builder", desc: "Drag-and-drop content block editor", locked: true },
  { icon: BarChart3, label: "SEO Analytics", desc: "Track rankings and content performance", locked: true },
];

const PLAN_PERKS = {
  silver: ["100 AI credits/month", "25 blogs", "Keyword research", "Analytics", "3 team members"],
  gold: ["500 AI credits/month", "100 blogs", "Advanced SEO tools", "Competitor analysis", "Schema generator"],
  diamond: ["2,000 AI credits/month", "Unlimited blogs", "White label", "Priority support", "Custom domain"],
};

export default function UserDashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 p-8 text-white">
        <Badge className="bg-white/20 text-white border-0 mb-3"><Zap className="h-3 w-3 mr-1" />Free Plan</Badge>
        <h1 className="text-2xl font-bold mb-2">Welcome, {session?.user?.name?.split(" ")[0]}! 👋</h1>
        <p className="text-indigo-100 mb-6">
          You're on the Free plan with access to demo features. Upgrade to unlock the full power of AI-powered SEO.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button asChild className="bg-white text-indigo-600 hover:bg-white/90 font-semibold gap-2">
            <Link href="/pricing">Upgrade Now <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
            <Link href="/demo">Try Live Demo</Link>
          </Button>
        </div>
      </div>

      {/* AI Credits */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">AI Credits</p>
              <p className="text-sm text-muted-foreground">Resets monthly</p>
            </div>
            <Badge variant="secondary">0 / 10 used</Badge>
          </div>
          <Progress value={0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">You have 10 free credits. Upgrade for more.</p>
        </CardContent>
      </Card>

      {/* Locked features */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" /> Features Available on Paid Plans
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {DEMO_FEATURES.map((feature) => (
            <Card key={feature.label} className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button asChild variant="gradient" size="sm" className="gap-2">
                  <Link href="/pricing"><Zap className="h-3.5 w-3.5" />Unlock with Upgrade</Link>
                </Button>
              </div>
              <CardContent className="p-5 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                    <feature.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                      {feature.label} <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-lg font-bold mb-4">Choose a Plan to Get Started</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(Object.entries(PLAN_PERKS) as [string, string[]][]).map(([plan, perks]) => (
            <Card key={plan} className={plan === "gold" ? "border-indigo-500 shadow-md shadow-indigo-500/10" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg capitalize">{plan}</h3>
                  {plan === "gold" && <Badge variant="info">Popular</Badge>}
                </div>
                <ul className="space-y-2 mb-5">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={plan === "gold" ? "gradient" : "outline"} className="w-full">
                  <Link href={`/pricing`}>Get {plan.charAt(0).toUpperCase() + plan.slice(1)}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
