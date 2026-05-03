// app/(auth)/verify-email/page.tsx
"use client";
import {useEffect, useState} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import Link from "next/link";
import {CheckCircle, XCircle, Loader2, Mail} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

export default function VerifyEmailPage() {
    const params = useSearchParams();
    const router = useRouter();
    const token = params.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error" | "no_token">("loading");
    const [error, setError] = useState("");
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus("no_token");
            return;
        }

        fetch("/api/auth/verify-email", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({token}),
        })
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    setStatus("success");
                    setTimeout(() => router.push("/dashboard/admin"), 3000);
                } else {
                    setStatus("error");
                    setError(d.error ?? "Verification failed. The link may have expired.");
                }
            })
            .catch(() => {
                setStatus("error");
                setError("Connection failed. Please try again.");
            });
    }, [token, router]);

    const resendVerification = async () => {
        setResending(true);
        try {
            await fetch("/api/auth/resend-verification", {method: "POST"});
            setResent(true);
        } finally {
            setResending(false);
        }
    };

    if (status === "loading") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin"/>
                    <p className="text-sm text-muted-foreground">Verifying your email...</p>
                </CardContent>
            </Card>
        );
    }

    if (status === "success") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
                    <div
                        className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                        <CheckCircle className="h-7 w-7 text-emerald-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Email verified! ✅</h2>
                        <p className="text-sm text-muted-foreground">Your account is now active. Redirecting to
                            dashboard...</p>
                    </div>
                    <Button variant="gradient" onClick={() => router.push("/dashboard/admin")}>
                        Go to Dashboard
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (status === "no_token") {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-7 w-7 text-muted-foreground"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Check your email</h2>
                        <p className="text-sm text-muted-foreground">We sent a verification link to your email address.
                            Click it to activate your account.</p>
                    </div>
                    {!resent ? (
                        <Button variant="outline" onClick={resendVerification} isLoading={resending}>
                            Resend Verification Email
                        </Button>
                    ) : (
                        <p className="text-sm text-emerald-600">✓ Verification email resent!</p>
                    )}
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Back to
                        login</Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardContent className="flex flex-col items-center text-center py-12 space-y-4">
                <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-7 w-7 text-destructive"/>
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-2">Verification failed</h2>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <div className="flex gap-3 flex-wrap justify-center">
                    {!resent ? (
                        <Button variant="outline" onClick={resendVerification} isLoading={resending}>
                            Resend Email
                        </Button>
                    ) : (
                        <p className="text-sm text-emerald-600">✓ New verification email sent!</p>
                    )}
                    <Button asChild variant="gradient">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}