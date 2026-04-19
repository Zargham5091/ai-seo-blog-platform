import crypto from "crypto";

const COINBASE_API = "https://api.commerce.coinbase.com";

interface CoinbaseCharge {
  id: string;
  code: string;
  hosted_url: string;
  expires_at: string;
}

export async function createCoinbaseCharge({
  name,
  description,
  amount,
  currency,
  userId,
  plan,
  billingCycle,
}: {
  name: string;
  description: string;
  amount: number;
  currency: string;
  userId: string;
  plan: string;
  billingCycle: string;
}): Promise<CoinbaseCharge> {
  const response = await fetch(`${COINBASE_API}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY!,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name,
      description,
      pricing_type: "fixed_price",
      local_price: { amount: amount.toFixed(2), currency },
      metadata: { userId, plan, billingCycle },
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/settings?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?payment=cancelled`,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? "Coinbase charge creation failed");
  return data.data;
}

export function verifyCoinbaseWebhook(rawBody: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", process.env.COINBASE_COMMERCE_WEBHOOK_SECRET!);
  hmac.update(rawBody);
  const computed = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export function parseCoinbaseEvent(body: Record<string, unknown>): {
  type: string;
  chargeId: string;
  metadata: { userId: string; plan: string; billingCycle: string };
} {
  const event = body as {
    event: {
      type: string;
      data: { id: string; metadata: { userId: string; plan: string; billingCycle: string } };
    };
  };
  return {
    type: event.event.type,
    chargeId: event.event.data.id,
    metadata: event.event.data.metadata,
  };
}
