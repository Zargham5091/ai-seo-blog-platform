import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { sendWelcomeEmail } from "@/services/email";

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    await connectDB();

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, error: "An account with this email already exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      name,
      email,
      password: hashed,
      role: "user",
      plan: "free",
      subscriptionStatus: "inactive",
      aiCreditsUsed: 0,
      aiCreditsLimit: 10,
      isActive: true,
    });

    // Fire-and-forget welcome email
    sendWelcomeEmail(email, name).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      data: { id: user._id.toString(), name: user.name, email: user.email },
    }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
