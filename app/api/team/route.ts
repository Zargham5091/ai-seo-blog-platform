import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose, { Schema, Document, Model } from "mongoose";
import UserModel from "@/models/User";
import { sendTeamInviteEmail } from "@/services/email";
import { z } from "zod";
import crypto from "crypto";

// Inline TeamMember model
const TeamMemberSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  tenantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "editor", "viewer"], default: "editor" },
  status: { type: String, enum: ["pending", "active"], default: "pending" },
  inviteEmail: { type: String },
  inviteToken: { type: String },
  invitedAt: { type: Date, default: Date.now },
  joinedAt: { type: Date },
}, { timestamps: true });

const TeamMemberModel: Model<Document> =
  mongoose.models.TeamMember ?? mongoose.model("TeamMember", TeamMemberSchema);

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]),
});

// GET /api/team — list team members for current tenant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const members = await TeamMemberModel.find({ tenantId: session.user.id })
      .populate("userId", "name email image")
      .sort({ createdAt: -1 })
      .lean();

    // Transform for response
    const data = members.map((m: Record<string, unknown>) => ({
      _id: m._id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      invitedAt: m.invitedAt,
      user: m.userId ?? { name: "Invited", email: m.inviteEmail },
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/team — invite a team member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { email, role } = parsed.data;
    await connectDB();

    // Check if already a member
    const existing = await TeamMemberModel.findOne({ tenantId: session.user.id, inviteEmail: email });
    if (existing) return NextResponse.json({ success: false, error: "This email is already a team member" }, { status: 409 });

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const member = await TeamMemberModel.create({
      tenantId: session.user.id,
      inviteEmail: email,
      inviteToken,
      role,
      status: "pending",
    });

    // Send invite email (fire-and-forget)
    const tenant = await UserModel.findById(session.user.id);
    if (tenant) {
      sendTeamInviteEmail(email, tenant.name, tenant.name + "'s Team", inviteToken).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: member._id,
        role,
        status: "pending",
        invitedAt: member.get("invitedAt"),
        user: { name: "Invited", email },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[TEAM_INVITE]", error);
    return NextResponse.json({ success: false, error: "Failed to invite member" }, { status: 500 });
  }
}
