import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import KeywordModel from "@/models/Keyword";
import { researchKeywords } from "@/services/ai";
import { checkRateLimit, aiRatelimit } from "@/lib/ratelimit";
import { z } from "zod";

const KeywordSchema = z.object({
  seed: z.string().min(2).max(100),
  count: z.number().min(5).max(20).optional(),
  save: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { success: rateLimitOk } = await checkRateLimit(aiRatelimit, `keywords:${session.user.id}`);
    if (!rateLimitOk) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    await connectDB();
    const user = await UserModel.findById(session.user.id);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    if (user.aiCreditsUsed >= user.aiCreditsLimit) {
      return NextResponse.json({ success: false, error: "No AI credits remaining. Please upgrade." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = KeywordSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const keywords = await researchKeywords(parsed.data.seed, parsed.data.count ?? 10);

    await UserModel.findByIdAndUpdate(session.user.id, { $inc: { aiCreditsUsed: 1 } });

    if (parsed.data.save) {
      const docs = keywords.map((k) => ({
        keyword: k.keyword,
        searchVolume: k.searchVolume,
        difficulty: k.difficulty,
        cpc: k.cpc,
        trend: k.trend,
        userId: session.user.id,
        tenantId: session.user.id,
        isSaved: true,
      }));
      await KeywordModel.insertMany(docs, { ordered: false }).catch(() => {});
    }

    return NextResponse.json({ success: true, data: keywords });
  } catch (error) {
    console.error("[KEYWORD_RESEARCH]", error);
    return NextResponse.json({ success: false, error: "Keyword research failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const keywords = await KeywordModel.find({ tenantId: session.user.id, isSaved: true }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: keywords });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });

    await connectDB();
    await KeywordModel.findOneAndDelete({ _id: id, tenantId: session.user.id });
    return NextResponse.json({ success: true, message: "Keyword removed" });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
