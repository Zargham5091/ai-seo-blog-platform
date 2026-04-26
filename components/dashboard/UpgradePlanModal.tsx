"use client";
import {useEffect, useState} from "react";
import {useSession} from "next-auth/react";
import {CheckCircle, X, Zap, CreditCard, Bitcoin, Loader2} from "lucide-react";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface PlanFeatures {
    aiCreditsPerMonth: number;
    maxBlogs: number;
    maxTeamMembers: number;
    advancedSEO: boolean;
    analytics: boolean;
    customDomain: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    keywordResearch: boolean;
    competitorAnalysis: boolean;
    schemaGenerator: boolean;
    bulkContentGeneration: boolean;
    exportFeatures: boolean;
}

interface Plan {
    _id: string;
    name: string;
    slug: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    isPopular: boolean;
    features: PlanFeatures;
}

interface UpgradePlanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type BillingCycle = "monthly" | "yearly";
type PaymentProvider = "stripe" | "coinbase";

const FEATURE_ROWS: { key: keyof PlanFeatures; label: string }[] = [
    {key: "aiCreditsPerMonth", label: "AI Credits / Month"},
    {key: "maxBlogs", label: "Max Blogs"},
    {key: "maxTeamMembers", label: "Team Members"},
    {key: "keywordResearch", label: "Keyword Research"},
    {key: "analytics", label: "Analytics"},
    {key: "advancedSEO", label: "Advanced SEO"},
    {key: "competitorAnalysis", label: "Competitor Analysis"},
    {key: "schemaGenerator", label: "Schema Generator"},
    {key: "apiAccess", label: "API Access"},
    {key: "customDomain", label: "Custom Domain"},
    {key: "whiteLabel", label: "White Label"},
    {key: "prioritySupport", label: "Priority Support"},
    {key: "bulkContentGeneration", label: "Bulk Content Gen"},
];

function formatFeatureValue(key: keyof PlanFeatures, val: boolean | number): string {
    if (typeof val === "boolean") return val ? "✓" : "—";
    if (val >= 999999) return "∞";
    return String(val);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UpgradePlanModal({open, onOpenChange}: UpgradePlanModalProps) {
    const {data: session} = useSession();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [provider, setProvider] = useState<PaymentProvider>("stripe");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState("");

    const currentPlan = session?.user?.plan ?? "free";

    useEffect(() => {
        if (!open) return;
        fetch("/api/plans")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setPlans(d.data);
            })
            .finally(() => setIsLoading(false));
    }, [open]);

    const price = (plan: Plan) =>
        billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    const savings = (plan: Plan) =>
        plan.monthlyPrice > 0
            ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
            : 0;

    const handleCheckout = async () => {
        if (!selectedPlan) return;
        setIsCheckingOut(true);
        setError("");

        try {
            const res = await fetch("/api/subscriptions/checkout", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    planSlug: selectedPlan.slug,
                    billingCycle,
                    provider,
                }),
            });
            const d = await res.json();
            if (d.success && d.data?.url) {
                // Open Stripe/Coinbase in same tab — they will redirect back
                window.location.href = d.data.url;
            } else {
                setError(d.error ?? "Checkout failed. Please try again.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    const paidPlans = plans.filter((p) => p.monthlyPrice > 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Zap className="h-5 w-5 text-indigo-500"/>
                        Upgrade Your Plan
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/>
                    </div>
                ) : (
                    <div className="space-y-6 py-2">
                        {/* Billing cycle toggle */}
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setBillingCycle("monthly")}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    billingCycle === "monthly"
                                        ? "bg-indigo-600 text-white"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle("yearly")}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                                    billingCycle === "yearly"
                                        ? "bg-indigo-600 text-white"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Yearly
                                <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                  Save up to 20%
                </span>
                            </button>
                        </div>

                        {/* Plan cards */}
                        <div className="grid grid-cols-3 gap-4">
                            {paidPlans.map((plan) => {
                                const isCurrent = currentPlan === plan.slug;
                                const isSelected = selectedPlan?._id === plan._id;
                                const p = price(plan);
                                const savePct = savings(plan);

                                return (
                                    <button
                                        key={plan._id}
                                        onClick={() => !isCurrent && setSelectedPlan(plan)}
                                        disabled={isCurrent}
                                        className={`text-left p-5 rounded-2xl border-2 transition-all ${
                                            isCurrent
                                                ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-not-allowed"
                                                : isSelected
                                                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md shadow-indigo-500/10"
                                                    : plan.isPopular
                                                        ? "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400"
                                                        : "border-border hover:border-indigo-200"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <span className="font-bold text-base">{plan.name}</span>
                                                {plan.isPopular && !isCurrent && (
                                                    <Badge variant="info" className="ml-2 text-xs">Popular</Badge>
                                                )}
                                                {isCurrent && (
                                                    <Badge variant="success" className="ml-2 text-xs">Current</Badge>
                                                )}
                                            </div>
                                            {isSelected && !isCurrent && (
                                                <CheckCircle className="h-5 w-5 text-indigo-500"/>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <span className="text-3xl font-bold">${p}</span>
                                            <span className="text-muted-foreground text-sm">
                        /{billingCycle === "yearly" ? "yr" : "mo"}
                      </span>
                                            {billingCycle === "yearly" && savePct > 0 && (
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                    Save {savePct}% vs monthly
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feature comparison table */}
                        <div className="rounded-xl border overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Feature</th>
                                        {paidPlans.map((plan) => (
                                            <th
                                                key={plan._id}
                                                className={`px-4 py-3 font-semibold text-center ${
                                                    selectedPlan?._id === plan._id ? "text-indigo-600 dark:text-indigo-400" : ""
                                                }`}
                                            >
                                                {plan.name}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                    {FEATURE_ROWS.map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-2.5 text-muted-foreground">{row.label}</td>
                                            {paidPlans.map((plan) => {
                                                const val = plan.features?.[row.key];
                                                const formatted = val !== undefined ? formatFeatureValue(row.key, val) : "—";
                                                const isCheck = formatted === "✓";
                                                const isDash = formatted === "—";
                                                return (
                                                    <td
                                                        key={plan._id}
                                                        className={`px-4 py-2.5 text-center font-medium ${
                                                            isCheck ? "text-emerald-500" : isDash ? "text-muted-foreground/40" : "text-foreground"
                                                        }`}
                                                    >
                                                        {formatted}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment provider + checkout */}
                        {selectedPlan && (
                            <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <p className="font-semibold">
                                            {selectedPlan.name} Plan
                                            — {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                                        </p>
                                        <p className="text-2xl font-bold">
                                            ${price(selectedPlan)}
                                            <span className="text-sm font-normal text-muted-foreground">
                        /{billingCycle === "yearly" ? "year" : "month"}
                      </span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPlan(null)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="h-4 w-4"/>
                                    </button>
                                </div>

                                {/* Payment method */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Payment Method</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setProvider("stripe")}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                                provider === "stripe"
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                                    : "border-border hover:border-indigo-200"
                                            }`}
                                        >
                                            <CreditCard className="h-4 w-4"/>
                                            Card / Stripe
                                        </button>
                                        <button
                                            onClick={() => setProvider("coinbase")}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                                                provider === "coinbase"
                                                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                                    : "border-border hover:border-indigo-200"
                                            }`}
                                        >
                                            <Bitcoin className="h-4 w-4"/>
                                            Crypto / Coinbase
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <Button
                                    variant="gradient"
                                    className="w-full gap-2 h-11 text-base"
                                    onClick={handleCheckout}
                                    isLoading={isCheckingOut}
                                >
                                    {isCheckingOut ? "Redirecting to checkout..." : `Subscribe to ${selectedPlan.name} — $${price(selectedPlan)}`}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    Secure checkout · Cancel anytime · Changes take effect immediately
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
