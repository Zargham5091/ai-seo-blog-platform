// app/(dashboard)/dashboard/super-admin/mascot/page.tsx
"use client";
import {useEffect, useState} from "react";
import {Save, Plus, Trash2, Bot, RefreshCw, Eye, EyeOff} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";

interface MascotAction {
    label: string;
    type: string;
    href?: string
}

interface MascotMessage {
    id: string;
    trigger: string;
    messages: string[];
    action?: MascotAction
}

interface MascotConfig {
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    name: string;
    size: "sm" | "md" | "lg";
    enabledPages: string[];
    disabledPages: string[];
    isGloballyEnabled: boolean;
    showOnMobile: boolean;
    showOnTablet: boolean;
    autoGreetDelay: number;
    idleTimeout: number;
    messages: MascotMessage[];
}

const TRIGGER_OPTIONS = [
    "page_load", "idle", "scroll_hero", "scroll_features", "scroll_pricing",
    "scroll_faq", "scroll_cta", "demo_page", "pricing_page", "register_page", "emotional",
];

const ACTION_TYPES = ["redirect", "chat", "tour", "dismiss"];

export default function MascotAdminPage() {
    const [config, setConfig] = useState<MascotConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [newPage, setNewPage] = useState("");

    useEffect(() => {
        fetch("/api/mascot").then(r => r.json()).then(d => {
            if (d.success) setConfig(d.data);
        }).finally(() => setIsLoading(false));
    }, []);

    const save = async () => {
        if (!config) return;
        setIsSaving(true);
        try {
            const res = await fetch("/api/mascot", {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(config),
            });
            const d = await res.json();
            setSaveMsg(d.success ? "Saved!" : d.error ?? "Failed");
            setTimeout(() => setSaveMsg(""), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const updateMsg = (idx: number, field: string, value: unknown) => {
        if (!config) return;
        const msgs = [...config.messages];
        msgs[idx] = {...msgs[idx], [field]: value};
        setConfig({...config, messages: msgs});
    };

    const updateMsgText = (msgIdx: number, lineIdx: number, val: string) => {
        if (!config) return;
        const msgs = [...config.messages];
        const lines = [...msgs[msgIdx].messages];
        lines[lineIdx] = val;
        msgs[msgIdx] = {...msgs[msgIdx], messages: lines};
        setConfig({...config, messages: msgs});
    };

    const addMsgLine = (msgIdx: number) => {
        if (!config) return;
        const msgs = [...config.messages];
        msgs[msgIdx] = {...msgs[msgIdx], messages: [...msgs[msgIdx].messages, ""]};
        setConfig({...config, messages: msgs});
    };

    const removeMsgLine = (msgIdx: number, lineIdx: number) => {
        if (!config) return;
        const msgs = [...config.messages];
        msgs[msgIdx].messages = msgs[msgIdx].messages.filter((_, i) => i !== lineIdx);
        setConfig({...config, messages: msgs});
    };

    const addMessage = () => {
        if (!config) return;
        setConfig({
            ...config,
            messages: [...config.messages, {
                id: `msg_${Date.now()}`, trigger: "idle",
                messages: ["New message here..."],
            }],
        });
    };

    const removeMessage = (idx: number) => {
        if (!config) return;
        setConfig({...config, messages: config.messages.filter((_, i) => i !== idx)});
    };

    const addPage = (type: "enabled" | "disabled") => {
        if (!newPage.trim() || !config) return;
        const key = type === "enabled" ? "enabledPages" : "disabledPages";
        setConfig({...config, [key]: [...config[key], newPage.trim()]});
        setNewPage("");
    };

    const removePage = (type: "enabled" | "disabled", page: string) => {
        if (!config) return;
        const key = type === "enabled" ? "enabledPages" : "disabledPages";
        setConfig({...config, [key]: config[key].filter(p => p !== page)});
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><RefreshCw
        className="h-6 w-6 animate-spin text-muted-foreground"/></div>;
    if (!config) return <p className="text-muted-foreground">Failed to load config.</p>;

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Bot className="h-6 w-6 text-indigo-500"/> SEIO Mascot Config
                    </h1>
                    <p className="text-muted-foreground text-sm">Control your AI mascot character appearance, behavior
                        and messages</p>
                </div>
                <div className="flex items-center gap-3">
                    {saveMsg && <span
                        className={`text-sm ${saveMsg === "Saved!" ? "text-emerald-600" : "text-destructive"}`}>{saveMsg}</span>}
                    <Button variant="gradient" onClick={save} isLoading={isSaving} className="gap-2">
                        <Save className="h-4 w-4"/> Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="appearance">
                <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="appearance">Appearance</TabsTrigger>
                    <TabsTrigger value="behavior">Behavior</TabsTrigger>
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                    <TabsTrigger value="messages">Messages</TabsTrigger>
                </TabsList>

                {/* ── Appearance ── */}
                <TabsContent value="appearance" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Character Design</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Live preview */}
                            <div className="flex items-center justify-center py-8 rounded-xl border bg-muted/20">
                                <div style={{filter: `drop-shadow(0 0 20px ${config.glowColor}88)`}}>
                                    <svg width="120" height="130" viewBox="0 0 80 90"
                                         xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <radialGradient id="previewBody" cx="45%" cy="35%" r="60%">
                                                <stop offset="0%" stopColor={config.secondaryColor} stopOpacity="0.9"/>
                                                <stop offset="100%" stopColor={config.primaryColor}/>
                                            </radialGradient>
                                        </defs>
                                        <ellipse cx="40" cy="88" rx="22" ry="4" fill="black" opacity="0.12"/>
                                        <line x1="22" y1="18" x2="15" y2="6" stroke={config.primaryColor}
                                              strokeWidth="2.5" strokeLinecap="round"/>
                                        <circle cx="14" cy="5" r="3.5" fill={config.glowColor}/>
                                        <circle cx="14" cy="5" r="2" fill="white" opacity="0.7"/>
                                        <line x1="58" y1="18" x2="65" y2="6" stroke={config.primaryColor}
                                              strokeWidth="2.5" strokeLinecap="round"/>
                                        <circle cx="66" cy="5" r="3.5" fill={config.glowColor}/>
                                        <circle cx="66" cy="5" r="2" fill="white" opacity="0.7"/>
                                        <ellipse cx="40" cy="55" rx="30" ry="32" fill="url(#previewBody)"/>
                                        <ellipse cx="12" cy="55" rx="7" ry="9" fill={config.primaryColor}
                                                 opacity="0.9"/>
                                        <ellipse cx="68" cy="55" rx="7" ry="9" fill={config.primaryColor}
                                                 opacity="0.9"/>
                                        <circle cx="40" cy="42" r="14" fill="white" opacity="0.95"/>
                                        <circle cx="40" cy="42" r="5" fill={config.primaryColor}/>
                                        <circle cx="43" cy="40" r="2" fill="white" opacity="0.8"/>
                                        <path d="M 31 60 Q 40 65 49 60" fill="none" stroke="white" strokeWidth="2"
                                              strokeLinecap="round" opacity="0.9"/>
                                        <text x="40" y="100" textAnchor="middle" fontSize="8" fontWeight="bold"
                                              fill={config.primaryColor} opacity="0.7"
                                              letterSpacing="1">{config.name}</text>
                                    </svg>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Character Name</Label>
                                    <Input value={config.name}
                                           onChange={e => setConfig({...config, name: e.target.value})}/>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Size</Label>
                                    <select value={config.size} onChange={e => setConfig({
                                        ...config,
                                        size: e.target.value as "sm" | "md" | "lg"
                                    })}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                                        <option value="sm">Small (64px)</option>
                                        <option value="md">Medium (80px)</option>
                                        <option value="lg">Large (96px)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Primary Color</Label>
                                    <div className="flex gap-2">
                                        <input type="color" value={config.primaryColor}
                                               onChange={e => setConfig({...config, primaryColor: e.target.value})}
                                               className="h-9 w-12 rounded border cursor-pointer"/>
                                        <Input value={config.primaryColor}
                                               onChange={e => setConfig({...config, primaryColor: e.target.value})}
                                               className="font-mono text-xs"/>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Secondary Color</Label>
                                    <div className="flex gap-2">
                                        <input type="color" value={config.secondaryColor}
                                               onChange={e => setConfig({...config, secondaryColor: e.target.value})}
                                               className="h-9 w-12 rounded border cursor-pointer"/>
                                        <Input value={config.secondaryColor}
                                               onChange={e => setConfig({...config, secondaryColor: e.target.value})}
                                               className="font-mono text-xs"/>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Glow Color</Label>
                                    <div className="flex gap-2">
                                        <input type="color" value={config.glowColor}
                                               onChange={e => setConfig({...config, glowColor: e.target.value})}
                                               className="h-9 w-12 rounded border cursor-pointer"/>
                                        <Input value={config.glowColor}
                                               onChange={e => setConfig({...config, glowColor: e.target.value})}
                                               className="font-mono text-xs"/>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Behavior ── */}
                <TabsContent value="behavior" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm">Global Settings</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-xl border">
                                <div>
                                    <p className="text-sm font-medium">Enable SEIO globally</p>
                                    <p className="text-xs text-muted-foreground">Master switch — disables on all
                                        pages</p>
                                </div>
                                <button
                                    onClick={() => setConfig({...config, isGloballyEnabled: !config.isGloballyEnabled})}
                                    className={`h-6 w-11 rounded-full transition-colors ${config.isGloballyEnabled ? "bg-indigo-500" : "bg-muted"}`}>
                                    <div
                                        className={`h-5 w-5 rounded-full bg-white m-0.5 transition-transform ${config.isGloballyEnabled ? "translate-x-5" : ""}`}/>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl border">
                                <div><p className="text-sm font-medium">Show on mobile</p></div>
                                <button onClick={() => setConfig({...config, showOnMobile: !config.showOnMobile})}
                                        className={`h-6 w-11 rounded-full transition-colors ${config.showOnMobile ? "bg-indigo-500" : "bg-muted"}`}>
                                    <div
                                        className={`h-5 w-5 rounded-full bg-white m-0.5 transition-transform ${config.showOnMobile ? "translate-x-5" : ""}`}/>
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl border">
                                <div><p className="text-sm font-medium">Show on tablet</p></div>
                                <button onClick={() => setConfig({...config, showOnTablet: !config.showOnTablet})}
                                        className={`h-6 w-11 rounded-full transition-colors ${config.showOnTablet ? "bg-indigo-500" : "bg-muted"}`}>
                                    <div
                                        className={`h-5 w-5 rounded-full bg-white m-0.5 transition-transform ${config.showOnTablet ? "translate-x-5" : ""}`}/>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Greeting delay (ms)</Label>
                                    <Input type="number" value={config.autoGreetDelay}
                                           onChange={e => setConfig({
                                               ...config,
                                               autoGreetDelay: Number(e.target.value)
                                           })}/>
                                    <p className="text-xs text-muted-foreground">Time before first message on page
                                        load</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Idle timeout (ms)</Label>
                                    <Input type="number" value={config.idleTimeout}
                                           onChange={e => setConfig({...config, idleTimeout: Number(e.target.value)})}/>
                                    <p className="text-xs text-muted-foreground">Time before SEIO says something when
                                        user is idle</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Pages ── */}
                <TabsContent value="pages" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2"><Eye
                                className="h-4 w-4 text-emerald-500"/> Enabled Pages</CardTitle>
                            <CardDescription>SEIO appears on these pages</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input placeholder="/pricing" value={newPage} onChange={e => setNewPage(e.target.value)}
                                       onKeyDown={e => e.key === "Enter" && addPage("enabled")}/>
                                <Button variant="outline" onClick={() => addPage("enabled")}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.enabledPages.map(p => (
                                    <div key={p}
                                         className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1">
                                        <span
                                            className="text-xs font-mono text-emerald-700 dark:text-emerald-300">{p}</span>
                                        <button onClick={() => removePage("enabled", p)}
                                                className="text-emerald-400 hover:text-red-500 transition-colors ml-1">
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2"><EyeOff
                                className="h-4 w-4 text-red-500"/> Disabled Pages</CardTitle>
                            <CardDescription>SEIO is hidden on these pages even if globally enabled</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-2">
                                <Input placeholder="/blog" value={newPage} onChange={e => setNewPage(e.target.value)}
                                       onKeyDown={e => e.key === "Enter" && addPage("disabled")}/>
                                <Button variant="outline" onClick={() => addPage("disabled")}>Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.disabledPages.map(p => (
                                    <div key={p}
                                         className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-full px-3 py-1">
                                        <span className="text-xs font-mono text-red-700 dark:text-red-300">{p}</span>
                                        <button onClick={() => removePage("disabled", p)}
                                                className="text-red-400 hover:text-red-600 transition-colors ml-1">
                                            <X className="h-3 w-3"/>
                                        </button>
                                    </div>
                                ))}
                                {config.disabledPages.length === 0 &&
                                    <p className="text-xs text-muted-foreground">No disabled pages</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Messages ── */}
                <TabsContent value="messages" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{config.messages.length} message groups
                            configured</p>
                        <Button variant="outline" size="sm" onClick={addMessage} className="gap-2">
                            <Plus className="h-3.5 w-3.5"/> Add Group
                        </Button>
                    </div>

                    {config.messages.map((msg, idx) => (
                        <Card key={msg.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="info" className="text-xs capitalize">{msg.trigger}</Badge>
                                        <span
                                            className="text-xs text-muted-foreground">{msg.messages.length} variant{msg.messages.length > 1 ? "s" : ""}</span>
                                    </div>
                                    <button onClick={() => removeMessage(idx)}
                                            className="text-muted-foreground hover:text-destructive transition-colors">
                                        <Trash2 className="h-4 w-4"/>
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Trigger */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Trigger</Label>
                                    <select value={msg.trigger}
                                            onChange={e => updateMsg(idx, "trigger", e.target.value)}
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                                        {TRIGGER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Messages */}
                                <div className="space-y-2">
                                    <Label className="text-xs">Messages (SEIO picks one randomly)</Label>
                                    {msg.messages.map((line, lineIdx) => (
                                        <div key={lineIdx} className="flex gap-2">
                                            <Input value={line}
                                                   onChange={e => updateMsgText(idx, lineIdx, e.target.value)}
                                                   placeholder="Message text..." className="text-sm"/>
                                            {msg.messages.length > 1 && (
                                                <button onClick={() => removeMsgLine(idx, lineIdx)}
                                                        className="text-muted-foreground hover:text-destructive">
                                                    <Trash2 className="h-4 w-4"/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => addMsgLine(idx)}
                                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                                        <Plus className="h-3 w-3"/> Add variant
                                    </button>
                                </div>

                                {/* Action */}
                                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                                    <Label className="text-xs">Action Button (optional)</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input placeholder="Button label" value={msg.action?.label ?? ""}
                                               onChange={e => updateMsg(idx, "action", {
                                                   ...msg.action,
                                                   label: e.target.value
                                               })}
                                               className="text-xs"/>
                                        <select value={msg.action?.type ?? "dismiss"}
                                                onChange={e => updateMsg(idx, "action", {
                                                    ...msg.action,
                                                    type: e.target.value
                                                })}
                                                className="rounded-lg border bg-background px-2 py-1.5 text-xs">
                                            {ACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <Input placeholder="/href (if redirect)" value={msg.action?.href ?? ""}
                                               onChange={e => updateMsg(idx, "action", {
                                                   ...msg.action,
                                                   href: e.target.value
                                               })}
                                               className="text-xs"/>
                                    </div>
                                    <button onClick={() => updateMsg(idx, "action", undefined)}
                                            className="text-xs text-muted-foreground hover:text-destructive">Remove
                                        action
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function X({className}: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    );
}