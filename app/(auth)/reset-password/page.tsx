// app/(auth)/reset-password/route.ts
"use client";
import {useState} from "react";
import {useSearchParams, useRouter} from "next/navigation";
import Link from "next/link";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {Eye, EyeOff, CheckCircle, XCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";

const schema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
    const params = useSearchParams();
    const router = useRouter();
    const token = params.get("token");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    if (!token) {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
                    <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <XCircle className="h-7 w-7 text-destructive"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Invalid reset link</h2>
                        <p className="text-sm text-muted-foreground">This link is missing a token. Please request a new
                            reset link.</p>
                    </div>
                    <Button asChild variant="gradient">
                        <Link href="/forgot-password">Request New Link</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="border-0 shadow-none lg:border lg:shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
                    <div
                        className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                        <CheckCircle className="h-7 w-7 text-emerald-600"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-2">Password updated!</h2>
                        <p className="text-sm text-muted-foreground">Your password has been reset successfully. You can
                            now sign in.</p>
                    </div>
                    <Button variant="gradient" onClick={() => router.push("/login")}>
                        Sign In Now
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({token, password: data.password}),
            });
            const d = await res.json();
            if (d.success) {
                setSuccess(true);
            } else {
                setError(d.error ?? "Reset failed. The link may have expired.");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
                <CardDescription>Choose a strong password for your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <div
                        className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                        {error}{" "}
                        {error.includes("expired") && (
                            <Link href="/forgot-password" className="underline font-medium">Request a new link</Link>
                        )}
                    </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Input id="password" type={showPassword ? "text" : "password"}
                                   placeholder="Min. 6 characters" {...register("password")} className="pr-10"/>
                            <button type="button" onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Input id="confirmPassword" type={showConfirm ? "text" : "password"}
                                   placeholder="Repeat new password" {...register("confirmPassword")}
                                   className="pr-10"/>
                            <button type="button" onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showConfirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </button>
                        </div>
                        {errors.confirmPassword &&
                            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" variant="gradient" isLoading={isSubmitting}>
                        Reset Password
                    </Button>
                </form>
                <Link href="/login"
                      className="flex items-center justify-center text-sm text-muted-foreground hover:text-foreground">
                    Back to login
                </Link>
            </CardContent>
        </Card>
    );
}