"use client";
import {useEffect, useState} from "react";
import {Mail, Users, BarChart3, Plus, Send, Edit, Sparkles} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {StatsCard} from "@/components/dashboard/StatsCard";

interface Campaign {
    _id: string;
    subject: string;
    status: string;
    recipientCount: number;
    openCount: number;
    clickCount: number;
    sentAt?: string;
    scheduledAt?: string;
    createdAt: string;
}

interface Stats {
    totalSubscribers: number;
    totalCampaigns: number;
    avgOpenRate: number;
}

const STATUS_BADGE: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
    draft: "secondary",
    scheduled: "info",
    sending: "warning",
    sent: "success",
    failed: "destructive",
};

export default function NewsletterPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<Stats>({totalSubscribers: 0, totalCampaigns: 0, avgOpenRate: 0});
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [addEmail, setAddEmail] = useState("");
    const [addName, setAddName] = useState("");
    const [addingSubscriber, setAddingSubscriber] = useState(false);
    const [form, setForm] = useState({
        subject: "", previewText: "", htmlContent: "", fromName: "My Blog", scheduledAt: "",
    });

    const fetchData = async () => {
        setIsLoading(true);
        const [c, s] = await Promise.all([
            fetch("/api/newsletter?type=campaigns").then((r) => r.json()),
            fetch("/api/newsletter?type=stats").then((r) => r.json()),
        ]);
        if (c.success) setCampaigns(c.data);
        if (s.success) setStats(s.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveCampaign = async () => {
        setIsSaving(true);
        const res = await fetch("/api/newsletter?action=campaign", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(form),
        });
        const d = await res.json();
        if (d.success) {
            setShowCreate(false);
            fetchData();
        }
        setIsSaving(false);
    };

    const generateWithAI = async () => {
        if (!form.subject) return;
        setIsGenerating(true);
        const res = await fetch("/api/repurpose", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                content: form.subject,
                title: form.subject,
                formats: ["newsletter"],
                tone: "professional",
            }),
        });
        const d = await res.json();
        if (d.success && d.data.newsletter) {
            const lines = (d.data.newsletter as string).split("\n");
            const subjectLine = lines.find((l: string) => l.startsWith("Subject:"))?.replace("Subject:", "").trim() ?? form.subject;
            const body = lines.filter((l: string) => !l.startsWith("Subject:")).join("\n").trim();
            setForm((f) => ({...f, htmlContent: `<p>${body.replace(/\n\n/g, "</p><p>")}</p>`, subject: subjectLine}));
        }
        setIsGenerating(false);
    };

    const addSubscriber = async () => {
        if (!addEmail) return;
        setAddingSubscriber(true);
        await fetch("/api/newsletter?action=subscribe", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: addEmail, name: addName}),
        });
        setAddEmail("");
        setAddName("");
        setAddingSubscriber(false);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="h-6 w-6 text-indigo-500"/> Newsletter
                    </h1>
                    <p className="text-muted-foreground text-sm">Build your audience and send email campaigns</p>
                </div>
                <Button variant="gradient" className="gap-2" onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4"/> New Campaign
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StatsCard title="Subscribers" value={stats.totalSubscribers} icon={Users}
                           gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
                <StatsCard title="Campaigns Sent" value={stats.totalCampaigns} icon={Send}
                           gradient="bg-gradient-to-br from-sky-500 to-sky-600"/>
                <StatsCard title="Avg Open Rate" value={`${stats.avgOpenRate}%`} icon={BarChart3}
                           gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
            </div>

            <Tabs defaultValue="campaigns">
                <TabsList>
                    <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                    <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                </TabsList>

                <TabsContent value="campaigns" className="mt-4">
                    {isLoading ? (
                        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i}
                                                                                     className="h-16 skeleton rounded-xl"/>)}</div>
                    ) : campaigns.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center py-16 text-center">
                                <Mail className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                                <p className="font-semibold">No campaigns yet</p>
                                <p className="text-sm text-muted-foreground mt-1">Create your first email campaign</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.map((c) => (
                                <Card key={c._id}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold text-sm">{c.subject}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {c.sentAt ? `Sent ${new Date(c.sentAt).toLocaleDateString()}` :
                                                    c.scheduledAt ? `Scheduled ${new Date(c.scheduledAt).toLocaleDateString()}` :
                                                        `Created ${new Date(c.createdAt).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        {c.status === "sent" && (
                                            <div className="flex gap-4 text-center text-xs text-muted-foreground">
                                                <div><p
                                                    className="font-bold text-base text-foreground">{c.recipientCount}</p>
                                                    <p>Sent</p></div>
                                                <div><p
                                                    className="font-bold text-base text-emerald-600">{c.recipientCount ? Math.round(c.openCount / c.recipientCount * 100) : 0}%</p>
                                                    <p>Opens</p></div>
                                                <div><p
                                                    className="font-bold text-base text-indigo-600">{c.recipientCount ? Math.round(c.clickCount / c.recipientCount * 100) : 0}%</p>
                                                    <p>Clicks</p></div>
                                            </div>
                                        )}
                                        <Badge variant={STATUS_BADGE[c.status] ?? "secondary"}
                                               className="capitalize shrink-0">{c.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="subscribers" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Add
                            Subscriber</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input value={addName} onChange={(e) => setAddName(e.target.value)}
                                       placeholder="Name (optional)" className="max-w-[160px]"/>
                                <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                                       placeholder="Email address *" className="flex-1"
                                       onKeyDown={(e) => e.key === "Enter" && addSubscriber()}/>
                                <Button variant="gradient" onClick={addSubscriber} isLoading={addingSubscriber}
                                        className="gap-1.5 shrink-0">
                                    <Plus className="h-4 w-4"/> Add
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Total active subscribers: <strong>{stats.totalSubscribers}</strong>
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Campaign Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Subject Line *</Label>
                            <div className="flex gap-2">
                                <Input value={form.subject}
                                       onChange={(e) => setForm({...form, subject: e.target.value})}
                                       placeholder="Email subject..." className="flex-1"/>
                                <Button variant="outline" size="sm" onClick={generateWithAI} isLoading={isGenerating}
                                        className="gap-1.5 shrink-0">
                                    <Sparkles className="h-3.5 w-3.5"/> AI Write
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Preview Text</Label>
                            <Input value={form.previewText}
                                   onChange={(e) => setForm({...form, previewText: e.target.value})}
                                   placeholder="Brief preview shown in inbox..."/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Content (HTML)</Label>
                            <textarea value={form.htmlContent}
                                      onChange={(e) => setForm({...form, htmlContent: e.target.value})} rows={8}
                                      placeholder="<p>Your email content...</p>"
                                      className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">From Name</Label>
                                <Input value={form.fromName}
                                       onChange={(e) => setForm({...form, fromName: e.target.value})}/>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Schedule (optional)</Label>
                                <Input type="datetime-local" value={form.scheduledAt}
                                       onChange={(e) => setForm({...form, scheduledAt: e.target.value})}/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSaveCampaign} isLoading={isSaving} className="gap-2">
                            <Send className="h-4 w-4"/> Save Campaign
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
