// ═══════════════════════════════════════════════════════════════════════════
// FILE: app/api/builder/ai-generate-component/route.ts
//
// AI-powered custom component generator using Claude Haiku.
// Generates raw HTML/CSS from a text prompt and saves it to the user's
// personal component library so they can reuse it in the site builder.
//
// TO ENABLE: Set ANTHROPIC_API_KEY in your .env and uncomment the handler.
// ═══════════════════════════════════════════════════════════════════════════

// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import UserComponentModel from "@/models/UserComponent"; // create this model
// import { v4 as uuid } from "uuid";
//
// const SYSTEM_PROMPT = `You are an expert HTML/CSS/Tailwind developer.
// Generate a single self-contained HTML section component based on the user's description.
//
// RULES:
// 1. Return ONLY a JSON object — no explanation, no markdown fences
// 2. Use Tailwind CSS classes for all styling (CDN will be available)
// 3. Make it fully responsive (mobile-first)
// 4. No external images — use placeholder divs with bg-gradient or emoji
// 5. No JavaScript unless absolutely needed
// 6. Component must look professional and polished
// 7. Use CSS variables: var(--color-primary), var(--color-text), var(--color-bg)
//
// OUTPUT FORMAT:
// {
//   "name": "Short descriptive name",
//   "category": "hero|section|footer|widget|layout",
//   "html": "<the complete HTML>",
//   "css": "/* any extra CSS beyond Tailwind */",
//   "description": "One sentence describing what this does"
// }`;
//
// export async function POST(req: NextRequest) {
//     try {
//         const session = await getServerSession(authOptions);
//         if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
//
//         // Require at least silver plan for custom AI components
//         if (!["silver", "gold", "diamond"].includes(session.user.plan ?? "free")) {
//             return NextResponse.json({
//                 success: false,
//                 error: "Custom AI components require a Silver plan or higher.",
//             }, { status: 403 });
//         }
//
//         const { prompt, saveToLibrary = true } = await req.json();
//
//         if (!prompt || prompt.trim().length < 10) {
//             return NextResponse.json({ success: false, error: "Prompt too short" }, { status: 400 });
//         }
//
//         // Call Claude Haiku via Anthropic API
//         const response = await fetch("https://api.anthropic.com/v1/messages", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "x-api-key": process.env.ANTHROPIC_API_KEY!,
//                 "anthropic-version": "2023-06-01",
//             },
//             body: JSON.stringify({
//                 model: "claude-haiku-4-5",
//                 max_tokens: 4096,
//                 system: SYSTEM_PROMPT,
//                 messages: [
//                     {
//                         role: "user",
//                         content: `Create a ${prompt}. Return JSON only.`,
//                     },
//                 ],
//             }),
//         });
//
//         if (!response.ok) {
//             const err = await response.text();
//             console.error("[AI_COMPONENT] Anthropic error:", err);
//             return NextResponse.json({ success: false, error: "AI service unavailable" }, { status: 503 });
//         }
//
//         const data = await response.json();
//         const rawText = data.content?.[0]?.text ?? "";
//
//         // Parse JSON response
//         let parsed: { name: string; category: string; html: string; css?: string; description?: string };
//         try {
//             // Strip any accidental markdown fences
//             const clean = rawText.replace(/```json|```/g, "").trim();
//             parsed = JSON.parse(clean);
//         } catch {
//             console.error("[AI_COMPONENT] Bad JSON:", rawText.slice(0, 200));
//             return NextResponse.json({ success: false, error: "AI returned invalid format. Try again." }, { status: 422 });
//         }
//
//         if (!parsed.html || !parsed.name) {
//             return NextResponse.json({ success: false, error: "AI did not return valid component" }, { status: 422 });
//         }
//
//         // Basic security: strip script tags from generated HTML
//         const safeHtml = parsed.html
//             .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
//             .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
//             .replace(/javascript\s*:/gi, "");
//
//         const component = {
//             instanceId: uuid(),
//             componentKey: `user-ai-${uuid().slice(0, 8)}`,
//             name: parsed.name,
//             category: parsed.category ?? "section",
//             htmlTemplate: safeHtml,
//             cssCode: parsed.css ?? "",
//             description: parsed.description ?? "",
//             isAIGenerated: true,
//             generatedFrom: prompt,
//             propsSchema: [], // AI components have no editable props by default
//             defaultProps: {},
//         };
//
//         // Optionally save to user's personal library
//         if (saveToLibrary) {
//             await connectDB();
//             // await UserComponentModel.create({ userId: session.user.id, ...component });
//             // ^ Uncomment when UserComponent model is created
//         }
//
//         return NextResponse.json({ success: true, data: component });
//
//     } catch (err) {
//         console.error("[AI_COMPONENT]", err);
//         return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
//     }
// }

// Placeholder export so Next.js doesn't complain about empty route file
export async function POST() {
    return Response.json({
        success: false,
        error: "AI component generation is not enabled yet. Set ANTHROPIC_API_KEY and uncomment the handler.",
    }, {status: 503});
}