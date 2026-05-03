// app/api/auth/reset-password/route.ts
import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcryptjs";
import {z} from "zod";

const Schema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = Schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {token, password} = parsed.data;
        await connectDB();

        const user = await UserModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: {$gt: new Date()}, // token must not be expired
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                error: "Reset link is invalid or has expired. Please request a new one.",
            }, {status: 400});
        }

        const hashed = await bcrypt.hash(password, 12);

        await UserModel.findByIdAndUpdate(user._id, {
            password: hashed,
            $unset: {resetPasswordToken: "", resetPasswordExpires: ""},
        });

        return NextResponse.json({success: true, message: "Password reset successfully."});
    } catch (error) {
        console.error("[RESET_PASSWORD]", error);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}