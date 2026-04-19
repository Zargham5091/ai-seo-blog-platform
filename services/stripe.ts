import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export async function createStripeCustomer(email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({ email, name });
  return customer.id;
}

export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  billingCycle,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  userId: string;
  billingCycle: "monthly" | "yearly";
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, billingCycle },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
  });
  return session.url!;
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

export async function getSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

export function constructWebhookEvent(payload: Buffer, sig: string): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET!);
}
