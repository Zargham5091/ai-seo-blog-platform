// app/api/ai/bulk-generate/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import BlogModel from "@/models/Blog";
import {generateBlogPost} from "@/services/ai";
import {getTenantContext, canWrite} from "@/lib/tenant";
import {slugify} from "@/lib/utils";
import {z} from "zod";

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

        await connectDB();
        const tenant = await getTenantContext(session.user.id);

        if (!canWrite(tenant.role)) {
            return NextResponse.json({success: false, error: "You have read-only access."}, {status: 403});
        }

        // Get owner's plan — bulk generate is diamond only
        const owner = await UserModel.findById(tenant.tenantId);
        if (!owner) return NextResponse.json({success: false, error: "Owner not found"}, {status: 404});

        if (owner.plan !== "diamond") {
            return NextResponse.json({
                success: false,
                error: "Bulk content generation requires Diamond plan."
            }, {status: 403});
        }

        const body = await req.json();
        const parsed = BulkSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
        }

        const {topics, tone = "professional", wordCount = 800, saveAsDraft = true} = parsed.data;

        // Credit check — owner vs team member
        if (tenant.isOwner) {
            if (owner.aiCreditsUsed + topics.length > owner.aiCreditsLimit) {
                return NextResponse.json({
                    success: false,
                    error: `Not enough credits. Need ${topics.length}, have ${owner.aiCreditsLimit - owner.aiCreditsUsed}.`,
                }, {status: 403});
            }
        } else {
            if (tenant.aiCreditsLimit === 0) {
                return NextResponse.json({success: false, error: "No AI credits allocated to you."}, {status: 403});
            }
            if (tenant.aiCreditsUsed + topics.length > tenant.aiCreditsLimit) {
                return NextResponse.json({
                    success: false,
                    error: `Not enough allocated credits. Need ${topics.length}, have ${tenant.aiCreditsLimit - tenant.aiCreditsUsed}.`,
                }, {status: 403});
            }
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
                        tenantId: tenant.tenantId,  // ← owner's tenantId
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

                // Deduct credits from correct account
                if (tenant.isOwner) {
                    await UserModel.findByIdAndUpdate(tenant.tenantId, {$inc: {aiCreditsUsed: 1}});
                } else {
                    await UserModel.findOneAndUpdate(
                        {_id: tenant.tenantId, "teamMembers.userId": session.user.id},
                        {$inc: {"teamMembers.$.aiCreditsUsed": 1, aiCreditsUsed: 1}}
                    );
                }
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

// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import UserModel from "@/models/User";
// import BlogModel from "@/models/Blog";
// import {slugify} from "@/lib/utils";
// import {z} from "zod";
// import {generateBlogPost} from "@/services/ai";
//
//
// const BulkSchema = z.object({
//     topics: z.array(z.string().min(3)).min(1).max(10),
//     tone: z.enum(["professional", "casual", "educational"]).optional(),
//     wordCount: z.number().min(300).max(2000).optional(),
//     targetKeywords: z.array(z.string()).optional(),
//     saveAsDraft: z.boolean().optional(),
// });
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         // Diamond plan only
//         if (session.user.plan !== "diamond") {
//             return NextResponse.json(
//                 {success: false, error: "Bulk content generation requires Diamond plan."},
//                 {status: 403}
//             );
//         }
//
//         await connectDB();
//         const user = await UserModel.findById(session.user.id);
//         if (!user) return NextResponse.json({success: false, error: "User not found"}, {status: 404});
//
//         const body = await req.json();
//         const parsed = BulkSchema.safeParse(body);
//         if (!parsed.success) {
//             return NextResponse.json({success: false, error: parsed.error.errors[0].message}, {status: 400});
//         }
//
//         const {topics, tone = "professional", wordCount = 800, saveAsDraft = true} = parsed.data;
//
//         // Check credits
//         if (user.aiCreditsUsed + topics.length > user.aiCreditsLimit) {
//             return NextResponse.json({
//                 success: false,
//                 error: `Not enough credits. Need ${topics.length}, have ${user.aiCreditsLimit - user.aiCreditsUsed}.`,
//             }, {status: 403});
//         }
//
//         const results: { topic: string; success: boolean; blogId?: string; error?: string }[] = [];
//
//         for (const topic of topics) {
//             try {
//                 const generated = await generateBlogPost({
//                     topic,
//                     keywords: parsed.data.targetKeywords ?? [],
//                     tone,
//                     wordCount,
//                 });
//                 if (saveAsDraft) {
//                     const blog = await BlogModel.create({
//                         title: generated.title,
//                         slug: `${slugify(generated.title)}-${Date.now()}`,
//                         excerpt: generated.excerpt,
//                         content: generated.content,
//                         authorId: session.user.id,
//                         tenantId: session.user.id,
//                         status: "draft",
//                         isAIGenerated: true,
//                         tags: generated.tags ?? [],
//                         readTime: generated.readTime ?? Math.ceil(wordCount / 200),
//                         seo: {
//                             metaTitle: generated.metaTitle,
//                             metaDescription: generated.metaDescription,
//                             keywords: parsed.data.targetKeywords ?? [],
//                             seoScore: 0,
//                             readabilityScore: 0,
//                         },
//                     });
//                     results.push({topic, success: true, blogId: blog._id.toString()});
//                 } else {
//                     results.push({topic, success: true});
//                 }
//
//                 await UserModel.findByIdAndUpdate(session.user.id, {$inc: {aiCreditsUsed: 1}});
//             } catch (err) {
//                 results.push({topic, success: false, error: String(err)});
//             }
//         }
//
//         return NextResponse.json({success: true, data: results});
//     } catch (error) {
//         console.error("[BULK_GENERATE]", error);
//         return NextResponse.json({success: false, error: "Bulk generation failed"}, {status: 500});
//     }
// }
