import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import PlanComponentModel from "@/models/PlanComponent";

function extractJSON(text: string): string | null {
    // Try direct parse first
    try {
        JSON.parse(text);
        return text;
    } catch {
    }
    // Strip markdown code fences
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
        try {
            JSON.parse(fenced[1].trim());
            return fenced[1].trim();
        } catch {
        }
    }
    // Extract first { ... } block (greedy)
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        try {
            JSON.parse(braceMatch[0]);
            return braceMatch[0];
        } catch {
        }
    }
    // Try to fix truncated JSON by appending ]}
    if (braceMatch) {
        for (const suffix of ["]}}", "]}", "}"]) {
            try {
                JSON.parse(braceMatch[0] + suffix);
                return braceMatch[0] + suffix;
            } catch {
            }
        }
    }
    return null;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});

        const {prompt, siteType, pageSlug, existingComponentKeys, clearCanvas} = await req.json();
        if (!prompt || prompt.trim().length < 5)
            return NextResponse.json({success: false, error: "Prompt too short"}, {status: 400});

        await connectDB();

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

        const systemPrompt = `You are an expert website builder AI. Return ONLY a JSON object — no explanation, no markdown, no code fences.

AVAILABLE COMPONENTS:
${componentList}

RULES:
1. Return ONLY valid JSON, starting with { and ending with }
2. Select 4-8 components ordered logically (navbar → hero → sections → footer)
3. Use componentKey values EXACTLY as listed
4. Keep propValues text short and relevant to: ${siteType ?? "general"} site, page: ${pageSlug ?? "/"}
5. Always include a navbar and footer if available
${!clearCanvas && existingComponentKeys?.length > 0 ? `6. Already on page: ${existingComponentKeys.join(", ")} — add complementary sections only` : "6. Build a complete page from scratch"}

OUTPUT FORMAT:
{"components":[{"componentKey":"exact_key","propValues":{"headline":"Text","subtext":"Text","ctaLabel":"Get Started","ctaHref":"#"}}]}`;

        // Try up to 2 times for reliability
        let rawText = "";
        for (let attempt = 0; attempt < 2; attempt++) {
            const cfRes = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        messages: [
                            {role: "system", content: systemPrompt},
                            {
                                role: "user",
                                content: `Build a ${siteType ?? "general"} website. ${prompt}. Return JSON only.`
                            },
                        ],
                        max_tokens: 2000,
                        temperature: attempt === 0 ? 0.2 : 0.1,
                    }),
                }
            );

            if (!cfRes.ok) {
                console.error("[AI_BUILD] Cloudflare error", cfRes.status);
                continue;
            }

            const cfData = await cfRes.json() as { result?: { response?: string } };
            rawText = cfData?.result?.response ?? "";
            if (rawText) break;
        }

        if (!rawText) {
            return NextResponse.json({
                success: false,
                error: "AI service unavailable. Please try again."
            }, {status: 503});
        }

        const jsonStr = extractJSON(rawText);
        if (!jsonStr) {
            console.error("[AI_BUILD] Could not extract JSON from:", rawText.substring(0, 300));
            return NextResponse.json({
                success: false,
                error: "AI returned an unexpected format. Please try again."
            }, {status: 422});
        }

        let parsed: { components: { componentKey: string; propValues: Record<string, unknown> }[] };
        try {
            parsed = JSON.parse(jsonStr);
        } catch {
            return NextResponse.json({
                success: false,
                error: "AI returned malformed JSON. Please try again."
            }, {status: 422});
        }

        if (!Array.isArray(parsed.components) || parsed.components.length === 0) {
            return NextResponse.json({
                success: false,
                error: "AI did not return any components. Try a more specific prompt."
            }, {status: 422});
        }

        const validKeys = new Map(components.map((c) => [c.key, c]));
        const result = parsed.components
            .filter((c) => validKeys.has(c.componentKey))
            .map((aiComp) => {
                const dbComp = validKeys.get(aiComp.componentKey)!;
                return {
                    componentKey: aiComp.componentKey,
                    componentId: (dbComp as { _id: unknown })._id,
                    propValues: {...(dbComp.defaultProps ?? {}), ...aiComp.propValues},
                };
            });

        if (result.length === 0) {
            return NextResponse.json({
                success: false,
                error: "AI suggested components not in your plan. Try rephrasing."
            }, {status: 422});
        }

        return NextResponse.json({success: true, data: result, count: result.length, clearCanvas: !!clearCanvas});
    } catch (err) {
        console.error("[AI_BUILD]", err);
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}

// // ════════════════════════════════════════════════════════════════════════════
// // FILE: app/api/builder/ai/route.ts
// // ════════════════════════════════════════════════════════════════════════════
//
// import {NextRequest, NextResponse} from "next/server";
// import {getServerSession} from "next-auth";
// import {authOptions} from "@/lib/auth";
// import {connectDB} from "@/lib/db";
// import PlanComponentModel from "@/models/PlanComponent";
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
//
//         const {prompt, siteType, pageSlug, existingComponentKeys} = await req.json();
//         if (!prompt || prompt.trim().length < 5)
//             return NextResponse.json({success: false, error: "Prompt too short"}, {status: 400});
//
//         await connectDB();
//
//         // Fetch components available to this user's plan
//         const components = await PlanComponentModel.find({
//             availableTo: {$in: [session.user.plan ?? "free"]},
//             isActive: true,
//             siteTypes: {$in: [siteType ?? "all", "all"]},
//         }).select("key name category description defaultProps").lean();
//
//         if (components.length === 0)
//             return NextResponse.json({success: false, error: "No components available for your plan"}, {status: 400});
//
//         const componentList = components
//             .map((c) => `- key:"${c.key}" [${c.category}] "${c.name}"${c.description ? ` — ${c.description}` : ""}`)
//             .join("\n");
//
//         const systemPrompt = `You are an expert website builder AI. Select and configure components from the library below to match the user's request.
//
// AVAILABLE COMPONENTS:
// ${componentList}
//
// STRICT RULES:
// 1. Return ONLY valid JSON — no markdown, no backticks, no preamble
// 2. Select 3-8 components, ordered logically (hero first, CTA/contact last)
// 3. Only use componentKey values EXACTLY as listed above
// 4. For propValues: keep text short, professional, and relevant to the site type
// 5. Site type: ${siteType ?? "general"}, Page: ${pageSlug ?? "/"}
// ${existingComponentKeys?.length > 0 ? `6. Already on page: ${existingComponentKeys.join(", ")} — add complementary components` : ""}
//
// RESPONSE FORMAT (JSON only):
// {"components":[{"componentKey":"exact_key","propValues":{"headline":"Short text","subtext":"One sentence.","ctaLabel":"Action Verb","ctaHref":"#"}}],"reasoning":"one sentence"}`;
//
//         const cfRes = await fetch(
//             `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     messages: [{role: "system", content: systemPrompt}, {role: "user", content: prompt}],
//                     max_tokens: 2000,
//                     temperature: 0.2,
//                 }),
//             }
//         );
//
//         if (!cfRes.ok) {
//             console.error("[AI_BUILD] Cloudflare error", cfRes.status);
//             return NextResponse.json({success: false, error: "AI service unavailable"}, {status: 503});
//         }
//
//         const cfData = await cfRes.json() as { result?: { response?: string } };
//         const rawText = cfData?.result?.response ?? "";
//
//         let parsed: { components: { componentKey: string; propValues: Record<string, unknown> }[] };
//         try {
//             const jsonMatch = rawText.match(/\{[\s\S]*\}/);
//             if (!jsonMatch) throw new Error("No JSON");
//             parsed = JSON.parse(jsonMatch[0]);
//         } catch {
//             return NextResponse.json({
//                 success: false,
//                 error: "AI returned malformed response. Please try again."
//             }, {status: 422});
//         }
//
//         // Validate keys + merge defaultProps
//         const validKeys = new Map(components.map((c) => [c.key, c]));
//         const result = (parsed.components ?? [])
//             .filter((c) => validKeys.has(c.componentKey))
//             .map((aiComp) => {
//                 const dbComp = validKeys.get(aiComp.componentKey)!;
//                 return {
//                     componentKey: aiComp.componentKey,
//                     componentId: (dbComp as { _id: unknown })._id,
//                     propValues: {...(dbComp.defaultProps ?? {}), ...aiComp.propValues},
//                 };
//             });
//
//         return NextResponse.json({success: true, data: result, count: result.length});
//     } catch (err) {
//         console.error("[AI_BUILD]", err);
//         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
//     }
// }
//
// // // ════════════════════════════════════════════════════════════════════════════
// // // FILE: app/api/builder/ai/route.ts
// // // ════════════════════════════════════════════════════════════════════════════
// //
// // import {NextRequest, NextResponse} from "next/server";
// // import {getServerSession} from "next-auth";
// // import {authOptions} from "@/lib/auth";
// // import {connectDB} from "@/lib/db";
// // import PlanComponentModel from "@/models/PlanComponent";
// //
// // export async function POST(req: NextRequest) {
// //     try {
// //         const session = await getServerSession(authOptions);
// //         if (!session) return NextResponse.json({success: false, error: "Unauthorized"}, {status: 401});
// //
// //         const {prompt, siteType, pageSlug, existingComponentKeys} = await req.json();
// //         if (!prompt || prompt.trim().length < 5)
// //             return NextResponse.json({success: false, error: "Prompt too short"}, {status: 400});
// //
// //         await connectDB();
// //
// //         // Fetch components available to this user's plan
// //         const components = await PlanComponentModel.find({
// //             availableTo: {$in: [session.user.plan ?? "free"]},
// //             isActive: true,
// //             siteTypes: {$in: [siteType ?? "all", "all"]},
// //         }).select("key name category description defaultProps").lean();
// //
// //         if (components.length === 0)
// //             return NextResponse.json({success: false, error: "No components available for your plan"}, {status: 400});
// //
// //         const componentList = components
// //             .map((c) => `- key:"${c.key}" [${c.category}] "${c.name}"${c.description ? ` — ${c.description}` : ""}`)
// //             .join("\n");
// //
// //         const systemPrompt = `You are an expert website builder AI. Select and configure components from the library below to match the user's request.
// //
// // AVAILABLE COMPONENTS:
// // ${componentList}
// //
// // STRICT RULES:
// // 1. Return ONLY valid JSON — no markdown, no backticks, no preamble
// // 2. Select 3-8 components, ordered logically (hero first, CTA/contact last)
// // 3. Only use componentKey values EXACTLY as listed above
// // 4. For propValues: keep text short, professional, and relevant to the site type
// // 5. Site type: ${siteType ?? "general"}, Page: ${pageSlug ?? "/"}
// // ${existingComponentKeys?.length > 0 ? `6. Already on page: ${existingComponentKeys.join(", ")} — add complementary components` : ""}
// //
// // RESPONSE FORMAT (JSON only):
// // {"components":[{"componentKey":"exact_key","propValues":{"headline":"Short text","subtext":"One sentence.","ctaLabel":"Action Verb","ctaHref":"#"}}],"reasoning":"one sentence"}`;
// //
// //         const cfRes = await fetch(
// //             `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
// //             {
// //                 method: "POST",
// //                 headers: {
// //                     "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
// //                     "Content-Type": "application/json"
// //                 },
// //                 body: JSON.stringify({
// //                     messages: [{role: "system", content: systemPrompt}, {role: "user", content: prompt}],
// //                     max_tokens: 2000,
// //                     temperature: 0.2,
// //                 }),
// //             }
// //         );
// //
// //         if (!cfRes.ok) {
// //             console.error("[AI_BUILD] Cloudflare error", cfRes.status);
// //             return NextResponse.json({success: false, error: "AI service unavailable"}, {status: 503});
// //         }
// //
// //         const cfData = await cfRes.json() as { result?: { response?: string } };
// //         const rawText = cfData?.result?.response ?? "";
// //
// //         let parsed: { components: { componentKey: string; propValues: Record<string, unknown> }[] };
// //         try {
// //             const jsonMatch = rawText.match(/\{[\s\S]*\}/);
// //             if (!jsonMatch) throw new Error("No JSON");
// //             parsed = JSON.parse(jsonMatch[0]);
// //         } catch {
// //             return NextResponse.json({
// //                 success: false,
// //                 error: "AI returned malformed response. Please try again."
// //             }, {status: 422});
// //         }
// //
// //         // Validate keys + merge defaultProps
// //         const validKeys = new Map(components.map((c) => [c.key, c]));
// //         const result = (parsed.components ?? [])
// //             .filter((c) => validKeys.has(c.componentKey))
// //             .map((aiComp) => {
// //                 const dbComp = validKeys.get(aiComp.componentKey)!;
// //                 return {
// //                     componentKey: aiComp.componentKey,
// //                     componentId: (dbComp as { _id: unknown })._id,
// //                     propValues: {...(dbComp.defaultProps ?? {}), ...aiComp.propValues},
// //                 };
// //             });
// //
// //         return NextResponse.json({success: true, data: result, count: result.length});
// //     } catch (err) {
// //         console.error("[AI_BUILD]", err);
// //         return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
// //     }
// // }