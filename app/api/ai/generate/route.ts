import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { generateBlogPost } from "@/services/ai";
import { checkRateLimit, aiRatelimit } from "@/lib/ratelimit";
import { z } from "zod";

const GenerateSchema = z.object({
  topic: z.string().min(3).max(200),
  keywords: z.array(z.string()).min(1).max(10),
  tone: z.enum(["professional", "casual", "educational", "persuasive", "storytelling"]).optional(),
  wordCount: z.number().min(300).max(3000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // Rate limit check
    const { success: rateLimitOk, remaining } = await checkRateLimit(aiRatelimit, `ai:${session.user.id}`);
    if (!rateLimitOk) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded. Please wait before making more AI requests." }, { status: 429 });
    }

    await connectDB();
    const user = await UserModel.findById(session.user.id);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Check AI credit quota
    if (user.aiCreditsUsed >= user.aiCreditsLimit) {
      return NextResponse.json({
        success: false,
        error: `You've used all ${user.aiCreditsLimit} AI credits for this month. Please upgrade your plan for more credits.`,
      }, { status: 403 });
    }

    const body = await req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const result = await generateBlogPost(parsed.data);

    // Deduct one credit
    await UserModel.findByIdAndUpdate(session.user.id, { $inc: { aiCreditsUsed: 1 } });

    return NextResponse.json({
      success: true,
      data: result,
      meta: { creditsRemaining: user.aiCreditsLimit - user.aiCreditsUsed - 1, rateLimitRemaining: remaining },
    });
  } catch (error) {
    console.error("[AI_GENERATE]", error);
    return NextResponse.json({ success: false, error: "AI generation failed. Please try again." }, { status: 500 });
  }
}
