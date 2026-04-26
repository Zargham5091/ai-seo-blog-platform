"use client";
import {useEffect, useState} from "react";
import {Gift, Copy, Check, Users, DollarSign, TrendingUp, Share2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {StatsCard} from "@/components/dashboard/StatsCard";
import {formatDate} from "@/lib/utils";

interface ReferralStats {
    totalReferrals: number;
    converted: number;
    totalEarned: number;
    pendingPayout: number;
}

interface Referral {
    _id: string;
    code: string;
    status: string;
    commissionAmount: number;
    convertedPlan?: string;
    convertedAt?: string;
    referredId?: { name: string; email: string };
    createdAt: string;
}

export default function ReferralPage() {
    const [code, setCode] = useState<string | null>(null);
    const [stats, setStats] = useState<ReferralStats>({
        totalReferrals: 0,
        converted: 0,
        totalEarned: 0,
        pendingPayout: 0
    });
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState<"code" | "link" | null>(null);

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const fetchData = async () => {
        setIsLoading(true);
        const res = await fetch("/api/referral");
        const d = await res.json();
        if (d.success) {
            setStats(d.data.stats);
            setReferrals(d.data.referrals);
            if (d.data.referrals.length > 0) setCode(d.data.referrals[0].code);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generateCode = async () => {
        setIsGenerating(true);
        const res = await fetch("/api/referral", {method: "POST"});
        const d = await res.json();
        if (d.success) {
            setCode(d.data.code);
            fetchData();
        }
        setIsGenerating(false);
    };

    const copy = (text: string, kind: "code" | "link") => {
        navigator.clipboard.writeText(text);
        setCopied(kind);
        setTimeout(() => setCopied(null), 2000);
    };

    const referralLink = code ? `${APP_URL}/register?ref=${code}` : null;

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Gift className="h-6 w-6 text-indigo-500"/> Referral Program
                </h1>
                <p className="text-muted-foreground text-sm">
                    Earn 20% commission on every paying user you refer
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard title="Total Referrals" value={stats.totalReferrals} icon={Users}
                           gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
                <StatsCard title="Converted" value={stats.converted} icon={TrendingUp}
                           gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
                <StatsCard title="Total Earned" value={`$${stats.totalEarned}`} icon={DollarSign}
                           gradient="bg-gradient-to-br from-sky-500 to-sky-600"/>
                <StatsCard title="Pending Payout" value={`$${stats.pendingPayout}`} icon={Gift}
                           gradient="bg-gradient-to-br from-purple-500 to-purple-600"/>
            </div>

            {/* Referral code */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Share2 className="h-4 w-4"/> Your Referral Code
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {code ? (
                        <>
                            <div
                                className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800">
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-1">Your Code</p>
                                    <p className="text-2xl font-bold font-mono tracking-widest text-indigo-700 dark:text-indigo-300">{code}</p>
                                </div>
                                <Button variant="outline" onClick={() => copy(code, "code")}
                                        className="gap-1.5 shrink-0">
                                    {copied === "code" ? <><Check
                                        className="h-3.5 w-3.5 text-emerald-500"/> Copied</> : <><Copy
                                        className="h-3.5 w-3.5"/> Copy Code</>}
                                </Button>
                            </div>

                            {referralLink && (
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground">Referral Link</p>
                                    <div className="flex items-center gap-2">
                                        <code
                                            className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate">{referralLink}</code>
                                        <Button variant="outline" size="sm" onClick={() => copy(referralLink, "link")}
                                                className="gap-1.5 shrink-0">
                                            {copied === "link" ? <Check className="h-3.5 w-3.5 text-emerald-500"/> :
                                                <Copy className="h-3.5 w-3.5"/>}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div
                                className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 p-4">
                                <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">How it
                                    works</p>
                                <ul className="text-xs text-muted-foreground space-y-1.5">
                                    <li>1️⃣ Share your code or link with friends and colleagues</li>
                                    <li>2️⃣ They sign up using your link</li>
                                    <li>3️⃣ When they buy a paid plan, you earn 20% commission</li>
                                    <li>4️⃣ Request payout once you reach $50</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3"/>
                            <p className="font-semibold mb-2">No referral code yet</p>
                            <p className="text-sm text-muted-foreground mb-4">Generate your unique referral code and
                                start earning</p>
                            <Button variant="gradient" onClick={generateCode} isLoading={isGenerating}
                                    className="gap-2">
                                <Gift className="h-4 w-4"/> Generate My Referral Code
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Referral history */}
            {referrals.filter((r) => r.referredId).length > 0 && (
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Referral
                        History</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {referrals.filter((r) => r.referredId).map((r) => (
                                <div key={r._id} className="flex items-center gap-3 p-3 rounded-lg border">
                                    <div
                                        className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {r.referredId?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{r.referredId?.name}</p>
                                        <p className="text-xs text-muted-foreground">{r.referredId?.email}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <Badge
                                            variant={r.status === "converted" ? "success" : r.status === "paid" ? "info" : "secondary"}
                                            className="capitalize text-xs mb-1"
                                        >
                                            {r.status}
                                        </Badge>
                                        {r.commissionAmount > 0 && (
                                            <p className="text-xs font-bold text-emerald-600">${r.commissionAmount}</p>
                                        )}
                                        {r.convertedPlan && (
                                            <p className="text-xs text-muted-foreground capitalize">{r.convertedPlan} plan</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// "use client";
// import {useEffect, useState} from "react";
// import {useSession} from "next-auth/react";
// import {Copy, Check, Users, DollarSign, Gift, Share2} from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {StatsCard} from "@/components/dashboard/StatsCard";
// import {formatCurrency} from "@/lib/utils";
//
// interface ReferralStats {
//     totalReferrals: number;
//     converted: number;
//     totalEarned: number;
//     pendingPayout: number;
// }
//
// interface ReferralEntry {
//     _id: string;
//     code: string;
//     status: "pending" | "converted" | "paid";
//     commissionAmount: number;
//     convertedPlan?: string;
//     createdAt: string;
//     referredId?: { name: string; email: string; plan: string };
// }
//
// export default function ReferralPage() {
//     const {data: session} = useSession();
//     const [code, setCode] = useState<string | null>(null);
//     const [stats, setStats] = useState<ReferralStats | null>(null);
//     const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [copied, setCopied] = useState<"code" | "link" | null>(null);
//
//     const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
//
//     const fetchReferrals = async () => {
//         setIsLoading(true);
//         const res = await fetch("/api/referral");
//         const d = await res.json();
//         if (d.success) {
//             setStats(d.data.stats);
//             setReferrals(d.data.referrals);
//             // Find the template code (no referredId)
//             const templateCode = d.data.referrals.find((r: ReferralEntry) => !r.referredId);
//             if (templateCode) setCode(templateCode.code);
//         }
//         setIsLoading(false);
//     };
//
//     useEffect(() => {
//         fetchReferrals();
//     }, []);
//
//     const generateCode = async () => {
//         setIsGenerating(true);
//         const res = await fetch("/api/referral", {method: "POST"});
//         const d = await res.json();
//         if (d.success) setCode(d.data.code);
//         setIsGenerating(false);
//         fetchReferrals();
//     };
//
//     const copy = (text: string, type: "code" | "link") => {
//         navigator.clipboard.writeText(text);
//         setCopied(type);
//         setTimeout(() => setCopied(null), 2000);
//     };
//
//     const referralLink = code ? `${appUrl}/register?ref=${code}` : "";
//
//     const STATUS_BADGE: Record<string, "secondary" | "warning" | "success"> = {
//         pending: "secondary",
//         converted: "warning",
//         paid: "success",
//     };
//
//     return (
//         <div className="space-y-6 max-w-4xl">
//             <div>
//                 <h1 className="text-2xl font-bold flex items-center gap-2">
//                     <Gift className="h-6 w-6 text-indigo-500"/> Referral Program
//                 </h1>
//                 <p className="text-muted-foreground text-sm">
//                     Earn 20% commission on every paid plan your referrals purchase
//                 </p>
//             </div>
//
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                 <StatsCard title="Total Referrals" value={isLoading ? "—" : stats?.totalReferrals ?? 0} icon={Users}
//                            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
//                 <StatsCard title="Converted" value={isLoading ? "—" : stats?.converted ?? 0} icon={Share2}
//                            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
//                 <StatsCard title="Total Earned" value={isLoading ? "—" : formatCurrency(stats?.totalEarned ?? 0)}
//                            icon={DollarSign} gradient="bg-gradient-to-br from-sky-500 to-sky-600"/>
//                 <StatsCard title="Pending Payout" value={isLoading ? "—" : formatCurrency(stats?.pendingPayout ?? 0)}
//                            icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-purple-600"/>
//             </div>
//
//             {/* Referral code card */}
//             <Card
//                 className="border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/50 to-sky-50/50 dark:from-indigo-950/20 dark:to-sky-950/20">
//                 <CardHeader className="pb-3">
//                     <CardTitle className="flex items-center gap-2">
//                         <Gift className="h-5 w-5 text-indigo-500"/> Your Referral Code
//                     </CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                     {code ? (
//                         <>
//                             <div className="grid md:grid-cols-2 gap-3">
//                                 <div>
//                                     <p className="text-xs text-muted-foreground mb-1.5">Referral Code</p>
//                                     <div className="flex items-center gap-2">
//                                         <div
//                                             className="flex-1 bg-background rounded-lg border px-4 py-2.5 font-mono font-bold text-lg tracking-wider text-center text-indigo-600 dark:text-indigo-400">
//                                             {code}
//                                         </div>
//                                         <Button variant="outline" size="sm" onClick={() => copy(code, "code")}
//                                                 className="gap-1.5 shrink-0">
//                                             {copied === "code" ? <><Check
//                                                 className="h-3.5 w-3.5 text-emerald-500"/>Copied</> : <><Copy
//                                                 className="h-3.5 w-3.5"/>Copy</>}
//                                         </Button>
//                                     </div>
//                                 </div>
//                                 <div>
//                                     <p className="text-xs text-muted-foreground mb-1.5">Referral Link</p>
//                                     <div className="flex items-center gap-2">
//                                         <div
//                                             className="flex-1 bg-background rounded-lg border px-3 py-2.5 text-xs text-muted-foreground truncate">
//                                             {referralLink}
//                                         </div>
//                                         <Button variant="outline" size="sm" onClick={() => copy(referralLink, "link")}
//                                                 className="gap-1.5 shrink-0">
//                                             {copied === "link" ? <><Check
//                                                 className="h-3.5 w-3.5 text-emerald-500"/>Copied</> : <><Copy
//                                                 className="h-3.5 w-3.5"/>Copy</>}
//                                         </Button>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="rounded-lg bg-indigo-100/50 dark:bg-indigo-900/20 p-3">
//                                 <p className="text-xs text-indigo-700 dark:text-indigo-300">
//                                     <strong>How it works:</strong> Share your link. When someone signs up and buys a
//                                     paid plan, you earn <strong>20% commission</strong>. Payouts are processed monthly
//                                     via PayPal, bank transfer, or crypto.
//                                 </p>
//                             </div>
//                         </>
//                     ) : (
//                         <div className="text-center py-4">
//                             <p className="text-sm text-muted-foreground mb-4">
//                                 Generate your unique referral code to start earning commissions
//                             </p>
//                             <Button variant="gradient" onClick={generateCode} isLoading={isGenerating}
//                                     className="gap-2">
//                                 <Gift className="h-4 w-4"/> Generate My Referral Code
//                             </Button>
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//
//             {/* Referrals list */}
//             {referrals.filter((r) => r.referredId).length > 0 && (
//                 <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-sm">Your Referrals</CardTitle></CardHeader>
//                     <CardContent>
//                         <div className="divide-y">
//                             {referrals.filter((r) => r.referredId).map((r) => (
//                                 <div key={r._id} className="flex items-center justify-between py-3">
//                                     <div>
//                                         <p className="text-sm font-medium">{r.referredId?.name}</p>
//                                         <p className="text-xs text-muted-foreground">{r.referredId?.email}</p>
//                                     </div>
//                                     <div className="flex items-center gap-3">
//                                         {r.convertedPlan && (
//                                             <Badge variant="info"
//                                                    className="capitalize text-xs">{r.convertedPlan}</Badge>
//                                         )}
//                                         <Badge variant={STATUS_BADGE[r.status]}
//                                                className="capitalize text-xs">{r.status}</Badge>
//                                         {r.commissionAmount > 0 && (
//                                             <span
//                                                 className="text-sm font-bold text-emerald-600">+{formatCurrency(r.commissionAmount)}</span>
//                                         )}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </CardContent>
//                 </Card>
//             )}
//         </div>
//     );
// }
