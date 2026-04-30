"use client";
import {useEffect, useState} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import {useSession, signIn} from "next-auth/react";
import Link from "next/link";
import {Users, CheckCircle2, XCircle, Loader2, LogIn} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";

type Status = "idle" | "loading" | "success" | "error" | "expired" | "wrong_email";

export default function InvitePage() {
    const params = useSearchParams();
    const router = useRouter();
    const {data: session, status: authStatus} = useSession();
    const token = params.get("token");

    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [teamInfo, setTeamInfo] = useState<{ ownerName: string; role: string } | null>(null);

    // Auto-accept-invite once logged in and token is present
    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No invitation token found. Please use the link from your email.");
            return;
        }
        if (authStatus === "loading") return;
        if (authStatus === "authenticated" && status === "idle") {
            acceptInvite();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authStatus, token]);

    const acceptInvite = async () => {
        setStatus("loading");
        try {
            const res = await fetch("/api/team/accept-invite", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({token}),
            });
            const d = await res.json();

            if (d.success) {
                setStatus("success");
                setTeamInfo(d.data);
            } else if (res.status === 410) {
                setStatus("expired");
                setMessage(d.error);
            } else if (res.status === 403) {
                setStatus("wrong_email");
                setMessage(d.error);
            } else {
                setStatus("error");
                setMessage(d.error ?? "Something went wrong.");
            }
        } catch {
            setStatus("error");
            setMessage("Request failed. Please try again.");
        }
    };

    // ── Not logged in ──────────────────────────────────────────────────────────
    if (authStatus === "unauthenticated") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardHeader className="pb-4 text-center">
                    <div
                        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/40">
                        <Users className="h-6 w-6 text-indigo-600"/>
                    </div>
                    <CardTitle className="text-2xl font-bold">Team Invitation</CardTitle>
                    <CardDescription>Sign in to accept your team invitation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div
                        className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 p-4 text-sm text-center text-indigo-700 dark:text-indigo-300">
                        You need to be signed in to accept this invitation. Make sure to sign in with the email address
                        the invite was sent to.
                    </div>
                    <Button
                        variant="gradient"
                        className="w-full gap-2"
                        onClick={() => signIn(undefined, {callbackUrl: `/invite?token=${token}`})}
                    >
                        <LogIn className="h-4 w-4"/> Sign In to Accept
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href={`/register?callbackUrl=/invite?token=${token}`}
                              className="text-indigo-600 font-medium hover:underline">
                            Create one free
                        </Link>
                    </p>
                </CardContent>
            </Card>
        );
    }

    // ── Loading ────────────────────────────────────────────────────────────────
    if (authStatus === "loading" || status === "loading" || status === "idle") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin"/>
                    <p className="text-sm text-muted-foreground">Processing your invitation...</p>
                </CardContent>
            </Card>
        );
    }

    // ── Success ────────────────────────────────────────────────────────────────
    if (status === "success") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-1">You&apos;re in! 🎉</h2>
                        <p className="text-muted-foreground text-sm">
                            You&apos;ve joined <strong>{teamInfo?.ownerName}&apos;s</strong> team as{" "}
                            <strong className="capitalize">{teamInfo?.role}</strong>.
                        </p>
                    </div>
                    <Button variant="gradient" onClick={() => router.push("/dashboard/admin")}>
                        Go to Dashboard →
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── Wrong email ────────────────────────────────────────────────────────────
    if (status === "wrong_email") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div
                        className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
                        <LogIn className="h-8 w-8 text-amber-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-1">Wrong Account</h2>
                        <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => signIn(undefined, {callbackUrl: `/invite?token=${token}`})}
                    >
                        Sign in with correct email
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── Expired / Error ────────────────────────────────────────────────────────
    return (
        <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive"/>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-1">
                        {status === "expired" ? "Invitation Expired" : "Invalid Invitation"}
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
                </div>
                <Button variant="outline" asChild>
                    <Link href="/login">Back to Login</Link>
                </Button>
            </CardContent>
        </Card>
    );
}