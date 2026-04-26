import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import {NewsletterCampaignModel, NewsletterListModel} from "@/models/Newsletter";
import {z} from "zod";

const CampaignSchema = z.object({
    subject: z.string().min(1).max(150),
    previewText: z.string().max(200).optional(),
    htmlContent: z.string().optional(),
    textContent: z.string().optional(),
    scheduledAt: z.string().optional(),
    fromName: z.string().max(80).optional(),
    fromEmail: z.string().email().optional(),
});

const SubscriberSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
});

// GET /api/newsletter?type=campaigns|list|stats
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const type = new URL(req.url).searchParams.get("type") ?? "campaigns";

        if (type === "campaigns") {
            const campaigns = await NewsletterCampaignModel.find({tenantId: session.user.id})
                .sort({createdAt: -1}).limit(20).lean();
            return NextResponse.json({success: true, data: campaigns});
        }

        if (type === "list") {
            const list = await NewsletterListModel.findOne({tenantId: session.user.id}).lean();
            return NextResponse.json({success: true, data: list ?? null});
        }

        if (type === "stats") {
            const [list, campaigns] = await Promise.all([
                NewsletterListModel.findOne({tenantId: session.user.id}).lean(),
                NewsletterCampaignModel.find({tenantId: session.user.id, status: "sent"}).lean(),
            ]);

            const totalSubs = (list?.subscribers ?? []).filter((s) => s.isActive).length;
            const avgOpenRate = campaigns.length
                ? Math.round(campaigns.reduce((s, c) => s + (c.recipientCount ? c.openCount / c.recipientCount : 0), 0) / campaigns.length * 100)
                : 0;

            return NextResponse.json({
                success: true,
                data: {totalSubscribers: totalSubs, totalCampaigns: campaigns.length, avgOpenRate},
            });
        }

        return NextResponse.json({success: false, error: "Invalid type"}, {status: 400});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// POST /api/newsletter?action=campaign|subscribe
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const action = new URL(req.url).searchParams.get("action") ?? "campaign";
        const body = await req.json();

        if (action === "campaign") {
            const parsed = CampaignSchema.safeParse(body);
            if (!parsed.success) return NextResponse.json({
                success: false,
                error: parsed.error.errors[0].message
            }, {status: 400});
            const userEmail = session.user.email;

            const campaign = await NewsletterCampaignModel.create({
                ...parsed.data,
                tenantId: session.user.id,
                fromEmail: userEmail,
                scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
            });
            return NextResponse.json({success: true, data: campaign}, {status: 201});
        }

        if (action === "subscribe") {
            const parsed = SubscriberSchema.safeParse(body);
            if (!parsed.success) return NextResponse.json({
                success: false,
                error: parsed.error.errors[0].message
            }, {status: 400});

            await NewsletterListModel.findOneAndUpdate(
                {tenantId: session.user.id},
                {
                    $push: {subscribers: {...parsed.data, subscribedAt: new Date(), isActive: true}},
                    $inc: {totalActive: 1},
                    $setOnInsert: {tenantId: session.user.id, name: "Main List"},
                },
                {upsert: true}
            );
            return NextResponse.json({success: true, message: "Subscribed"}, {status: 201});
        }

        return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
    } catch (error) {
        console.error("[NEWSLETTER]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
