// app/api/newsletter/track/route.ts
import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/db";
import {NewsletterCampaignModel} from "@/models/Newsletter";

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const campaignId = searchParams.get("campaignId");
    const subscriberId = searchParams.get("subscriberId");
    const link = searchParams.get("link");

    await connectDB();

    if (link) {
        // Track click
        await NewsletterCampaignModel.updateOne(
            {_id: campaignId},
            {$inc: {clickCount: 1}}
        );
        // Redirect to actual link
        return NextResponse.redirect(decodeURIComponent(link));
    } else {
        // Track open (1x1 pixel)
        await NewsletterCampaignModel.updateOne(
            {_id: campaignId},
            {$inc: {openCount: 1}}
        );
        // Return transparent pixel
        return new NextResponse(Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64"), {
            headers: {"Content-Type": "image/gif"}
        });
    }
}