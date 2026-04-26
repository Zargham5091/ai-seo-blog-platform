"use client";
import {useState} from "react";
import {Star, Send, CheckCircle, Clock, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";

interface FeatureRequestButtonProps {
    blogId: string;
    blogTitle: string;
    existingStatus?: "pending" | "approved" | "rejected" | null;
}

export function FeatureRequestButton({
                                         blogId,
                                         blogTitle,
                                         existingStatus,
                                     }: FeatureRequestButtonProps) {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(existingStatus ?? null);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError("");
        try {
            const res = await fetch("/api/featured", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({blogId, note}),
            });
            const d = await res.json();
            if (d.success) {
                setStatus("pending");
                setOpen(false);
                setNote("");
            } else {
                setError(d.error);
            }
        } catch {
            setError("Failed to submit request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (status === "approved") {
        return (
            <Badge variant="success" className="gap-1 text-xs">
                <CheckCircle className="h-3 w-3"/> Featured on main site
            </Badge>
        );
    }

    if (status === "pending") {
        return (
            <Badge variant="warning" className="gap-1 text-xs">
                <Clock className="h-3 w-3"/> Pending approval
            </Badge>
        );
    }

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setOpen(true)}
            >
                <Star className="h-3.5 w-3.5"/> Request Feature
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-indigo-500"/>
                            Request to Feature Post
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Submit <strong>&quot;{blogTitle}&quot;</strong> for review. If approved by the admin, it
                            will appear on the main blog page.
                        </p>
                        {error && (
                            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
                        )}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Message to admin (optional)
                            </label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Tell the admin why this post should be featured..."
                                rows={3}
                                maxLength={500}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground text-right">{note.length}/500</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSubmit} isLoading={isSubmitting} className="gap-2">
                            <Send className="h-4 w-4"/> Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
