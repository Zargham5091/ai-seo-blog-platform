"use client";
import {useState} from "react";
import {useSession} from "next-auth/react";
import {
    CreditCard, User, Shield, ExternalLink, Zap,
    Search, CheckCircle2, XCircle, Loader2,
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/misc";
import {UpgradePlanModal} from "@/components/dashboard/UpgradePlanModal";
import {signIn} from "next-auth/react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";

// ── Schemas ──────────────────────────────────────────────────────────────────
const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Constants ────────────────────────────────────────────────────────────────
const PLAN_BADGE: Record<string, "secondary" | "info" | "warning" | "success"> = {
    free: "secondary", silver: "info", gold: "warning", diamond: "success",
};

// ── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const {data: session, update} = useSession();
    const [name, setName] = useState(session?.user?.name ?? "");
    const [saving, setSaving] = useState(false);
    const [portalLoading, setPortalLoading] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    // GSC state
    const [gscSites, setGscSites] = useState<{ siteUrl: string; permissionLevel: string }[]>([]);
    const [gscSiteUrl, setGscSiteUrl] = useState("");
    const [gscLoading, setGscLoading] = useState(false);
    const [gscStatus, setGscStatus] = useState<"idle" | "success" | "error">("idle");
    const [gscMessage, setGscMessage] = useState("");

    // Password form
    const [pwSuccess, setPwSuccess] = useState("");
    const [pwError, setPwError] = useState("");
    const {
        register: regPw,
        handleSubmit: handlePwSubmit,
        reset: resetPw,
        formState: {errors: pwErrors, isSubmitting: pwSubmitting},
    } = useForm<PasswordForm>({resolver: zodResolver(passwordSchema)});

    const plan = session?.user?.plan ?? "free";
    const gscConnected = session?.user?.gscConnected ?? false;

    // ── Handlers ────────────────────────────────────────────────────────────────
    const openBillingPortal = async () => {
        setPortalLoading(true);
        try {
            const res = await fetch("/api/subscriptions/checkout", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({action: "portal"}),
            });
            const d = await res.json();
            if (d.success) window.open(d.data.url, "_blank");
        } finally {
            setPortalLoading(false);
        }
    };

    const connectGSC = () => {
        // Re-trigger Google OAuth with GSC scope — NextAuth handles the token storage
        signIn("google", {callbackUrl: "/dashboard/admin/settings?tab=integrations"});
    };

    const disconnectGSC = async () => {
        if (!confirm("Disconnect Google Search Console?")) return;
        setGscLoading(true);
        try {
            const res = await fetch("/api/google-search-console", {
                method: "DELETE",
            });
            const d = await res.json();
            if (d.success) {
                setGscStatus("success");
                setGscMessage("Disconnected successfully.");
                await update(); // refresh session
            }
        } catch {
            setGscStatus("error");
            setGscMessage("Failed to disconnect.");
        } finally {
            setGscLoading(false);
        }
    };

    const fetchGSCSites = async () => {
        setGscLoading(true);
        setGscStatus("idle");
        try {
            const res = await fetch("/api/google-search-console?action=sites");
            const d = await res.json();
            if (d.success) {
                setGscSites(d.data ?? []);
                setGscStatus("success");
                setGscMessage(`Found ${d.data?.length ?? 0} verified site(s).`);
            } else {
                setGscStatus("error");
                setGscMessage(d.error ?? "Failed to fetch sites.");
            }
        } catch {
            setGscStatus("error");
            setGscMessage("Request failed.");
        } finally {
            setGscLoading(false);
        }
    };

    const saveGSCSite = async () => {
        if (!gscSiteUrl) return;
        setGscLoading(true);
        try {
            const res = await fetch("/api/google-search-console", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({siteUrl: gscSiteUrl}),
            });
            const d = await res.json();
            setGscStatus(d.success ? "success" : "error");
            setGscMessage(d.success ? "Default site saved!" : (d.error ?? "Failed to save."));
        } finally {
            setGscLoading(false);
        }
    };

    const onPasswordSubmit = async (data: PasswordForm) => {
        setPwError("");
        setPwSuccess("");
        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({currentPassword: data.currentPassword, newPassword: data.newPassword}),
            });
            const d = await res.json();
            if (d.success) {
                setPwSuccess("Password updated successfully.");
                resetPw();
            } else {
                setPwError(d.error ?? "Failed to update password.");
            }
        } catch {
            setPwError("Something went wrong. Please try again.");
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm">Manage your account, billing, and integrations</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile" className="gap-2"><User className="h-3.5 w-3.5"/>Profile</TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2"><CreditCard
                        className="h-3.5 w-3.5"/>Billing</TabsTrigger>
                    <TabsTrigger value="integrations" className="gap-2"><Search
                        className="h-3.5 w-3.5"/>Integrations</TabsTrigger>
                    <TabsTrigger value="security" className="gap-2"><Shield
                        className="h-3.5 w-3.5"/>Security</TabsTrigger>
                </TabsList>

                {/* ── Profile ── */}
                <TabsContent value="profile" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your name and profile details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={session?.user?.image ?? ""}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-xl">
                                        {session?.user?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{session?.user?.name}</p>
                                    <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                                    <Badge variant={PLAN_BADGE[plan]} className="mt-1 capitalize">{plan} Plan</Badge>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Display Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)}/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input value={session?.user?.email ?? ""} disabled className="opacity-60"/>
                                <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact
                                    support.</p>
                            </div>
                            <Button
                                variant="gradient"
                                isLoading={saving}
                                onClick={async () => {
                                    setSaving(true);
                                    await update({name});
                                    setSaving(false);
                                }}
                            >
                                Save Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Billing ── */}
                <TabsContent value="billing" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Plan</CardTitle>
                            <CardDescription>Your active subscription</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div
                                className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800">
                                <div>
                                    <p className="font-bold text-lg capitalize">{plan} Plan</p>
                                    <p className="text-sm text-muted-foreground">
                                        {plan === "free" ? "Free forever" : "Active subscription"}
                                    </p>
                                </div>
                                <Badge variant={PLAN_BADGE[plan]}
                                       className="capitalize text-sm px-3 py-1">{plan}</Badge>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <Button variant="gradient" className="gap-2" onClick={() => setUpgradeOpen(true)}>
                                    <Zap className="h-4 w-4"/>
                                    {plan === "free" ? "Upgrade Plan" : "Change Plan"}
                                </Button>
                                {plan !== "free" && (
                                    <Button variant="outline" onClick={openBillingPortal} isLoading={portalLoading}
                                            className="gap-2">
                                        <ExternalLink className="h-4 w-4"/> Manage Billing
                                    </Button>
                                )}
                            </div>
                            {plan === "free" && (
                                <div
                                    className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 p-4">
                                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">Unlock
                                        more with a paid plan</p>
                                    <ul className="text-xs text-muted-foreground space-y-1">
                                        <li>✦ More AI credits for content generation</li>
                                        <li>✦ Your own subdomain for your blog</li>
                                        <li>✦ Advanced SEO tools and analytics</li>
                                        <li>✦ Team collaboration features</li>
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Crypto Payments</CardTitle>
                            <CardDescription>Pay with Bitcoin, Ethereum, USDC, and more</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Accepted via Coinbase Commerce. Click Upgrade Plan above and select &quot;Crypto /
                                Coinbase&quot; as your payment method.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Integrations ── */}
                <TabsContent value="integrations" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-indigo-500"/>
                                Google Search Console
                            </CardTitle>
                            <CardDescription>
                                Connect GSC to see your search performance data inside the dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status indicator */}
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                                {gscConnected ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0"/>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Connected</p>
                                            <p className="text-xs text-muted-foreground">Your Google account is linked
                                                with GSC access</p>
                                        </div>
                                        <Button variant="outline" size="sm"
                                                className="text-destructive border-destructive/40 hover:bg-destructive/10"
                                                onClick={disconnectGSC} disabled={gscLoading}>
                                            {gscLoading ?
                                                <Loader2 className="h-3.5 w-3.5 animate-spin"/> : "Disconnect"}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="h-5 w-5 text-muted-foreground shrink-0"/>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Not connected</p>
                                            <p className="text-xs text-muted-foreground">Sign in with Google to grant
                                                Search Console access</p>
                                        </div>
                                        <Button variant="gradient" size="sm" onClick={connectGSC}>
                                            Connect
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Only show site picker when connected */}
                            {gscConnected && (
                                <>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Your Verified Sites</Label>
                                            <Button variant="ghost" size="sm" onClick={fetchGSCSites}
                                                    disabled={gscLoading} className="text-xs gap-1">
                                                {gscLoading ? <Loader2 className="h-3 w-3 animate-spin"/> : null}
                                                Refresh
                                            </Button>
                                        </div>

                                        {gscSites.length > 0 ? (
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                {gscSites.map((site) => (
                                                    <button
                                                        key={site.siteUrl}
                                                        onClick={() => setGscSiteUrl(site.siteUrl)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                                                            gscSiteUrl === site.siteUrl
                                                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
                                                                : "border-border hover:bg-muted/50"
                                                        }`}
                                                    >
                                                        <span
                                                            className="font-medium truncate block">{site.siteUrl}</span>
                                                        <span
                                                            className="text-xs text-muted-foreground capitalize">{site.permissionLevel?.replace("_", " ")}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground py-2">
                                                Click &quot;Refresh&quot; to load your verified sites, or enter a URL
                                                manually below.
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>Default Site URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="https://yoursite.com/"
                                                value={gscSiteUrl}
                                                onChange={(e) => setGscSiteUrl(e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button variant="gradient" onClick={saveGSCSite}
                                                    disabled={!gscSiteUrl || gscLoading}>
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Feedback message */}
                            {gscMessage && (
                                <div className={`rounded-lg px-3 py-2 text-sm border ${
                                    gscStatus === "success"
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                                        : "bg-destructive/10 border-destructive/20 text-destructive"
                                }`}>
                                    {gscMessage}
                                </div>
                            )}

                            <div className="rounded-lg bg-muted/40 border px-3 py-2">
                                <p className="text-xs text-muted-foreground">
                                    <strong>Note:</strong> GSC access is granted via Google OAuth. Your token is stored
                                    securely and only used to fetch your own Search Console data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Security ── */}
                <TabsContent value="security" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your account password</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePwSubmit(onPasswordSubmit)} className="space-y-4">
                                {pwError && (
                                    <div
                                        className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                                        {pwError}
                                    </div>
                                )}
                                {pwSuccess && (
                                    <div
                                        className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                                        {pwSuccess}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input id="currentPassword" type="password"
                                           placeholder="••••••••" {...regPw("currentPassword")} />
                                    {pwErrors.currentPassword &&
                                        <p className="text-xs text-destructive">{pwErrors.currentPassword.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input id="newPassword" type="password"
                                           placeholder="Min. 6 characters" {...regPw("newPassword")} />
                                    {pwErrors.newPassword &&
                                        <p className="text-xs text-destructive">{pwErrors.newPassword.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input id="confirmPassword" type="password"
                                           placeholder="Repeat new password" {...regPw("confirmPassword")} />
                                    {pwErrors.confirmPassword &&
                                        <p className="text-xs text-destructive">{pwErrors.confirmPassword.message}</p>}
                                </div>
                                <Button type="submit" variant="gradient" isLoading={pwSubmitting}>
                                    Update Password
                                </Button>
                            </form>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-semibold text-sm text-destructive mb-2">Danger Zone</h3>
                                <Button
                                    variant="outline"
                                    className="border-destructive text-destructive hover:bg-destructive/10"
                                    onClick={() => confirm("Are you sure? This cannot be undone.") && fetch("/api/users/me", {method: "DELETE"})}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <UpgradePlanModal open={upgradeOpen} onOpenChange={setUpgradeOpen}/>
        </div>
    );
}

// "use client";
// import {useState} from "react";
// import {useSession} from "next-auth/react";
// import {CreditCard, User, Shield, ExternalLink, Zap} from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Label, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
// import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
// import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/misc";
// import {UpgradePlanModal} from "@/components/dashboard/UpgradePlanModal";
//
// const PLAN_BADGE: Record<string, "secondary" | "info" | "warning" | "success"> = {
//     free: "secondary", silver: "info", gold: "warning", diamond: "success",
// };
//
// export default function SettingsPage() {
//     const {data: session, update} = useSession();
//     const [name, setName] = useState(session?.user?.name ?? "");
//     const [saving, setSaving] = useState(false);
//     const [portalLoading, setPortalLoading] = useState(false);
//     const [upgradeOpen, setUpgradeOpen] = useState(false);
//
//     const plan = session?.user?.plan ?? "free";
//
//     const openBillingPortal = async () => {
//         setPortalLoading(true);
//         try {
//             const res = await fetch("/api/subscriptions/checkout", {
//                 method: "POST",
//                 headers: {"Content-Type": "application/json"},
//                 body: JSON.stringify({action: "portal"}),
//             });
//             const d = await res.json();
//             if (d.success) window.open(d.data.url, "_blank");
//         } finally {
//             setPortalLoading(false);
//         }
//     };
//
//     return (
//         <div className="space-y-6 max-w-3xl">
//             <div>
//                 <h1 className="text-2xl font-bold">Settings</h1>
//                 <p className="text-muted-foreground text-sm">Manage your account, billing, and preferences</p>
//             </div>
//
//             <Tabs defaultValue="profile">
//                 <TabsList>
//                     <TabsTrigger value="profile" className="gap-2"><User className="h-3.5 w-3.5"/>Profile</TabsTrigger>
//                     <TabsTrigger value="billing" className="gap-2"><CreditCard
//                         className="h-3.5 w-3.5"/>Billing</TabsTrigger>
//                     <TabsTrigger value="security" className="gap-2"><Shield
//                         className="h-3.5 w-3.5"/>Security</TabsTrigger>
//                 </TabsList>
//
//                 {/* Profile */}
//                 <TabsContent value="profile" className="mt-4">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Profile Information</CardTitle>
//                             <CardDescription>Update your name and profile details</CardDescription>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="flex items-center gap-4">
//                                 <Avatar className="h-16 w-16">
//                                     <AvatarImage src={session?.user?.image ?? ""}/>
//                                     <AvatarFallback
//                                         className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-xl">
//                                         {session?.user?.name?.charAt(0).toUpperCase()}
//                                     </AvatarFallback>
//                                 </Avatar>
//                                 <div>
//                                     <p className="font-semibold">{session?.user?.name}</p>
//                                     <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
//                                     <Badge variant={PLAN_BADGE[plan]} className="mt-1 capitalize">{plan} Plan</Badge>
//                                 </div>
//                             </div>
//                             <div className="space-y-1.5">
//                                 <Label>Display Name</Label>
//                                 <Input value={name} onChange={(e) => setName(e.target.value)}/>
//                             </div>
//                             <div className="space-y-1.5">
//                                 <Label>Email</Label>
//                                 <Input value={session?.user?.email ?? ""} disabled className="opacity-60"/>
//                                 <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact
//                                     support.</p>
//                             </div>
//                             <Button
//                                 variant="gradient"
//                                 isLoading={saving}
//                                 onClick={async () => {
//                                     setSaving(true);
//                                     await update({name});
//                                     setSaving(false);
//                                 }}
//                             >
//                                 Save Changes
//                             </Button>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//
//                 {/* Billing */}
//                 <TabsContent value="billing" className="mt-4 space-y-4">
//                     {/* Current plan */}
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Current Plan</CardTitle>
//                             <CardDescription>Your active subscription</CardDescription>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div
//                                 className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800">
//                                 <div>
//                                     <p className="font-bold text-lg capitalize">{plan} Plan</p>
//                                     <p className="text-sm text-muted-foreground">
//                                         {plan === "free" ? "Free forever" : "Active subscription"}
//                                     </p>
//                                 </div>
//                                 <Badge variant={PLAN_BADGE[plan]} className="capitalize text-sm px-3 py-1">
//                                     {plan}
//                                 </Badge>
//                             </div>
//
//                             <div className="flex gap-3 flex-wrap">
//                                 {/* Upgrade button — opens modal */}
//                                 <Button
//                                     variant="gradient"
//                                     className="gap-2"
//                                     onClick={() => setUpgradeOpen(true)}
//                                 >
//                                     <Zap className="h-4 w-4"/>
//                                     {plan === "free" ? "Upgrade Plan" : "Change Plan"}
//                                 </Button>
//
//                                 {/* Manage billing — only show for paid plans with Stripe */}
//                                 {plan !== "free" && (
//                                     <Button
//                                         variant="outline"
//                                         onClick={openBillingPortal}
//                                         isLoading={portalLoading}
//                                         className="gap-2"
//                                     >
//                                         <ExternalLink className="h-4 w-4"/>
//                                         Manage Billing
//                                     </Button>
//                                 )}
//                             </div>
//
//                             {plan === "free" && (
//                                 <div
//                                     className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 p-4">
//                                     <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-1">
//                                         Unlock more with a paid plan
//                                     </p>
//                                     <ul className="text-xs text-muted-foreground space-y-1">
//                                         <li>✦ More AI credits for content generation</li>
//                                         <li>✦ Your own subdomain for your blog</li>
//                                         <li>✦ Advanced SEO tools and analytics</li>
//                                         <li>✦ Team collaboration features</li>
//                                     </ul>
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//
//                     {/* Crypto payments info */}
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Crypto Payments</CardTitle>
//                             <CardDescription>Pay with Bitcoin, Ethereum, USDC, and more</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <p className="text-sm text-muted-foreground mb-4">
//                                 Accepted via Coinbase Commerce. Click Upgrade Plan above and select &quot;Crypto /
//                                 Coinbase&quot; as your payment method.
//                             </p>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//
//                 {/* Security */}
//                 <TabsContent value="security" className="mt-4">
//                     <Card>
//                         <CardHeader>
//                             <CardTitle>Security</CardTitle>
//                             <CardDescription>Manage password and account security</CardDescription>
//                         </CardHeader>
//                         <CardContent className="space-y-4">
//                             <div className="space-y-1.5">
//                                 <Label>Current Password</Label>
//                                 <Input type="password" placeholder="••••••••"/>
//                             </div>
//                             <div className="space-y-1.5">
//                                 <Label>New Password</Label>
//                                 <Input type="password" placeholder="Min. 6 characters"/>
//                             </div>
//                             <div className="space-y-1.5">
//                                 <Label>Confirm New Password</Label>
//                                 <Input type="password" placeholder="Repeat new password"/>
//                             </div>
//                             <Button variant="gradient">Update Password</Button>
//                             <div className="border-t pt-4">
//                                 <h3 className="font-semibold text-sm text-destructive mb-2">Danger Zone</h3>
//                                 <Button variant="outline"
//                                         className="border-destructive text-destructive hover:bg-destructive/10">
//                                     Delete Account
//                                 </Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>
//
//             {/* Upgrade modal */}
//             <UpgradePlanModal open={upgradeOpen} onOpenChange={setUpgradeOpen}/>
//         </div>
//     );
// }
//
//
// // "use client";
// // import { useState } from "react";
// // import { useSession } from "next-auth/react";
// // import { CreditCard, User, Shield, Bell, ExternalLink } from "lucide-react";
// // import { Button } from "@/components/ui/button";
// // import { Input, Label, Badge } from "@/components/ui/form-elements";
// // import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
// // import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/misc";
// // import { Progress } from "@/components/ui/misc";
// //
// // export default function SettingsPage() {
// //   const { data: session, update } = useSession();
// //   const [name, setName] = useState(session?.user?.name ?? "");
// //   const [saving, setSaving] = useState(false);
// //   const [portalLoading, setPortalLoading] = useState(false);
// //
// //   const planLabels: Record<string, string> = { free: "Free", silver: "Silver", gold: "Gold", diamond: "Diamond" };
// //   const planColors: Record<string, "secondary" | "info" | "warning" | "success"> = { free: "secondary", silver: "info", gold: "warning", diamond: "success" };
// //
// //   const openBillingPortal = async () => {
// //     setPortalLoading(true);
// //     try {
// //       const res = await fetch("/api/subscriptions/checkout", {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ action: "portal" }),
// //       });
// //       const d = await res.json();
// //       if (d.success) window.open(d.data.url, "_blank");
// //     } finally { setPortalLoading(false); }
// //   };
// //
// //   return (
// //     <div className="space-y-6 max-w-3xl">
// //       <div>
// //         <h1 className="text-2xl font-bold">Settings</h1>
// //         <p className="text-muted-foreground text-sm">Manage your account, billing, and preferences</p>
// //       </div>
// //
// //       <Tabs defaultValue="profile">
// //         <TabsList>
// //           <TabsTrigger value="profile" className="gap-2"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
// //           <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-3.5 w-3.5" />Billing</TabsTrigger>
// //           <TabsTrigger value="security" className="gap-2"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
// //         </TabsList>
// //
// //         {/* Profile */}
// //         <TabsContent value="profile" className="mt-4">
// //           <Card>
// //             <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Update your name and profile picture</CardDescription></CardHeader>
// //             <CardContent className="space-y-4">
// //               <div className="flex items-center gap-4">
// //                 <Avatar className="h-16 w-16">
// //                   <AvatarImage src={session?.user?.image ?? ""} />
// //                   <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-xl">
// //                     {session?.user?.name?.charAt(0).toUpperCase()}
// //                   </AvatarFallback>
// //                 </Avatar>
// //                 <div>
// //                   <p className="font-semibold">{session?.user?.name}</p>
// //                   <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
// //                   <Badge variant={planColors[session?.user?.plan ?? "free"]} className="mt-1 capitalize">{planLabels[session?.user?.plan ?? "free"]} Plan</Badge>
// //                 </div>
// //               </div>
// //               <div className="space-y-1.5">
// //                 <Label>Display Name</Label>
// //                 <Input value={name} onChange={(e) => setName(e.target.value)} />
// //               </div>
// //               <div className="space-y-1.5">
// //                 <Label>Email</Label>
// //                 <Input value={session?.user?.email ?? ""} disabled className="opacity-60" />
// //                 <p className="text-xs text-muted-foreground">Email cannot be changed directly. Contact support.</p>
// //               </div>
// //               <Button variant="gradient" isLoading={saving} onClick={async () => { setSaving(true); await update({ name }); setSaving(false); }}>
// //                 Save Changes
// //               </Button>
// //             </CardContent>
// //           </Card>
// //         </TabsContent>
// //
// //         {/* Billing */}
// //         <TabsContent value="billing" className="mt-4 space-y-4">
// //           <Card>
// //             <CardHeader><CardTitle>Current Plan</CardTitle><CardDescription>Manage your subscription and billing</CardDescription></CardHeader>
// //             <CardContent className="space-y-4">
// //               <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800">
// //                 <div>
// //                   <p className="font-bold text-lg capitalize">{session?.user?.plan ?? "Free"} Plan</p>
// //                   <p className="text-sm text-muted-foreground">Active subscription</p>
// //                 </div>
// //                 <Badge variant={planColors[session?.user?.plan ?? "free"]} className="capitalize text-sm px-3 py-1">
// //                   {planLabels[session?.user?.plan ?? "free"]}
// //                 </Badge>
// //               </div>
// //               <div className="flex gap-3 flex-wrap">
// //                 <Button variant="gradient" asChild><a href="/pricing">Upgrade Plan</a></Button>
// //                 {session?.user?.plan !== "free" && (
// //                   <Button variant="outline" onClick={openBillingPortal} isLoading={portalLoading} className="gap-2">
// //                     <ExternalLink className="h-4 w-4" /> Manage Billing
// //                   </Button>
// //                 )}
// //               </div>
// //             </CardContent>
// //           </Card>
// //
// //           <Card>
// //             <CardHeader><CardTitle>Pay with Crypto</CardTitle><CardDescription>Use Coinbase Commerce to pay with cryptocurrency</CardDescription></CardHeader>
// //             <CardContent>
// //               <p className="text-sm text-muted-foreground mb-4">Bitcoin, Ethereum, USDC, and more accepted via Coinbase Commerce.</p>
// //               <Button variant="outline" asChild><a href="/pricing">View Crypto Plans →</a></Button>
// //             </CardContent>
// //           </Card>
// //         </TabsContent>
// //
// //         {/* Security */}
// //         <TabsContent value="security" className="mt-4">
// //           <Card>
// //             <CardHeader><CardTitle>Security</CardTitle><CardDescription>Manage password and account security</CardDescription></CardHeader>
// //             <CardContent className="space-y-4">
// //               <div className="space-y-1.5">
// //                 <Label>Current Password</Label>
// //                 <Input type="password" placeholder="••••••••" />
// //               </div>
// //               <div className="space-y-1.5">
// //                 <Label>New Password</Label>
// //                 <Input type="password" placeholder="Min. 6 characters" />
// //               </div>
// //               <div className="space-y-1.5">
// //                 <Label>Confirm New Password</Label>
// //                 <Input type="password" placeholder="Repeat new password" />
// //               </div>
// //               <Button variant="gradient">Update Password</Button>
// //               <div className="border-t pt-4 mt-4">
// //                 <h3 className="font-semibold text-sm text-destructive mb-2">Danger Zone</h3>
// //                 <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">Delete Account</Button>
// //               </div>
// //             </CardContent>
// //           </Card>
// //         </TabsContent>
// //       </Tabs>
// //     </div>
// //   );
// // }
