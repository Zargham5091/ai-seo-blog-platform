import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import PlanModel from "@/models/Plan";

// GET /api/plans — public, returns all active plans
export async function GET() {
  try {
    await connectDB();
    const plans = await PlanModel.find({ isActive: true }).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, data: plans });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch plans" }, { status: 500 });
  }
}

// POST /api/plans — super admin only, create/update plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "super_admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const plan = await PlanModel.findOneAndUpdate(
      { slug: body.slug },
      { $set: body },
      { new: true, upsert: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: plan }, { status: 201 });
  } catch (error) {
    console.error("[PLAN_CREATE]", error);
    return NextResponse.json({ success: false, error: "Failed to create plan" }, { status: 500 });
  }
}
