"use client";
import {useState} from "react";
import {Settings, Save, Mail, Globe, Shield, Webhook, CheckCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";

export default function SuperAdminSettingsPage() {
    const [saveMsg, setSaveMsg] = useState("");

    const save = (section: string) => {
        setSaveMsg(`${section} settings saved`);
        setTimeout(() => setSaveMsg(""), 3000);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="h-6 w-6 text-indigo-500"/> Platform Settings
                </h1>
                <p className="text-muted-foreground text-sm">Configure global platform settings</p>
            </div>

            {saveMsg && (
                <div
                    className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg px-4 py-3">
                    <CheckCircle className="h-4 w-4"/> {saveMsg}
                </div>
            )}

            <Tabs defaultValue="general">
                <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="general"><Globe className="h-3.5 w-3.5 mr-1.5"/>General</TabsTrigger>
                    <TabsTrigger value="email"><Mail className="h-3.5 w-3.5 mr-1.5"/>Email</TabsTrigger>
                    <TabsTrigger value="security"><Shield className="h-3.5 w-3.5 mr-1.5"/>Security</TabsTrigger>
                    <TabsTrigger value="integrations"><Webhook className="h-3.5 w-3.5 mr-1.5"/>APIs</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Platform Configuration</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Platform Name</Label>
                                <Input defaultValue="SEO Platform" placeholder="Your SaaS name"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Root Domain</Label>
                                <Input defaultValue={process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000"}
                                       placeholder="yourdomain.com"/>
                                <p className="text-xs text-muted-foreground">Used for subdomain routing (e.g.
                                    user.yourdomain.com)</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>App URL</Label>
                                <Input defaultValue={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
                                       placeholder="https://yourdomain.com"/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Default AI Credits (Free Plan)</Label>
                                <Input type="number" defaultValue={10}/>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Referral Commission (%)</Label>
                                <Input type="number" defaultValue={20} min={0} max={50}/>
                                <p className="text-xs text-muted-foreground">Percentage of first payment given to
                                    referrer</p>
                            </div>
                            <Button variant="gradient" onClick={() => save("General")} className="gap-2">
                                <Save className="h-4 w-4"/> Save General Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Email Configuration</CardTitle>
                            <CardDescription>SMTP settings for sending transactional emails</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>SMTP Host</Label>
                                    <Input defaultValue="smtp.gmail.com" placeholder="smtp.gmail.com"/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP Port</Label>
                                    <Input type="number" defaultValue={587}/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Email Username</Label>
                                    <Input placeholder="your@gmail.com"/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>App Password</Label>
                                    <Input type="password" placeholder="Gmail App Password"/>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>From Email</Label>
                                <Input defaultValue="noreply@yourdomain.com"/>
                            </div>
                            <Button variant="gradient" onClick={() => save("Email")} className="gap-2">
                                <Save className="h-4 w-4"/> Save Email Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Security Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>NextAuth Secret</Label>
                                <Input type="password" defaultValue="••••••••••••••••••••••••"/>
                            </div>
                            <div className="space-y-2">
                                <Label>Allowed OAuth Providers</Label>
                                <div className="space-y-2">
                                    {["Google", "GitHub", "Email/Password"].map((p) => (
                                        <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="checkbox" defaultChecked className="rounded"/>
                                            {p}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Rate Limit (requests per minute)</Label>
                                <Input type="number" defaultValue={60}/>
                            </div>
                            <Button variant="gradient" onClick={() => save("Security")} className="gap-2">
                                <Save className="h-4 w-4"/> Save Security Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="mt-4 space-y-4">
                    {[
                        {name: "OpenAI", key: "OPENAI_API_KEY", desc: "GPT-4o-mini for AI content generation"},
                        {name: "Stripe", key: "STRIPE_SECRET_KEY", desc: "Payment processing"},
                        {name: "Coinbase Commerce", key: "COINBASE_COMMERCE_API_KEY", desc: "Crypto payments"},
                        {name: "Cloudinary", key: "CLOUDINARY_API_KEY", desc: "Image hosting and optimization"},
                        {name: "Google Search Console", key: "GSC_CLIENT_ID", desc: "Real rank data integration"},
                    ].map((integration) => (
                        <Card key={integration.name}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{integration.name}</p>
                                    <p className="text-xs text-muted-foreground">{integration.desc}</p>
                                </div>
                                <Input type="password" placeholder={integration.key} className="max-w-[200px]"/>
                                <Button variant="outline" size="sm" onClick={() => save(integration.name)}>Save</Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

// "use client";
// import { useState } from "react";
// import { Save, Key, Bell, Globe, Cpu, Shield } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
//
// export default function SuperAdminSettingsPage() {
//   const [saving, setSaving] = useState(false);
//
//   const handleSave = async () => {
//     setSaving(true);
//     await new Promise((r) => setTimeout(r, 800));
//     setSaving(false);
//   };
//
//   return (
//     <div className="space-y-6 max-w-3xl">
//       <div>
//         <h1 className="text-2xl font-bold">Platform Settings</h1>
//         <p className="text-muted-foreground text-sm">Configure global platform settings and integrations</p>
//       </div>
//
//       <Tabs defaultValue="general">
//         <TabsList>
//           <TabsTrigger value="general" className="gap-2"><Globe className="h-3.5 w-3.5" />General</TabsTrigger>
//           <TabsTrigger value="ai" className="gap-2"><Cpu className="h-3.5 w-3.5" />AI Limits</TabsTrigger>
//           <TabsTrigger value="keys" className="gap-2"><Key className="h-3.5 w-3.5" />API Keys</TabsTrigger>
//           <TabsTrigger value="security" className="gap-2"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
//         </TabsList>
//
//         {/* General */}
//         <TabsContent value="general" className="mt-4">
//           <Card>
//             <CardHeader><CardTitle>Platform Settings</CardTitle><CardDescription>Basic platform configuration</CardDescription></CardHeader>
//             <CardContent className="space-y-4">
//               <div className="space-y-1.5">
//                 <Label>Platform Name</Label>
//                 <Input defaultValue="SEO Platform" />
//               </div>
//               <div className="space-y-1.5">
//                 <Label>Platform URL</Label>
//                 <Input defaultValue={process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"} />
//               </div>
//               <div className="space-y-1.5">
//                 <Label>Support Email</Label>
//                 <Input type="email" defaultValue="support@seoplatform.com" />
//               </div>
//               <div className="space-y-1.5">
//                 <Label>Google Analytics ID</Label>
//                 <Input placeholder="G-XXXXXXXXXX" />
//               </div>
//               <Button variant="gradient" isLoading={saving} onClick={handleSave} className="gap-2">
//                 <Save className="h-4 w-4" /> Save Changes
//               </Button>
//             </CardContent>
//           </Card>
//         </TabsContent>
//
//         {/* AI Limits */}
//         <TabsContent value="ai" className="mt-4">
//           <Card>
//             <CardHeader><CardTitle>AI Usage Limits</CardTitle><CardDescription>Configure default AI credit limits per plan</CardDescription></CardHeader>
//             <CardContent className="space-y-4">
//               {[
//                 { plan: "Free", default: 10 },
//                 { plan: "Silver", default: 100 },
//                 { plan: "Gold", default: 500 },
//                 { plan: "Diamond", default: 2000 },
//               ].map((p) => (
//                 <div key={p.plan} className="flex items-center gap-4">
//                   <Label className="w-24 shrink-0">{p.plan}</Label>
//                   <Input type="number" defaultValue={p.default} className="max-w-[160px]" />
//                   <span className="text-sm text-muted-foreground">credits / month</span>
//                 </div>
//               ))}
//               <Button variant="gradient" isLoading={saving} onClick={handleSave} className="gap-2">
//                 <Save className="h-4 w-4" /> Save Limits
//               </Button>
//             </CardContent>
//           </Card>
//         </TabsContent>
//
//         {/* API Keys */}
//         <TabsContent value="keys" className="mt-4">
//           <Card>
//             <CardHeader><CardTitle>API Key Status</CardTitle><CardDescription>Integration key configuration overview</CardDescription></CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {[
//                   { name: "OpenAI API Key", envVar: "OPENAI_API_KEY", status: "configured" },
//                   { name: "Stripe Secret Key", envVar: "STRIPE_SECRET_KEY", status: "configured" },
//                   { name: "Coinbase Commerce", envVar: "COINBASE_COMMERCE_API_KEY", status: "configured" },
//                   { name: "Cloudinary", envVar: "CLOUDINARY_API_KEY", status: "configured" },
//                   { name: "Upstash Redis", envVar: "UPSTASH_REDIS_REST_URL", status: "configured" },
//                   { name: "Gmail SMTP", envVar: "EMAIL_SERVER_HOST", status: "configured" },
//                 ].map((key) => (
//                   <div key={key.name} className="flex items-center justify-between p-3 rounded-lg border">
//                     <div>
//                       <p className="text-sm font-medium">{key.name}</p>
//                       <p className="text-xs text-muted-foreground font-mono">{key.envVar}</p>
//                     </div>
//                     <span className="text-xs text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full font-medium">
//                       ● Set in .env
//                     </span>
//                   </div>
//                 ))}
//               </div>
//               <p className="text-xs text-muted-foreground mt-4">API keys are managed via environment variables. Restart the server after changes.</p>
//             </CardContent>
//           </Card>
//         </TabsContent>
//
//         {/* Security */}
//         <TabsContent value="security" className="mt-4">
//           <Card>
//             <CardHeader><CardTitle>Security Settings</CardTitle><CardDescription>Platform-wide security configuration</CardDescription></CardHeader>
//             <CardContent className="space-y-4">
//               {[
//                 { label: "Rate Limiting", desc: "Upstash Redis rate limiting on all API endpoints", enabled: true },
//                 { label: "RBAC Enforcement", desc: "Role-based access control via Edge Middleware", enabled: true },
//                 { label: "JWT Sessions", desc: "Secure JWT tokens via NextAuth.js v4", enabled: true },
//                 { label: "Security Headers", desc: "X-Frame-Options, CSP, XSS-Protection headers", enabled: true },
//                 { label: "Input Validation", desc: "Zod schema validation on all API inputs", enabled: true },
//               ].map((s) => (
//                 <div key={s.label} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
//                   <div>
//                     <p className="text-sm font-medium">{s.label}</p>
//                     <p className="text-xs text-muted-foreground">{s.desc}</p>
//                   </div>
//                   <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${s.enabled ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" : "text-red-600 bg-red-100"}`}>
//                     {s.enabled ? "● Active" : "● Inactive"}
//                   </span>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }
