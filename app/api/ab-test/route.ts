import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import ABTestModel from "@/models/ABTest";
import {z} from "zod";
import crypto from "crypto";

const CreateSchema = z.object({
    name: z.string().min(1).max(100),
    testType: z.enum(["headline", "meta_title", "meta_description", "cta"]),
    blogId: z.string().optional(),
    primaryMetric: z.enum(["ctr", "time_on_page", "scroll_depth", "conversions"]).optional(),
    variants: z.array(z.object({
        name: z.string(),
        value: z.string(),
        isControl: z.boolean().optional(),
    })).min(2).max(4),
    minimumSampleSize: z.number().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const status = new URL(req.url).searchParams.get("status");
        const query: Record<string, unknown> = {tenantId: session.user.id};
        if (status) query.status = status;

        const tests = await ABTestModel.find(query)
            .populate("blogId", "title slug")
            .sort({createdAt: -1})
            .lean();

        return NextResponse.json({success: true, data: tests});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const body = await req.json();
        const parsed = CreateSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({
            success: false,
            error: parsed.error.errors[0].message
        }, {status: 400});

        await connectDB();

        const variants = parsed.data.variants.map((v, i) => ({
            id: crypto.randomBytes(4).toString("hex"),
            name: v.name,
            value: v.value,
            isControl: v.isControl ?? i === 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
        }));

        const test = await ABTestModel.create({
            tenantId: session.user.id,
            name: parsed.data.name,
            testType: parsed.data.testType,
            blogId: parsed.data.blogId,
            primaryMetric: parsed.data.primaryMetric ?? "ctr",
            variants,
            minimumSampleSize: parsed.data.minimumSampleSize ?? 100,
            startDate: new Date(),
            status: "running",
        });

        return NextResponse.json({success: true, data: test}, {status: 201});
    } catch (error) {
        console.error("[AB_TEST_CREATE]", error);
        return NextResponse.json({success: false, error: "Failed to create test"}, {status: 500});
    }
}
