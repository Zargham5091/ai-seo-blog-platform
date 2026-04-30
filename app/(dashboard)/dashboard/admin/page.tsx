// // app/(dashboard)/dashboard/admin/team/page.tsx
// "use client";
// import {useEffect, useState} from "react";
// import {useSession} from "next-auth/react";
// import {
//     Users, UserPlus, Trash2, Mail, Crown, Lock,
//     Shield, Eye, Edit, MoreHorizontal, Activity,
//     LogIn, FileText, UserCheck, UserX, Settings,
//     ChevronDown, ChevronUp, Zap,
// } from "lucide-react";
// import Link from "next/link";
// import {Button} from "@/components/ui/button";
// import {Input, Label, Badge} from "@/components/ui/form-elements";
// import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
// import {ConfirmDialog} from "@/components/shared/ConfirmDialog";
// import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
// import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/misc";
// import {formatDate} from "@/lib/utils";
// import {RESTRICTABLE_PAGES} from "@/lib/tenant";
//
// // ── Types ────────────────────────────────────────────────────────────────────
// interface TeamMember {
//     userId: { _id: string; name: string; email: string; image?: string; plan: string };
//     role: "member" | "editor" | "admin";
//     joinedAt: string;
//     aiCreditsAllocated: number;
//     aiCreditsUsed: number;
//     allowedPages: string[];
// }
//
// interface ActivityLog {
//     _id: string;
//     action: string;
//     category: string;
//     metadata?: Record<string, unknown>;
//     ip?: string;
//     createdAt: string;
//     userId: { _id: string; name: string; email: string; image?: string };
// }
//
// // ── Constants ────────────────────────────────────────────────────────────────
// const PLAN_LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};
//
// const ROLE_CONFIG = {
//     member: {label: "Member", icon: Eye, color: "secondary" as const, description: "View only"},
//     editor: {label: "Editor", icon: Edit, color: "info" as const, description: "Create & edit"},
//     admin: {label: "Admin", icon: Shield, color: "warning" as const, description: "Full access"},
// };
//
// const ACTION_LABELS: Record<string, { label: string; icon: typeof LogIn; color: string }> = {
//     "user.login": {label: "Signed in", icon: LogIn, color: "text-emerald-600"},
//     "blog.created": {label: "Created a blog post", icon: FileText, color: "text-sky-600"},
//     "blog.published": {label: "Published a post", icon: FileText, color: "text-emerald-600"},
//     "blog.deleted": {label: "Deleted a post", icon: FileText, color: "text-red-500"},
//     "blog.ai_generated": {label: "AI generated a post", icon: FileText, color: "text-purple-600"},
//     "team.member_invited": {label: "Invited a member", icon: UserPlus, color: "text-indigo-600"},
//     "team.member_joined": {label: "Joined the team", icon: UserCheck, color: "text-emerald-600"},
//     "team.member_removed": {label: "Removed a member", icon: UserX, color: "text-red-500"},
//     "team.role_changed": {label: "Changed a role", icon: Settings, color: "text-amber-600"},
// };
//
// // ── Component ────────────────────────────────────────────────────────────────
// export default function TeamPage() {
//     const {data: session} = useSession();
//     const [members, setMembers] = useState<TeamMember[]>([]);
//     const [activity, setActivity] = useState<ActivityLog[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [activityLoading, setActivityLoading] = useState(true);
//     const [inviteEmail, setInviteEmail] = useState("");
//     const [inviteRole, setInviteRole] = useState<"member" | "editor" | "admin">("member");
//     const [inviting, setInviting] = useState(false);
//     const [inviteMsg, setInviteMsg] = useState("");
//     const [removeId, setRemoveId] = useState<string | null>(null);
//     const [isRemoving, setIsRemoving] = useState(false);
//     const [error, setError] = useState("");
//     // Per-member expanded state for permissions panel
//     const [expandedMember, setExpandedMember] = useState<string | null>(null);
//     const [savingPermissions, setSavingPermissions] = useState<string | null>(null);
//     const [savingCredits, setSavingCredits] = useState<string | null>(null);
//     const [creditInputs, setCreditInputs] = useState<Record<string, number>>({});
//
//     const plan = session?.user?.plan ?? "free";
//     const maxMembers = PLAN_LIMITS[plan] ?? 1;
//     const atLimit = members.length >= maxMembers;
//
//     const fetchTeam = async () => {
//         setIsLoading(true);
//         const res = await fetch("/api/team");
//         const d = await res.json();
//         if (d.success) {
//             setMembers(d.data);
//             // Init credit inputs
//             const inputs: Record<string, number> = {};
//             (d.data as TeamMember[]).forEach((m) => {
//                 inputs[m.userId._id] = m.aiCreditsAllocated ?? 0;
//             });
//             setCreditInputs(inputs);
//         }
//         setIsLoading(false);
//     };
//
//     const fetchActivity = async () => {
//         setActivityLoading(true);
//         const res = await fetch("/api/team/activity?limit=30");
//         const d = await res.json();
//         if (d.success) setActivity(d.data);
//         setActivityLoading(false);
//     };
//
//     useEffect(() => {
//         fetchTeam();
//         fetchActivity();
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
//             body: JSON.stringify({email: inviteEmail, role: inviteRole}),
//         });
//         const d = await res.json();
//         if (d.success) {
//             setInviteMsg(`Invitation sent to ${inviteEmail}`);
//             setInviteEmail("");
//         } else setError(d.error);
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
//         fetchActivity();
//     };
//
//     const handleRoleChange = async (memberId: string, role: string) => {
//         await fetch("/api/team", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({memberId, role}),
//         });
//         fetchTeam();
//     };
//
//     const handleSaveCredits = async (memberId: string) => {
//         setSavingCredits(memberId);
//         await fetch("/api/team", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({memberId, aiCreditsAllocated: creditInputs[memberId] ?? 0}),
//         });
//         setSavingCredits(null);
//         fetchTeam();
//     };
//
//     const handleSavePermissions = async (memberId: string, allowedPages: string[]) => {
//         setSavingPermissions(memberId);
//         await fetch("/api/team/permissions", {
//             method: "PATCH",
//             headers: {"Content-Type": "application/json"},
//             body: JSON.stringify({memberId, allowedPages}),
//         });
//         setSavingPermissions(null);
//         fetchTeam();
//     };
//
//     const togglePage = (member: TeamMember, path: string) => {
//         const current = member.allowedPages ?? [];
//         const updated = current.includes(path) ? current.filter((p) => p !== path) : [...current, path];
//         // Optimistic update
//         setMembers((prev) => prev.map((m) =>
//             m.userId._id === member.userId._id ? {...m, allowedPages: updated} : m
//         ));
//     };
//
//     return (
//         <div className="space-y-6 max-w-4xl">
//             <div>
//                 <h1 className="text-2xl font-bold flex items-center gap-2">
//                     <Users className="h-6 w-6 text-indigo-500"/> Team
//                 </h1>
//                 <p className="text-muted-foreground text-sm">
//                     {members.length} / {maxMembers === 999 ? "∞" : maxMembers} members on {plan} plan
//                 </p>
//             </div>
//
//             <Tabs defaultValue="members">
//                 <TabsList>
//                     <TabsTrigger value="members" className="gap-2"><Users
//                         className="h-3.5 w-3.5"/> Members</TabsTrigger>
//                     <TabsTrigger value="activity" className="gap-2"><Activity className="h-3.5 w-3.5"/> Activity
//                         Feed</TabsTrigger>
//                 </TabsList>
//
//                 {/* ── Members ── */}
//                 <TabsContent value="members" className="mt-4 space-y-4">
//
//                     {/* Role legend */}
//                     <div className="grid grid-cols-3 gap-3">
//                         {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
//                             <div key={key} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
//                                 <cfg.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0"/>
//                                 <div>
//                                     <p className="text-xs font-semibold">{cfg.label}</p>
//                                     <p className="text-xs text-muted-foreground">{cfg.description}</p>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//
//                     {/* Invite form */}
//                     <Card>
//                         <CardHeader className="pb-3">
//                             <CardTitle className="text-sm flex items-center gap-2"><UserPlus
//                                 className="h-4 w-4"/> Invite Team Member</CardTitle>
//                         </CardHeader>
//                         <CardContent className="space-y-3">
//                             {atLimit && maxMembers < 999 ? (
//                                 <div
//                                     className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-3">
//                                     <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
//                                         <Lock className="h-4 w-4"/> Team limit reached
//                                     </p>
//                                     <Link href="/dashboard/admin/settings"
//                                           className="text-xs text-indigo-600 hover:underline mt-1 block">Upgrade to add
//                                         more →</Link>
//                                 </div>
//                             ) : (
//                                 <>
//                                     {error && <p className="text-sm text-destructive">{error}</p>}
//                                     {inviteMsg && <p className="text-sm text-emerald-600">{inviteMsg}</p>}
//                                     <div className="flex gap-2">
//                                         <Input type="email" value={inviteEmail}
//                                                onChange={(e) => setInviteEmail(e.target.value)}
//                                                placeholder="colleague@company.com" className="flex-1"
//                                                onKeyDown={(e) => e.key === "Enter" && handleInvite()}/>
//                                         <select value={inviteRole}
//                                                 onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
//                                                 className="px-3 rounded-lg border bg-background text-sm">
//                                             <option value="member">Member — view only</option>
//                                             <option value="editor">Editor — can edit</option>
//                                             <option value="admin">Admin — full access</option>
//                                         </select>
//                                         <Button variant="gradient" onClick={handleInvite} isLoading={inviting}
//                                                 className="gap-2 shrink-0">
//                                             <Mail className="h-4 w-4"/> Send Invite
//                                         </Button>
//                                     </div>
//                                     <p className="text-xs text-muted-foreground">They will receive an email invitation
//                                         link</p>
//                                 </>
//                             )}
//                         </CardContent>
//                     </Card>
//
//                     {/* Members list */}
//                     {isLoading ? (
//                         <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i}
//                                                                                      className="h-16 skeleton rounded-xl"/>)}</div>
//                     ) : members.length === 0 ? (
//                         <Card>
//                             <CardContent className="flex flex-col items-center py-12 text-center">
//                                 <Users className="h-10 w-10 text-muted-foreground/30 mb-3"/>
//                                 <p className="font-semibold">No team members yet</p>
//                                 <p className="text-sm text-muted-foreground mt-1">Invite colleagues to collaborate on
//                                     your content</p>
//                             </CardContent>
//                         </Card>
//                     ) : (
//                         <div className="space-y-3">
//                             {members.map((member) => {
//                                 const roleCfg = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
//                                 const isExpanded = expandedMember === member.userId._id;
//                                 return (
//                                     <Card key={member.userId._id}>
//                                         <CardContent className="p-4">
//                                             {/* Member row */}
//                                             <div className="flex items-center gap-4">
//                                                 {member.userId.image ? (
//                                                     // eslint-disable-next-line @next/next/no-img-element
//                                                     <img src={member.userId.image} alt=""
//                                                          className="h-10 w-10 rounded-full object-cover shrink-0"/>
//                                                 ) : (
//                                                     <div
//                                                         className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
//                                                         {member.userId.name?.charAt(0).toUpperCase()}
//                                                     </div>
//                                                 )}
//                                                 <div className="flex-1 min-w-0">
//                                                     <div className="flex items-center gap-2 flex-wrap">
//                                                         <span
//                                                             className="font-semibold text-sm">{member.userId.name}</span>
//                                                         <Badge variant={roleCfg.color}
//                                                                className="text-xs gap-1 capitalize">
//                                                             <roleCfg.icon className="h-2.5 w-2.5"/>
//                                                             {roleCfg.label}
//                                                         </Badge>
//                                                         {member.role === "admin" && (
//                                                             <Badge variant="warning" className="text-xs gap-1"><Crown
//                                                                 className="h-2.5 w-2.5"/>Admin</Badge>
//                                                         )}
//                                                     </div>
//                                                     <p className="text-xs text-muted-foreground">{member.userId.email}</p>
//                                                     <p className="text-xs text-muted-foreground">
//                                                         Joined {member.joinedAt && formatDate(new Date(member.joinedAt), {
//                                                         month: "short",
//                                                         day: "numeric",
//                                                         year: "numeric"
//                                                     })}
//                                                         {" · "}
//                                                         <span
//                                                             className="text-indigo-600">{member.aiCreditsUsed ?? 0}/{member.aiCreditsAllocated ?? 0} credits used</span>
//                                                         {member.allowedPages?.length > 0 && (
//                                                             <span
//                                                                 className="ml-1 text-amber-600">· {member.allowedPages.length} page restriction{member.allowedPages.length > 1 ? "s" : ""}</span>
//                                                         )}
//                                                     </p>
//                                                 </div>
//
//                                                 <div className="flex items-center gap-1 shrink-0">
//                                                     {/* Expand/collapse permissions */}
//                                                     <Button variant="ghost" size="sm" className="gap-1 text-xs"
//                                                             onClick={() => setExpandedMember(isExpanded ? null : member.userId._id)}>
//                                                         <Settings className="h-3.5 w-3.5"/>
//                                                         {isExpanded ? <ChevronUp className="h-3 w-3"/> :
//                                                             <ChevronDown className="h-3 w-3"/>}
//                                                     </Button>
//
//                                                     <DropdownMenu>
//                                                         <DropdownMenuTrigger asChild>
//                                                             <Button variant="ghost" size="icon"
//                                                                     className="h-8 w-8"><MoreHorizontal
//                                                                 className="h-4 w-4"/></Button>
//                                                         </DropdownMenuTrigger>
//                                                         <DropdownMenuContent align="end">
//                                                             <DropdownMenuItem
//                                                                 className="text-xs font-semibold text-muted-foreground"
//                                                                 disabled>Change Role</DropdownMenuItem>
//                                                             {(["member", "editor", "admin"] as const).filter(r => r !== member.role).map(r => {
//                                                                 const RIcon = ROLE_CONFIG[r].icon;
//                                                                 return (
//                                                                     <DropdownMenuItem key={r}
//                                                                                       onClick={() => handleRoleChange(member.userId._id, r)}
//                                                                                       className="capitalize gap-2">
//                                                                         <RIcon
//                                                                             className="h-3.5 w-3.5"/> Make {ROLE_CONFIG[r].label}
//                                                                     </DropdownMenuItem>
//                                                                 );
//                                                             })}
//                                                             <DropdownMenuItem
//                                                                 onClick={() => setRemoveId(member.userId._id)}
//                                                                 className="text-destructive gap-2">
//                                                                 <Trash2 className="h-3.5 w-3.5"/> Remove from team
//                                                             </DropdownMenuItem>
//                                                         </DropdownMenuContent>
//                                                     </DropdownMenu>
//                                                 </div>
//                                             </div>
//
//                                             {/* Expanded: credits + page permissions */}
//                                             {isExpanded && (
//                                                 <div className="mt-4 pt-4 border-t space-y-4">
//                                                     {/* AI Credits allocation */}
//                                                     <div className="space-y-2">
//                                                         <Label className="text-xs flex items-center gap-1.5">
//                                                             <Zap className="h-3.5 w-3.5 text-indigo-500"/> AI Credits
//                                                             Allocation
//                                                         </Label>
//                                                         <div className="flex items-center gap-2">
//                                                             <Input
//                                                                 type="number" min={0}
//                                                                 value={creditInputs[member.userId._id] ?? 0}
//                                                                 onChange={(e) => setCreditInputs((prev) => ({
//                                                                     ...prev,
//                                                                     [member.userId._id]: Number(e.target.value)
//                                                                 }))}
//                                                                 className="w-28 text-sm"
//                                                             />
//                                                             <span className="text-xs text-muted-foreground">credits from your plan limit</span>
//                                                             <Button variant="outline" size="sm"
//                                                                     isLoading={savingCredits === member.userId._id}
//                                                                     onClick={() => handleSaveCredits(member.userId._id)}>
//                                                                 Save
//                                                             </Button>
//                                                         </div>
//                                                         <p className="text-xs text-muted-foreground">
//                                                             Used: {member.aiCreditsUsed ?? 0} / {creditInputs[member.userId._id] ?? 0} allocated
//                                                         </p>
//                                                     </div>
//
//                                                     {/* Page access */}
//                                                     <div className="space-y-2">
//                                                         <div className="flex items-center justify-between">
//                                                             <Label className="text-xs flex items-center gap-1.5">
//                                                                 <Shield className="h-3.5 w-3.5 text-indigo-500"/> Page
//                                                                 Access
//                                                             </Label>
//                                                             <div className="flex gap-2">
//                                                                 <button
//                                                                     onClick={() => setMembers((prev) => prev.map((m) =>
//                                                                         m.userId._id === member.userId._id ? {
//                                                                             ...m,
//                                                                             allowedPages: RESTRICTABLE_PAGES.map(p => p.path)
//                                                                         } : m
//                                                                     ))}
//                                                                     className="text-xs text-indigo-600 hover:underline">All
//                                                                 </button>
//                                                                 <button
//                                                                     onClick={() => setMembers((prev) => prev.map((m) =>
//                                                                         m.userId._id === member.userId._id ? {
//                                                                             ...m,
//                                                                             allowedPages: []
//                                                                         } : m
//                                                                     ))}
//                                                                     className="text-xs text-muted-foreground hover:underline">None
//                                                                     (unrestricted)
//                                                                 </button>
//                                                             </div>
//                                                         </div>
//                                                         <p className="text-xs text-muted-foreground mb-2">
//                                                             Leave all unchecked for full access. Check specific pages to
//                                                             restrict access to only those.
//                                                         </p>
//                                                         <div className="grid grid-cols-2 gap-1.5">
//                                                             {RESTRICTABLE_PAGES.map((page) => {
//                                                                 const isAllowed = (member.allowedPages ?? []).includes(page.path);
//                                                                 return (
//                                                                     <button
//                                                                         key={page.path}
//                                                                         onClick={() => togglePage(member, page.path)}
//                                                                         className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-left transition-colors ${
//                                                                             isAllowed
//                                                                                 ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300"
//                                                                                 : "border-border hover:bg-muted/40 text-muted-foreground"
//                                                                         }`}
//                                                                     >
//                                                                         <div
//                                                                             className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${isAllowed ? "bg-indigo-500 border-indigo-500" : "border-muted-foreground"}`}>
//                                                                             {isAllowed && <span
//                                                                                 className="text-white text-[8px]">✓</span>}
//                                                                         </div>
//                                                                         {page.label}
//                                                                     </button>
//                                                                 );
//                                                             })}
//                                                         </div>
//                                                         <Button variant="gradient" size="sm" className="mt-2"
//                                                                 isLoading={savingPermissions === member.userId._id}
//                                                                 onClick={() => handleSavePermissions(member.userId._id, member.allowedPages ?? [])}>
//                                                             Save Page Permissions
//                                                         </Button>
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </CardContent>
//                                     </Card>
//                                 );
//                             })}
//                         </div>
//                     )}
//                 </TabsContent>
//
//                 {/* ── Activity Feed ── */}
//                 <TabsContent value="activity" className="mt-4">
//                     <Card>
//                         <CardHeader className="pb-3">
//                             <CardTitle className="text-sm flex items-center gap-2"><Activity
//                                 className="h-4 w-4 text-indigo-500"/> Team Activity</CardTitle>
//                         </CardHeader>
//                         <CardContent>
//                             {activityLoading ? (
//                                 <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i}
//                                                                                              className="h-12 skeleton rounded-lg"/>)}</div>
//                             ) : activity.length === 0 ? (
//                                 <div className="text-center py-10 text-muted-foreground text-sm">No activity yet.</div>
//                             ) : (
//                                 <div className="space-y-1">
//                                     {activity.map((log) => {
//                                         const cfg = ACTION_LABELS[log.action];
//                                         const Icon = cfg?.icon ?? Activity;
//                                         return (
//                                             <div key={log._id}
//                                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
//                                                 <div
//                                                     className={`mt-0.5 shrink-0 ${cfg?.color ?? "text-muted-foreground"}`}>
//                                                     <Icon className="h-4 w-4"/>
//                                                 </div>
//                                                 <div className="flex-1 min-w-0">
//                                                     <p className="text-sm">
//                                                         <span
//                                                             className="font-medium">{log.userId?.name ?? "Someone"}</span>
//                                                         {" "}{cfg?.label ?? log.action}
//                                                         {!!log.metadata?.title && <span
//                                                             className="text-muted-foreground"> — &quot;{String(log.metadata.title)}&quot;</span>}
//                                                         {!!log.metadata?.invitedEmail && <span
//                                                             className="text-muted-foreground"> → {String(log.metadata.invitedEmail)}</span>}
//                                                         {!!log.metadata?.newRole && <span
//                                                             className="text-muted-foreground"> to {String(log.metadata.newRole)}</span>}
//                                                     </p>
//                                                     <div className="flex items-center gap-2 mt-0.5">
//                             <span className="text-xs text-muted-foreground">
//                               {formatDate(new Date(log.createdAt), {
//                                   month: "short",
//                                   day: "numeric",
//                                   hour: "2-digit",
//                                   minute: "2-digit"
//                               })}
//                             </span>
//                                                         {log.ip && log.ip !== "unknown" && <span
//                                                             className="text-xs text-muted-foreground">· {log.ip}</span>}
//                                                         {!!log.metadata?.device && <span
//                                                             className="text-xs text-muted-foreground capitalize">· {String(log.metadata.device)}</span>}
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             )}
//                         </CardContent>
//                     </Card>
//                 </TabsContent>
//             </Tabs>
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

"use client";
import { useEffect, useState } from "react";
import { FileText, Eye, Sparkles, TrendingUp, Plus, ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/form-elements";
import { Progress } from "@/components/ui/misc";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { formatNumber } from "@/lib/utils";

interface DashboardStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  avgSEOScore: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

interface ViewPoint { date: string; views: number }

const quickActions = [
  { label: "New Blog Post", href: "/dashboard/admin/blogs/new", icon: Plus, color: "bg-indigo-500" },
  { label: "AI Generate", href: "/dashboard/admin/blogs/new?ai=true", icon: Sparkles, color: "bg-purple-500" },
  { label: "Keyword Research", href: "/dashboard/admin/seo/keywords", icon: Search, color: "bg-sky-500" },
  { label: "View Analytics", href: "/dashboard/admin/analytics", icon: TrendingUp, color: "bg-emerald-500" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [viewData, setViewData] = useState<ViewPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics?type=dashboard").then((r) => r.json()),
      fetch("/api/analytics?type=views").then((r) => r.json()),
    ]).then(([statsRes, viewsRes]) => {
      if (statsRes.success) setStats(statsRes.data);
      if (viewsRes.success) setViewData(viewsRes.data);
    }).finally(() => setIsLoading(false));
  }, []);

  const creditPct = stats ? Math.round((stats.aiCreditsUsed / stats.aiCreditsLimit) * 100) : 0;

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back!</p>
          </div>
          <Button asChild variant="gradient" className="gap-2">
            <Link href="/dashboard/admin/blogs/new"><Plus className="h-4 w-4" /> New Post</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
              <Link key={a.label} href={a.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.color} shrink-0`}>
                  <a.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{a.label}</span>
              </Link>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Blogs" value={isLoading ? "—" : stats?.totalBlogs ?? 0} icon={FileText} gradient="bg-gradient-to-br from-indigo-500 to-indigo-600" />
          <StatsCard title="Published" value={isLoading ? "—" : stats?.publishedBlogs ?? 0} icon={ArrowRight} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
          <StatsCard title="Total Views" value={isLoading ? "—" : formatNumber(stats?.totalViews ?? 0)} icon={Eye} gradient="bg-gradient-to-br from-sky-500 to-sky-600" />
          <StatsCard title="Avg SEO Score" value={isLoading ? "—" : `${stats?.avgSEOScore ?? 0}/100`} icon={TrendingUp} gradient="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-semibold">Page Views</CardTitle></CardHeader>
            <CardContent>
              {viewData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={viewData}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Area type="monotone" dataKey="views" stroke="#4F46E5" strokeWidth={2} fill="url(#viewsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? "Loading..." : "No view data yet. Publish posts to start tracking."}
                  </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" /> AI Credits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used this month</span>
                  <span className="font-semibold">{stats?.aiCreditsUsed ?? 0} / {stats?.aiCreditsLimit ?? 10}</span>
                </div>
                <Progress value={creditPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{100 - creditPct}% remaining</p>
              </div>
              {creditPct >= 80 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Running low on credits</p>
                    <Link href="/pricing" className="text-xs text-indigo-600 hover:underline font-medium">Upgrade plan →</Link>
                  </div>
              )}
              <Button asChild variant="outline" size="sm" className="w-full gap-2">
                <Link href="/dashboard/admin/blogs/new?ai=true"><Sparkles className="h-3.5 w-3.5" /> Generate Content</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Content Overview</CardTitle>
              <Button asChild variant="ghost" size="sm" className="gap-1 text-indigo-600">
                <Link href="/dashboard/admin/blogs">View all <ArrowRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Published", value: stats?.publishedBlogs ?? 0, color: "text-emerald-600", badge: "success" as const },
                { label: "Drafts", value: stats?.draftBlogs ?? 0, color: "text-yellow-600", badge: "warning" as const },
                { label: "Total", value: stats?.totalBlogs ?? 0, color: "text-indigo-600", badge: "info" as const },
              ].map((s) => (
                  <div key={s.label} className="rounded-xl border p-4">
                    <p className={`text-3xl font-bold ${s.color}`}>{isLoading ? "—" : s.value}</p>
                    <Badge variant={s.badge} className="mt-2">{s.label}</Badge>
                  </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
  );
}