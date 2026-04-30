import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import {NewsletterCampaignModel, NewsletterListModel} from "@/models/Newsletter";
import {z} from "zod";
import {sendNewsletterCampaign} from "@/services/email";
import {CampaignSendModel} from "@/models/CampaignSend";
import mongoose from "mongoose";
import {canDelete, canWrite, getTenantContext} from "@/lib/tenant";

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
        const tenant = await getTenantContext(session.user.id);

        await connectDB();
        const type = new URL(req.url).searchParams.get("type") ?? "campaigns";

        if (type === "campaigns") {
            const campaigns = await NewsletterCampaignModel.find({tenantId: tenant.tenantId})
                .sort({createdAt: -1}).limit(20).lean();
            return NextResponse.json({success: true, data: campaigns});
        }

        if (type === "list") {
            const list = await NewsletterListModel.findOne({tenantId: tenant.tenantId}).lean();
            return NextResponse.json({success: true, data: list ?? null});
        }

        if (type === "stats") {
            const [list, campaigns] = await Promise.all([
                NewsletterListModel.findOne({tenantId: tenant.tenantId}).lean(),
                NewsletterCampaignModel.find({tenantId: tenant.tenantId, status: "sent"}).lean(),
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
        // Add this to your GET handler (after stats)
        if (type === "subscribers") {
            const list = await NewsletterListModel.findOne({tenantId: tenant.tenantId}).lean();
            return NextResponse.json({
                success: true,
                data: list?.subscribers.filter(s => s.isActive) ?? []
            });
        }

        if (type === "campaign-details") {
            const campaignId = new URL(req.url).searchParams.get("campaignId");
            const campaign = await NewsletterCampaignModel.findOne({
                _id: campaignId,
                tenantId: tenant.tenantId,
            }).lean();

            // Get send logs if you have them
            const sends = await CampaignSendModel.find({campaignId}).lean();

            return NextResponse.json({
                success: true,
                data: {
                    ...campaign,
                    sends: sends // Track who got it, opened, clicked
                }
            });
        }

        return NextResponse.json({success: false, error: "Invalid type"}, {status: 400});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

async function processCampaignSend(campaignId: string, tenantId: string) {
    try {
        // Update status to sending
        await NewsletterCampaignModel.findByIdAndUpdate(campaignId, {
            status: "sending",
            sentAt: new Date()
        });

        // Get campaign details
        const campaign = await NewsletterCampaignModel.findById(campaignId).lean();
        if (!campaign) throw new Error("Campaign not found");

        // Get active subscribers
        const list = await NewsletterListModel.findOne({tenantId}).lean();
        const activeSubscribers = (list?.subscribers ?? []).filter(s => s.isActive);

        if (activeSubscribers.length === 0) {
            await NewsletterCampaignModel.findByIdAndUpdate(campaignId, {
                status: "failed",
                errorMessage: "No active subscribers"
            });
            return;
        }
        let processedHtml = campaign.htmlContent || "";

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        processedHtml = processedHtml.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
            const trackedUrl = `${appUrl}/api/newsletter/track?campaignId=${campaignId}&link=${encodeURIComponent(url)}`;
            return `href="${trackedUrl}"`;
        });
        // Send emails in batches to avoid overwhelming
        const batchSize = 50;
        let successCount = 0;

        for (let i = 0; i < activeSubscribers.length; i += batchSize) {
            const batch = activeSubscribers.slice(i, i + batchSize);
            const emailPromises = batch.map((subscriber, idx) => {
                const subscriberId = (subscriber as any)._id || `sub_${Date.now()}_${idx}`;
                return sendNewsletterCampaign({
                    to: subscriber.email,
                    toName: subscriber.name || "",
                    subject: campaign.subject,
                    htmlContent: campaign.htmlContent || "",
                    fromName: campaign.fromName || "SEO Platform",
                    fromEmail: (campaign.fromEmail || process.env.EMAIL_FROM || "noreply@seoplatform.com") as string,
                    campaignId: campaign._id.toString(),
                    subscriberId: subscriberId.toString()
                }).catch(err => {
                    console.error(`Failed to send to ${subscriber.email}:`, err);
                    return null;
                });
            });

            const results = await Promise.all(emailPromises);
            successCount += results.filter(r => r !== null).length;

            // Small delay between batches
            if (i + batchSize < activeSubscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update final status
        await NewsletterCampaignModel.findByIdAndUpdate(campaignId, {
            status: "sent",
            recipientCount: activeSubscribers.length,
            sentAt: new Date()
        });

    } catch (error) {
        console.error("Campaign send failed:", error);
        await NewsletterCampaignModel.findByIdAndUpdate(campaignId, {
            status: "failed",
            errorMessage: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

// POST /api/newsletter?action=campaign|subscribe|send-now
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const tenant = await getTenantContext(session.user.id);
        if (!canWrite(tenant.role)) return NextResponse.json({
            success: false,
            error: "Only admins can write."
        }, {status: 403});
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
            const scheduledDate = parsed.data.scheduledAt && parsed.data.scheduledAt.trim() !== ""
                ? new Date(parsed.data.scheduledAt)
                : undefined;

            const hasScheduledDate = scheduledDate && scheduledDate > new Date();
            // Determine status: draft (scheduled) or pending (send immediately)
            let status = "draft";
            if (!hasScheduledDate && parsed.data.htmlContent) {
                status = "sending"; // Will send immediately
            } else if (hasScheduledDate) {
                status = "scheduled";
            }

            const campaign = await NewsletterCampaignModel.create({
                ...parsed.data,
                tenantId: new mongoose.Types.ObjectId(tenant.tenantId),
                fromEmail: userEmail,
                status: status,
                scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
                createdAt: new Date(),
            });

            // If pending (no schedule), send immediately in background
            if (status === "pending") {
                // Don't await - send in background to not block response
                processCampaignSend(campaign._id.toString(), tenant.tenantId).catch(err => {
                    console.error("Background send failed:", err);
                });
            }

            return NextResponse.json({success: true, data: campaign}, {status: 201});
        }

        if (action === "send-now") {
            const {campaignId} = body;
            if (!campaignId) {
                return NextResponse.json({success: false, error: "campaignId required"}, {status: 400});
            }

            const campaign = await NewsletterCampaignModel.findOne({
                _id: campaignId,
                tenantId: tenant.tenantId
            });

            if (!campaign) {
                return NextResponse.json({success: false, error: "Campaign not found"}, {status: 404});
            }

            // Update status to pending and trigger send
            await NewsletterCampaignModel.findByIdAndUpdate(campaignId, {status: "pending"});

            // Send in background
            processCampaignSend(campaignId, tenant.tenantId).catch(err => {
                console.error("Background send failed:", err);
            });

            return NextResponse.json({success: true, message: "Sending started"}, {status: 200});
        }

        if (action === "subscribe") {
            const parsed = SubscriberSchema.safeParse(body);
            if (!parsed.success) return NextResponse.json({
                success: false,
                error: parsed.error.errors[0].message
            }, {status: 400});

            await NewsletterListModel.findOneAndUpdate(
                {tenantId: tenant.tenantId},
                {
                    $push: {subscribers: {...parsed.data, subscribedAt: new Date(), isActive: true}},
                    $inc: {totalActive: 1},
                    $setOnInsert: {tenantId: tenant.tenantId, name: "Main List"},
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

// Add this after your POST handler
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        const tenant = await getTenantContext(session.user.id);
        if (!canDelete(tenant.role)) return NextResponse.json({
            success: false,
            error: "Only admins can delete."
        }, {status: 403});
        await connectDB();
        const campaignId = new URL(req.url).searchParams.get("campaignId");

        if (!campaignId) {
            return NextResponse.json({success: false, error: "campaignId required"}, {status: 400});
        }

        const deleted = await NewsletterCampaignModel.findOneAndDelete({
            _id: campaignId,
            tenantId: tenant.tenantId
        });

        if (!deleted) {
            return NextResponse.json({success: false, error: "Campaign not found"}, {status: 404});
        }

        return NextResponse.json({success: true, message: "Deleted successfully"});
    } catch (error) {
        return NextResponse.json({success: false, error: "Delete failed"}, {status: 500});
    }
}

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import {NewsletterCampaignModel, NewsletterListModel} from "@/models/Newsletter";
// import {z} from "zod";
//
// const CampaignSchema = z.object({
//     subject: z.string().min(1).max(150),
//     previewText: z.string().max(200).optional(),
//     htmlContent: z.string().optional(),
//     textContent: z.string().optional(),
//     scheduledAt: z.string().optional(),
//     fromName: z.string().max(80).optional(),
//     fromEmail: z.string().email().optional(),
// });
//
// const SubscriberSchema = z.object({
//     email: z.string().email(),
//     name: z.string().optional(),
//     tags: z.array(z.string()).optional(),
//     source: z.string().optional(),
// });
//
// // GET /api/newsletter?type=campaigns|list|stats
// export async function GET(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         await connectDB();
//         const type = new URL(req.url).searchParams.get("type") ?? "campaigns";
//
//         if (type === "campaigns") {
//             const campaigns = await NewsletterCampaignModel.find({tenantId: session.user.id})
//                 .sort({createdAt: -1}).limit(20).lean();
//             return NextResponse.json({success: true, data: campaigns});
//         }
//
//         if (type === "list") {
//             const list = await NewsletterListModel.findOne({tenantId: session.user.id}).lean();
//             return NextResponse.json({success: true, data: list ?? null});
//         }
//
//         if (type === "stats") {
//             const [list, campaigns] = await Promise.all([
//                 NewsletterListModel.findOne({tenantId: session.user.id}).lean(),
//                 NewsletterCampaignModel.find({tenantId: session.user.id, status: "sent"}).lean(),
//             ]);
//
//             const totalSubs = (list?.subscribers ?? []).filter((s) => s.isActive).length;
//             const avgOpenRate = campaigns.length
//                 ? Math.round(campaigns.reduce((s, c) => s + (c.recipientCount ? c.openCount / c.recipientCount : 0), 0) / campaigns.length * 100)
//                 : 0;
//
//             return NextResponse.json({
//                 success: true,
//                 data: {totalSubscribers: totalSubs, totalCampaigns: campaigns.length, avgOpenRate},
//             });
//         }
//
//         return NextResponse.json({success: false, error: "Invalid type"}, {status: 400});
//     } catch {
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // POST /api/newsletter?action=campaign|subscribe
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         await connectDB();
//         const action = new URL(req.url).searchParams.get("action") ?? "campaign";
//         const body = await req.json();
//
//         if (action === "campaign") {
//             const parsed = CampaignSchema.safeParse(body);
//             if (!parsed.success) return NextResponse.json({
//                 success: false,
//                 error: parsed.error.errors[0].message
//             }, {status: 400});
//             const userEmail = session.user.email;
//
//             const campaign = await NewsletterCampaignModel.create({
//                 ...parsed.data,
//                 tenantId: session.user.id,
//                 fromEmail: userEmail,
//                 scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
//             });
//             return NextResponse.json({success: true, data: campaign}, {status: 201});
//         }
//
//         if (action === "subscribe") {
//             const parsed = SubscriberSchema.safeParse(body);
//             if (!parsed.success) return NextResponse.json({
//                 success: false,
//                 error: parsed.error.errors[0].message
//             }, {status: 400});
//
//             await NewsletterListModel.findOneAndUpdate(
//                 {tenantId: session.user.id},
//                 {
//                     $push: {subscribers: {...parsed.data, subscribedAt: new Date(), isActive: true}},
//                     $inc: {totalActive: 1},
//                     $setOnInsert: {tenantId: session.user.id, name: "Main List"},
//                 },
//                 {upsert: true}
//             );
//             return NextResponse.json({success: true, message: "Subscribed"}, {status: 201});
//         }
//
//         return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
//     } catch (error) {
//         console.error("[NEWSLETTER]", error);
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
