"use client";
import {useEffect, useState} from "react";
import {Gift, DollarSign, CheckCircle, Clock, X, Users} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {StatsCard} from "@/components/dashboard/StatsCard";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Input, Label} from "@/components/ui/form-elements";

interface ReferralUser {
    _id: string;
    name: string;
    email: string;
    pendingAmount: number;
    totalEarned: number;
    totalReferrals: number;
    convertedReferrals: number;
}

export default function SuperAdminReferralPage() {
    const [users, setUsers] = useState<ReferralUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [payoutUser, setPayoutUser] = useState<ReferralUser | null>(null);
    const [paymentMethod, setPaymentMethod] = useState("paypal");
    const [paymentDetails, setPaymentDetails] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        // Fetch all users who have referrals
        const res = await fetch("/api/referral?admin=true");
        const d = await res.json();
        if (d.success) setUsers(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const totalPending = users.reduce((s, u) => s + u.pendingAmount, 0);
    const totalPaid = users.reduce((s, u) => s + (u.totalEarned - u.pendingAmount), 0);

    const processPayout = async () => {
        if (!payoutUser) return;
        setIsProcessing(true);
        // In production this would create a payout record and trigger payment
        await fetch("/api/referral/payout", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                userId: payoutUser._id,
                amount: payoutUser.pendingAmount,
                paymentMethod,
                paymentDetails,
                note: adminNote,
            }),
        });
        setPayoutUser(null);
        fetchUsers();
        setIsProcessing(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Gift className="h-6 w-6 text-indigo-500"/> Referral Payouts
                </h1>
                <p className="text-muted-foreground text-sm">Manage affiliate commissions and process payouts</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StatsCard title="Total Affiliates" value={users.length} icon={Users}
                           gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
                <StatsCard title="Pending Payouts" value={`$${totalPending.toFixed(2)}`} icon={Clock}
                           gradient="bg-gradient-to-br from-amber-500 to-amber-600"/>
                <StatsCard title="Total Paid Out" value={`$${totalPaid.toFixed(2)}`} icon={DollarSign}
                           gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i}
                                                                             className="h-16 skeleton rounded-xl"/>)}</div>
            ) : users.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-16 text-center">
                        <Gift className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                        <p className="font-semibold">No referral activity yet</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {users.map((user) => (
                        <Card key={user._id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div
                                    className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {user.convertedReferrals}/{user.totalReferrals} referrals converted
                                    </p>
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                    {user.pendingAmount > 0 && (
                                        <p className="text-sm font-bold text-amber-600">${user.pendingAmount.toFixed(2)} pending</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">${user.totalEarned.toFixed(2)} total
                                        earned</p>
                                </div>
                                {user.pendingAmount >= 50 ? (
                                    <Button variant="gradient" size="sm" onClick={() => setPayoutUser(user)}
                                            className="gap-1.5 shrink-0">
                                        <DollarSign className="h-3.5 w-3.5"/> Pay ${user.pendingAmount.toFixed(2)}
                                    </Button>
                                ) : (
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                        ${(50 - user.pendingAmount).toFixed(2)} to min
                                    </Badge>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={!!payoutUser} onOpenChange={(o) => !o && setPayoutUser(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-emerald-500"/>
                            Process Payout — ${payoutUser?.pendingAmount.toFixed(2)}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <p className="text-sm text-muted-foreground">
                            Paying
                            out <strong>${payoutUser?.pendingAmount.toFixed(2)}</strong> to <strong>{payoutUser?.name}</strong>
                        </p>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Payment Method</Label>
                            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="paypal">PayPal</option>
                                <option value="bank">Bank Transfer</option>
                                <option value="crypto">Cryptocurrency</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label
                                className="text-xs">{paymentMethod === "paypal" ? "PayPal Email" : paymentMethod === "bank" ? "Bank Account Details" : "Crypto Address"}</Label>
                            <Input value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)}
                                   placeholder={paymentMethod === "paypal" ? "user@example.com" : paymentMethod === "bank" ? "IBAN / Account Number" : "0x..."}/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Note (optional)</Label>
                            <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                                   placeholder="Commission payout for Q1 referrals"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPayoutUser(null)}>Cancel</Button>
                        <Button variant="gradient" onClick={processPayout} isLoading={isProcessing} className="gap-2">
                            <CheckCircle className="h-4 w-4"/> Mark as Paid
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// "use client";
// import {useEffect, useState} from "react";
// import {DollarSign, Users, CheckCircle, Clock} from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {StatsCard} from "@/components/dashboard/StatsCard";
// import {formatCurrency, formatDate} from "@/lib/utils";
//
// interface ReferralEntry {
//     _id: string;
//     code: string;
//     status: "pending" | "converted" | "paid";
//     commissionAmount: number;
//     commissionPercent: number;
//     convertedPlan?: string;
//     convertedAmount?: number;
//     createdAt: string;
//     referrerId: { _id: string; name: string; email: string };
//     referredId?: { name: string; email: string; plan: string };
// }
//
// export default function SuperAdminReferralPage() {
//     const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [statusFilter, setStatusFilter] = useState<"all" | "converted" | "paid">("all");
//     const [processing, setProcessing] = useState<string | null>(null);
//
//     const fetchReferrals = async () => {
//         setIsLoading(true);
//         const res = await fetch(`/api/referral?admin=true${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`);
//         const d = await res.json();
//         if (d.success) setReferrals(d.data.referrals ?? []);
//         setIsLoading(false);
//     };
//
//     useEffect(() => {
//         fetchReferrals();
//     }, [statusFilter]);
//
//     const markPaid = async (id: string) => {
//         setProcessing(id);
//         await fetch(`/api/referral/${id}`, {
//             method: "PUT",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({status: "paid"}),
//         });
//         setProcessing(null);
//         fetchReferrals();
//     };
//
//     const totalPending = referrals
//         .filter((r) => r.status === "converted")
//         .reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0);
//
//     const totalPaid = referrals
//         .filter((r) => r.status === "paid")
//         .reduce((sum, r) => sum + (r.commissionAmount ?? 0), 0);
//
//     return (
//         <div className="space-y-6">
//             <div>
//                 <h1 className="text-2xl font-bold">Referral Management</h1>
//                 <p className="text-muted-foreground text-sm">Track all referrals and process commission payouts</p>
//             </div>
//
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                 <StatsCard title="Total Referrals" value={referrals.length} icon={Users}
//                            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
//                 <StatsCard title="Converted" value={referrals.filter((r) => r.status !== "pending").length}
//                            icon={CheckCircle} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
//                 <StatsCard title="Pending Payout" value={formatCurrency(totalPending)} icon={Clock}
//                            gradient="bg-gradient-to-br from-amber-500 to-amber-600"/>
//                 <StatsCard title="Total Paid Out" value={formatCurrency(totalPaid)} icon={DollarSign}
//                            gradient="bg-gradient-to-br from-purple-500 to-purple-600"/>
//             </div>
//
//             <div className="flex gap-2">
//                 {(["all", "converted", "paid"] as const).map((s) => (
//                     <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm"
//                             onClick={() => setStatusFilter(s)} className="capitalize">
//                         {s}
//                     </Button>
//                 ))}
//             </div>
//
//             <Card>
//                 <CardContent className="p-0">
//                     <div className="overflow-x-auto">
//                         <table className="w-full text-sm">
//                             <thead className="border-b bg-muted/30">
//                             <tr>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referrer</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referred</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
//                                 <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
//                                 <th className="px-4 py-3"/>
//                             </tr>
//                             </thead>
//                             <tbody className="divide-y">
//                             {isLoading ? (
//                                 [...Array(5)].map((_, i) => (
//                                     <tr key={i}>
//                                         <td colSpan={7} className="px-4 py-3">
//                                             <div className="h-5 skeleton rounded"/>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : referrals.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={7} className="text-center py-12 text-muted-foreground">No referrals
//                                         found
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 referrals.map((r) => (
//                                     <tr key={r._id} className="hover:bg-muted/20 transition-colors">
//                                         <td className="px-4 py-3">
//                                             <p className="font-medium">{r.referrerId?.name}</p>
//                                             <p className="text-xs text-muted-foreground">{r.referrerId?.email}</p>
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             {r.referredId ? (
//                                                 <>
//                                                     <p className="font-medium">{r.referredId.name}</p>
//                                                     <p className="text-xs text-muted-foreground">{r.referredId.email}</p>
//                                                 </>
//                                             ) : <span
//                                                 className="text-muted-foreground text-xs">Not yet signed up</span>}
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             {r.convertedPlan
//                                                 ? <Badge variant="info"
//                                                          className="capitalize text-xs">{r.convertedPlan}</Badge>
//                                                 : "—"}
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             <span
//                                                 className="font-bold text-emerald-600">{formatCurrency(r.commissionAmount)}</span>
//                                             <span
//                                                 className="text-xs text-muted-foreground ml-1">({r.commissionPercent}%)</span>
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             <Badge
//                                                 variant={r.status === "paid" ? "success" : r.status === "converted" ? "warning" : "secondary"}
//                                                 className="capitalize text-xs">
//                                                 {r.status}
//                                             </Badge>
//                                         </td>
//                                         <td className="px-4 py-3 text-muted-foreground text-xs">
//                                             {formatDate(new Date(r.createdAt), {month: "short", day: "numeric"})}
//                                         </td>
//                                         <td className="px-4 py-3">
//                                             {r.status === "converted" && r.commissionAmount > 0 && (
//                                                 <Button
//                                                     variant="outline"
//                                                     size="sm"
//                                                     className="text-xs gap-1.5"
//                                                     isLoading={processing === r._id}
//                                                     onClick={() => markPaid(r._id)}
//                                                 >
//                                                     <CheckCircle className="h-3.5 w-3.5"/> Mark Paid
//                                                 </Button>
//                                             )}
//                                         </td>
//                                     </tr>
//                                 ))
//                             )}
//                             </tbody>
//                         </table>
//                     </div>
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }
