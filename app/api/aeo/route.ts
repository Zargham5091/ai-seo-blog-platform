import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {checkRateLimit, aiRatelimit} from "@/lib/ratelimit";
import {z} from "zod";
import {analyzeAEOContent} from "@/services/ai";

const AEOSchema = z.object({
    content: z.string().min(100),
    title: z.string().min(1),
    targetKeyword: z.string().min(2),
    url: z.string().optional(),
});

export interface AEOAnalysisResult {
    aeoScore: number;
    geoScore: number;
    citationLikelihood: "high" | "medium" | "low";
    issues: { type: string; message: string; fix: string }[];
    suggestions: string[];
    optimizedSnippets: {
        directAnswer: string;
        featuredSnippet: string;
        faqPairs: { question: string; answer: string }[];
        definitionBlock: string;
    };
    missingEntities: string[];
    structureScore: {
        hasDirectAnswer: boolean;
        hasDefinition: boolean;
        hasExamples: boolean;
        hasFAQ: boolean;
        hasStatistics: boolean;
        hasAuthorInfo: boolean;
    };
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
        }

        // Rate limiting
        const {success: rateLimitOk} = await checkRateLimit(aiRatelimit, `aeo:${session.user.id}`);
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
        const parsed = AEOSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {content, title, targetKeyword} = parsed.data;

        // Add timeout to AI call (30 seconds)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("AI analysis timeout")), 30000)
        );

        const result = await Promise.race([
            analyzeAEOContent(content, title, targetKeyword),
            timeoutPromise
        ]) as AEOAnalysisResult;

        // Update credits only if successful
        await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});

        return NextResponse.json({success: true, data: result});

    } catch (error) {
        console.error("[AEO_ANALYZE]", error);

        // Better error messages
        if (error instanceof Error) {
            if (error.message === "AI analysis timeout") {
                return NextResponse.json({
                    success: false,
                    error: "Analysis taking too long, please try again"
                }, {status: 504});
            }
            if (error.message.includes("API key") || error.message.includes("OpenAI")) {
                return NextResponse.json({success: false, error: "AI service unavailable"}, {status: 503});
            }
        }

        return NextResponse.json({success: false, error: "AEO analysis failed"}, {status: 500});
    }
}