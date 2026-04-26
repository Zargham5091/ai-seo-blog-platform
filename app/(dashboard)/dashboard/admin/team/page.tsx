"use client";
import {useEffect, useState} from "react";
import {useSession} from "next-auth/react";
import {Users, UserPlus, Trash2, Mail, Crown, Lock} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";
import {formatDate} from "@/lib/utils";

interface TeamMember {
    userId: { _id: string; name: string; email: string; image?: string; plan: string };
    role: string;
    joinedAt: string;
}

const PLAN_LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};

export default function TeamPage() {
    const {data: session} = useSession();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviting, setInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState("");
    const [removeId, setRemoveId] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState("");

    const plan = session?.user?.plan ?? "free";
    const maxMembers = PLAN_LIMITS[plan] ?? 1;

    const fetchTeam = async () => {
        setIsLoading(true);
        const res = await fetch("/api/team");
        const d = await res.json();
        if (d.success) setMembers(d.data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setError("");
        setInviteMsg("");
        const res = await fetch("/api/team", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: inviteEmail}),
        });
        const d = await res.json();
        if (d.success) {
            setInviteMsg(`Invitation sent to ${inviteEmail}`);
            setInviteEmail("");
        } else {
            setError(d.error);
        }
        setInviting(false);
    };

    const handleRemove = async () => {
        if (!removeId) return;
        setIsRemoving(true);
        await fetch(`/api/team/${removeId}`, {method: "DELETE"});
        setRemoveId(null);
        setIsRemoving(false);
        fetchTeam();
    };

    const atLimit = members.length >= maxMembers;

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-500"/> Team
                </h1>
                <p className="text-muted-foreground text-sm">
                    {members.length} / {maxMembers === 999 ? "∞" : maxMembers} members on {plan} plan
                </p>
            </div>

            {/* Invite form */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserPlus
                    className="h-4 w-4"/> Invite Team Member</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {atLimit && maxMembers < 999 ? (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-3">
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <Lock className="h-4 w-4"/> Team limit reached ({maxMembers} members on {plan} plan)
                            </p>
                            <Link href="/dashboard/admin/settings?tab=billing"
                                  className="text-xs text-indigo-600 hover:underline mt-1 block">
                                Upgrade to add more team members →
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            {inviteMsg && <p className="text-sm text-emerald-600">{inviteMsg}</p>}
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="flex-1"
                                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                                />
                                <Button variant="gradient" onClick={handleInvite} isLoading={inviting}
                                        className="gap-2 shrink-0">
                                    <Mail className="h-4 w-4"/> Send Invite
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">They will receive an email invitation link</p>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Members list */}
            {isLoading ? (
                <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i}
                                                                             className="h-16 skeleton rounded-xl"/>)}</div>
            ) : members.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center py-12 text-center">
                        <Users className="h-10 w-10 text-muted-foreground/30 mb-3"/>
                        <p className="font-semibold">No team members yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Invite colleagues to collaborate on your
                            content</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {members.map((member) => (
                        <Card key={member.userId._id}>
                            <CardContent className="p-4 flex items-center gap-4">
                                {member.userId.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={member.userId.image} alt=""
                                         className="h-10 w-10 rounded-full object-cover shrink-0"/>
                                ) : (
                                    <div
                                        className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {member.userId.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{member.userId.name}</span>
                                        {member.role === "admin" && (
                                            <Badge variant="info" className="text-xs gap-1"><Crown
                                                className="h-2.5 w-2.5"/> Admin</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{member.userId.email}</p>
                                    {member.joinedAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Joined {formatDate(new Date(member.joinedAt), {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric"
                                        })}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() => setRemoveId(member.userId._id)}
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <ConfirmDialog
                open={!!removeId}
                onOpenChange={(o) => !o && setRemoveId(null)}
                title="Remove Team Member"
                description="This member will lose access to your dashboard. You can re-invite them later."
                confirmLabel="Remove"
                onConfirm={handleRemove}
                isLoading={isRemoving}
                variant="destructive"
            />
        </div>
    );
}

// "use client";
// import { useState, useEffect } from "react";
// import { UserPlus, Trash2, Mail, Shield, Eye, Edit } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input, Label, Badge } from "@/components/ui/form-elements";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
//
// interface TeamMember {
//   _id: string;
//   userId: string;
//   role: "owner" | "editor" | "viewer";
//   status: "pending" | "active";
//   user: { name: string; email: string; image?: string };
//   invitedAt: string;
// }
//
// const ROLE_BADGES: Record<string, "success" | "info" | "secondary"> = {
//   owner: "success",
//   editor: "info",
//   viewer: "secondary",
// };
//
// const ROLE_ICONS: Record<string, React.ElementType> = {
//   owner: Shield,
//   editor: Edit,
//   viewer: Eye,
// };
//
// export default function TeamPage() {
//   const [members, setMembers] = useState<TeamMember[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [showInvite, setShowInvite] = useState(false);
//   const [inviteEmail, setInviteEmail] = useState("");
//   const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
//   const [inviting, setInviting] = useState(false);
//   const [inviteError, setInviteError] = useState("");
//
//   useEffect(() => {
//     fetch("/api/team")
//       .then((r) => r.json())
//       .then((d) => { if (d.success) setMembers(d.data); })
//       .finally(() => setIsLoading(false));
//   }, []);
//
//   const handleInvite = async () => {
//     if (!inviteEmail) return;
//     setInviting(true);
//     setInviteError("");
//     const res = await fetch("/api/team", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
//     });
//     const d = await res.json();
//     if (d.success) {
//       setShowInvite(false);
//       setInviteEmail("");
//       setMembers((prev) => [d.data, ...prev]);
//     } else {
//       setInviteError(d.error);
//     }
//     setInviting(false);
//   };
//
//   const handleRemove = async (memberId: string) => {
//     if (!confirm("Remove this team member?")) return;
//     await fetch(`/api/team/${memberId}`, { method: "DELETE" });
//     setMembers((prev) => prev.filter((m) => m._id !== memberId));
//   };
//
//   const handleRoleChange = async (memberId: string, role: string) => {
//     await fetch(`/api/team/${memberId}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ role }),
//     });
//     setMembers((prev) => prev.map((m) => m._id === memberId ? { ...m, role: role as TeamMember["role"] } : m));
//   };
//
//   return (
//     <div className="space-y-6 max-w-4xl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Team</h1>
//           <p className="text-muted-foreground text-sm">{members.length} member{members.length !== 1 ? "s" : ""}</p>
//         </div>
//         <Button variant="gradient" className="gap-2" onClick={() => setShowInvite(true)}>
//           <UserPlus className="h-4 w-4" /> Invite Member
//         </Button>
//       </div>
//
//       {/* Role legend */}
//       <Card>
//         <CardContent className="p-4 grid grid-cols-3 gap-4">
//           {[
//             { role: "owner", label: "Owner", desc: "Full access, can manage team" },
//             { role: "editor", label: "Editor", desc: "Can create and edit blogs" },
//             { role: "viewer", label: "Viewer", desc: "Read-only access to content" },
//           ].map((r) => {
//             const Icon = ROLE_ICONS[r.role];
//             return (
//               <div key={r.role} className="flex items-start gap-3">
//                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
//                   <Icon className="h-4 w-4 text-muted-foreground" />
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium capitalize">{r.label}</p>
//                   <p className="text-xs text-muted-foreground">{r.desc}</p>
//                 </div>
//               </div>
//             );
//           })}
//         </CardContent>
//       </Card>
//
//       {/* Members list */}
//       <Card>
//         <CardHeader className="pb-3">
//           <CardTitle className="text-base">Team Members</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           {isLoading ? (
//             <div className="p-4 space-y-3">
//               {[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />)}
//             </div>
//           ) : members.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-12 text-center px-4">
//               <UserPlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
//               <p className="font-semibold mb-1">No team members yet</p>
//               <p className="text-sm text-muted-foreground mb-4">Invite collaborators to work on your SEO projects together.</p>
//               <Button variant="outline" onClick={() => setShowInvite(true)} className="gap-2">
//                 <UserPlus className="h-4 w-4" /> Send First Invite
//               </Button>
//             </div>
//           ) : (
//             <div className="divide-y">
//               {members.map((member) => {
//                 const Icon = ROLE_ICONS[member.role];
//                 return (
//                   <div key={member._id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors">
//                     <Avatar className="h-9 w-9">
//                       <AvatarImage src={member.user?.image ?? ""} />
//                       <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-sky-400 text-white text-xs">
//                         {member.user?.name?.charAt(0).toUpperCase()}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1 min-w-0">
//                       <p className="font-medium text-sm">{member.user?.name ?? "Invited User"}</p>
//                       <p className="text-xs text-muted-foreground flex items-center gap-1">
//                         <Mail className="h-3 w-3" /> {member.user?.email}
//                       </p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <Badge variant={ROLE_BADGES[member.role]} className="capitalize gap-1">
//                         <Icon className="h-3 w-3" /> {member.role}
//                       </Badge>
//                       {member.status === "pending" && <Badge variant="warning" className="text-xs">Pending</Badge>}
//                     </div>
//                     {member.role !== "owner" && (
//                       <div className="flex items-center gap-1">
//                         <select
//                           value={member.role}
//                           onChange={(e) => handleRoleChange(member._id, e.target.value)}
//                           className="h-7 rounded border bg-background px-2 text-xs"
//                         >
//                           <option value="editor">Editor</option>
//                           <option value="viewer">Viewer</option>
//                         </select>
//                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemove(member._id)}>
//                           <Trash2 className="h-3.5 w-3.5" />
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//
//       {/* Invite Dialog */}
//       <Dialog open={showInvite} onOpenChange={setShowInvite}>
//         <DialogContent>
//           <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
//           <div className="space-y-4 py-2">
//             {inviteError && <div className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{inviteError}</div>}
//             <div className="space-y-1.5">
//               <Label>Email Address</Label>
//               <Input type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
//             </div>
//             <div className="space-y-1.5">
//               <Label>Role</Label>
//               <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
//                 <option value="editor">Editor — Can create and edit blogs</option>
//                 <option value="viewer">Viewer — Read-only access</option>
//               </select>
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
//             <Button variant="gradient" onClick={handleInvite} isLoading={inviting} className="gap-2">
//               <Mail className="h-4 w-4" /> Send Invite
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
