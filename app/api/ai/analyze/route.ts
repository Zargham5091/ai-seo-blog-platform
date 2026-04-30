// app/api/ai/analyze/route.ts
import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import UserModel from "@/models/User";
import {
    analyzeSEOContent,
    generateMetaTags,
    generateSchemaMarkup,
    generateInternalLinkSuggestions
} from "@/services/ai";
import {getTenantContext, canWrite} from "@/lib/tenant";
import {z} from "zod";

const AnalyzeSchema = z.object({
    content: z.string().min(50),
    targetKeyword: z.string().min(2),
    title: z.string().optional(),
    generateMeta: z.boolean().optional(),
    generateSchema: z.boolean().optional(),
    existingPosts: z.array(z.string()).optional(),
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

        // Credit check
        const owner = await UserModel.findById(tenant.tenantId)
            .select("aiCreditsUsed aiCreditsLimit")
            .lean() as { aiCreditsUsed: number; aiCreditsLimit: number } | null;

        if (!owner) return NextResponse.json({success: false, error: "Owner not found"}, {status: 404});

        if (tenant.isOwner) {
            if (owner.aiCreditsUsed >= owner.aiCreditsLimit) {
                return NextResponse.json({success: false, error: "No AI credits remaining."}, {status: 403});
            }
        } else {
            if (tenant.aiCreditsLimit === 0 || tenant.aiCreditsUsed >= tenant.aiCreditsLimit) {
                return NextResponse.json({success: false, error: "No AI credits allocated to you."}, {status: 403});
            }
        }

        const body = await req.json();
        const parsed = AnalyzeSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({
            success: false,
            error: parsed.error.errors[0].message
        }, {status: 400});

        const {content, targetKeyword, generateMeta, generateSchema, existingPosts} = parsed.data;

        const [analysis, meta, schema, internalLinks] = await Promise.all([
            analyzeSEOContent(content, targetKeyword),
            generateMeta ? generateMetaTags(content, [targetKeyword]) : Promise.resolve(null),
            generateSchema ? generateSchemaMarkup({
                title: parsed.data.title ?? targetKeyword,
                description: content.slice(0, 160),
                type: "Article",
                url: "",
            }) : Promise.resolve(null),
            existingPosts?.length ? generateInternalLinkSuggestions(content, existingPosts) : Promise.resolve([]),
        ]);

        // Deduct credit
        if (tenant.isOwner) {
            await UserModel.findByIdAndUpdate(tenant.tenantId, {$inc: {aiCreditsUsed: 1}});
        } else {
            await UserModel.findOneAndUpdate(
                {_id: tenant.tenantId, "teamMembers.userId": session.user.id},
                {$inc: {"teamMembers.$.aiCreditsUsed": 1, aiCreditsUsed: 1}}
            );
        }

        return NextResponse.json({success: true, data: {analysis, meta, schema, internalLinks}});
    } catch (error) {
        console.error("[SEO_ANALYZE]", error);
        return NextResponse.json({success: false, error: "Analysis failed"}, {status: 500});
    }
}

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import { analyzeSEOContent, generateMetaTags, generateSchemaMarkup, generateInternalLinkSuggestions } from "@/services/ai";
// import { z } from "zod";
//
// const AnalyzeSchema = z.object({
//   content: z.string().min(50),
//   targetKeyword: z.string().min(2),
//   title: z.string().optional(),
//   generateMeta: z.boolean().optional(),
//   generateSchema: z.boolean().optional(),
//   existingPosts: z.array(z.string()).optional(),
// });
//
// export async function POST(req: NextRequest) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//     await connectDB();
//     const user = await UserModel.findById(session.user.id);
//     if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
//
//     if (user.aiCreditsUsed >= user.aiCreditsLimit) {
//       return NextResponse.json({ success: false, error: "No AI credits remaining" }, { status: 403 });
//     }
//
//     const body = await req.json();
//     const parsed = AnalyzeSchema.safeParse(body);
//     if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
//
//     const { content, targetKeyword, generateMeta, generateSchema, existingPosts } = parsed.data;
//
//     const [analysis, meta, schema, internalLinks] = await Promise.all([
//       analyzeSEOContent(content, targetKeyword),
//       generateMeta ? generateMetaTags(content, [targetKeyword]) : Promise.resolve(null),
//       generateSchema ? generateSchemaMarkup({ title: parsed.data.title ?? targetKeyword, description: content.slice(0, 160), type: "Article", url: "" }) : Promise.resolve(null),
//       existingPosts?.length ? generateInternalLinkSuggestions(content, existingPosts) : Promise.resolve([]),
//     ]);
//
//     await UserModel.findByIdAndUpdate(session.user.id, { $inc: { aiCreditsUsed: 1 } });
//
//     return NextResponse.json({
//       success: true,
//       data: { analysis, meta, schema, internalLinks },
//     });
//   } catch (error) {
//     console.error("[SEO_ANALYZE]", error);
//     return NextResponse.json({ success: false, error: "Analysis failed" }, { status: 500 });
//   }
// }
