// lib/tenant.ts
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";

export type TeamRole = "owner" | "admin" | "editor" | "member";

export interface TenantContext {
    tenantId: string;
    role: TeamRole;
    isOwner: boolean;
    ownerId: string;
    aiCreditsLimit: number;
    aiCreditsUsed: number;
    allowedPages: string[];
}

export async function getTenantContext(userId: string): Promise<TenantContext> {
    await connectDB();

    const owner = await UserModel.findOne({"teamMembers.userId": userId})
        .lean<{
            _id: { toString(): string };
            aiCreditsLimit: number;
            aiCreditsUsed: number;
            teamMembers: {
                userId: { toString(): string };
                role: string;
                aiCreditsAllocated?: number;
                aiCreditsUsed?: number;
                allowedPages?: string[];
            }[];
        }>();

    if (owner) {
        const member = owner.teamMembers.find((m) => m.userId.toString() === userId);
        return {
            tenantId: owner._id.toString(),
            ownerId: owner._id.toString(),
            role: (member?.role ?? "member") as TeamRole,
            isOwner: false,
            aiCreditsLimit: member?.aiCreditsAllocated ?? 0,
            aiCreditsUsed: member?.aiCreditsUsed ?? 0,
            allowedPages: member?.allowedPages ?? [],
        };
    }

    const self = await UserModel.findById(userId)
        .select("aiCreditsLimit aiCreditsUsed")
        .lean<{ aiCreditsLimit: number; aiCreditsUsed: number }>();

    return {
        tenantId: userId,
        ownerId: userId,
        role: "owner",
        isOwner: true,
        aiCreditsLimit: self?.aiCreditsLimit ?? 10,
        aiCreditsUsed: self?.aiCreditsUsed ?? 0,
        allowedPages: [],
    };
}

export function canRead(_role: TeamRole): boolean {
    return true;
}

export function canWrite(role: TeamRole): boolean {
    return role === "owner" || role === "admin" || role === "editor";
}

export function canDelete(role: TeamRole): boolean {
    return role === "owner" || role === "admin";
}

export function canManageTeam(role: TeamRole): boolean {
    return role === "owner" || role === "admin";
}

export function canManageBilling(role: TeamRole): boolean {
    return role === "owner";
}

export function canAccessPage(allowedPages: string[], path: string): boolean {
    if (allowedPages.length === 0) return true;
    return allowedPages.some((p) => path.startsWith(p));
}

export const RESTRICTABLE_PAGES = [
    {path: "/dashboard/admin/blogs", label: "Blog Posts"},
    {path: "/dashboard/admin/categories", label: "Categories"},
    {path: "/dashboard/admin/seo", label: "SEO Tools"},
    {path: "/dashboard/admin/seo/keywords", label: "Keyword Research"},
    {path: "/dashboard/admin/seo/schema", label: "Schema Generator"},
    {path: "/dashboard/admin/aeo", label: "AEO Optimizer"},
    {path: "/dashboard/admin/analytics", label: "Analytics"},
    {path: "/dashboard/admin/rank-tracking", label: "Rank Tracking"},
    {path: "/dashboard/admin/backlinks", label: "Backlinks"},
    {path: "/dashboard/admin/content-calendar", label: "Content Calendar"},
    {path: "/dashboard/admin/media", label: "Media Library"},
    {path: "/dashboard/admin/repurpose", label: "Repurpose Content"},
    {path: "/dashboard/admin/bulk-generate", label: "Bulk Generate"},
    {path: "/dashboard/admin/reports", label: "Reports"},
    {path: "/dashboard/admin/newsletter", label: "Newsletter"},
    {path: "/dashboard/admin/ab-test", label: "A/B Testing"},
] as const;


// // lib/tenant.ts
// // Resolves the effective tenant for any logged-in user.
// // - If the user is an owner (direct signup) → tenantId = their own id
// // - If the user is a team member → tenantId = owner's id
// // SECURITY: Never let a team member query their own data — always use tenantId.
//
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
//
// export type TeamRole = "owner" | "admin" | "editor" | "member";
//
// export interface TenantContext {
//     tenantId: string;       // owner's userId — use this for ALL DB queries
//     role: TeamRole;         // effective role
//     isOwner: boolean;       // true if the user IS the owner
//     ownerId: string;        // same as tenantId — explicit alias for clarity
//     aiCreditsLimit: number; // credits available to this user (owner's limit or allocated)
//     aiCreditsUsed: number;  // credits used by this user
// }
//
// /**
//  * Resolves the tenant context for a given userId.
//  * Call this at the top of every API route instead of using session.user.id directly.
//  *
//  * Usage:
//  *   const tenant = await getTenantContext(session.user.id);
//  *   const blogs = await BlogModel.find({ tenantId: tenant.tenantId });
//  *   if (!tenant.canWrite) return 403;
//  */
// export async function getTenantContext(userId: string): Promise<TenantContext> {
//     await connectDB();
//
//     // Check if this user is a team member of someone else
//     const owner = await UserModel.findOne({
//         "teamMembers.userId": userId,
//     }).lean<{
//         _id: { toString(): string };
//         aiCreditsLimit: number;
//         aiCreditsUsed: number;
//         teamMembers: {
//             userId: { toString(): string };
//             role: string;
//             aiCreditsAllocated?: number;
//             aiCreditsUsed?: number;
//         }[];
//     }>();
//
//     if (owner) {
//         const member = owner.teamMembers.find(
//             (m) => m.userId.toString() === userId
//         );
//         return {
//             tenantId: owner._id.toString(),
//             ownerId: owner._id.toString(),
//             role: (member?.role ?? "member") as TeamRole,
//             isOwner: false,
//             // Member uses their allocated credits, falling back to owner limit
//             aiCreditsLimit: member?.aiCreditsAllocated ?? 0,
//             aiCreditsUsed: member?.aiCreditsUsed ?? 0,
//         };
//     }
//
//     // User is their own owner
//     const self = await UserModel.findById(userId)
//         .select("aiCreditsLimit aiCreditsUsed")
//         .lean<{ aiCreditsLimit: number; aiCreditsUsed: number }>();
//
//     return {
//         tenantId: userId,
//         ownerId: userId,
//         role: "owner",
//         isOwner: true,
//         aiCreditsLimit: self?.aiCreditsLimit ?? 10,
//         aiCreditsUsed: self?.aiCreditsUsed ?? 0,
//     };
// }
//
// // ── Role permission helpers ───────────────────────────────────────────────────
//
// /** Can read/view content */
// export function canRead(_role: TeamRole): boolean {
//     return true; // all roles can read
// }
//
// /** Can create or edit content */
// export function canWrite(role: TeamRole): boolean {
//     return role === "owner" || role === "admin" || role === "editor";
// }
//
// /** Can delete content */
// export function canDelete(role: TeamRole): boolean {
//     return role === "owner" || role === "admin";
// }
//
// /** Can manage team members, change roles, allocate credits */
// export function canManageTeam(role: TeamRole): boolean {
//     return role === "owner" || role === "admin";
// }
//
// /** Can access billing and plan settings — OWNER ONLY */
// export function canManageBilling(role: TeamRole): boolean {
//     return role === "owner";
// }