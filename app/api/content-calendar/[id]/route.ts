import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import ContentCalendarModel from "@/models/ContentCalendar";

interface Params {
    params: { id: string }
}

export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        const body = await req.json();
        if (body.scheduledDate) body.scheduledDate = new Date(body.scheduledDate);

        const item = await ContentCalendarModel.findOneAndUpdate(
            {_id: params.id, tenantId: session.user.id},
            {$set: body},
            {new: true}
        );

        if (!item) return NextResponse.json({success: false, error: "Item not found"}, {status: 404});
        return NextResponse.json({success: true, data: item});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        await connectDB();
        await ContentCalendarModel.findOneAndDelete({_id: params.id, tenantId: session.user.id});
        return NextResponse.json({success: true, message: "Deleted"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
