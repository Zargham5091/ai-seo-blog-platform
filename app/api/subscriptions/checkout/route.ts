import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import PlanModel from "@/models/Plan";
import SubscriptionModel from "@/models/Subscription";
import { createStripeCustomer, createCheckoutSession, createPortalSession } from "@/services/stripe";
import { createCoinbaseCharge } from "@/services/coinbase";
import { z } from "zod";

const CheckoutSchema = z.object({
  planSlug: z.enum(["silver", "gold", "diamond"]),
  billingCycle: z.enum(["monthly", "yearly"]),
  provider: z.enum(["stripe", "coinbase"]),
});

// POST /api/subscriptions/checkout
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Portal access request
    if (body.action === "portal") {
      await connectDB();
      const user = await UserModel.findById(session.user.id);
      if (!user?.stripeCustomerId) return NextResponse.json({ success: false, error: "No billing account found" }, { status: 400 });
      const url = await createPortalSession(user.stripeCustomerId, `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings`);
      return NextResponse.json({ success: true, data: { url } });
    }

    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const { planSlug, billingCycle, provider } = parsed.data;

    await connectDB();
    const [user, plan] = await Promise.all([
      UserModel.findById(session.user.id),
      PlanModel.findOne({ slug: planSlug }),
    ]);

    if (!user || !plan) return NextResponse.json({ success: false, error: "User or plan not found" }, { status: 404 });

    const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

    if (provider === "stripe") {
      if (!user.stripeCustomerId) {
        const customerId = await createStripeCustomer(user.email, user.name);
        await UserModel.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
        user.stripeCustomerId = customerId;
      }

      const priceId = billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
      if (!priceId) return NextResponse.json({ success: false, error: "Stripe price not configured for this plan" }, { status: 400 });

      const url = await createCheckoutSession({
        customerId: user.stripeCustomerId,
        priceId,
        userId: user._id.toString(),
        billingCycle,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?payment=success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
      });

      return NextResponse.json({ success: true, data: { url } });
    }

    if (provider === "coinbase") {
      const charge = await createCoinbaseCharge({
        name: `${plan.name} Plan (${billingCycle})`,
        description: plan.description,
        amount,
        currency: "USD",
        userId: user._id.toString(),
        plan: planSlug,
        billingCycle,
      });

      await SubscriptionModel.create({
        userId: user._id,
        plan: planSlug,
        status: "inactive",
        billingCycle,
        paymentProvider: "coinbase",
        coinbaseChargeId: charge.id,
        amount,
        currency: "USD",
      });

      return NextResponse.json({ success: true, data: { url: charge.hosted_url } });
    }

    return NextResponse.json({ success: false, error: "Invalid payment provider" }, { status: 400 });
  } catch (error) {
    console.error("[SUBSCRIPTION_CHECKOUT]", error);
    return NextResponse.json({ success: false, error: "Checkout failed" }, { status: 500 });
  }
}
