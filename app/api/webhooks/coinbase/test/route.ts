import {NextRequest, NextResponse} from "next/server";

// ── DEV ONLY — simulate a Coinbase webhook to test subscription upgrades ─────
// Usage: POST /api/webhooks/coinbase/test
// Body: { userId: "...", plan: "silver|gold|diamond", billingCycle: "monthly|yearly" }
// This route does NOT exist in production.

export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({error: "Not available in production"}, {status: 404});
    }

    const {userId, plan, billingCycle = "monthly"} = await req.json();

    if (!userId || !plan) {
        return NextResponse.json({error: "userId and plan are required"}, {status: 400});
    }

    // Simulate the exact payload our webhook handler expects
    const mockPayload = {
        event: {
            type: "charge:confirmed",
            data: {
                id: `mock_charge_${Date.now()}`,
                metadata: {userId, plan, billingCycle},
            },
        },
    };

    // Call our own webhook handler internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/webhooks/coinbase`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-cc-webhook-signature": "dev_mock_signature", // passes because isDev skips verification
        },
        body: JSON.stringify(mockPayload),
    });

    const result = await res.json();

    return NextResponse.json({
        success: true,
        message: `Simulated charge:confirmed for user ${userId} on ${plan} plan`,
        webhookResponse: result,
    });
}