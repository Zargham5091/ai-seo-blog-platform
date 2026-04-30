// app/(dashboard)/layout.tsx
import {getServerSession} from "next-auth";
import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {DashboardSidebar} from "@/components/layout/DashboardSidebar";
import {DashboardNavbar} from "@/components/layout/DashboardNavbar";
import {Shield} from "lucide-react";

interface TeamContext {
    ownerName: string;
    ownerEmail: string;
    role: string;
    allowedPages: string[];
}

async function getTeamContext(userId: string): Promise<TeamContext | null> {
    try {
        await connectDB();
        const owner = await UserModel.findOne({"teamMembers.userId": userId})
            .select("name email teamMembers")
            .lean() as {
            name: string;
            email: string;
            teamMembers: { userId: { toString(): string }; role: string; allowedPages?: string[] }[]
        } | null;

        if (!owner) return null;

        const member = owner.teamMembers.find((m) => m.userId.toString() === userId);
        return {
            ownerName: owner.name,
            ownerEmail: owner.email,
            role: member?.role ?? "member",
            allowedPages: member?.allowedPages ?? [],
        };
    } catch {
        return null;
    }
}

export default async function DashboardLayout({children}: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const teamCtx = await getTeamContext(session.user.id);

    // ── Page access enforcement for team members ──────────────────────────────
    // If user is a team member AND allowedPages is non-empty,
    // check the current path against the allowed list.
    if (teamCtx && teamCtx.allowedPages.length > 0) {
        const headersList = await headers();
        const pathname = headersList.get("x-invoke-path") ?? headersList.get("x-pathname") ?? "";

        // Always allow dashboard root and settings
        const alwaysAllowed = [
            "/dashboard/admin",
            "/dashboard/admin/settings",
        ];

        const isAlwaysAllowed = alwaysAllowed.some((p) => pathname === p || pathname.startsWith(p + "?"));
        const isPageAllowed = teamCtx.allowedPages.some((p) => pathname.startsWith(p));

        if (pathname && !isAlwaysAllowed && !isPageAllowed) {
            redirect("/dashboard/admin?error=access_denied");
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <DashboardSidebar/>
            <div className="flex flex-1 flex-col overflow-hidden">
                <DashboardNavbar/>

                {/* Team member banner */}
                {teamCtx && (
                    <div
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-800 text-sm shrink-0">
                        <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0"/>
                        <span className="text-indigo-700 dark:text-indigo-300">
              You&apos;re viewing <strong>{teamCtx.ownerName}&apos;s</strong> workspace as{" "}
                            <strong className="capitalize">{teamCtx.role}</strong>
                            {teamCtx.role === "member" && " — read only"}
                            {teamCtx.role === "editor" && " — can create & edit"}
                            {teamCtx.role === "admin" && " — full access"}
                            {teamCtx.allowedPages.length > 0 && (
                                <span className="ml-2 text-indigo-500 text-xs">
                  · {teamCtx.allowedPages.length} page{teamCtx.allowedPages.length > 1 ? "s" : ""} accessible
                </span>
                            )}
            </span>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

// // app/(dashboard)/layout.tsx
// import {getServerSession} from "next-auth";
// import {redirect} from "next/navigation";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
// import {DashboardSidebar} from "@/components/layout/DashboardSidebar";
// import {DashboardNavbar} from "@/components/layout/DashboardNavbar";
// import {Shield} from "lucide-react";
//
// async function getTeamContext(userId: string) {
//     try {
//         await connectDB();
//         const owner = await UserModel.findOne({"teamMembers.userId": userId})
//             .select("name email teamMembers")
//             .lean() as {
//             name: string;
//             email: string;
//             teamMembers: { userId: { toString(): string }; role: string }[]
//         } | null;
//
//         if (!owner) return null;
//
//         const member = owner.teamMembers.find((m) => m.userId.toString() === userId);
//         return {ownerName: owner.name, ownerEmail: owner.email, role: member?.role ?? "member"};
//     } catch {
//         return null;
//     }
// }
//
// export default async function DashboardLayout({children}: { children: React.ReactNode }) {
//     const session = await getServerSession(authOptions);
//     if (!session) redirect("/login");
//
//     const teamCtx = await getTeamContext(session.user.id);
//
//     return (
//         <div className="flex h-screen overflow-hidden bg-background">
//             <DashboardSidebar/>
//             <div className="flex flex-1 flex-col overflow-hidden">
//                 <DashboardNavbar/>
//
//                 {/* Team member banner — only shown when logged in as a team member */}
//                 {teamCtx && (
//                     <div
//                         className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-800 text-sm shrink-0">
//                         <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0"/>
//                         <span className="text-indigo-700 dark:text-indigo-300">
//               You&apos;re viewing <strong>{teamCtx.ownerName}&apos;s</strong> workspace as{" "}
//                             <strong className="capitalize">{teamCtx.role}</strong>
//                             {teamCtx.role === "member" && " — read only"}
//                             {teamCtx.role === "editor" && " — can create & edit"}
//                             {teamCtx.role === "admin" && " — full access"}
//             </span>
//                     </div>
//                 )}
//
//                 <main className="flex-1 overflow-y-auto p-6">
//                     {children}
//                 </main>
//             </div>
//         </div>
//     );
// }
// import { getServerSession } from "next-auth";
// import { redirect } from "next/navigation";
// import { authOptions } from "@/lib/auth";
// import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
// import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
//
// export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const session = await getServerSession(authOptions);
//   if (!session) redirect("/login");
//
//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       <DashboardSidebar />
//       <div className="flex flex-1 flex-col overflow-hidden">
//         <DashboardNavbar />
//         <main className="flex-1 overflow-y-auto p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }
