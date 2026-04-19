import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import SubscriptionModel from "@/models/Subscription";
import UserModel from "@/models/User";

// GET /api/subscriptions — get current user's subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const [subscription, user] = await Promise.all([
      SubscriptionModel.findOne({ userId: session.user.id, status: "active" })
        .sort({ createdAt: -1 })
        .lean(),
      UserModel.findById(session.user.id).select("plan subscriptionStatus aiCreditsUsed aiCreditsLimit").lean(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription ?? null,
        plan: user?.plan ?? "free",
        subscriptionStatus: user?.subscriptionStatus ?? "inactive",
        aiCreditsUsed: user?.aiCreditsUsed ?? 0,
        aiCreditsLimit: user?.aiCreditsLimit ?? 10,
      },
    });
  } catch (error) {
    console.error("[SUBSCRIPTIONS_GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
