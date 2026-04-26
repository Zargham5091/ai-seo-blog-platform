import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import OpenAI from "openai";
import {checkRateLimit, aiRatelimit} from "@/lib/ratelimit";
import {z} from "zod";

const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const RepurposeSchema = z.object({
    content: z.string().min(100, "Content must be at least 100 characters"),
    title: z.string().min(1),
    formats: z.array(
        z.enum(["twitter_thread", "linkedin_post", "instagram_caption", "newsletter", "facebook_post", "tiktok_script"])
    ).min(1),
    tone: z.enum(["professional", "casual", "educational", "inspirational", "humorous"]).optional(),
    brandName: z.string().max(50).optional(),
});

interface RepurposedContent {
    twitter_thread?: string[];
    linkedin_post?: string;
    instagram_caption?: string;
    newsletter?: string;
    facebook_post?: string;
    tiktok_script?: string;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        const {success: rateLimitOk} = await checkRateLimit(aiRatelimit, `repurpose:${session.user.id}`);
        if (!rateLimitOk) {
            return NextResponse.json({success: false, error: "Rate limit exceeded"}, {status: 429});
        }

        await connectDB();
        const user = await UserModel.findById(session.user.id);
        if (!user) {
            return NextResponse.json({success: false, error: "User not found"}, {status: 404});
        }

        if (user.aiCreditsUsed >= user.aiCreditsLimit) {
            return NextResponse.json({success: false, error: "No AI credits remaining"}, {status: 403});
        }

        const body = await req.json();
        const parsed = RepurposeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {content, title, formats, tone = "professional", brandName} = parsed.data;
        const brand = brandName ? `Brand: ${brandName}. ` : "";
        const strippedContent = content.replace(/<[^>]*>/g, "").slice(0, 2000);

        const formatInstructions = formats.map((f) => {
            switch (f) {
                case "twitter_thread":
                    return `"twitter_thread": array of 5-8 tweets, each max 280 chars. Start with a hook. End with a CTA.`;
                case "linkedin_post":
                    return `"linkedin_post": 150-300 word professional post with line breaks, 3 relevant hashtags at end.`;
                case "instagram_caption":
                    return `"instagram_caption": engaging 100-150 word caption with emojis, 10 relevant hashtags at end.`;
                case "newsletter":
                    return `"newsletter": 200-300 word email newsletter excerpt with subject line at top as "Subject: ...".`;
                case "facebook_post":
                    return `"facebook_post": conversational 100-200 word post, end with a question to drive engagement.`;
                case "tiktok_script":
                    return `"tiktok_script": 150-200 word spoken script for a 60s TikTok video. Include [PAUSE], [SHOW TEXT], [B-ROLL] cues.`;
                default:
                    return "";
            }
        }).join("\n");

        const prompt = `You are a social media content expert. ${brand}
Repurpose this blog post into multiple formats. Use a ${tone} tone.

Blog Title: ${title}
Blog Content: ${strippedContent}

Create ONLY these formats (return as JSON object):
${formatInstructions}

Return ONLY a valid JSON object with exactly the keys specified above. No extra text.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{role: "user", content: prompt}],
            response_format: {type: "json_object"},
            temperature: 0.8,
            max_tokens: 2000,
        });

        const result = JSON.parse(response.choices[0].message.content ?? "{}") as RepurposedContent;

        await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});

        return NextResponse.json({success: true, data: result});
    } catch (error) {
        console.error("[REPURPOSE]", error);
        return NextResponse.json({success: false, error: "Content repurposing failed"}, {status: 500});
    }
}