"use client";
import {useEffect, useState} from "react";
import {CheckCircle, X, Clock, Eye, Star} from "lucide-react";
import {formatDate} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface PopulatedBlog {
    _id: string;
    title: string;
    slug: string;
    coverImage?: string;
    excerpt: string;
}

interface PopulatedUser {
    _id: string;
    name: string;
    email: string;
    image?: string;
}

interface FeaturedRequest {
    _id: string;
    blogId: PopulatedBlog;
    requestedBy: PopulatedUser;
    status: "pending" | "approved" | "rejected";
    note?: string;
    adminNote?: string;
    createdAt: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FeaturedPostsPage() {
    const [requests, setRequests] = useState<FeaturedRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
    const [reviewTarget, setReviewTarget] = useState<FeaturedRequest | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);

    const fetchRequests = async (status: string) => {
        setIsLoading(true);
        const res = await fetch(`/api/featured?status=${status}`);
        const d = await res.json();
        if (d.success) setRequests(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchRequests(activeTab);
    }, [activeTab]);

    const openReview = (req: FeaturedRequest, action: "approved" | "rejected") => {
        setReviewTarget(req);
        setReviewAction(action);
        setAdminNote("");
    };

    const submitReview = async () => {
        if (!reviewTarget || !reviewAction) return;
        setIsReviewing(true);
        const res = await fetch(`/api/featured/${reviewTarget._id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({status: reviewAction, adminNote}),
        });
        const d = await res.json();
        if (d.success) {
            setReviewTarget(null);
            fetchRequests(activeTab);
        }
        setIsReviewing(false);
    };

    const STATUS_COLORS: Record<string, "warning" | "success" | "destructive"> = {
        pending: "warning",
        approved: "success",
        rejected: "destructive",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="h-6 w-6 text-indigo-500"/> Featured Post Requests
                </h1>
                <p className="text-muted-foreground text-sm">
                    Review and approve user requests to feature posts on the main blog page
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList>
                    <TabsTrigger value="pending" className="gap-2">
                        <Clock className="h-3.5 w-3.5"/> Pending
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="gap-2">
                        <CheckCircle className="h-3.5 w-3.5"/> Approved
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="gap-2">
                        <X className="h-3.5 w-3.5"/> Rejected
                    </TabsTrigger>
                </TabsList>

                {(["pending", "approved", "rejected"] as const).map((tab) => (
                    <TabsContent key={tab} value={tab} className="mt-4">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-24 skeleton rounded-xl"/>
                                ))}
                            </div>
                        ) : requests.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                    <Star className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                                    <p className="font-semibold">No {tab} requests</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {tab === "pending"
                                            ? "Users can request to feature their posts on the main blog."
                                            : `No ${tab} requests yet.`}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {requests.map((req) => (
                                    <Card key={req._id}>
                                        <CardContent className="p-4 flex items-start gap-4">
                                            {req.blogId.coverImage && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={req.blogId.coverImage}
                                                    alt=""
                                                    className="h-16 w-24 rounded-lg object-cover shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <p className="font-semibold text-sm truncate">{req.blogId.title}</p>
                                                    <Badge variant={STATUS_COLORS[req.status]}
                                                           className="capitalize text-xs">
                                                        {req.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    By <strong>{req.requestedBy.name}</strong> ({req.requestedBy.email})
                                                    ·{" "}
                                                    {formatDate(new Date(req.createdAt), {
                                                        month: "short",
                                                        day: "numeric"
                                                    })}
                                                </p>
                                                {req.note && (
                                                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 mt-1">
                                                        &quot;{req.note}&quot;
                                                    </p>
                                                )}
                                                {req.adminNote && (
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                                        Admin note: {req.adminNote}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Button variant="outline" size="sm" asChild className="gap-1.5">
                                                    <a href={`/blog/${req.blogId.slug}`} target="_blank"
                                                       rel="noreferrer">
                                                        <Eye className="h-3.5 w-3.5"/> View
                                                    </a>
                                                </Button>
                                                {tab === "pending" && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                                            onClick={() => openReview(req, "approved")}
                                                        >
                                                            <CheckCircle className="h-3.5 w-3.5"/> Approve
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                            onClick={() => openReview(req, "rejected")}
                                                        >
                                                            <X className="h-3.5 w-3.5"/> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>

            {/* Review dialog */}
            <Dialog open={!!reviewTarget} onOpenChange={(o) => !o && setReviewTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {reviewAction === "approved"
                                ? <><CheckCircle className="h-5 w-5 text-emerald-500"/> Approve Post</>
                                : <><X className="h-5 w-5 text-destructive"/> Reject Post</>}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {reviewAction === "approved"
                                ? "This post will appear on the main /blog page visible to all visitors."
                                : "The user will be notified that their request was not approved."}
                        </p>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">
                                Note to user (optional)
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder={
                                    reviewAction === "approved"
                                        ? "Great content! Approved for the main blog."
                                        : "Reason for rejection..."
                                }
                                rows={3}
                                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReviewTarget(null)}>Cancel</Button>
                        <Button
                            variant={reviewAction === "approved" ? "gradient" : "destructive"}
                            onClick={submitReview}
                            isLoading={isReviewing}
                        >
                            {reviewAction === "approved" ? "Approve & Feature" : "Reject Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
