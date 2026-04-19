// ─── User & Auth Types ────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "product_admin" | "user";

export type SubscriptionPlan = "free" | "silver" | "gold" | "diamond";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "past_due" | "trialing";

export interface IUser {
    _id: string;
    name: string;
    email: string;
    image?: string;
    role: UserRole;
    plan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    subscriptionId?: string;
    stripeCustomerId?: string;
    coinbaseCustomerId?: string;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    isActive: boolean;
    emailVerified?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Plan Types ───────────────────────────────────────────────────────────────

export interface IPlanFeatures {
    aiCreditsPerMonth: number;
    maxBlogs: number;
    maxTeamMembers: number;
    advancedSEO: boolean;
    analytics: boolean;
    customDomain: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    keywordResearch: boolean;
    competitorAnalysis: boolean;
    schemaGenerator: boolean;
    bulkContentGeneration: boolean;
    exportFeatures: boolean;
}

export interface IPlan {
    _id: string;
    name: string;
    slug: SubscriptionPlan;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
    features: IPlanFeatures;
    isActive: boolean;
    isPopular: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Blog Types ───────────────────────────────────────────────────────────────

export type BlogStatus = "draft" | "published" | "scheduled" | "archived";

export interface IBlogBlock {
    id: string;
    type: "heading" | "paragraph" | "image" | "video" | "table" | "quote" | "list" | "button" | "code" | "faq" | "chart" | "embed" | "divider" | "ordered_list";
    content: {
        text?: string;
        url?: string;
        caption?: string;
        author?: string;
        items?: string[];
        headers?: string[];
        rows?: string[][];
        code?: string;
        lang?: string;
        style?: "unordered" | "ordered";
    };
    order: number;
}

export interface IBlogSEO {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    structuredData?: Record<string, unknown>;
    seoScore: number;
    readabilityScore: number;
}

export interface IBlog {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    blocks: IBlogBlock[];
    coverImage?: string;
    author: string | IUser;
    authorId: string;
    status: BlogStatus;
    seo: IBlogSEO;
    tags: string[];
    categories: string[];
    scheduledAt?: Date;
    publishedAt?: Date;
    viewCount: number;
    readTime: number;
    isAIGenerated: boolean;
    version: number;
    versions: IBlogVersion[];
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBlogVersion {
    version: number;
    content: string;
    blocks: IBlogBlock[];
    savedAt: Date;
    savedBy: string;
}

// ─── SEO Types ────────────────────────────────────────────────────────────────

export interface IKeyword {
    _id: string;
    keyword: string;
    searchVolume: number;
    difficulty: number;
    cpc: number;
    trend: "up" | "down" | "stable";
    relatedKeywords: string[];
    userId: string;
    createdAt: Date;
}

export interface ISEOAnalysis {
    url: string;
    score: number;
    issues: ISEOIssue[];
    suggestions: string[];
    metaTitle: { value: string; status: "good" | "warning" | "error"; message: string };
    metaDescription: { value: string; status: "good" | "warning" | "error"; message: string };
    headings: { h1: number; h2: number; h3: number; status: "good" | "warning" | "error" };
    images: { total: number; withAlt: number; withoutAlt: number; status: "good" | "warning" | "error" };
    links: { internal: number; external: number; broken: number };
    wordCount: number;
    readabilityScore: number;
    keywordDensity: Record<string, number>;
    pageSpeed?: number;
}

export interface ISEOIssue {
    type: "error" | "warning" | "info";
    category: string;
    message: string;
    fix: string;
}

// ─── Analytics Types ──────────────────────────────────────────────────────────

export interface IAnalyticsData {
    period: string;
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: { url: string; views: number }[];
    topKeywords: { keyword: string; clicks: number; impressions: number; position: number }[];
    deviceBreakdown: { desktop: number; mobile: number; tablet: number };
    countryBreakdown: { country: string; visitors: number }[];
}

export interface IRevenueData {
    month: string;
    revenue: number;
    subscriptions: number;
    churn: number;
    mrr: number;
    arr: number;
}

// ─── CMS Types ────────────────────────────────────────────────────────────────

export type CMSPageSlug =
    "home"
    | "about"
    | "contact"
    | "privacy"
    | "terms"
    | "features"
    | "pricing"
    | "faq"
    | "documentation";

export interface ICMSPage {
    _id: string;
    slug: CMSPageSlug;
    title: string;
    content: string;
    blocks: IBlogBlock[];
    seo: Partial<IBlogSEO>;
    isPublished: boolean;
    lastEditedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Team Types ───────────────────────────────────────────────────────────────

export type TeamMemberRole = "owner" | "editor" | "viewer";

export interface ITeamMember {
    _id: string;
    userId: string;
    tenantId: string;
    role: TeamMemberRole;
    user: IUser;
    invitedAt: Date;
    joinedAt?: Date;
    status: "pending" | "active" | "inactive";
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface INotification {
    _id: string;
    userId: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    isRead: boolean;
    link?: string;
    createdAt: Date;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
    email: string;
    password: string;
}

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface BlogFormData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    tags: string[];
    categories: string[];
    status: BlogStatus;
    seo: Partial<IBlogSEO>;
    coverImage?: string;
    scheduledAt?: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
    totalBlogs: number;
    publishedBlogs: number;
    draftBlogs: number;
    totalViews: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    avgSEOScore: number;
    teamMembers: number;
}

export interface SuperAdminStats {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
    mrr: number;
    arr: number;
    churnRate: number;
    newUsersThisMonth: number;
    activeUsersThisMonth: number;
    planDistribution: Record<SubscriptionPlan, number>;
    recentSignups: IUser[];
}
