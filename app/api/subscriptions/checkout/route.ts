import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import PlanModel from "@/models/Plan";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {apiVersion: "2024-06-20"});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const body = await req.json();

        // Billing portal — let user manage existing subscription
        if (body.action === "portal") {
            const user = await UserModel.findById(session.user.id).select("stripeCustomerId").lean() as Record<string, string> | null;
            if (!user?.stripeCustomerId) {
                return NextResponse.json({success: false, error: "No billing account found"}, {status: 404});
            }
            const portalSession = await stripe.billingPortal.sessions.create({
                customer: user.stripeCustomerId,
                return_url: `${APP_URL}/dashboard/admin/settings`,
            });
            return NextResponse.json({success: true, data: {url: portalSession.url}});
        }

        // New checkout
        const {planSlug, billingCycle = "monthly", provider = "stripe"} = body as {
            planSlug: string; billingCycle: string; provider: string;
        };

        const plan = await PlanModel.findOne({slug: planSlug, isActive: true}).lean();
        if (!plan) return NextResponse.json({success: false, error: "Plan not found"}, {status: 404});

        // Find the billing cycle price
        const cycle = plan.billingCycles?.find((c) => c.interval === billingCycle && c.isActive);
        const price = cycle?.price ?? (billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice);
        const stripePriceId = cycle?.stripePriceId ?? (billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly);

        if (provider === "coinbase") {
            // Coinbase Commerce checkout
            const coinbaseRes = await fetch("https://api.commerce.coinbase.com/charges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY ?? "",
                },
                body: JSON.stringify({
                    name: `${plan.name} Plan — ${billingCycle}`,
                    description: plan.description,
                    pricing_type: "fixed_price",
                    local_price: {amount: String(price), currency: "USD"},
                    metadata: {userId: session.user.id, planSlug, billingCycle},
                    redirect_url: `${APP_URL}/dashboard/admin/settings?payment=success`,
                    cancel_url: `${APP_URL}/dashboard/admin/settings?payment=cancelled`,
                }),
            });
            const coinbaseData = await coinbaseRes.json() as { data?: { hosted_url: string } };
            return NextResponse.json({success: true, data: {url: coinbaseData.data?.hosted_url}});
        }

        // Stripe checkout
        if (!stripePriceId) {
            return NextResponse.json({
                success: false,
                error: "Stripe Price ID not configured for this plan. Super admin needs to add it in Plan Settings.",
            }, {status: 400});
        }

        const user = await UserModel.findById(session.user.id).select("email stripeCustomerId").lean() as Record<string, string> | null;

        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: user?.stripeCustomerId ?? undefined,
            customer_email: user?.stripeCustomerId ? undefined : (user?.email ?? session.user.email ?? undefined),
            line_items: [{price: stripePriceId, quantity: 1}],
            success_url: `${APP_URL}/dashboard/admin/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${APP_URL}/dashboard/admin/settings?payment=cancelled`,
            metadata: {userId: session.user.id, planSlug, billingCycle},
            subscription_data: {
                metadata: {userId: session.user.id, planSlug, billingCycle},
            },
        });

        return NextResponse.json({success: true, data: {url: checkoutSession.url}});
    } catch (error) {
        console.error("[CHECKOUT]", error);
        return NextResponse.json({success: false, error: "Checkout failed. Please try again."}, {status: 500});
    }
}


// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import PlanModel from "@/models/Plan";
// import SubscriptionModel from "@/models/Subscription";
// import { createStripeCustomer, createCheckoutSession, createPortalSession } from "@/services/stripe";
// import { createCoinbaseCharge } from "@/services/coinbase";

// import { z } from "zod";
//
// const CheckoutSchema = z.object({
//   planSlug: z.enum(["silver", "gold", "diamond"]),
//   billingCycle: z.enum(["monthly", "yearly"]),
//   provider: z.enum(["stripe", "coinbase"]),
// });
//
// // POST /api/subscriptions/checkout
// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     const body = await req.json();
//
//     // Portal access request
//     if (body.action === "portal") {
//       await connectDB();
//       const user = await UserModel.findById(session.user.id);
//       if (!user?.stripeCustomerId) return NextResponse.json({ success: false, error: "No billing account found" }, { status: 400 });
//       const url = await createPortalSession(user.stripeCustomerId, `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings`);
//       return NextResponse.json({ success: true, data: { url } });
//     }
//
//     const parsed = CheckoutSchema.safeParse(body);
//     if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
//
//     const { planSlug, billingCycle, provider } = parsed.data;
//
//     await connectDB();
//     const [user, plan] = await Promise.all([
//       UserModel.findById(session.user.id),
//       PlanModel.findOne({ slug: planSlug }),
//     ]);
//
//     if (!user || !plan) return NextResponse.json({ success: false, error: "User or plan not found" }, { status: 404 });
//
//     const amount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
//
//     if (provider === "stripe") {
//       if (!user.stripeCustomerId) {
//         const customerId = await createStripeCustomer(user.email, user.name);
//         await UserModel.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
//         user.stripeCustomerId = customerId;
//       }
//
//       const priceId = billingCycle === "yearly" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
//       if (!priceId) return NextResponse.json({ success: false, error: "Stripe price not configured for this plan" }, { status: 400 });
//
//       const url = await createCheckoutSession({
//         customerId: user.stripeCustomerId,
//         priceId,
//         userId: user._id.toString(),
//         billingCycle,
//         successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?payment=success`,
//         cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
//       });
//
//       return NextResponse.json({ success: true, data: { url } });
//     }
//
//     if (provider === "coinbase") {
//       const charge = await createCoinbaseCharge({
//         name: `${plan.name} Plan (${billingCycle})`,
//         description: plan.description,
//         amount,
//         currency: "USD",
//         userId: user._id.toString(),
//         plan: planSlug,
//         billingCycle,
//       });
//
//       await SubscriptionModel.create({
//         userId: user._id,
//         plan: planSlug,
//         status: "inactive",
//         billingCycle,
//         paymentProvider: "coinbase",
//         coinbaseChargeId: charge.id,
//         amount,
//         currency: "USD",
//       });
//
//       return NextResponse.json({ success: true, data: { url: charge.hosted_url } });
//     }
//
//     return NextResponse.json({ success: false, error: "Invalid payment provider" }, { status: 400 });
//   } catch (error) {
//     console.error("[SUBSCRIPTION_CHECKOUT]", error);
//     return NextResponse.json({ success: false, error: "Checkout failed" }, { status: 500 });
//   }
// }
