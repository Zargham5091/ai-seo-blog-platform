// ════════════════════════════════════════════════════════════════════════════
// FILE: app/api/builder/ai/route.ts
// ════════════════════════════════════════════════════════════════════════════

import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {prompt, siteType, pageSlug, existingComponentKeys} = await req.json();
        if (!prompt || prompt.trim().length < 5)
            return NextResponse.json({success: false, error: "Prompt too short"}, {status: 400});

        await connectDB();

        // Fetch components available to this user's plan
        const components = await PlanComponentModel.find({
            availableTo: {$in: [session.user.plan ?? "free"]},
            isActive: true,
            siteTypes: {$in: [siteType ?? "all", "all"]},
        }).select("key name category description defaultProps").lean();

        if (components.length === 0)
            return NextResponse.json({success: false, error: "No components available for your plan"}, {status: 400});

        const componentList = components
            .map((c) => `- key:"${c.key}" [${c.category}] "${c.name}"${c.description ? ` — ${c.description}` : ""}`)
            .join("\n");

        const systemPrompt = `You are an expert website builder AI. Select and configure components from the library below to match the user's request.

AVAILABLE COMPONENTS:
${componentList}

STRICT RULES:
1. Return ONLY valid JSON — no markdown, no backticks, no preamble
2. Select 3-8 components, ordered logically (hero first, CTA/contact last)
3. Only use componentKey values EXACTLY as listed above
4. For propValues: keep text short, professional, and relevant to the site type
5. Site type: ${siteType ?? "general"}, Page: ${pageSlug ?? "/"}
${existingComponentKeys?.length > 0 ? `6. Already on page: ${existingComponentKeys.join(", ")} — add complementary components` : ""}

RESPONSE FORMAT (JSON only):
{"components":[{"componentKey":"exact_key","propValues":{"headline":"Short text","subtext":"One sentence.","ctaLabel":"Action Verb","ctaHref":"#"}}],"reasoning":"one sentence"}`;

        const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [{role: "system", content: systemPrompt}, {role: "user", content: prompt}],
                    max_tokens: 2000,
                    temperature: 0.2,
                }),
            }
        );

        if (!cfRes.ok) {
            console.error("[AI_BUILD] Cloudflare error", cfRes.status);
            return NextResponse.json({success: false, error: "AI service unavailable"}, {status: 503});
        }

        const cfData = await cfRes.json() as { result?: { response?: string } };
        const rawText = cfData?.result?.response ?? "";

        let parsed: { components: { componentKey: string; propValues: Record<string, unknown> }[] };
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON");
            parsed = JSON.parse(jsonMatch[0]);
        } catch {
            return NextResponse.json({
                success: false,
                error: "AI returned malformed response. Please try again."
            }, {status: 422});
        }

        // Validate keys + merge defaultProps
        const validKeys = new Map(components.map((c) => [c.key, c]));
        const result = (parsed.components ?? [])
            .filter((c) => validKeys.has(c.componentKey))
            .map((aiComp) => {
                const dbComp = validKeys.get(aiComp.componentKey)!;
                return {
                    componentKey: aiComp.componentKey,
                    componentId: (dbComp as { _id: unknown })._id,
                    propValues: {...(dbComp.defaultProps ?? {}), ...aiComp.propValues},
                };
            });

        return NextResponse.json({success: true, data: result, count: result.length});
    } catch (err) {
        console.error("[AI_BUILD]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}