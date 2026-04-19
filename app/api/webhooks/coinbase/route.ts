import { NextRequest, NextResponse } from "next/server";
import { verifyCoinbaseWebhook, parseCoinbaseEvent } from "@/services/coinbase";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import SubscriptionModel from "@/models/Subscription";

const PLAN_CREDITS: Record<string, number> = { silver: 100, gold: 500, diamond: 2000 };

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-cc-webhook-signature") ?? "";

  if (!verifyCoinbaseWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(rawBody);
  const { type, chargeId, metadata } = parseCoinbaseEvent(body);

  await connectDB();

  if (type === "charge:confirmed" || type === "charge:resolved") {
    const { userId, plan, billingCycle } = metadata;

    await Promise.all([
      UserModel.findByIdAndUpdate(userId, {
        plan,
        subscriptionStatus: "active",
        aiCreditsUsed: 0,
        aiCreditsLimit: PLAN_CREDITS[plan] ?? 10,
        role: "product_admin",
      }),
      SubscriptionModel.findOneAndUpdate(
        { coinbaseChargeId: chargeId },
        { status: "active", billingCycle },
        { upsert: true }
      ),
    ]);
  }

  if (type === "charge:failed" || type === "charge:expired") {
    await SubscriptionModel.findOneAndUpdate({ coinbaseChargeId: chargeId }, { status: "cancelled" });
  }

  return NextResponse.json({ received: true });
}
