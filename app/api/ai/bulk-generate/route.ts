import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import BlogModel from "@/models/Blog";
import {slugify} from "@/lib/utils";
import {z} from "zod";
import {generateBlogPost} from "@/services/ai";


const BulkSchema = z.object({
    topics: z.array(z.string().min(3)).min(1).max(10),
    tone: z.enum(["professional", "casual", "educational"]).optional(),
    wordCount: z.number().min(300).max(2000).optional(),
    targetKeywords: z.array(z.string()).optional(),
    saveAsDraft: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        // Diamond plan only
        if (session.user.plan !== "diamond") {
            return NextResponse.json(
                {success: false, error: "Bulk content generation requires Diamond plan."},
                {status: 403}
            );
        }

        await connectDB();
        const user = await UserModel.findById(session.user.id);
        if (!user) return NextResponse.json({success: false, error: "User not found"}, {status: 404});

        const body = await req.json();
        const parsed = BulkSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {topics, tone = "professional", wordCount = 800, saveAsDraft = true} = parsed.data;

        // Check credits
        if (user.aiCreditsUsed + topics.length > user.aiCreditsLimit) {
            return NextResponse.json({
                success: false,
                error: `Not enough credits. Need ${topics.length}, have ${user.aiCreditsLimit - user.aiCreditsUsed}.`,
            }, {status: 403});
        }

        const results: { topic: string; success: boolean; blogId?: string; error?: string }[] = [];

        for (const topic of topics) {
            try {
                const generated = await generateBlogPost({
                    topic,
                    keywords: parsed.data.targetKeywords ?? [],
                    tone,
                    wordCount,
                });
                if (saveAsDraft) {
                    const blog = await BlogModel.create({
                        title: generated.title,
                        slug: `${slugify(generated.title)}-${Date.now()}`,
                        excerpt: generated.excerpt,
                        content: generated.content,
                        authorId: session.user.id,
                        tenantId: session.user.id,
                        status: "draft",
                        isAIGenerated: true,
                        tags: generated.tags ?? [],
                        readTime: generated.readTime ?? Math.ceil(wordCount / 200),
                        seo: {
                            metaTitle: generated.metaTitle,
                            metaDescription: generated.metaDescription,
                            keywords: parsed.data.targetKeywords ?? [],
                            seoScore: 0,
                            readabilityScore: 0,
                        },
                    });
                    results.push({topic, success: true, blogId: blog._id.toString()});
                } else {
                    results.push({topic, success: true});
                }

                await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});
            } catch (err) {
                results.push({topic, success: false, error: String(err)});
            }
        }

        return NextResponse.json({success: true, data: results});
    } catch (error) {
        console.error("[BULK_GENERATE]", error);
        return NextResponse.json({success: false, error: "Bulk generation failed"}, {status: 500});
    }
}
