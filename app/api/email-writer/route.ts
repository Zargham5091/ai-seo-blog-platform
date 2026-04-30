import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {checkRateLimit, aiRatelimit} from "@/lib/ratelimit";
import {z} from "zod";
import {generateEmailContent} from "@/services/ai";

const EmailWriterSchema = z.object({
    subject: z.string().min(1).max(150),
    tone: z.enum(["professional", "casual", "educational", "inspirational", "humorous"]).optional(),
    purpose: z.enum(["announcement", "newsletter", "promotion", "update", "welcome"]).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        // Rate limiting
        const {success: rateLimitOk} = await checkRateLimit(aiRatelimit, `email-writer:${session.user.id}`);
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
        const parsed = EmailWriterSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {subject, tone = "professional", purpose = "newsletter"} = parsed.data;

        // Generate email content
        const result = await generateEmailContent(subject, tone, purpose);

        // Update credits only on success
        await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});

        return NextResponse.json({success: true, data: result});

    } catch (error) {
        console.error("[EMAIL_WRITER]", error);
        return NextResponse.json({success: false, error: "Email generation failed"}, {status: 500});
    }
}