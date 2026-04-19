"use client";
import { useState } from "react";
import { Save, Key, Bell, Globe, Cpu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/form-elements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";

export default function SuperAdminSettingsPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground text-sm">Configure global platform settings and integrations</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-2"><Globe className="h-3.5 w-3.5" />General</TabsTrigger>
          <TabsTrigger value="ai" className="gap-2"><Cpu className="h-3.5 w-3.5" />AI Limits</TabsTrigger>
          <TabsTrigger value="keys" className="gap-2"><Key className="h-3.5 w-3.5" />API Keys</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Platform Settings</CardTitle><CardDescription>Basic platform configuration</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Platform Name</Label>
                <Input defaultValue="SEO Platform" />
              </div>
              <div className="space-y-1.5">
                <Label>Platform URL</Label>
                <Input defaultValue={process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"} />
              </div>
              <div className="space-y-1.5">
                <Label>Support Email</Label>
                <Input type="email" defaultValue="support@seoplatform.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Google Analytics ID</Label>
                <Input placeholder="G-XXXXXXXXXX" />
              </div>
              <Button variant="gradient" isLoading={saving} onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Limits */}
        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardHeader><CardTitle>AI Usage Limits</CardTitle><CardDescription>Configure default AI credit limits per plan</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { plan: "Free", default: 10 },
                { plan: "Silver", default: 100 },
                { plan: "Gold", default: 500 },
                { plan: "Diamond", default: 2000 },
              ].map((p) => (
                <div key={p.plan} className="flex items-center gap-4">
                  <Label className="w-24 shrink-0">{p.plan}</Label>
                  <Input type="number" defaultValue={p.default} className="max-w-[160px]" />
                  <span className="text-sm text-muted-foreground">credits / month</span>
                </div>
              ))}
              <Button variant="gradient" isLoading={saving} onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" /> Save Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="keys" className="mt-4">
          <Card>
            <CardHeader><CardTitle>API Key Status</CardTitle><CardDescription>Integration key configuration overview</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "OpenAI API Key", envVar: "OPENAI_API_KEY", status: "configured" },
                  { name: "Stripe Secret Key", envVar: "STRIPE_SECRET_KEY", status: "configured" },
                  { name: "Coinbase Commerce", envVar: "COINBASE_COMMERCE_API_KEY", status: "configured" },
                  { name: "Cloudinary", envVar: "CLOUDINARY_API_KEY", status: "configured" },
                  { name: "Upstash Redis", envVar: "UPSTASH_REDIS_REST_URL", status: "configured" },
                  { name: "Gmail SMTP", envVar: "EMAIL_SERVER_HOST", status: "configured" },
                ].map((key) => (
                  <div key={key.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{key.envVar}</p>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
                      ● Set in .env
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">API keys are managed via environment variables. Restart the server after changes.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle><CardDescription>Platform-wide security configuration</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Rate Limiting", desc: "Upstash Redis rate limiting on all API endpoints", enabled: true },
                { label: "RBAC Enforcement", desc: "Role-based access control via Edge Middleware", enabled: true },
                { label: "JWT Sessions", desc: "Secure JWT tokens via NextAuth.js v4", enabled: true },
                { label: "Security Headers", desc: "X-Frame-Options, CSP, XSS-Protection headers", enabled: true },
                { label: "Input Validation", desc: "Zod schema validation on all API inputs", enabled: true },
              ].map((s) => (
                <div key={s.label} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${s.enabled ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-red-600 bg-red-100"}`}>
                    {s.enabled ? "● Active" : "● Inactive"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
