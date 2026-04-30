// app/api/team/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {sendTeamInviteEmail} from "@/services/email";
import {logActivity, ACTIONS, parseRequestMeta} from "@/lib/activity";
import {canManageTeam, getTenantContext} from "@/lib/tenant";
import {z} from "zod";
import crypto from "crypto";

const InviteSchema = z.object({
    email: z.string().email(),
    role: z.enum(["member", "editor", "admin"]).optional(),
});

// GET /api/team
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const user = await UserModel.findById(session.user.id)
            .populate("teamMembers.userId", "name email image plan createdAt")
            .lean() as Record<string, unknown> | null;

        return NextResponse.json({success: true, data: (user?.teamMembers as unknown[]) ?? []});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/team — invite
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canManageTeam(tenant.role)) {
            return NextResponse.json({success: false, error: "Only team admins can invite members."}, {status: 403});
        }

        const LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};
        const maxMembers = LIMITS[session.user.plan ?? "free"] ?? 1;
        const owner = await UserModel.findById(tenant.tenantId).lean() as Record<string, unknown[]> | null;
        const currentMembers = (owner?.teamMembers as unknown[])?.length ?? 0;

        if (currentMembers >= maxMembers) {
            return NextResponse.json({
                success: false,
                error: `Your ${session.user.plan} plan allows ${maxMembers} team member${maxMembers === 1 ? "" : "s"}. Upgrade to add more.`,
            }, {status: 403});
        }

        const body = await req.json();
        const parsed = InviteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const inviteToken = crypto.randomBytes(24).toString("hex");
        const role = parsed.data.role ?? "member";

        await UserModel.findByIdAndUpdate(tenant.tenantId, {
            $push: {
                pendingInvites: {
                    email: parsed.data.email,
                    role,
                    token: inviteToken,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                },
            },
        });

        const {ip, userAgent, device} = parseRequestMeta(req);
        logActivity({
            userId: session.user.id,
            tenantId: tenant.tenantId,
            action: ACTIONS.TEAM_MEMBER_INVITED,
            category: "team",
            metadata: {invitedEmail: parsed.data.email, role, device},
            ip, userAgent,
        }).catch(console.error);

        try {
            await sendTeamInviteEmail(
                parsed.data.email,
                session.user.name ?? "Someone",
                `${session.user.name}'s Team`,
                inviteToken
            );
        } catch (emailErr) {
            console.error("[TEAM_INVITE_EMAIL]", emailErr);
        }

        return NextResponse.json({success: true, message: `Invitation sent to ${parsed.data.email}`});
    } catch (error) {
        console.error("[TEAM_INVITE]", error);
        return NextResponse.json({success: false, error: "Failed to send invitation"}, {status: 500});
    }
}

// PATCH /api/team — change role OR allocate AI credits
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canManageTeam(tenant.role)) {
            return NextResponse.json({success: false, error: "Only team admins can update members."}, {status: 403});
        }

        const {memberId, role, aiCreditsAllocated} = await req.json() as {
            memberId: string;
            role?: string;
            aiCreditsAllocated?: number;
        };

        if (!memberId) {
            return NextResponse.json({success: false, error: "memberId required"}, {status: 400});
        }

        const updateFields: Record<string, unknown> = {};

        if (role) {
            if (!["member", "editor", "admin"].includes(role)) {
                return NextResponse.json({success: false, error: "Invalid role"}, {status: 400});
            }
            updateFields["teamMembers.$.role"] = role;
        }

        if (typeof aiCreditsAllocated === "number") {
            if (aiCreditsAllocated < 0) {
                return NextResponse.json({success: false, error: "Credits cannot be negative"}, {status: 400});
            }
            const ownerDoc = await UserModel.findById(tenant.tenantId)
                .lean() as {
                aiCreditsLimit: number;
                teamMembers: { userId: { toString(): string }; aiCreditsAllocated?: number }[]
            } | null;

            if (ownerDoc) {
                // Sum all other members' allocations (exclude current member being updated)
                const otherAllocated = (ownerDoc.teamMembers ?? [])
                    .filter((m) => m.userId.toString() !== memberId)
                    .reduce((sum, m) => sum + (m.aiCreditsAllocated ?? 0), 0);

                if (otherAllocated + aiCreditsAllocated > ownerDoc.aiCreditsLimit) {
                    return NextResponse.json({
                        success: false,
                        error: `Not enough credits. Total limit: ${ownerDoc.aiCreditsLimit}, already allocated to others: ${otherAllocated}.`,
                    }, {status: 400});
                }
            }
            updateFields["teamMembers.$.aiCreditsAllocated"] = aiCreditsAllocated;
        }

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({success: false, error: "Nothing to update"}, {status: 400});
        }

        await UserModel.findOneAndUpdate(
            {_id: tenant.tenantId, "teamMembers.userId": memberId},
            {$set: updateFields}
        );

        if (role) {
            logActivity({
                userId: session.user.id,
                tenantId: tenant.tenantId,
                action: ACTIONS.TEAM_ROLE_CHANGED,
                category: "team",
                metadata: {memberId, newRole: role},
            }).catch(console.error);
        }

        return NextResponse.json({success: true, message: "Member updated"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
// import {sendTeamInviteEmail} from "@/services/email";
// import {logActivity, ACTIONS, parseRequestMeta} from "@/lib/activity";
// import {z} from "zod";
// import crypto from "crypto";
//
// const InviteSchema = z.object({
//     email: z.string().email(),
//     role: z.enum(["member", "editor", "admin"]).optional(),
// });
//
// // ── GET /api/team — list members ─────────────────────────────────────────────
// export async function GET() {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         await connectDB();
//         const user = await UserModel.findById(session.user.id)
//             .populate("teamMembers.userId", "name email image plan createdAt")
//             .lean() as Record<string, unknown> | null;
//
//         return NextResponse.json({success: true, data: (user?.teamMembers as unknown[]) ?? []});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // ── POST /api/team — send invite ─────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};
//         const maxMembers = LIMITS[session.user.plan ?? "free"] ?? 1;
//
//         await connectDB();
//         const owner = await UserModel.findById(session.user.id).lean() as Record<string, unknown[]> | null;
//         const currentMembers = (owner?.teamMembers as unknown[])?.length ?? 0;
//
//         if (currentMembers >= maxMembers) {
//             return NextResponse.json({
//                 success: false,
//                 error: `Your ${session.user.plan} plan allows ${maxMembers} team member${maxMembers === 1 ? "" : "s"}. Upgrade to add more.`,
//             }, {status: 403});
//         }
//
//         const body = await req.json();
//         const parsed = InviteSchema.safeParse(body);
//         if (!parsed.success) {
//             return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
//         }
//
//         const inviteToken = crypto.randomBytes(24).toString("hex");
//         const role = parsed.data.role ?? "member";
//
//         await UserModel.findByIdAndUpdate(session.user.id, {
//             $push: {
//                 pendingInvites: {
//                     email: parsed.data.email,
//                     role,
//                     token: inviteToken,
//                     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//                 },
//             },
//         });
//
//         // Log activity
//         const {ip, userAgent, device} = parseRequestMeta(req);
//         logActivity({
//             userId: session.user.id,
//             tenantId: session.user.id,
//             action: ACTIONS.TEAM_MEMBER_INVITED,
//             category: "team",
//             metadata: {invitedEmail: parsed.data.email, role, device},
//             ip,
//             userAgent,
//         }).catch(console.error);
//
//         try {
//             await sendTeamInviteEmail(
//                 parsed.data.email,
//                 session.user.name ?? "Someone",
//                 `${session.user.name}'s Team`,
//                 inviteToken
//             );
//         } catch (emailErr) {
//             console.error("[TEAM_INVITE_EMAIL]", emailErr);
//         }
//
//         return NextResponse.json({success: true, message: `Invitation sent to ${parsed.data.email}`});
//     } catch (error) {
//         console.error("[TEAM_INVITE]", error);
//         return NextResponse.json({success: false, error: "Failed to send invitation"}, {status: 500});
//     }
// }
//
// // ── PATCH /api/team — change member role ─────────────────────────────────────
// export async function PATCH(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const {memberId, role} = await req.json() as { memberId: string; role: string };
//         if (!memberId || !role) {
//             return NextResponse.json({success: false, error: "memberId and role required"}, {status: 400});
//         }
//
//         const validRoles = ["member", "editor", "admin"];
//         if (!validRoles.includes(role)) {
//             return NextResponse.json({success: false, error: "Invalid role"}, {status: 400});
//         }
//
//         await connectDB();
//         await UserModel.findOneAndUpdate(
//             {_id: session.user.id, "teamMembers.userId": memberId},
//             {$set: {"teamMembers.$.role": role}}
//         );
//
//         logActivity({
//             userId: session.user.id,
//             tenantId: session.user.id,
//             action: ACTIONS.TEAM_ROLE_CHANGED,
//             category: "team",
//             metadata: {memberId, newRole: role},
//         }).catch(console.error);
//
//         return NextResponse.json({success: true, message: "Role updated"});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // import {NextRequest, NextResponse} from "next/server";
// // import {getServerSession} from "next-auth";
// // import {authOptions} from "@/lib/auth";
// // import {connectDB} from "@/lib/db";
// // import UserModel from "@/models/User";
// // import {sendTeamInviteEmail} from "@/services/email";
// // import {z} from "zod";
// // import crypto from "crypto";
// //
// // const InviteSchema = z.object({
// //     email: z.string().email(),
// //     role: z.enum(["member", "editor", "admin"]).optional(),
// // });
// //
// // export async function GET() {
// //     try {
// //         const session = await getServerSession(authOptions);
// //         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
// //
// //         await connectDB();
// //         const user = await UserModel.findById(session.user.id)
// //             .populate("teamMembers.userId", "name email image plan createdAt")
// //             .lean() as Record<string, unknown> | null;
// //
// //         return NextResponse.json({success: true, data: (user?.teamMembers as unknown[]) ?? []});
// //     } catch {
// //         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
// //     }
// // }
// //
// // export async function POST(req: NextRequest) {
// //     try {
// //         const session = await getServerSession(authOptions);
// //         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
// //
// //         // Check team member limit based on plan
// //         const LIMITS: Record<string, number> = {free: 1, silver: 3, gold: 10, diamond: 999};
// //         const maxMembers = LIMITS[session.user.plan ?? "free"] ?? 1;
// //
// //         await connectDB();
// //         const owner = await UserModel.findById(session.user.id).lean() as Record<string, unknown[]> | null;
// //         const currentMembers = (owner?.teamMembers as unknown[])?.length ?? 0;
// //
// //         if (currentMembers >= maxMembers) {
// //             return NextResponse.json({
// //                 success: false,
// //                 error: `Your ${session.user.plan} plan allows ${maxMembers} team member${maxMembers === 1 ? "" : "s"}. Upgrade to add more.`,
// //             }, {status: 403});
// //         }
// //
// //         const body = await req.json();
// //         const parsed = InviteSchema.safeParse(body);
// //         if (!parsed.success) {
// //             return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
// //         }
// //
// //         const inviteToken = crypto.randomBytes(24).toString("hex");
// //         const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
// //
// //         // Store pending invite on owner user
// //         await UserModel.findByIdAndUpdate(session.user.id, {
// //             $push: {
// //                 pendingInvites: {
// //                     email: parsed.data.email,
// //                     role: parsed.data.role ?? "member",
// //                     token: inviteToken,
// //                     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
// //                 },
// //             },
// //         });
// //
// //
// //         try {
// //             await sendTeamInviteEmail(
// //                 parsed.data.email,
// //                 session.user.name ?? "Someone",
// //                 `${session.user.name}'s Team`,
// //                 inviteToken
// //             );
// //         } catch (emailErr) {
// //             console.error("[TEAM_INVITE_EMAIL]", emailErr);
// //         }
// //
// //         return NextResponse.json({success: true, message: `Invitation sent to ${parsed.data.email}`});
// //     } catch (error) {
// //         console.error("[TEAM_INVITE]", error);
// //         return NextResponse.json({success: false, error: "Failed to send invitation"}, {status: 500});
// //     }
// // }
//
// // import { NextRequest, NextResponse } from "next/server";
// // import { getServerSession } from "next-auth";
// // import { authOptions } from "@/lib/auth";
// // import { connectDB } from "@/lib/db";
// // import mongoose, { Schema, Document, Model } from "mongoose";
// // import UserModel from "@/models/User";
// // import { sendTeamInviteEmail } from "@/services/email";
// // import { z } from "zod";
// // import crypto from "crypto";
// //
// // // Inline TeamMember model
// // const TeamMemberSchema = new Schema({
// //   userId: { type: Schema.Types.ObjectId, ref: "User" },
// //   tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
// //   role: { type: String, enum: ["owner", "editor", "viewer"], default: "editor" },
// //   status: { type: String, enum: ["pending", "active"], default: "pending" },
// //   inviteEmail: { type: String },
// //   inviteToken: { type: String },
// //   invitedAt: { type: Date, default: Date.now },
// //   joinedAt: { type: Date },
// // }, { timestamps: true });
// //
// // const TeamMemberModel: Model<Document> =
// //   mongoose.models.TeamMember ?? mongoose.model("TeamMember", TeamMemberSchema);
// //
// // const InviteSchema = z.object({
// //   email: z.string().email(),
// //   role: z.enum(["editor", "viewer"]),
// // });
// //
// // // GET /api/team — list team members for current tenant
// // export async function GET() {
// //   try {
// //     const session = await getServerSession(authOptions);
// //     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
// //
// //     await connectDB();
// //     const members = await TeamMemberModel.find({ tenantId: session.user.id })
// //       .populate("userId", "name email image")
// //       .sort({ createdAt: -1 })
// //       .lean();
// //
// //     // Transform for response
// //     const data = members.map((m: Record<string, unknown>) => ({
// //       _id: m._id,
// //       userId: m.userId,
// //       role: m.role,
// //       status: m.status,
// //       invitedAt: m.invitedAt,
// //       user: m.userId ?? { name: "Invited", email: m.inviteEmail },
// //     }));
// //
// //     return NextResponse.json({ success: true, data });
// //   } catch {
// //     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
// //   }
// // }
// //
// // // POST /api/team — invite a team member
// // export async function POST(req: NextRequest) {
// //   try {
// //     const session = await getServerSession(authOptions);
// //     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
// //
// //     const body = await req.json();
// //     const parsed = InviteSchema.safeParse(body);
// //     if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
// //
// //     const { email, role } = parsed.data;
// //     await connectDB();
// //
// //     // Check if already a member
// //     const existing = await TeamMemberModel.findOne({ tenantId: session.user.id, inviteEmail: email });
// //     if (existing) return NextResponse.json({ success: false, error: "This email is already a team member" }, { status: 409 });
// //
// //     const inviteToken = crypto.randomBytes(32).toString("hex");
// //     const member = await TeamMemberModel.create({
// //       tenantId: session.user.id,
// //       inviteEmail: email,
// //       inviteToken,
// //       role,
// //       status: "pending",
// //     });
// //
// //     // Send invite email (fire-and-forget)
// //     const tenant = await UserModel.findById(session.user.id);
// //     if (tenant) {
// //       sendTeamInviteEmail(email, tenant.name, tenant.name + "'s Team", inviteToken).catch(console.error);
// //     }
// //
// //     return NextResponse.json({
// //       success: true,
// //       data: {
// //         _id: member._id,
// //         role,
// //         status: "pending",
// //         invitedAt: member.get("invitedAt"),
// //         user: { name: "Invited", email },
// //       },
// //     }, { status: 201 });
// //   } catch (error) {
// //     console.error("[TEAM_INVITE]", error);
// //     return NextResponse.json({ success: false, error: "Failed to invite member" }, { status: 500 });
// //   }
// // }
