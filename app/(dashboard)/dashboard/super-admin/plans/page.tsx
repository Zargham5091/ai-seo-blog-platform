"use client";
import {useEffect, useState} from "react";
import {Edit, CheckCircle, X, Plus, Save} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";

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
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
    isActive: boolean;
    isPopular: boolean;
    order: number;
    features: PlanFeatures;
}

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
    aiCreditsPerMonth: "AI Credits / Month",
    maxBlogs: "Max Blogs",
    maxTeamMembers: "Max Team Members",
    advancedSEO: "Advanced SEO",
    analytics: "Analytics",
    customDomain: "Custom Domain",
    prioritySupport: "Priority Support",
    apiAccess: "API Access",
    whiteLabel: "White Label",
    keywordResearch: "Keyword Research",
    competitorAnalysis: "Competitor Analysis",
    schemaGenerator: "Schema Generator",
    bulkContentGeneration: "Bulk Content Generation",
    exportFeatures: "Export Features",
};

const PLAN_BADGE: Record<string, "secondary" | "info" | "warning" | "success"> = {
    free: "secondary", silver: "info", gold: "warning", diamond: "success",
};

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editPlan, setEditPlan] = useState<Plan | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");

    const fetchPlans = async () => {
        setIsLoading(true);
        const res = await fetch("/api/plans");
        const d = await res.json();
        if (d.success) setPlans(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSave = async () => {
        if (!editPlan) return;
        setSaving(true);
        const res = await fetch("/api/plans", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(editPlan),
        });
        const d = await res.json();
        if (d.success) {
            setSaveMsg("Saved! Changes are now live on the pricing page.");
            setTimeout(() => {
                setSaveMsg("");
                setEditPlan(null);
                fetchPlans();
            }, 2000);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Subscription Plans</h1>
                    <p className="text-muted-foreground text-sm">
                        Changes here update the pricing page and feature gates instantly
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl"/>)}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {plans.map((plan) => {
                        const f = plan.features;
                        return (
                            <Card key={plan._id} className="relative flex flex-col">
                                {plan.isPopular && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                        <Badge
                                            className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 text-xs">Popular</Badge>
                                    </div>
                                )}
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{plan.name}</CardTitle>
                                        <Badge variant={PLAN_BADGE[plan.slug] ?? "secondary"}
                                               className="capitalize">{plan.slug}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-3">
                                    <div className="text-2xl font-bold">
                                        ${plan.monthlyPrice}
                                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                        {plan.yearlyPrice > 0 && (
                                            <p className="text-xs text-muted-foreground">${plan.yearlyPrice}/yr</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        {(Object.entries(f ?? {}) as [keyof PlanFeatures, boolean | number][]).slice(0, 5).map(([key, val]) => (
                                            <div key={key} className="flex items-center justify-between text-xs">
                                                <span
                                                    className="text-muted-foreground">{FEATURE_LABELS[key] ?? key}</span>
                                                <span className="font-medium">
                          {typeof val === "boolean"
                              ? val
                                  ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500"/>
                                  : <X className="h-3.5 w-3.5 text-muted-foreground/40"/>
                              : val >= 999999 ? "∞" : String(val)}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Badge variant={plan.isActive ? "success" : "secondary"} className="text-xs">
                                            {plan.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <Button
                                            variant="outline" size="sm" className="ml-auto gap-1.5"
                                            onClick={() => setEditPlan(JSON.parse(JSON.stringify(plan)))}
                                        >
                                            <Edit className="h-3.5 w-3.5"/> Edit
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={!!editPlan} onOpenChange={(o) => !o && setEditPlan(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit {editPlan?.name} Plan</DialogTitle>
                    </DialogHeader>
                    {editPlan && (
                        <div className="space-y-4 py-2">
                            {saveMsg && (
                                <div
                                    className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-400 px-4 py-3 text-sm">
                                    {saveMsg}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Plan Name</Label>
                                    <Input value={editPlan.name}
                                           onChange={(e) => setEditPlan({...editPlan, name: e.target.value})}/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Order (sort position)</Label>
                                    <Input type="number" value={editPlan.order}
                                           onChange={(e) => setEditPlan({...editPlan, order: Number(e.target.value)})}/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Monthly Price ($)</Label>
                                    <Input type="number" value={editPlan.monthlyPrice} onChange={(e) => setEditPlan({
                                        ...editPlan,
                                        monthlyPrice: Number(e.target.value)
                                    })}/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Yearly Price ($)</Label>
                                    <Input type="number" value={editPlan.yearlyPrice} onChange={(e) => setEditPlan({
                                        ...editPlan,
                                        yearlyPrice: Number(e.target.value)
                                    })}/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Stripe Price ID (Monthly)</Label>
                                    <Input value={editPlan.stripePriceIdMonthly ?? ""} onChange={(e) => setEditPlan({
                                        ...editPlan,
                                        stripePriceIdMonthly: e.target.value
                                    })} placeholder="price_xxx"/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Stripe Price ID (Yearly)</Label>
                                    <Input value={editPlan.stripePriceIdYearly ?? ""} onChange={(e) => setEditPlan({
                                        ...editPlan,
                                        stripePriceIdYearly: e.target.value
                                    })} placeholder="price_xxx"/>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Description</Label>
                                <Input value={editPlan.description}
                                       onChange={(e) => setEditPlan({...editPlan, description: e.target.value})}/>
                            </div>

                            <div>
                                <Label className="text-xs mb-2 block">Features</Label>
                                <div className="space-y-2 border rounded-lg p-3 max-h-72 overflow-y-auto">
                                    {(Object.entries(editPlan.features ?? {}) as [keyof PlanFeatures, boolean | number][]).map(([key, val]) => (
                                        <div key={key} className="flex items-center justify-between gap-3">
                                            <span className="text-sm">{FEATURE_LABELS[key] ?? key}</span>
                                            {typeof val === "boolean" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditPlan({
                                                        ...editPlan,
                                                        features: {...editPlan.features, [key]: !val},
                                                    })}
                                                    className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${val ? "bg-emerald-500 text-white" : "border-2 border-border"}`}
                                                >
                                                    {val && <CheckCircle className="h-4 w-4"/>}
                                                </button>
                                            ) : (
                                                <Input
                                                    type="number"
                                                    value={val}
                                                    onChange={(e) => setEditPlan({
                                                        ...editPlan,
                                                        features: {...editPlan.features, [key]: Number(e.target.value)},
                                                    })}
                                                    className="h-7 w-28 text-xs text-right"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Use 999999 for unlimited</p>
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editPlan.isActive}
                                        onChange={(e) => setEditPlan({...editPlan, isActive: e.target.checked})}
                                        className="rounded"
                                    />
                                    Active (visible on pricing page)
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editPlan.isPopular}
                                        onChange={(e) => setEditPlan({...editPlan, isPopular: e.target.checked})}
                                        className="rounded"
                                    />
                                    Mark as Popular
                                </label>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPlan(null)}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSave} isLoading={saving} className="gap-2">
                            <Save className="h-4 w-4"/> Save — goes live instantly
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// "use client";
// import { useEffect, useState } from "react";
// import { Plus, Edit, CheckCircle, X } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
//
// interface Plan {
//   _id: string;
//   name: string;
//   slug: string;
//   description: string;
//   monthlyPrice: number;
//   yearlyPrice: number;
//   isActive: boolean;
//   isPopular: boolean;
//   features: Record<string, boolean | number>;
// }
//
// const FEATURE_LABELS: Record<string, string> = {
//   aiCreditsPerMonth: "AI Credits / Month",
//   maxBlogs: "Max Blogs",
//   maxTeamMembers: "Max Team Members",
//   advancedSEO: "Advanced SEO",
//   analytics: "Analytics",
//   customDomain: "Custom Domain",
//   prioritySupport: "Priority Support",
//   apiAccess: "API Access",
//   whiteLabel: "White Label",
//   keywordResearch: "Keyword Research",
//   competitorAnalysis: "Competitor Analysis",
//   schemaGenerator: "Schema Generator",
//   bulkContentGeneration: "Bulk Content Generation",
//   exportFeatures: "Export Features",
// };
//
// export default function PlansPage() {
//   const [plans, setPlans] = useState<Plan[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [editPlan, setEditPlan] = useState<Plan | null>(null);
//   const [saving, setSaving] = useState(false);
//
//   const fetchPlans = async () => {
//     setIsLoading(true);
//     const res = await fetch("/api/plans");
//     const d = await res.json();
//     if (d.success) setPlans(d.data);
//     setIsLoading(false);
//   };
//
//   useEffect(() => { fetchPlans(); }, []);
//
//   const handleSave = async () => {
//     if (!editPlan) return;
//     setSaving(true);
//     await fetch("/api/plans", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(editPlan),
//     });
//     setSaving(false);
//     setEditPlan(null);
//     fetchPlans();
//   };
//
//   const PLAN_BADGE: Record<string, "secondary" | "info" | "warning" | "success"> = {
//     free: "secondary", silver: "info", gold: "warning", diamond: "success",
//   };
//
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Subscription Plans</h1>
//           <p className="text-muted-foreground text-sm">Manage pricing, features and limits</p>
//         </div>
//       </div>
//
//       {isLoading ? (
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
//           {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-xl" />)}
//         </div>
//       ) : (
//         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
//           {plans.map((plan) => (
//             <Card key={plan._id} className="relative flex flex-col">
//               {plan.isPopular && (
//                 <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
//                   <Badge className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white border-0 text-xs">Popular</Badge>
//                 </div>
//               )}
//               <CardHeader className="pb-3">
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="text-base">{plan.name}</CardTitle>
//                   <Badge variant={PLAN_BADGE[plan.slug] ?? "secondary"} className="capitalize">{plan.slug}</Badge>
//                 </div>
//                 <p className="text-sm text-muted-foreground">{plan.description}</p>
//               </CardHeader>
//               <CardContent className="flex-1 space-y-3">
//                 <div className="text-2xl font-bold">
//                   ${plan.monthlyPrice}<span className="text-sm font-normal text-muted-foreground">/mo</span>
//                 </div>
//                 <div className="space-y-1.5">
//                   {Object.entries(plan.features ?? {}).slice(0, 6).map(([key, val]) => (
//                     <div key={key} className="flex items-center justify-between text-xs">
//                       <span className="text-muted-foreground">{FEATURE_LABELS[key] ?? key}</span>
//                       <span className="font-medium">
//                         {typeof val === "boolean"
//                           ? val ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <X className="h-3.5 w-3.5 text-muted-foreground/40" />
//                           : val === -1 || val === Infinity ? "∞" : String(val)}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="flex items-center gap-2 pt-2">
//                   <Badge variant={plan.isActive ? "success" : "secondary"} className="text-xs">
//                     {plan.isActive ? "Active" : "Inactive"}
//                   </Badge>
//                   <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={() => setEditPlan(plan)}>
//                     <Edit className="h-3.5 w-3.5" /> Edit
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//
//       {/* Edit Dialog */}
//       <Dialog open={!!editPlan} onOpenChange={(o) => !o && setEditPlan(null)}>
//         <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
//           <DialogHeader>
//             <DialogTitle>Edit {editPlan?.name} Plan</DialogTitle>
//           </DialogHeader>
//           {editPlan && (
//             <div className="space-y-4 py-2">
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Plan Name</Label>
//                   <Input value={editPlan.name} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Monthly Price ($)</Label>
//                   <Input type="number" value={editPlan.monthlyPrice} onChange={(e) => setEditPlan({ ...editPlan, monthlyPrice: Number(e.target.value) })} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Yearly Price ($)</Label>
//                   <Input type="number" value={editPlan.yearlyPrice} onChange={(e) => setEditPlan({ ...editPlan, yearlyPrice: Number(e.target.value) })} />
//                 </div>
//                 <div className="space-y-1.5">
//                   <Label className="text-xs">Stripe Price ID (Monthly)</Label>
//                   <Input placeholder="price_xxx" />
//                 </div>
//               </div>
//               <div className="space-y-1.5">
//                 <Label className="text-xs">Description</Label>
//                 <Input value={editPlan.description} onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })} />
//               </div>
//               <div>
//                 <Label className="text-xs mb-2 block">Features</Label>
//                 <div className="space-y-2 border rounded-lg p-3">
//                   {Object.entries(FEATURE_LABELS).map(([key, label]) => {
//                     const val = editPlan.features?.[key];
//                     const isBool = typeof val === "boolean";
//                     return (
//                       <div key={key} className="flex items-center justify-between">
//                         <span className="text-sm">{label}</span>
//                         {isBool ? (
//                           <button
//                             onClick={() => setEditPlan({ ...editPlan, features: { ...editPlan.features, [key]: !val } })}
//                             className={`h-5 w-5 rounded flex items-center justify-center ${val ? "bg-emerald-500 text-white" : "border-2"}`}
//                           >
//                             {val && <CheckCircle className="h-3.5 w-3.5" />}
//                           </button>
//                         ) : (
//                           <Input
//                             type="number"
//                             value={val as number}
//                             onChange={(e) => setEditPlan({ ...editPlan, features: { ...editPlan.features, [key]: Number(e.target.value) } })}
//                             className="h-7 w-24 text-xs text-right"
//                           />
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//               <div className="flex items-center gap-4">
//                 <label className="flex items-center gap-2 text-sm cursor-pointer">
//                   <input type="checkbox" checked={editPlan.isActive} onChange={(e) => setEditPlan({ ...editPlan, isActive: e.target.checked })} className="rounded" />
//                   Active
//                 </label>
//                 <label className="flex items-center gap-2 text-sm cursor-pointer">
//                   <input type="checkbox" checked={editPlan.isPopular} onChange={(e) => setEditPlan({ ...editPlan, isPopular: e.target.checked })} className="rounded" />
//                   Mark as Popular
//                 </label>
//               </div>
//             </div>
//           )}
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setEditPlan(null)}>Cancel</Button>
//             <Button variant="gradient" onClick={handleSave} isLoading={saving}>Save Changes</Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
