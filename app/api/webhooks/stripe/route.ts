import {NextRequest, NextResponse} from "next/server";
import Stripe from "stripe";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import SubscriptionModel from "@/models/Subscription";
import {createAlert} from "@/app/api/alerts/route";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {apiVersion: "2024-06-20"});

const PLAN_CREDIT_MAP: Record<string, number> = {
    free: 10, silver: 100, gold: 500, diamond: 2000,
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
        return NextResponse.json({error: "No signature"}, {status: 400});
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "");
    } catch (err) {
        console.error("[STRIPE_WEBHOOK] Signature error:", err);
        return NextResponse.json({error: "Invalid signature"}, {status: 400});
    }

    await connectDB();

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const sess = event.data.object as Stripe.CheckoutSession;
                const {userId, planSlug, billingCycle} = sess.metadata ?? {};
                if (!userId || !planSlug) break;

                const credits = PLAN_CREDIT_MAP[planSlug] ?? 10;

                await UserModel.findByIdAndUpdate(userId, {
                    $set: {
                        plan: planSlug,
                        stripeCustomerId: sess.customer as string,
                        aiCreditsLimit: credits,
                        aiCreditsUsed: 0,
                    },
                });

                await SubscriptionModel.findOneAndUpdate(
                    {userId},
                    {
                        $set: {
                            userId,
                            planSlug,
                            status: "active",
                            billingCycle: billingCycle ?? "monthly",
                            stripeCustomerId: sess.customer as string,
                            stripeSubscriptionId: sess.subscription as string,
                            amount: (sess.amount_total ?? 0) / 100,
                            currentPeriodStart: new Date(),
                            currentPeriodEnd: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
                        },
                    },
                    {upsert: true}
                );

                await createAlert(userId, "plan_expiring",
                    `🎉 Welcome to ${planSlug.charAt(0).toUpperCase() + planSlug.slice(1)}!`,
                    `Your ${planSlug} plan is now active. You have ${credits} AI credits this month.`
                );
                break;
            }

            case "customer.subscription.deleted": {
                const sub = event.data.object as Stripe.Subscription;
                const userId = sub.metadata?.userId;
                if (!userId) break;

                await UserModel.findByIdAndUpdate(userId, {
                    $set: {plan: "free", aiCreditsLimit: 10},
                });

                await SubscriptionModel.findOneAndUpdate(
                    {stripeSubscriptionId: sub.id},
                    {$set: {status: "cancelled"}}
                );
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;
                const user = await UserModel.findOne({stripeCustomerId: customerId}).lean() as Record<string, string> | null;
                if (user?._id) {
                    await createAlert(
                        user._id.toString(), "plan_expiring",
                        "Payment Failed",
                        "Your subscription payment failed. Please update your payment method to keep your plan active."
                    );
                }
                break;
            }
        }
    } catch (error) {
        console.error("[STRIPE_WEBHOOK] Handler error:", error);
    }

    return NextResponse.json({received: true});
}

// import { NextRequest, NextResponse } from "next/server";
// import { constructWebhookEvent } from "@/services/stripe";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import SubscriptionModel from "@/models/Subscription";
// import { sendSubscriptionConfirmationEmail } from "@/services/email";
// import Stripe from "stripe";
//
// const PLAN_CREDITS: Record<string, number> = {
//   silver: 100,
//   gold: 500,
//   diamond: 2000,
// };
//
// function getPlanFromPriceId(priceId: string): string {
//   // Map price IDs to plan slugs via env vars
//   const map: Record<string, string> = {
//     [process.env.STRIPE_PRICE_SILVER_MONTHLY ?? ""]: "silver",
//     [process.env.STRIPE_PRICE_SILVER_YEARLY ?? ""]: "silver",
//     [process.env.STRIPE_PRICE_GOLD_MONTHLY ?? ""]: "gold",
//     [process.env.STRIPE_PRICE_GOLD_YEARLY ?? ""]: "gold",
//     [process.env.STRIPE_PRICE_DIAMOND_MONTHLY ?? ""]: "diamond",
//     [process.env.STRIPE_PRICE_DIAMOND_YEARLY ?? ""]: "diamond",
//   };
//   return map[priceId] ?? "free";
// }
//
// export async function POST(req: NextRequest) {
//   const body = await req.text();
//   const sig = req.headers.get("stripe-signature");
//
//   if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
//
//   let event: Stripe.Event;
//   try {
//     event = constructWebhookEvent(Buffer.from(body), sig);
//   } catch {
//     return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
//   }
//
//   await connectDB();
//
//   try {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         const session = event.data.object as Stripe.Checkout.Session;
//         const userId = session.metadata?.userId;
//         const subscriptionId = session.subscription as string;
//         if (!userId || !subscriptionId) break;
//
//         const stripe = (await import("@/services/stripe")).stripe;
//         const sub = await stripe.subscriptions.retrieve(subscriptionId);
//         const priceId = sub.items.data[0].price.id;
//         const plan = getPlanFromPriceId(priceId);
//
//         await Promise.all([
//           UserModel.findByIdAndUpdate(userId, {
//             plan,
//             subscriptionStatus: "active",
//             subscriptionId: subscriptionId,
//             aiCreditsUsed: 0,
//             aiCreditsLimit: PLAN_CREDITS[plan] ?? 10,
//             role: "product_admin",
//           }),
//           SubscriptionModel.findOneAndUpdate(
//             { userId },
//             {
//               plan,
//               status: "active",
//               paymentProvider: "stripe",
//               stripeSubscriptionId: subscriptionId,
//               stripeCustomerId: session.customer as string,
//               stripePriceId: priceId,
//               currentPeriodStart: new Date(sub.current_period_start * 1000),
//               currentPeriodEnd: new Date(sub.current_period_end * 1000),
//               amount: sub.items.data[0].price.unit_amount! / 100,
//             },
//             { upsert: true }
//           ),
//         ]);
//
//         const user = await UserModel.findById(userId);
//         if (user) {
//           sendSubscriptionConfirmationEmail(user.email, user.name, plan, session.metadata?.billingCycle ?? "monthly").catch(console.error);
//         }
//         break;
//       }
//
//       case "customer.subscription.updated": {
//         const sub = event.data.object as Stripe.Subscription;
//         const userId = sub.metadata?.userId;
//         if (!userId) break;
//
//         const priceId = sub.items.data[0].price.id;
//         const plan = getPlanFromPriceId(priceId);
//
//         await Promise.all([
//           UserModel.findByIdAndUpdate(userId, {
//             plan,
//             subscriptionStatus: sub.status === "active" ? "active" : sub.status,
//             aiCreditsLimit: PLAN_CREDITS[plan] ?? 10,
//           }),
//           SubscriptionModel.findOneAndUpdate({ stripeSubscriptionId: sub.id }, {
//             plan,
//             status: sub.status,
//             cancelAtPeriodEnd: sub.cancel_at_period_end,
//             currentPeriodEnd: new Date(sub.current_period_end * 1000),
//           }),
//         ]);
//         break;
//       }
//
//       case "customer.subscription.deleted": {
//         const sub = event.data.object as Stripe.Subscription;
//         const userId = sub.metadata?.userId;
//         if (!userId) break;
//
//         await Promise.all([
//           UserModel.findByIdAndUpdate(userId, {
//             plan: "free",
//             subscriptionStatus: "cancelled",
//             subscriptionId: null,
//             aiCreditsLimit: 10,
//             role: "user",
//           }),
//           SubscriptionModel.findOneAndUpdate({ stripeSubscriptionId: sub.id }, {
//             status: "cancelled",
//             cancelledAt: new Date(),
//           }),
//         ]);
//         break;
//       }
//
//       case "invoice.payment_failed": {
//         const invoice = event.data.object as Stripe.Invoice;
//         await SubscriptionModel.findOneAndUpdate(
//           { stripeSubscriptionId: invoice.subscription as string },
//           { status: "past_due" }
//         );
//         break;
//       }
//     }
//
//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error("[STRIPE_WEBHOOK]", error);
//     return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
//   }
// }
