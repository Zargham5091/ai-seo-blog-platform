"use client";
import {useState} from "react";
import {useSession, signOut} from "next-auth/react";
import {User, Shield, Trash2, Save, CheckCircle} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/misc";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";

export default function UserSettingsPage() {
    const {data: session, update} = useSession();
    const [name, setName] = useState(session?.user?.name ?? "");
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [saving, setSaving] = useState(false);
    const [savingPw, setSavingPw] = useState(false);
    const [msg, setMsg] = useState("");
    const [pwMsg, setPwMsg] = useState("");
    const [pwError, setPwError] = useState("");
    const [showDelete, setShowDelete] = useState(false);

    const saveProfile = async () => {
        setSaving(true);
        setMsg("");
        await update({name});
        setMsg("Profile updated!");
        setTimeout(() => setMsg(""), 3000);
        setSaving(false);
    };

    const changePassword = async () => {
        setPwError("");
        setPwMsg("");
        if (!currentPw || !newPw) {
            setPwError("All fields required");
            return;
        }
        if (newPw.length < 6) {
            setPwError("New password must be at least 6 characters");
            return;
        }
        if (newPw !== confirmPw) {
            setPwError("Passwords do not match");
            return;
        }

        setSavingPw(true);
        const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({currentPassword: currentPw, newPassword: newPw}),
        });
        const d = await res.json();
        if (d.success) {
            setPwMsg("Password changed successfully");
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
            setTimeout(() => setPwMsg(""), 3000);
        } else {
            setPwError(d.error);
        }
        setSavingPw(false);
    };

    const deleteAccount = async () => {
        await fetch("/api/auth/delete-account", {method: "DELETE"});
        signOut({callbackUrl: "/"});
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground text-sm">Manage your account preferences</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-3.5 w-3.5"/> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-3.5 w-3.5"/> Security
                    </TabsTrigger>
                </TabsList>

                {/* Profile tab */}
                <TabsContent value="profile" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your display name and account details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={session?.user?.image ?? ""}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xl font-bold">
                                        {session?.user?.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{session?.user?.name}</p>
                                    <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                                    <Badge variant="secondary" className="mt-1">Free Plan</Badge>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Display Name</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"/>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input value={session?.user?.email ?? ""} disabled className="opacity-60"/>
                                <p className="text-xs text-muted-foreground">Contact support to change your email</p>
                            </div>

                            {msg && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600">
                                    <CheckCircle className="h-4 w-4"/> {msg}
                                </div>
                            )}

                            <Button variant="gradient" onClick={saveProfile} isLoading={saving} className="gap-2">
                                <Save className="h-4 w-4"/> Save Profile
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security tab */}
                <TabsContent value="security" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Minimum 6 characters. Use a strong password.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pwError && (
                                <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{pwError}</p>
                            )}
                            {pwMsg && (
                                <div className="flex items-center gap-2 text-sm text-emerald-600">
                                    <CheckCircle className="h-4 w-4"/> {pwMsg}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Current Password</Label>
                                <Input
                                    type="password"
                                    value={currentPw}
                                    onChange={(e) => setCurrentPw(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={newPw}
                                    onChange={(e) => setNewPw(e.target.value)}
                                    placeholder="Min. 6 characters"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Confirm New Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPw}
                                    onChange={(e) => setConfirmPw(e.target.value)}
                                    placeholder="Repeat new password"
                                    onKeyDown={(e) => e.key === "Enter" && changePassword()}
                                />
                            </div>
                            <Button variant="gradient" onClick={changePassword} isLoading={savingPw}>
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="text-destructive text-sm flex items-center gap-2">
                                <Trash2 className="h-4 w-4"/> Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Permanently delete your account. This action cannot be undone.
                                All your data will be removed immediately.
                            </p>
                            <Button
                                variant="outline"
                                className="border-destructive text-destructive hover:bg-destructive/5"
                                onClick={() => setShowDelete(true)}
                            >
                                Delete My Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <ConfirmDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                title="Delete Account"
                description="This will permanently delete your account, all your blog posts, and all data. This cannot be undone."
                confirmLabel="Yes, Delete My Account"
                onConfirm={deleteAccount}
                variant="destructive"
            />
        </div>
    );
}
