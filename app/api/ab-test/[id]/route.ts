import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import ABTestModel from "@/models/ABTest";
import type {IABTestDocument} from "@/models/ABTest";

interface Params {
    params: { id: string }
}

// PUT /api/ab-test/[id] — record event or update status
export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const body = await req.json();

        // Record impression
        if (body.action === "impression" && body.variantId) {
            await ABTestModel.updateOne(
                {_id: params.id, "variants.id": body.variantId},
                {$inc: {"variants.$.impressions": 1}}
            );
            // Recalculate CTR
            const test = await ABTestModel.findById(params.id) as IABTestDocument | null;
            if (test) {
                for (const v of test.variants) {
                    v.ctr = v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 100 * 100) / 100 : 0;
                }
                await test.save();
            }
            return NextResponse.json({success: true});
        }

        // Record click
        if (body.action === "click" && body.variantId) {
            await ABTestModel.updateOne(
                {_id: params.id, "variants.id": body.variantId},
                {$inc: {"variants.$.clicks": 1}}
            );
            const test = await ABTestModel.findById(params.id) as IABTestDocument | null;
            if (test) {
                for (const v of test.variants) {
                    v.ctr = v.impressions > 0 ? Math.round((v.clicks / v.impressions) * 100 * 100) / 100 : 0;
                }
                await test.save();
            }
            return NextResponse.json({success: true});
        }

        // Declare winner / change status
        if (body.action === "complete" && body.winnerVariantId) {
            const test = await ABTestModel.findOneAndUpdate(
                {_id: params.id, tenantId: session.user.id},
                {$set: {status: "completed", winnerVariantId: body.winnerVariantId, endDate: new Date()}},
                {new: true}
            );
            return NextResponse.json({success: true, data: test});
        }

        if (body.action === "pause") {
            const test = await ABTestModel.findOneAndUpdate(
                {_id: params.id, tenantId: session.user.id},
                {$set: {status: "paused"}},
                {new: true}
            );
            return NextResponse.json({success: true, data: test});
        }

        if (body.action === "resume") {
            const test = await ABTestModel.findOneAndUpdate(
                {_id: params.id, tenantId: session.user.id},
                {$set: {status: "running"}},
                {new: true}
            );
            return NextResponse.json({success: true, data: test});
        }

        return NextResponse.json({success: false, error: "Invalid action"}, {status: 400});
    } catch (error) {
        console.error("[AB_TEST_PUT]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        await ABTestModel.findOneAndDelete({_id: params.id, tenantId: session.user.id});
        return NextResponse.json({success: true});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
