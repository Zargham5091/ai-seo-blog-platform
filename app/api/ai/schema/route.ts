import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { generateSchemaMarkup } from "@/services/ai";
import { checkRateLimit, aiRatelimit } from "@/lib/ratelimit";
import { z } from "zod";

const SchemaSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(10),
  type: z.enum(["Article", "BlogPosting", "FAQPage", "HowTo", "Product", "LocalBusiness", "WebPage"]),
  url: z.string().url().optional().or(z.literal("")),
  additionalData: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { success: rateLimitOk } = await checkRateLimit(aiRatelimit, `schema:${session.user.id}`);
    if (!rateLimitOk) return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });

    await connectDB();
    const user = await UserModel.findById(session.user.id);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    if (user.aiCreditsUsed >= user.aiCreditsLimit) {
      return NextResponse.json({ success: false, error: "No AI credits remaining. Please upgrade." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = SchemaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const schema = await generateSchemaMarkup({
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      url: parsed.data.url ?? process.env.NEXT_PUBLIC_APP_URL ?? "",
    });

    await UserModel.findByIdAndUpdate(session.user.id, { $inc: { aiCreditsUsed: 1 } });

    // Return both the JSON object and a formatted string for easy copy-paste
    return NextResponse.json({
      success: true,
      data: {
        schema,
        formatted: JSON.stringify(schema, null, 2),
        scriptTag: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`,
      },
    });
  } catch (error) {
    console.error("[SCHEMA_GENERATE]", error);
    return NextResponse.json({ success: false, error: "Schema generation failed" }, { status: 500 });
  }
}
