// app/api/auth/forgot-password/route.ts
import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {sendPasswordResetEmail} from "@/services/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
    try {
        const {email} = await req.json() as { email: string };
        if (!email) return NextResponse.json({success: false, error: "Email required"}, {status: 400});

        await connectDB();
        const user = await UserModel.findOne({email: email.toLowerCase().trim()});

        // Always return success — never reveal if email exists (security)
        if (!user) {
            return NextResponse.json({success: true, message: "If an account exists, a reset link has been sent."});
        }

        // Generate reset token
        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await UserModel.findByIdAndUpdate(user._id, {
            resetPasswordToken: token,
            resetPasswordExpires: expires,
        });

        // Send email (non-blocking — don't reveal failures to client)
        sendPasswordResetEmail(email, token).catch((err) =>
            console.error("[FORGOT_PASSWORD_EMAIL]", err)
        );

        return NextResponse.json({success: true, message: "If an account exists, a reset link has been sent."});
    } catch (error) {
        console.error("[FORGOT_PASSWORD]", error);
        // Return success even on error — security best practice
        return NextResponse.json({success: true, message: "If an account exists, a reset link has been sent."});
    }
}