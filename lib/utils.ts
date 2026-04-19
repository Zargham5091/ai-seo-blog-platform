import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + "…";
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getSEOScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
}

export function getSEOScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

export function parseOpenAIError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function getPlanLimits(plan: string) {
  const limits = {
    free: { aiCredits: 10, maxBlogs: 3, maxTeamMembers: 1 },
    silver: { aiCredits: 100, maxBlogs: 25, maxTeamMembers: 3 },
    gold: { aiCredits: 500, maxBlogs: 100, maxTeamMembers: 10 },
    diamond: { aiCredits: 2000, maxBlogs: Infinity, maxTeamMembers: Infinity },
  };
  return limits[plan as keyof typeof limits] ?? limits.free;
}

export function isFeatureAllowed(plan: string, feature: string): boolean {
  const planFeatures: Record<string, string[]> = {
    free: ["basic_seo", "blog_creation", "demo_access"],
    silver: ["basic_seo", "blog_creation", "keyword_research", "analytics", "demo_access"],
    gold: ["basic_seo", "advanced_seo", "blog_creation", "keyword_research", "analytics", "competitor_analysis", "schema_generator", "api_access", "demo_access"],
    diamond: ["basic_seo", "advanced_seo", "blog_creation", "keyword_research", "analytics", "competitor_analysis", "schema_generator", "api_access", "white_label", "bulk_generation", "priority_support", "custom_domain", "demo_access"],
  };
  return planFeatures[plan]?.includes(feature) ?? false;
}
