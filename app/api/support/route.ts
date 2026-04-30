import {NextRequest, NextResponse} from "next/server";
import {getServerSession} from "next-auth";
import {authOptions} from "@/lib/auth";
import {connectDB} from "@/lib/db";
import SupportTicketModel from "@/models/SupportTicket";
import OpenAI from "openai";

const isDev = process.env.NODE_ENV !== "production";

const client = new OpenAI(
    isDev
        ? {apiKey: process.env.GROQ_API_KEY!, baseURL: "https://api.groq.com/openai/v1"}
        : {apiKey: process.env.OPENAI_API_KEY!}
);
const MODEL = isDev ? "llama-3.3-70b-versatile" : "gpt-4o-mini";

// ── Product knowledge base ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a helpful support assistant for SEO Platform — an AI-powered SaaS platform for SEO content creation.

PRODUCT KNOWLEDGE:
- AI Blog Generator: generates full SEO-optimized blog posts from a topic + keywords. Uses GPT-4o-mini. Costs 1 AI credit per post.
- Keyword Research: finds keywords with search volume, difficulty, CPC, and trend data. Requires Silver plan or above.
- SEO Analytics: tracks views, SEO scores, published posts, AI credits. 
- Rank Tracking: monitors keyword positions in Google/Bing.
- Content Calendar: schedule and plan content.
- Backlink Monitor: tracks inbound links.
- Schema Generator: generates JSON-LD structured data.
- AEO Optimizer: optimizes for AI answer engines (Perplexity, ChatGPT, etc).
- Content Repurposer: converts blog posts to Twitter threads, LinkedIn posts, newsletters, etc.
- Bulk Generate: generate up to 10 blog posts at once. Diamond plan only.
- Team Collaboration: invite team members with Member/Editor/Admin roles. Allocate AI credits per member.
- Custom Domain: connect your own domain. Silver plan and above.
- White Label: remove SEO Platform branding. Diamond plan only.

PLANS:
- Free: 10 AI credits/month, 3 blogs, basic SEO tools
- Silver ($29/mo): 100 credits, 25 blogs, keyword research, 3 team members, custom domain
- Gold ($79/mo): 500 credits, 100 blogs, all features, 10 team members
- Diamond ($199/mo): 2000 credits, unlimited blogs, bulk generate, white label, unlimited team

PAYMENT: Stripe (credit card) and Coinbase Commerce (crypto: Bitcoin, Ethereum, USDC).

TECH STACK: Next.js 14, MongoDB, AI via Groq (dev) / OpenAI (production).

IMPORTANT RULES:
1. Answer questions about the product helpfully and accurately.
2. If you don't know the answer or the question is about account-specific issues, billing disputes, bugs, or technical problems, say: "I'll need to escalate this to our team. Let me create a support ticket for you."
3. Keep answers concise (2-4 sentences max).
4. Never make up features that don't exist.
5. If asked about pricing, give accurate plan info.
6. Do NOT answer questions unrelated to the product.`;

// ── POST /api/support — send a message ───────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json() as {
            message: string;
            sessionId: string;
            visitorEmail?: string;
        };

        const {message, sessionId, visitorEmail} = body;
        if (!message?.trim() || !sessionId) {
            return NextResponse.json({success: false, error: "message and sessionId required"}, {status: 400});
        }

        await connectDB();

        // Get or create ticket
        let ticket = await SupportTicketModel.findOne({sessionId});
        if (!ticket) {
            ticket = await SupportTicketModel.create({
                sessionId,
                userId: session?.user?.id ?? undefined,
                visitorEmail,
                messages: [],
                status: "open",
                subject: message.slice(0, 80),
            });
        }

        // Add user message
        ticket.messages.push({role: "user", content: message, createdAt: new Date()});

        // Build conversation history for AI (last 10 messages)
        const history = ticket.messages.slice(-10).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
        }));

        // Call AI
        let aiResponse = "";
        let shouldEscalate = false;

        try {
            const response = await client.chat.completions.create({
                model: MODEL,
                messages: [
                    {role: "system", content: SYSTEM_PROMPT},
                    ...history,
                ],
                temperature: 0.4,
                max_tokens: 300,
            });
            aiResponse = response.choices[0].message.content ?? "I'm sorry, I couldn't process that. Please try again.";

            // Check if AI wants to escalate
            shouldEscalate = aiResponse.toLowerCase().includes("escalate") ||
                aiResponse.toLowerCase().includes("support ticket") ||
                aiResponse.toLowerCase().includes("our team");
        } catch {
            aiResponse = "I'm having trouble connecting right now. I'll create a support ticket so our team can help you directly.";
            shouldEscalate = true;
        }

        // Add AI response
        ticket.messages.push({role: "assistant", content: aiResponse, createdAt: new Date()});

        // Update status
        if (shouldEscalate) {
            ticket.status = "pending_admin";
            if (visitorEmail && !ticket.visitorEmail) ticket.visitorEmail = visitorEmail;
        }

        await ticket.save();

        return NextResponse.json({
            success: true,
            data: {
                message: aiResponse,
                ticketId: ticket._id.toString(),
                escalated: shouldEscalate,
            },
        });
    } catch (error) {
        console.error("[SUPPORT_CHAT]", error);
        return NextResponse.json({success: false, error: "Failed to process message"}, {status: 500});
    }
}

// ── GET /api/support?sessionId=xxx — get conversation history ─────────────────
export async function GET(req: NextRequest) {
    try {
        const {searchParams} = new URL(req.url);
        const sessionId = searchParams.get("sessionId");
        if (!sessionId) return NextResponse.json({success: false, error: "sessionId required"}, {status: 400});

        await connectDB();
        const ticket = await SupportTicketModel.findOne({sessionId}).lean();

        return NextResponse.json({
            success: true,
            data: ticket ? {messages: ticket.messages, status: ticket.status} : {messages: [], status: "open"},
        });
    } catch {
        return NextResponse.json({success: false, error: "Internal server error"}, {status: 500});
    }
}