import {NextRequest, NextResponse} from "next/server";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {ReferralModel} from "@/models/Referral";
import {sendWelcomeEmail} from "@/services/email";
import bcrypt from "bcryptjs";
import {z} from "zod";

const RegisterSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    referralCode: z.string().optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        const body = await req.json();
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {success: false, error: parsed.error.errors[0].message},
                {status: 400}
            );
        }

        const {name, email, password, referralCode} = parsed.data;

        // Check for duplicate email
        const existing = await UserModel.findOne({email: email.toLowerCase().trim()});
        if (existing) {
            return NextResponse.json(
                {success: false, error: "An account with this email already exists"},
                {status: 409}
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await UserModel.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: "product_admin",
            plan: "free",
            aiCreditsUsed: 0,
            aiCreditsLimit: 10,
        });

        // Track referral if code provided
        if (referralCode) {
            const referralTemplate = await ReferralModel.findOne({
                code: referralCode.toUpperCase(),
                referredId: {$exists: false},
                status: "pending",
            });

            if (referralTemplate) {
                // Create a new referral entry tracking this signup
                await ReferralModel.create({
                    referrerId: referralTemplate.referrerId,
                    referredId: user._id,
                    code: referralCode.toUpperCase(),
                    status: "pending",
                    commissionPercent: referralTemplate.commissionPercent,
                    commissionAmount: 0,
                });
            }
        }

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, name).catch((err) => console.error("[WELCOME_EMAIL]", err));

        return NextResponse.json(
            {
                success: true,
                message: "Account created successfully",
                data: {id: user._id.toString(), email: user.email, name: user.name},
            },
            {status: 201}
        );
    } catch (error) {
        console.error("[REGISTER]", error);
        return NextResponse.json({success: false, error: "Registration failed. Please try again."}, {status: 500});
    }
}

// import { NextRequest, NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import { z } from "zod";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import { sendWelcomeEmail } from "@/services/email";
//
// const RegisterSchema = z.object({
//   name: z.string().min(2).max(100),
//   email: z.string().email(),
//   password: z.string().min(6).max(100),
// });
//
// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const parsed = RegisterSchema.safeParse(body);
//     if (!parsed.success) {
//       return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
//     }
//
//     const { name, email, password } = parsed.data;
//     await connectDB();
//
//     const existing = await UserModel.findOne({ email });
//     if (existing) {
//       return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
//     }
//
//     const hashed = await bcrypt.hash(password, 12);
//     const user = await UserModel.create({
//       name,
//       email,
//       password: hashed,
//       role: "user",
//       plan: "free",
//       subscriptionStatus: "inactive",
//       aiCreditsUsed: 0,
//       aiCreditsLimit: 10,
//       isActive: true,
//     });
//
//     // Fire-and-forget welcome email
//     sendWelcomeEmail(email, name).catch(console.error);
//
//     return NextResponse.json({
//       success: true,
//       message: "Account created successfully",
//       data: { id: user._id.toString(), name: user.name, email: user.email },
//     }, { status: 201 });
//   } catch (error) {
//     console.error("[REGISTER]", error);
//     return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//   }
// }
