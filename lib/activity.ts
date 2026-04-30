import {connectDB} from "@/lib/db";
import ActivityLogModel from "@/models/ActivityLog";
import type {IActivityLog} from "@/models/ActivityLog";

type LogActivityParams = {
    userId: string;
    tenantId: string;
    action: string;
    category: IActivityLog["category"];
    metadata?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
};

/**
 * Log an activity. Always fire-and-forget — never await this in a request handler
 * unless you specifically need to wait.
 *
 * Usage:
 *   logActivity({ userId, tenantId, action: "blog.created", category: "blog", metadata: { title } })
 *     .catch(console.error);
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
    try {
        await connectDB();
        await ActivityLogModel.create(params);
    } catch (err) {
        // Never crash the main request due to logging failure
        console.error("[ACTIVITY_LOG]", err);
    }
}

// ── Predefined action constants — import these instead of raw strings ────────
export const ACTIONS = {
    // Auth
    USER_LOGIN: "user.login",
    USER_REGISTER: "user.register",
    USER_LOGOUT: "user.logout",
    PASSWORD_CHANGED: "user.password_changed",

    // Blog
    BLOG_CREATED: "blog.created",
    BLOG_UPDATED: "blog.updated",
    BLOG_DELETED: "blog.deleted",
    BLOG_PUBLISHED: "blog.published",
    BLOG_AI_GENERATED: "blog.ai_generated",

    // Team
    TEAM_MEMBER_INVITED: "team.member_invited",
    TEAM_MEMBER_JOINED: "team.member_joined",
    TEAM_MEMBER_REMOVED: "team.member_removed",
    TEAM_ROLE_CHANGED: "team.role_changed",
    TEAM_MEMBER_LEFT: "team.member_left",

    // SEO
    SEO_ANALYZED: "seo.analyzed",
    KEYWORDS_RESEARCHED: "seo.keywords_researched",
    SCHEMA_GENERATED: "seo.schema_generated",

    // Billing
    PLAN_UPGRADED: "billing.plan_upgraded",
    PLAN_CANCELLED: "billing.plan_cancelled",
} as const;

// ── Helper: parse IP + device from request headers ───────────────────────────
export function parseRequestMeta(req: Request | { headers: { get: (k: string) => string | null } }): {
    ip: string;
    userAgent: string;
    device: string;
} {
    const ip =
        (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";

    const userAgent = req.headers.get("user-agent") ?? "unknown";

    // Simple device detection from UA
    const device = /mobile|android|iphone|ipad/i.test(userAgent)
        ? "mobile"
        : /tablet/i.test(userAgent)
            ? "tablet"
            : "desktop";

    return {ip, userAgent, device};
}