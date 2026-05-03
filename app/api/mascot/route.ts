// app/api/mascot/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import MascotConfigModel, {IMascotConfig} from "@/models/MascotConfig";

// GET /api/mascot — fetch config (public, needed for rendering)
export async function GET() {
    try {
        await connectDB();
        let config = await MascotConfigModel.findOne().lean<IMascotConfig>();
        if (!config) {
            // Create default config on first request
            const created = await MascotConfigModel.create({});
            config = created.toObject();
        }
        return NextResponse.json({success: true, data: config});
    } catch (error) {
        console.error("[MASCOT_GET]", error);
        return NextResponse.json({success: false, error: "Failed to fetch mascot config"}, {status: 500});
    }
}

// PATCH /api/mascot — update config (super admin only)
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "super_admin") {
            return NextResponse.json({success: false, error: "Forbidden"}, {status: 403});
        }

        const body = await req.json();
        await connectDB();

        const config = await MascotConfigModel.findOneAndUpdate(
            {},
            {$set: body},
            {upsert: true, new: true}
        );

        return NextResponse.json({success: true, data: config});
    } catch (error) {
        console.error("[MASCOT_PATCH]", error);
        return NextResponse.json({success: false, error: "Failed to update mascot config"}, {status: 500});
    }
}