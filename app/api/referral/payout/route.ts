import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import {ReferralModel, ReferralPayoutModel} from "@/models/Referral";
import {z} from "zod";

const PayoutSchema = z.object({
    userId: z.string().min(1),
    amount: z.number().min(0.01),
    paymentMethod: z.enum(["paypal", "bank", "crypto"]),
    paymentDetails: z.string().min(1, "Payment details required"),
    note: z.string().max(500).optional(),
});

// POST /api/referral/payout — super admin creates a payout record and marks referrals as paid
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const body = await req.json();
        const parsed = PayoutSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        await connectDB();

        // Get all pending converted referrals for this user
        const pendingReferrals = await ReferralModel.find({
            referrerId: parsed.data.userId,
            status: "converted",
        }).lean();

        if (pendingReferrals.length === 0) {
            return NextResponse.json(
                {success: false, error: "No pending referrals to pay out"},
                {status: 400}
            );
        }

        // Create payout record
        const payout = await ReferralPayoutModel.create({
            userId: parsed.data.userId,
            amount: parsed.data.amount,
            currency: "USD",
            status: "paid",
            referralIds: pendingReferrals.map((r) => r._id),
            paymentMethod: parsed.data.paymentMethod,
            paymentDetails: parsed.data.paymentDetails,
            processedAt: new Date(),
            note: parsed.data.note,
        });

        // Mark all converted referrals as paid
        await ReferralModel.updateMany(
            {referrerId: parsed.data.userId, status: "converted"},
            {$set: {status: "paid"}}
        );

        return NextResponse.json({success: true, data: payout}, {status: 201});
    } catch (error) {
        console.error("[REFERRAL_PAYOUT]", error);
        return NextResponse.json({success: false, error: "Failed to process payout"}, {status: 500});
    }
}

// GET /api/referral/payout — list payout history
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        await connectDB();
        const {searchParams} = new URL(req.url);
        const userId = searchParams.get("userId");

        // Super admin can view all; users see only their own
        const query =
            session.user.role === "super_admin" && userId
                ? {userId}
                : {userId: session.user.id};

        const payouts = await ReferralPayoutModel.find(query)
            .populate("userId", "name email")
            .sort({createdAt: -1})
            .lean();

        return NextResponse.json({success: true, data: payouts});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
