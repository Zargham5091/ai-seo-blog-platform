"use client";
import {useEffect, useState} from "react";
import {
    Mail,
    Users,
    BarChart3,
    Plus,
    Send,
    Edit,
    Sparkles,
    Eye,
    MousePointer,
    X,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {StatsCard} from "@/components/dashboard/StatsCard";
// import {TipTapEditor} from "@/components/email/TipTapEditor";
import {TiptapEditor} from "@/components/blog/TiptapEditor";

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

interface Subscriber {
    email: string;
    name: string;
    subscribedAt: string;
    isActive: boolean;
}

interface CampaignSend {
    email: string;
    name: string;
    status: "sent" | "failed" | "opened" | "clicked";
    sentAt: string;
    openedAt?: string;
    clickedAt?: string;
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
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [addEmail, setAddEmail] = useState("");
    const [addName, setAddName] = useState("");
    const [addingSubscriber, setAddingSubscriber] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [campaignSends, setCampaignSends] = useState<CampaignSend[]>([]);
    const [showDetails, setShowDetails] = useState(false);
    const [showAIOptions, setShowAIOptions] = useState(false);
    const [form, setForm] = useState({
        subject: "",
        previewText: "",
        htmlContent: "",
        fromName: "My Blog",
        scheduledAt: "",
        aiTone: "professional",
        aiPurpose: "newsletter",
    });

    const fetchData = async () => {
        setIsLoading(true);
        const [c, s, subs] = await Promise.all([
            fetch("/api/newsletter?type=campaigns").then((r) => r.json()),
            fetch("/api/newsletter?type=stats").then((r) => r.json()),
            fetch("/api/newsletter?type=subscribers").then((r) => r.json()),
        ]);
        if (c.success) setCampaigns(c.data);
        if (s.success) setStats(s.data);
        if (subs.success) setSubscribers(subs.data);
        setIsLoading(false);
    };

    const fetchCampaignDetails = async (campaignId: string) => {
        const res = await fetch(`/api/newsletter?type=campaign-details&campaignId=${campaignId}`);
        const d = await res.json();
        if (d.success) {
            setSelectedCampaign(d.data);
            setCampaignSends(d.data.sends || []);
            setShowDetails(true);
        }
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

    const sendNow = async (campaignId: string) => {
        await fetch("/api/newsletter?action=send-now", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({campaignId}),
        });
        fetchData();
    };

    const generateWithAI = async () => {
        if (!form.subject) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/email-writer", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    subject: form.subject,
                    tone: form.aiTone,
                    purpose: form.aiPurpose
                }),
            });
            const d = await res.json();
            if (d.success && d.data) {
                setForm({
                    ...form,
                    subject: d.data.subject,
                    previewText: d.data.previewText,
                    htmlContent: d.data.htmlContent,
                });
                setShowAIOptions(false);
            }
        } catch (error) {
            console.error("AI generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
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
                    <TabsTrigger value="subscribers">Subscribers ({stats.totalSubscribers})</TabsTrigger>
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
                                <Card key={c._id} className="cursor-pointer hover:shadow-md transition"
                                      onClick={() => fetchCampaignDetails(c._id)}>
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
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm("Delete this campaign?")) {
                                                    await fetch(`/api/newsletter?campaignId=${c._id}`, {method: "DELETE"});
                                                    fetchData();
                                                }
                                            }}
                                        >
                                            <X className="h-4 w-4"/>
                                        </Button>
                                        <Badge variant={STATUS_BADGE[c.status] ?? "secondary"}
                                               className="capitalize shrink-0">{c.status}</Badge>
                                        {c.status === "draft" && (
                                            <Button size="sm" variant="outline" onClick={(e) => {
                                                e.stopPropagation();
                                                sendNow(c._id);
                                            }} className="gap-1">
                                                <Send className="h-3 w-3"/> Send Now
                                            </Button>
                                        )}
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
                            <div className="flex gap-2 mb-6">
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
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 text-sm font-semibold border-b">
                                    <div>Name</div>
                                    <div>Email</div>
                                    <div>Subscribed</div>
                                </div>
                                <div className="divide-y">
                                    {subscribers.map((sub, idx) => (
                                        <div key={idx} className="grid grid-cols-3 gap-4 p-3 text-sm">
                                            <div>{sub.name || "—"}</div>
                                            <div>{sub.email}</div>
                                            <div>{new Date(sub.subscribedAt).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                                    {subscribers.length === 0 && (
                                        <div className="p-6 text-center text-muted-foreground text-sm">No subscribers
                                            yet</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Campaign Details Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5"/> {selectedCampaign?.subject}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-2xl font-bold">{selectedCampaign?.recipientCount || 0}</p>
                                <p className="text-xs text-muted-foreground">Total Sent</p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-2xl font-bold text-emerald-600">{selectedCampaign?.openCount || 0}</p>
                                <p className="text-xs text-muted-foreground">Opens</p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <p className="text-2xl font-bold text-indigo-600">{selectedCampaign?.clickCount || 0}</p>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold mb-3">Delivery Status</h3>
                            <div className="border rounded-lg">
                                <div className="grid grid-cols-4 gap-3 p-3 bg-muted/50 text-xs font-semibold border-b">
                                    <div>Email</div>
                                    <div>Name</div>
                                    <div>Status</div>
                                    <div>Time</div>
                                </div>
                                <div className="divide-y max-h-[300px] overflow-y-auto">
                                    {campaignSends.map((send, idx) => (
                                        <div key={idx} className="grid grid-cols-4 gap-3 p-3 text-xs">
                                            <div className="truncate">{send.email}</div>
                                            <div className="truncate">{send.name || "—"}</div>
                                            <div className="flex items-center gap-1">
                                                {send.status === "sent" && <Send className="h-3 w-3 text-blue-500"/>}
                                                {send.status === "opened" &&
                                                    <Eye className="h-3 w-3 text-emerald-500"/>}
                                                {send.status === "clicked" &&
                                                    <MousePointer className="h-3 w-3 text-indigo-500"/>}
                                                {send.status === "failed" &&
                                                    <XCircle className="h-3 w-3 text-red-500"/>}
                                                <span className="capitalize">{send.status}</span>
                                            </div>
                                            <div>{new Date(send.sentAt).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Campaign Dialog with TipTap */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Subject Line */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Subject Line *</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={form.subject}
                                    onChange={(e) => setForm({...form, subject: e.target.value})}
                                    placeholder="Email subject..."
                                    className="flex-1"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAIOptions(!showAIOptions)}
                                    className="gap-1.5 shrink-0"
                                >
                                    <Sparkles className="h-3.5 w-3.5"/> AI Write
                                </Button>
                            </div>
                        </div>

                        {/* AI Options - Only visible when clicked */}
                        {showAIOptions && (
                            <Card className="border-indigo-200 bg-indigo-50/30">
                                <CardContent className="p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Tone</Label>
                                            <select
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                value={form.aiTone}
                                                onChange={(e) => setForm({...form, aiTone: e.target.value})}
                                            >
                                                <option value="professional">Professional</option>
                                                <option value="casual">Casual</option>
                                                <option value="educational">Educational</option>
                                                <option value="inspirational">Inspirational</option>
                                                <option value="humorous">Humorous</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Purpose</Label>
                                            <select
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                                value={form.aiPurpose}
                                                onChange={(e) => setForm({...form, aiPurpose: e.target.value})}
                                            >
                                                <option value="newsletter">Newsletter</option>
                                                <option value="announcement">Announcement</option>
                                                <option value="promotion">Promotion</option>
                                                <option value="update">Update</option>
                                                <option value="welcome">Welcome</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={generateWithAI}
                                        isLoading={isGenerating}
                                        variant="gradient"
                                        size="sm"
                                        className="w-full gap-2"
                                    >
                                        <Sparkles className="h-3.5 w-3.5"/> Generate Email Content
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Preview Text */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Preview Text</Label>
                            <Input
                                value={form.previewText}
                                onChange={(e) => setForm({...form, previewText: e.target.value})}
                                placeholder="Brief preview shown in inbox..."
                            />
                        </div>

                        {/* TipTap Editor for Email Content */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Content</Label>
                            <TiptapEditor
                                key={form.htmlContent}
                                content={form.htmlContent}
                                onChange={(content: string) => setForm({...form, htmlContent: content})}
                                placeholder="Write your email content here..."
                                className="min-h-[300px]"
                            />
                        </div>

                        {/* Settings */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">From Name</Label>
                                <Input
                                    value={form.fromName}
                                    onChange={(e) => setForm({...form, fromName: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Schedule (optional)</Label>
                                <Input
                                    type="datetime-local"
                                    value={form.scheduledAt}
                                    onChange={(e) => setForm({...form, scheduledAt: e.target.value})}
                                />
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


// "use client";
// import {useEffect, useState} from "react";
// import {
//     Mail,
//     Users,
//     BarChart3,
//     Plus,
//     Send,
//     Edit,
//     Sparkles,
//     Eye,
//     MousePointer,
//     X,
//     CheckCircle,
//     XCircle,
//     Clock
// } from "lucide-react";
// import {Button} from "@/components/ui/button";
// import {Input, Label, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
// import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
// import {StatsCard} from "@/components/dashboard/StatsCard";
//
// interface Campaign {
//     _id: string;
//     subject: string;
//     status: string;
//     recipientCount: number;
//     openCount: number;
//     clickCount: number;
//     sentAt?: string;
//     scheduledAt?: string;
//     createdAt: string;
// }
//
// interface Subscriber {
//     email: string;
//     name: string;
//     subscribedAt: string;
//     isActive: boolean;
// }
//
// interface CampaignSend {
//     email: string;
//     name: string;
//     status: "sent" | "failed" | "opened" | "clicked";
//     sentAt: string;
//     openedAt?: string;
//     clickedAt?: string;
// }
//
// interface Stats {
//     totalSubscribers: number;
//     totalCampaigns: number;
//     avgOpenRate: number;
// }
//
// const STATUS_BADGE: Record<string, "secondary" | "info" | "warning" | "success" | "destructive"> = {
//     draft: "secondary",
//     scheduled: "info",
//     sending: "warning",
//     sent: "success",
//     failed: "destructive",
// };
//
// export default function NewsletterPage() {
//     const [campaigns, setCampaigns] = useState<Campaign[]>([]);
//     const [stats, setStats] = useState<Stats>({totalSubscribers: 0, totalCampaigns: 0, avgOpenRate: 0});
//     const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [showCreate, setShowCreate] = useState(false);
//     const [isSaving, setIsSaving] = useState(false);
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [addEmail, setAddEmail] = useState("");
//     const [addName, setAddName] = useState("");
//     const [addingSubscriber, setAddingSubscriber] = useState(false);
//     const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
//     const [campaignSends, setCampaignSends] = useState<CampaignSend[]>([]);
//     const [showDetails, setShowDetails] = useState(false);
//     const [form, setForm] = useState({
//         subject: "",
//         previewText: "",
//         htmlContent: "",
//         fromName: "My Blog",
//         scheduledAt: "",
//         aiTone: "professional",
//         aiPurpose: "newsletter",
//     });
//
//     const fetchData = async () => {
//         setIsLoading(true);
//         const [c, s, subs] = await Promise.all([
//             fetch("/api/newsletter?type=campaigns").then((r) => r.json()),
//             fetch("/api/newsletter?type=stats").then((r) => r.json()),
//             fetch("/api/newsletter?type=subscribers").then((r) => r.json()),
//         ]);
//         if (c.success) setCampaigns(c.data);
//         if (s.success) setStats(s.data);
//         if (subs.success) setSubscribers(subs.data);
//         setIsLoading(false);
//     };
//
//     const fetchCampaignDetails = async (campaignId: string) => {
//         const res = await fetch(`/api/newsletter?type=campaign-details&campaignId=${campaignId}`);
//         const d = await res.json();
//         if (d.success) {
//             setSelectedCampaign(d.data);
//             setCampaignSends(d.data.sends || []);
//             setShowDetails(true);
//         }
//     };
//
//     useEffect(() => {
//         fetchData();
//     }, []);
//
//     const handleSaveCampaign = async () => {
//         setIsSaving(true);
//         const res = await fetch("/api/newsletter?action=campaign", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify(form),
//         });
//         const d = await res.json();
//         if (d.success) {
//             setShowCreate(false);
//             fetchData();
//         }
//         setIsSaving(false);
//     };
//
//     const sendNow = async (campaignId: string) => {
//         await fetch("/api/newsletter?action=send-now", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({campaignId}),
//         });
//         fetchData();
//     };
//
//     const generateWithAI = async () => {
//         if (!form.subject) return;
//         setIsGenerating(true);
//         const res = await fetch("/api/email-writer", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({
//                 subject: form.subject,
//                 tone: form.aiTone || "professional",
//                 purpose: form.aiPurpose || "newsletter"
//             }),
//         });
//         const d = await res.json();
//         if (d.success && d.data.newsletter) {
//             const lines = (d.data.newsletter as string).split("\n");
//             const subjectLine = lines.find((l: string) => l.startsWith("Subject:"))?.replace("Subject:", "").trim() ?? form.subject;
//             const body = lines.filter((l: string) => !l.startsWith("Subject:")).join("\n").trim();
//             setForm((f) => ({...f, htmlContent: `<p>${body.replace(/\n\n/g, "</p><p>")}</p>`, subject: subjectLine}));
//         }
//         setIsGenerating(false);
//     };
//
//     const addSubscriber = async () => {
//         if (!addEmail) return;
//         setAddingSubscriber(true);
//         await fetch("/api/newsletter?action=subscribe", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({email: addEmail, name: addName}),
//         });
//         setAddEmail("");
//         setAddName("");
//         setAddingSubscriber(false);
//         fetchData();
//     };
//
//     return (
//         <div className="space-y-6">
//             <div className="flex items-center justify-between">
//                 <div>
//                     <h1 className="text-2xl font-bold flex items-center gap-2">
//                         <Mail className="h-6 w-6 text-indigo-500"/> Newsletter
//                     </h1>
//                     <p className="text-muted-foreground text-sm">Build your audience and send email campaigns</p>
//                 </div>
//                 <Button variant="gradient" className="gap-2" onClick={() => setShowCreate(true)}>
//                     <Plus className="h-4 w-4"/> New Campaign
//                 </Button>
//             </div>
//
//             <div className="grid grid-cols-3 gap-4">
//                 <StatsCard title="Subscribers" value={stats.totalSubscribers} icon={Users}
//                            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"/>
//                 <StatsCard title="Campaigns Sent" value={stats.totalCampaigns} icon={Send}
//                            gradient="bg-gradient-to-br from-sky-500 to-sky-600"/>
//                 <StatsCard title="Avg Open Rate" value={`${stats.avgOpenRate}%`} icon={BarChart3}
//                            gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"/>
//             </div>
//
//             <Tabs defaultValue="campaigns">
//                 <TabsList>
//                     <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
//                     <TabsTrigger value="subscribers">Subscribers ({stats.totalSubscribers})</TabsTrigger>
//                 </TabsList>
//
//                 <TabsContent value="campaigns" className="mt-4">
//                     {isLoading ? (
//                         <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i}
//                                                                                      className="h-16 skeleton rounded-xl"/>)}</div>
//                     ) : campaigns.length === 0 ? (
//                         <Card>
//                             <CardContent className="flex flex-col items-center py-16 text-center">
//                                 <Mail className="h-10 w-10 text-muted-foreground/30 mb-3"/>
//                                 <p className="font-semibold">No campaigns yet</p>
//                                 <p className="text-sm text-muted-foreground mt-1">Create your first email campaign</p>
//                             </CardContent>
//                         </Card>
//                     ) : (
//                         <div className="space-y-3">
//                             {campaigns.map((c) => (
//                                 <Card key={c._id} className="cursor-pointer hover:shadow-md transition"
//                                       onClick={() => fetchCampaignDetails(c._id)}>
//                                     <CardContent className="p-4 flex items-center gap-4">
//                                         <div className="flex-1">
//                                             <p className="font-semibold text-sm">{c.subject}</p>
//                                             <p className="text-xs text-muted-foreground mt-0.5">
//                                                 {c.sentAt ? `Sent ${new Date(c.sentAt).toLocaleDateString()}` :
//                                                     c.scheduledAt ? `Scheduled ${new Date(c.scheduledAt).toLocaleDateString()}` :
//                                                         `Created ${new Date(c.createdAt).toLocaleDateString()}`}
//                                             </p>
//                                         </div>
//                                         {c.status === "sent" && (
//                                             <div className="flex gap-4 text-center text-xs text-muted-foreground">
//                                                 <div><p
//                                                     className="font-bold text-base text-foreground">{c.recipientCount}</p>
//                                                     <p>Sent</p></div>
//                                                 <div><p
//                                                     className="font-bold text-base text-emerald-600">{c.recipientCount ? Math.round(c.openCount / c.recipientCount * 100) : 0}%</p>
//                                                     <p>Opens</p></div>
//                                                 <div><p
//                                                     className="font-bold text-base text-indigo-600">{c.recipientCount ? Math.round(c.clickCount / c.recipientCount * 100) : 0}%</p>
//                                                     <p>Clicks</p></div>
//                                             </div>
//                                         )}
//                                         <Button
//                                             size="sm"
//                                             variant="ghost"
//                                             className="text-red-500 hover:text-red-700"
//                                             onClick={async (e) => {
//                                                 e.stopPropagation();
//                                                 if (confirm("Delete this campaign?")) {
//                                                     await fetch(`/api/newsletter?campaignId=${c._id}`, {method: "DELETE"});
//                                                     fetchData();
//                                                 }
//                                             }}
//                                         >
//                                             <X className="h-4 w-4"/>
//                                         </Button>
//                                         <Badge variant={STATUS_BADGE[c.status] ?? "secondary"}
//                                                className="capitalize shrink-0">{c.status}</Badge>
//                                         {c.status === "draft" && (
//                                             <Button size="sm" variant="outline" onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 sendNow(c._id);
//                                             }} className="gap-1">
//                                                 <Send className="h-3 w-3"/> Send Now
//                                             </Button>
//                                         )}
//                                     </CardContent>
//                                 </Card>
//                             ))}
//                         </div>
//                     )}
//                 </TabsContent>
//
//                 <TabsContent value="subscribers" className="mt-4">
//                     <Card>
//                         <CardHeader className="pb-3"><CardTitle className="text-sm">Add
//                             Subscriber</CardTitle></CardHeader>
//                         <CardContent>
//                             <div className="flex gap-2 mb-6">
//                                 <Input value={addName} onChange={(e) => setAddName(e.target.value)}
//                                        placeholder="Name (optional)" className="max-w-[160px]"/>
//                                 <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
//                                        placeholder="Email address *" className="flex-1"
//                                        onKeyDown={(e) => e.key === "Enter" && addSubscriber()}/>
//                                 <Button variant="gradient" onClick={addSubscriber} isLoading={addingSubscriber}
//                                         className="gap-1.5 shrink-0">
//                                     <Plus className="h-4 w-4"/> Add
//                                 </Button>
//                             </div>
//
//                             <div className="border rounded-lg">
//                                 <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 text-sm font-semibold border-b">
//                                     <div>Name</div>
//                                     <div>Email</div>
//                                     <div>Subscribed</div>
//                                 </div>
//                                 <div className="divide-y">
//                                     {subscribers.map((sub, idx) => (
//                                         <div key={idx} className="grid grid-cols-3 gap-4 p-3 text-sm">
//                                             <div>{sub.name || "—"}</div>
//                                             <div>{sub.email}</div>
//                                             <div>{new Date(sub.subscribedAt).toLocaleDateString()}</div>
//                                         </div>
//                                     ))}
//                                     {subscribers.length === 0 && (
//                                         <div className="p-6 text-center text-muted-foreground text-sm">No subscribers
//                                             yet</div>
//                                     )}
//                                 </div>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>
//
//             {/* Campaign Details Dialog */}
//             <Dialog open={showDetails} onOpenChange={setShowDetails}>
//                 <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
//                     <DialogHeader>
//                         <DialogTitle className="flex items-center gap-2">
//                             <Mail className="h-5 w-5"/> {selectedCampaign?.subject}
//                         </DialogTitle>
//                     </DialogHeader>
//
//                     <div className="space-y-6">
//                         {/* Stats Summary */}
//                         <div className="grid grid-cols-3 gap-4">
//                             <div className="text-center p-3 bg-muted/30 rounded-lg">
//                                 <p className="text-2xl font-bold">{selectedCampaign?.recipientCount || 0}</p>
//                                 <p className="text-xs text-muted-foreground">Total Sent</p>
//                             </div>
//                             <div className="text-center p-3 bg-muted/30 rounded-lg">
//                                 <p className="text-2xl font-bold text-emerald-600">{selectedCampaign?.openCount || 0}</p>
//                                 <p className="text-xs text-muted-foreground">Opens</p>
//                             </div>
//                             <div className="text-center p-3 bg-muted/30 rounded-lg">
//                                 <p className="text-2xl font-bold text-indigo-600">{selectedCampaign?.clickCount || 0}</p>
//                                 <p className="text-xs text-muted-foreground">Clicks</p>
//                             </div>
//                         </div>
//
//                         {/* Send Logs */}
//                         <div>
//                             <h3 className="text-sm font-semibold mb-3">Delivery Status</h3>
//                             <div className="border rounded-lg">
//                                 <div className="grid grid-cols-4 gap-3 p-3 bg-muted/50 text-xs font-semibold border-b">
//                                     <div>Email</div>
//                                     <div>Name</div>
//                                     <div>Status</div>
//                                     <div>Time</div>
//                                 </div>
//                                 <div className="divide-y max-h-[300px] overflow-y-auto">
//                                     {campaignSends.map((send, idx) => (
//                                         <div key={idx} className="grid grid-cols-4 gap-3 p-3 text-xs">
//                                             <div className="truncate">{send.email}</div>
//                                             <div className="truncate">{send.name || "—"}</div>
//                                             <div className="flex items-center gap-1">
//                                                 {send.status === "sent" && <Send className="h-3 w-3 text-blue-500"/>}
//                                                 {send.status === "opened" &&
//                                                     <Eye className="h-3 w-3 text-emerald-500"/>}
//                                                 {send.status === "clicked" &&
//                                                     <MousePointer className="h-3 w-3 text-indigo-500"/>}
//                                                 {send.status === "failed" &&
//                                                     <XCircle className="h-3 w-3 text-red-500"/>}
//                                                 <span className="capitalize">{send.status}</span>
//                                             </div>
//                                             <div>{new Date(send.sentAt).toLocaleString()}</div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//
//                     <DialogFooter>
//                         <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//
//             {/* Create Campaign Dialog - same as before */}
//             <Dialog open={showCreate} onOpenChange={setShowCreate}>
//                 <DialogContent className="max-w-2xl">
//                     <DialogHeader><DialogTitle>Create Email Campaign</DialogTitle></DialogHeader>
//                     <div className="space-y-3 py-2">
//                         <div className="space-y-1.5">
//                             <Label className="text-xs">Subject Line *</Label>
//                             <div className="flex gap-2">
//                                 <Input value={form.subject}
//                                        onChange={(e) => setForm({...form, subject: e.target.value})}
//                                        placeholder="Email subject..." className="flex-1"/>
//                                 <Button variant="outline" size="sm" onClick={generateWithAI} isLoading={isGenerating}
//                                         className="gap-1.5 shrink-0">
//                                     <Sparkles className="h-3.5 w-3.5"/> AI Write
//                                 </Button>
//                             </div>
//                         </div>
//                         <div className="grid grid-cols-2 gap-3">
//                             <div className="space-y-1.5">
//                                 <Label className="text-xs">AI Tone</Label>
//                                 <select
//                                     className="w-full rounded-md border bg-background px-3 py-2 text-sm"
//                                     value={form.aiTone || "professional"}
//                                     onChange={(e) => setForm({...form, aiTone: e.target.value})}
//                                 >
//                                     <option value="professional">Professional</option>
//                                     <option value="casual">Casual</option>
//                                     <option value="educational">Educational</option>
//                                     <option value="inspirational">Inspirational</option>
//                                     <option value="humorous">Humorous</option>
//                                 </select>
//                             </div>
//                             <div className="space-y-1.5">
//                                 <Label className="text-xs">Email Purpose</Label>
//                                 <select
//                                     className="w-full rounded-md border bg-background px-3 py-2 text-sm"
//                                     value={form.aiPurpose || "newsletter"}
//                                     onChange={(e) => setForm({...form, aiPurpose: e.target.value})}
//                                 >
//                                     <option value="newsletter">Newsletter</option>
//                                     <option value="announcement">Announcement</option>
//                                     <option value="promotion">Promotion</option>
//                                     <option value="update">Update</option>
//                                     <option value="welcome">Welcome</option>
//                                 </select>
//                             </div>
//                         </div>
//                         <div className="space-y-1.5">
//                             <Label className="text-xs">Preview Text</Label>
//                             <Input value={form.previewText}
//                                    onChange={(e) => setForm({...form, previewText: e.target.value})}
//                                    placeholder="Brief preview shown in inbox..."/>
//                         </div>
//                         <div className="space-y-1.5">
//                             <Label className="text-xs">Content (HTML)</Label>
//                             <textarea value={form.htmlContent}
//                                       onChange={(e) => setForm({...form, htmlContent: e.target.value})} rows={8}
//                                       placeholder="<p>Your email content...</p>"
//                                       className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
//                         </div>
//                         <div className="grid grid-cols-2 gap-3">
//                             <div className="space-y-1.5">
//                                 <Label className="text-xs">From Name</Label>
//                                 <Input value={form.fromName}
//                                        onChange={(e) => setForm({...form, fromName: e.target.value})}/>
//                             </div>
//                             <div className="space-y-1.5">
//                                 <Label className="text-xs">Schedule (optional)</Label>
//                                 <Input type="datetime-local" value={form.scheduledAt}
//                                        onChange={(e) => setForm({...form, scheduledAt: e.target.value})}/>
//                             </div>
//                         </div>
//                     </div>
//                     <DialogFooter>
//                         <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
//                         <Button variant="gradient" onClick={handleSaveCampaign} isLoading={isSaving} className="gap-2">
//                             <Send className="h-4 w-4"/> Save Campaign
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// }