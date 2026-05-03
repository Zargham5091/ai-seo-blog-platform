// app/(auth)/forgot-password/page.tsx
"use client";
import {useState} from "react";
import Link from "next/link";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Mail, ArrowLeft, CheckCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";

const schema = z.object({
    email: z.string().email("Please enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false);
    const [sentTo, setSentTo] = useState("");
    const [error, setError] = useState("");

    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: data.email}),
            });
            const d = await res.json();
            if (d.success) {
                setSentTo(data.email);
                setSent(true);
            } else {
                // Don't reveal if email exists — always show success for security
                setSentTo(data.email);
                setSent(true);
            }
        } catch {
            setError("Something went wrong. Please try again.");
        }
    };

    if (sent) {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-10 px-6 space-y-4">
                    <div
                        className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                        <CheckCircle className="h-7 w-7 text-emerald-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            If an account exists for <strong>{sentTo}</strong>, we&apos;ve sent a password reset link.
                            It expires in 1 hour.
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Didn&apos;t receive it? Check your spam folder or{" "}
                        <button onClick={() => setSent(false)} className="text-indigo-600 hover:underline font-medium">
                            try again
                        </button>
                    </p>
                    <Link href="/login" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                        <ArrowLeft className="h-3.5 w-3.5"/> Back to login
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">Forgot password?</CardTitle>
                <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div
                        className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email">Email address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                            <Input id="email" type="email" placeholder="you@example.com"
                                   className="pl-9" {...register("email")} />
                        </div>
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" variant="gradient" isLoading={isSubmitting}>
                        Send Reset Link
                    </Button>
                </form>
                <Link href="/login"
                      className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5"/> Back to login
                </Link>
            </CardContent>
        </Card>
    );
}