import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose, { Schema, Model, Document } from "mongoose";

const TeamMemberSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "User" },
  role: String,
  status: String,
}, { timestamps: true });

const TeamMemberModel: Model<Document> =
  mongoose.models.TeamMember ?? mongoose.model("TeamMember", TeamMemberSchema);

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { role } = await req.json();

    const member = await TeamMemberModel.findOneAndUpdate(
      { _id: params.id, tenantId: session.user.id },
      { $set: { role } },
      { new: true }
    );

    if (!member) return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: member });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    await TeamMemberModel.findOneAndDelete({ _id: params.id, tenantId: session.user.id });
    return NextResponse.json({ success: true, message: "Member removed" });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
