"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { CreditCard, User, Shield, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Badge } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/misc";
import { Progress } from "@/components/ui/misc";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const planLabels: Record<string, string> = { free: "Free", silver: "Silver", gold: "Gold", diamond: "Diamond" };
  const planColors: Record<string, "secondary" | "info" | "warning" | "success"> = { free: "secondary", silver: "info", gold: "warning", diamond: "success" };

  const openBillingPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });
      const d = await res.json();
      if (d.success) window.open(d.data.url, "_blank");
    } finally { setPortalLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account, billing, and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><User className="h-3.5 w-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="billing" className="gap-2"><CreditCard className="h-3.5 w-3.5" />Billing</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
        </TabsList>

        {/* Profile */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Update your name and profile picture</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session?.user?.image ?? ""} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-xl">
                    {session?.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{session?.user?.name}</p>
                  <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                  <Badge variant={planColors[session?.user?.plan ?? "free"]} className="mt-1 capitalize">{planLabels[session?.user?.plan ?? "free"]} Plan</Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={session?.user?.email ?? ""} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed directly. Contact support.</p>
              </div>
              <Button variant="gradient" isLoading={saving} onClick={async () => { setSaving(true); await update({ name }); setSaving(false); }}>
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Current Plan</CardTitle><CardDescription>Manage your subscription and billing</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-800">
                <div>
                  <p className="font-bold text-lg capitalize">{session?.user?.plan ?? "Free"} Plan</p>
                  <p className="text-sm text-muted-foreground">Active subscription</p>
                </div>
                <Badge variant={planColors[session?.user?.plan ?? "free"]} className="capitalize text-sm px-3 py-1">
                  {planLabels[session?.user?.plan ?? "free"]}
                </Badge>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button variant="gradient" asChild><a href="/pricing">Upgrade Plan</a></Button>
                {session?.user?.plan !== "free" && (
                  <Button variant="outline" onClick={openBillingPortal} isLoading={portalLoading} className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pay with Crypto</CardTitle><CardDescription>Use Coinbase Commerce to pay with cryptocurrency</CardDescription></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Bitcoin, Ethereum, USDC, and more accepted via Coinbase Commerce.</p>
              <Button variant="outline" asChild><a href="/pricing">View Crypto Plans →</a></Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Security</CardTitle><CardDescription>Manage password and account security</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input type="password" placeholder="Min. 6 characters" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Repeat new password" />
              </div>
              <Button variant="gradient">Update Password</Button>
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-sm text-destructive mb-2">Danger Zone</h3>
                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
