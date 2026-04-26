import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";

interface Params {
    params: { id: string }
}

export async function PUT(req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        await connectDB();
        const body = await req.json();

        const component = await PlanComponentModel.findByIdAndUpdate(
            params.id,
            {$set: body},
            {new: true, runValidators: true}
        );

        if (!component) {
            return NextResponse.json({success: false, error: "Component not found"}, {status: 404});
        }

        return NextResponse.json({success: true, data: component});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

export async function DELETE(_req: NextRequest, {params}: Params) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        await connectDB();
        await PlanComponentModel.findByIdAndDelete(params.id);
        return NextResponse.json({success: true, message: "Component deleted"});
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}
