"use client";
import {useEffect, useState} from "react";
import {useSession} from "next-auth/react";
import {
    Users, UserPlus, Trash2, Mail, Crown, Lock,
    Shield, Eye, Edit, MoreHorizontal, Activity,
    LogIn, FileText, UserCheck, UserX, Settings,
} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ConfirmDialog} from "@/components/shared/ConfirmDialog";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
import {formatDate} from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────
interface TeamMember {
    userId: { _id: string; name: string; email: string; image?: string; plan: string };
    role: "member" | "editor" | "admin";
    joinedAt: string;
}

interface ActivityLog {
    _id: string;
    action: string;
    category: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    createdAt: string;
    userId: { _id: string; name: string; email: string; image?: string };
}

// ── Constants ────────────────────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};

const ROLE_CONFIG = {
    member: {label: "Member", icon: Eye, color: "secondary" as const, description: "Can view content only"},
    editor: {label: "Editor", icon: Edit, color: "info" as const, description: "Can create and edit content"},
    admin: {label: "Admin", icon: Shield, color: "warning" as const, description: "Full access except billing"},
};

const ACTION_LABELS: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
    "user.login": {label: "Signed in", icon: LogIn, color: "text-emerald-600"},
    "user.register": {label: "Registered", icon: UserCheck, color: "text-indigo-600"},
    "blog.created": {label: "Created a blog post", icon: FileText, color: "text-sky-600"},
    "blog.published": {label: "Published a post", icon: FileText, color: "text-emerald-600"},
    "blog.deleted": {label: "Deleted a post", icon: FileText, color: "text-red-500"},
    "blog.ai_generated": {label: "AI generated a post", icon: FileText, color: "text-purple-600"},
    "team.member_invited": {label: "Invited a member", icon: UserPlus, color: "text-indigo-600"},
    "team.member_joined": {label: "Joined the team", icon: UserCheck, color: "text-emerald-600"},
    "team.member_removed": {label: "Removed a member", icon: UserX, color: "text-red-500"},
    "team.role_changed": {label: "Changed a role", icon: Settings, color: "text-amber-600"},
    "seo.keywords_researched": {label: "Researched keywords", icon: Activity, color: "text-sky-600"},
};

// ── Component ────────────────────────────────────────────────────────────────
export default function TeamPage() {
    const {data: session} = useSession();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [activity, setActivity] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activityLoading, setActivityLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"member" | "editor" | "admin">("member");
    const [inviting, setInviting] = useState(false);
    const [inviteMsg, setInviteMsg] = useState("");
    const [removeId, setRemoveId] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [error, setError] = useState("");

    const plan = session?.user?.plan ?? "free";
    const maxMembers = PLAN_LIMITS[plan] ?? 1;
    const atLimit = members.length >= maxMembers;

    const fetchTeam = async () => {
        setIsLoading(true);
        const res = await fetch("/api/team");
        const d = await res.json();
        if (d.success) setMembers(d.data);
        setIsLoading(false);
    };

    const fetchActivity = async () => {
        setActivityLoading(true);
        const res = await fetch("/api/team/activity?limit=30");
        const d = await res.json();
        if (d.success) setActivity(d.data);
        setActivityLoading(false);
    };

    useEffect(() => {
        fetchTeam();
        fetchActivity();
    }, []);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setError("");
        setInviteMsg("");
        const res = await fetch("/api/team", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email: inviteEmail, role: inviteRole}),
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
        fetchActivity();
    };

    const handleRoleChange = async (memberId: string, role: string) => {
        await fetch("/api/team", {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({memberId, role}),
        });
        fetchTeam();
        fetchActivity();
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-indigo-500"/> Team
                </h1>
                <p className="text-muted-foreground text-sm">
                    {members.length} / {maxMembers === 999 ? "∞" : maxMembers} members on {plan} plan
                </p>
            </div>

            <Tabs defaultValue="members">
                <TabsList>
                    <TabsTrigger value="members" className="gap-2">
                        <Users className="h-3.5 w-3.5"/> Members
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="gap-2">
                        <Activity className="h-3.5 w-3.5"/> Activity Feed
                    </TabsTrigger>
                </TabsList>

                {/* ── Members tab ── */}
                <TabsContent value="members" className="mt-4 space-y-4">

                    {/* Role legend */}
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                            <div key={key} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                                <cfg.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/>
                                <div>
                                    <p className="text-xs font-semibold">{cfg.label}</p>
                                    <p className="text-xs text-muted-foreground">{cfg.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Invite form */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <UserPlus className="h-4 w-4"/> Invite Team Member
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {atLimit && maxMembers < 999 ? (
                                <div
                                    className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-3">
                                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                        <Lock className="h-4 w-4"/> Team limit reached ({maxMembers} on {plan} plan)
                                    </p>
                                    <Link href="/dashboard/admin/settings"
                                          className="text-xs text-indigo-600 hover:underline mt-1 block">
                                        Upgrade to add more →
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
                                        {/* Role selector */}
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                                            className="px-3 rounded-lg border bg-background text-sm"
                                        >
                                            <option value="member">Member — view only</option>
                                            <option value="editor">Editor — can edit</option>
                                            <option value="admin">Admin — full access</option>
                                        </select>
                                        <Button variant="gradient" onClick={handleInvite} isLoading={inviting}
                                                className="gap-2 shrink-0">
                                            <Mail className="h-4 w-4"/> Send Invite
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">They will receive an email with an
                                        invitation link</p>
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
                                <p className="text-sm text-muted-foreground mt-1">Invite colleagues to collaborate on
                                    your content</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => {
                                const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
                                return (
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
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-sm">{member.userId.name}</span>
                                                    <Badge variant={roleCfg.color} className="text-xs gap-1 capitalize">
                                                        <roleCfg.icon className="h-2.5 w-2.5"/>
                                                        {roleCfg.label}
                                                    </Badge>
                                                    {member.role === "admin" && (
                                                        <Badge variant="warning" className="text-xs gap-1">
                                                            <Crown className="h-2.5 w-2.5"/> Admin
                                                        </Badge>
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

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4"/>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="text-xs font-semibold text-muted-foreground"
                                                        disabled>
                                                        Change Role
                                                    </DropdownMenuItem>
                                                    {(["member", "editor", "admin"] as const).filter(r => r !== member.role).map(r => {
                                                        const RoleIcon = ROLE_CONFIG[r].icon;
                                                        return (
                                                            <DropdownMenuItem key={r}
                                                                              onClick={() => handleRoleChange(member.userId._id, r)}
                                                                              className="capitalize gap-2">
                                                                <RoleIcon className="h-3.5 w-3.5"/>
                                                                Make {ROLE_CONFIG[r].label}
                                                            </DropdownMenuItem>
                                                        );
                                                    })}
                                                    <DropdownMenuItem
                                                        onClick={() => setRemoveId(member.userId._id)}
                                                        className="text-destructive gap-2"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5"/> Remove from team
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* ── Activity Feed tab ── */}
                <TabsContent value="activity" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4 text-indigo-500"/> Team Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activityLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg"/>)}
                                </div>
                            ) : activity.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    No activity yet. Actions by you and your team will appear here.
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {activity.map((log: ActivityLog) => {
                                        const cfg = ACTION_LABELS[log.action];
                                        const Icon = cfg?.icon ?? Activity;
                                        return (
                                            <div key={log._id}
                                                 className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                                                <div
                                                    className={`mt-0.5 shrink-0 ${cfg?.color ?? "text-muted-foreground"}`}>
                                                    <Icon className="h-4 w-4"/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm">
                                                        <span
                                                            className="font-medium">{log.userId?.name ?? "Someone"}</span>
                                                        {" "}{cfg?.label ?? log.action}
                                                        {!!log.metadata?.title && (
                                                            <span
                                                                className="text-muted-foreground"> — &quot;{String(log.metadata.title)}&quot;</span>
                                                        )}
                                                        {!!log.metadata?.invitedEmail && (
                                                            <span
                                                                className="text-muted-foreground"> → {String(log.metadata.invitedEmail)}</span>
                                                        )}
                                                        {!!log.metadata?.newRole && (
                                                            <span
                                                                className="text-muted-foreground"> to {String(log.metadata.newRole)}</span>
                                                        )}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(new Date(log.createdAt), {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                              })}
                            </span>
                                                        {log.ip && log.ip !== "unknown" && (
                                                            <span
                                                                className="text-xs text-muted-foreground">· {log.ip}</span>
                                                        )}
                                                        {!!log.metadata?.device && (
                                                            <span
                                                                className="text-xs text-muted-foreground capitalize">· {String(log.metadata.device)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

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
// import {useEffect, useState} from "react";
// import {useSession} from "next-auth/react";
// import {Users, UserPlus, Trash2, Mail, Crown, Lock} from "lucide-react";
// import Link from "next/link";
// import {Button} from "@/components/ui/button";
// import {Input, Label, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {ConfirmDialog} from "@/components/shared/ConfirmDialog";
// import {formatDate} from "@/lib/utils";
//
// interface TeamMember {
//     userId: { _id: string; name: string; email: string; image?: string; plan: string };
//     role: string;
//     joinedAt: string;
// }
//
// const PLAN_LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};
//
// export default function TeamPage() {
//     const {data: session} = useSession();
//     const [members, setMembers] = useState<TeamMember[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [inviteEmail, setInviteEmail] = useState("");
//     const [inviting, setInviting] = useState(false);
//     const [inviteMsg, setInviteMsg] = useState("");
//     const [removeId, setRemoveId] = useState<string | null>(null);
//     const [isRemoving, setIsRemoving] = useState(false);
//     const [error, setError] = useState("");
//
//     const plan = session?.user?.plan ?? "free";
//     const maxMembers = PLAN_LIMITS[plan] ?? 1;
//
//     const fetchTeam = async () => {
//         setIsLoading(true);
//         const res = await fetch("/api/team");
//         const d = await res.json();
//         if (d.success) setMembers(d.data);
//         setIsLoading(false);
//     };
//
//     useEffect(() => {
//         fetchTeam();
//     }, []);
//
//     const handleInvite = async () => {
//         if (!inviteEmail.trim()) return;
//         setInviting(true);
//         setError("");
//         setInviteMsg("");
//         const res = await fetch("/api/team", {
//             method: "POST",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({email: inviteEmail}),
//         });
//         const d = await res.json();
//         if (d.success) {
//             setInviteMsg(`Invitation sent to ${inviteEmail}`);
//             setInviteEmail("");
//         } else {
//             setError(d.error);
//         }
//         setInviting(false);
//     };
//
//     const handleRemove = async () => {
//         if (!removeId) return;
//         setIsRemoving(true);
//         await fetch(`/api/team/${removeId}`, {method: "DELETE"});
//         setRemoveId(null);
//         setIsRemoving(false);
//         fetchTeam();
//     };
//
//     const atLimit = members.length >= maxMembers;
//
//     return (
//         <div className="space-y-6 max-w-3xl">
//             <div>
//                 <h1 className="text-2xl font-bold flex items-center gap-2">
//                     <Users className="h-6 w-6 text-indigo-500"/> Team
//                 </h1>
//                 <p className="text-muted-foreground text-sm">
//                     {members.length} / {maxMembers === 999 ? "∞" : maxMembers} members on {plan} plan
//                 </p>
//             </div>
//
//             {/* Invite form */}
//             <Card>
//                 <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UserPlus
//                     className="h-4 w-4"/> Invite Team Member</CardTitle></CardHeader>
//                 <CardContent className="space-y-3">
//                     {atLimit && maxMembers < 999 ? (
//                         <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-3">
//                             <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
//                                 <Lock className="h-4 w-4"/> Team limit reached ({maxMembers} members on {plan} plan)
//                             </p>
//                             <Link href="/dashboard/admin/settings?tab=billing"
//                                   className="text-xs text-indigo-600 hover:underline mt-1 block">
//                                 Upgrade to add more team members →
//                             </Link>
//                         </div>
//                     ) : (
//                         <>
//                             {error && <p className="text-sm text-destructive">{error}</p>}
//                             {inviteMsg && <p className="text-sm text-emerald-600">{inviteMsg}</p>}
//                             <div className="flex gap-2">
//                                 <Input
//                                     type="email"
//                                     value={inviteEmail}
//                                     onChange={(e) => setInviteEmail(e.target.value)}
//                                     placeholder="colleague@company.com"
//                                     className="flex-1"
//                                     onKeyDown={(e) => e.key === "Enter" && handleInvite()}
//                                 />
//                                 <Button variant="gradient" onClick={handleInvite} isLoading={inviting}
//                                         className="gap-2 shrink-0">
//                                     <Mail className="h-4 w-4"/> Send Invite
//                                 </Button>
//                             </div>
//                             <p className="text-xs text-muted-foreground">They will receive an email invitation link</p>
//                         </>
//                     )}
//                 </CardContent>
//             </Card>
//
//             {/* Members list */}
//             {isLoading ? (
//                 <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i}
//                                                                              className="h-16 skeleton rounded-xl"/>)}</div>
//             ) : members.length === 0 ? (
//                 <Card>
//                     <CardContent className="flex flex-col items-center py-12 text-center">
//                         <Users className="h-10 w-10 text-muted-foreground/30 mb-3"/>
//                         <p className="font-semibold">No team members yet</p>
//                         <p className="text-sm text-muted-foreground mt-1">Invite colleagues to collaborate on your
//                             content</p>
//                     </CardContent>
//                 </Card>
//             ) : (
//                 <div className="space-y-2">
//                     {members.map((member) => (
//                         <Card key={member.userId._id}>
//                             <CardContent className="p-4 flex items-center gap-4">
//                                 {member.userId.image ? (
//                                     // eslint-disable-next-line @next/next/no-img-element
//                                     <img src={member.userId.image} alt=""
//                                          className="h-10 w-10 rounded-full object-cover shrink-0"/>
//                                 ) : (
//                                     <div
//                                         className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
//                                         {member.userId.name?.charAt(0).toUpperCase()}
//                                     </div>
//                                 )}
//                                 <div className="flex-1 min-w-0">
//                                     <div className="flex items-center gap-2">
//                                         <span className="font-semibold text-sm">{member.userId.name}</span>
//                                         {member.role === "admin" && (
//                                             <Badge variant="info" className="text-xs gap-1"><Crown
//                                                 className="h-2.5 w-2.5"/> Admin</Badge>
//                                         )}
//                                     </div>
//                                     <p className="text-xs text-muted-foreground">{member.userId.email}</p>
//                                     {member.joinedAt && (
//                                         <p className="text-xs text-muted-foreground">
//                                             Joined {formatDate(new Date(member.joinedAt), {
//                                             month: "short",
//                                             day: "numeric",
//                                             year: "numeric"
//                                         })}
//                                         </p>
//                                     )}
//                                 </div>
//                                 <Button
//                                     variant="ghost"
//                                     size="icon"
//                                     className="h-8 w-8 text-muted-foreground hover:text-destructive"
//                                     onClick={() => setRemoveId(member.userId._id)}
//                                 >
//                                     <Trash2 className="h-4 w-4"/>
//                                 </Button>
//                             </CardContent>
//                         </Card>
//                     ))}
//                 </div>
//             )}
//
//             <ConfirmDialog
//                 open={!!removeId}
//                 onOpenChange={(o) => !o && setRemoveId(null)}
//                 title="Remove Team Member"
//                 description="This member will lose access to your dashboard. You can re-invite them later."
//                 confirmLabel="Remove"
//                 onConfirm={handleRemove}
//                 isLoading={isRemoving}
//                 variant="destructive"
//             />
//         </div>
//     );
// }
