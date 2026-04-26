import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import ContentCalendarModel from "@/models/ContentCalendar";
import {z} from "zod";

const ItemSchema = z.object({
    title: z.string().min(1).max(200),
    contentType: z.enum(["blog", "social", "newsletter", "video", "podcast", "infographic"]).optional(),
    status: z.enum(["idea", "outline", "draft", "review", "scheduled", "published"]).optional(),
    scheduledDate: z.string(),
    targetKeyword: z.string().optional(),
    notes: z.string().max(1000).optional(),
    tags: z.array(z.string()).optional(),
    color: z.string().optional(),
    blogId: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const {searchParams} = new URL(req.url);
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        const query: Record<string, unknown> = {tenantId: session.user.id};

        if (month && year) {
            const start = new Date(parseInt(year), parseInt(month) - 1, 1);
            const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            query.scheduledDate = {$gte: start, $lte: end};
        }

        const items = await ContentCalendarModel.find(query)
            .populate("blogId", "title slug status")
            .populate("assignedTo", "name image")
            .sort({scheduledDate: 1})
            .lean();

        return NextResponse.json({success: true, data: items});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const body = await req.json();
        const parsed = ItemSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({
            success: false,
            error: parsed.error.errors[0].message
        }, {status: 400});

        await connectDB();
        const item = await ContentCalendarModel.create({
            ...parsed.data,
            tenantId: session.user.id,
            scheduledDate: new Date(parsed.data.scheduledDate),
        });

        return NextResponse.json({success: true, data: item}, {status: 201});
    } catch (error) {
        console.error("[CALENDAR_POST]", error);
        return NextResponse.json({success: false, error: "Failed to create item"}, {status: 500});
    }
}
