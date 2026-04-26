"use client";
import {useEffect, useState} from "react";
import {FlaskConical, Plus, CheckCircle, PauseCircle, PlayCircle, Trophy, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Progress} from "@/components/ui/misc";

interface ABVariant {
    id: string;
    name: string;
    value: string;
    impressions: number;
    clicks: number;
    ctr: number;
    isControl: boolean;
}

interface ABTest {
    _id: string;
    name: string;
    testType: string;
    status: string;
    variants: ABVariant[];
    winnerVariantId?: string;
    startDate: string;
    minimumSampleSize: number;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "secondary"> = {
    running: "success", paused: "warning", completed: "secondary",
};

export default function ABTestPage() {
    const [tests, setTests] = useState<ABTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        testType: "headline" as "headline" | "meta_title" | "meta_description" | "cta",
        variants: [
            {name: "Control (Original)", value: "", isControl: true},
            {name: "Variant B", value: "", isControl: false},
        ],
    });

    const fetchTests = async () => {
        setIsLoading(true);
        const res = await fetch("/api/ab-test");
        const d = await res.json();
        if (d.success) setTests(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const handleCreate = async () => {
        setIsSaving(true);
        const res = await fetch("/api/ab-test", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(form),
        });
        const d = await res.json();
        if (d.success) {
            setShowCreate(false);
            fetchTests();
        }
        setIsSaving(false);
    };

    const updateStatus = async (id: string, action: string, winnerVariantId?: string) => {
        await fetch(`/api/ab-test/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({action, winnerVariantId}),
        });
        fetchTests();
    };

    const deleteTest = async (id: string) => {
        await fetch(`/api/ab-test/${id}`, {method: "DELETE"});
        fetchTests();
    };

    const maxCTR = (variants: ABVariant[]) => Math.max(...variants.map((v) => v.ctr), 0.1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FlaskConical className="h-6 w-6 text-indigo-500"/> A/B Testing
                    </h1>
                    <p className="text-muted-foreground text-sm">Test headlines, meta titles, and CTAs to maximize
                        CTR</p>
                </div>
                <Button variant="gradient" className="gap-2" onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4"/> New Test
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i}
                                                                             className="h-40 skeleton rounded-xl"/>)}</div>
            ) : tests.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-16 text-center">
                        <FlaskConical className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                        <p className="font-semibold">No tests running</p>
                        <p className="text-sm text-muted-foreground mt-1">Create your first A/B test to optimize
                            click-through rates</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tests.map((test) => {
                        const best = [...test.variants].sort((a, b) => b.ctr - a.ctr)[0];
                        const hasEnoughData = test.variants.every((v) => v.impressions >= test.minimumSampleSize);
                        const max = maxCTR(test.variants);
                        return (
                            <Card key={test._id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <CardTitle className="text-base">{test.name}</CardTitle>
                                            <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                                Testing: {test.testType.replace("_", " ")} ·
                                                Started {new Date(test.startDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={STATUS_BADGE[test.status] ?? "secondary"}
                                                   className="capitalize">{test.status}</Badge>
                                            {test.status === "running" && (
                                                <Button variant="outline" size="sm"
                                                        onClick={() => updateStatus(test._id, "pause")}
                                                        className="gap-1.5">
                                                    <PauseCircle className="h-3.5 w-3.5"/> Pause
                                                </Button>
                                            )}
                                            {test.status === "paused" && (
                                                <Button variant="outline" size="sm"
                                                        onClick={() => updateStatus(test._id, "resume")}
                                                        className="gap-1.5">
                                                    <PlayCircle className="h-3.5 w-3.5"/> Resume
                                                </Button>
                                            )}
                                            {hasEnoughData && test.status === "running" && (
                                                <Button variant="gradient" size="sm"
                                                        onClick={() => updateStatus(test._id, "complete", best.id)}
                                                        className="gap-1.5">
                                                    <Trophy className="h-3.5 w-3.5"/> Declare Winner
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="text-destructive"
                                                    onClick={() => deleteTest(test._id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {test.variants.map((v) => {
                                            const isWinner = test.winnerVariantId === v.id;
                                            const isBest = !test.winnerVariantId && v.id === best.id && v.impressions > 0;
                                            return (
                                                <div key={v.id}
                                                     className={`p-3 rounded-xl border ${isWinner ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : isBest ? "border-indigo-200 dark:border-indigo-800" : ""}`}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {v.isControl && <Badge variant="secondary"
                                                                                   className="text-xs">Control</Badge>}
                                                            {isWinner && <Badge variant="success"
                                                                                className="gap-1 text-xs"><Trophy
                                                                className="h-3 w-3"/> Winner</Badge>}
                                                            {isBest && !isWinner && <Badge variant="info"
                                                                                           className="text-xs">Leading</Badge>}
                                                            <span className="text-sm font-medium">{v.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span
                                                                className="text-muted-foreground">{v.impressions} imp.</span>
                                                            <span
                                                                className="text-muted-foreground">{v.clicks} clicks</span>
                                                            <span
                                                                className={`font-bold ${isBest || isWinner ? "text-indigo-600" : ""}`}>{v.ctr}% CTR</span>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1.5 mb-2">&quot;{v.value}&quot;</p>
                                                    <Progress value={(v.ctr / max) * 100} className="h-1.5"/>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!hasEnoughData && (
                                        <p className="text-xs text-muted-foreground mt-3 text-center">
                                            Need {test.minimumSampleSize} impressions per variant for statistical
                                            significance · Currently{" "}
                                            {Math.min(...test.variants.map((v) => v.impressions))} / {test.minimumSampleSize}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Create A/B Test</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Test Name</Label>
                            <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                                   placeholder="e.g. Homepage headline test"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">What are you testing?</Label>
                            <select value={form.testType} onChange={(e) => setForm({
                                ...form,
                                testType: e.target.value as typeof form.testType
                            })} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                <option value="headline">Headline</option>
                                <option value="meta_title">Meta Title</option>
                                <option value="meta_description">Meta Description</option>
                                <option value="cta">CTA Button Text</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Variants (minimum 2)</Label>
                            {form.variants.map((v, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{v.name}</p>
                                    <Input value={v.value} onChange={(e) => {
                                        const updated = [...form.variants];
                                        updated[i] = {...updated[i], value: e.target.value};
                                        setForm({...form, variants: updated});
                                    }} placeholder={`Enter ${form.testType.replace("_", " ")} for ${v.name}...`}/>
                                </div>
                            ))}
                            {form.variants.length < 4 && (
                                <Button variant="outline" size="sm" onClick={() => setForm({
                                    ...form,
                                    variants: [...form.variants, {
                                        name: `Variant ${String.fromCharCode(67 + form.variants.length - 2)}`,
                                        value: "",
                                        isControl: false
                                    }]
                                })}>
                                    <Plus className="h-3.5 w-3.5 mr-1"/> Add Variant
                                </Button>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button variant="gradient" onClick={handleCreate} isLoading={isSaving} className="gap-2">
                            <FlaskConical className="h-4 w-4"/> Start Test
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
