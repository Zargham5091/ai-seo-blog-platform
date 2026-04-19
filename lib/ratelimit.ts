import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only instantiate if env vars are present (graceful fallback for local dev)
function createRatelimit(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
  });
}

// Different limiters for different endpoints
export const aiRatelimit = createRatelimit(20, "1 h");       // 20 AI calls / hour
export const authRatelimit = createRatelimit(10, "15 m");    // 10 auth attempts / 15 min
export const apiRatelimit = createRatelimit(100, "1 m");     // 100 API calls / min
export const uploadRatelimit = createRatelimit(30, "1 h");   // 30 uploads / hour

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!limiter) return { success: true, remaining: 999, reset: 0 };
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
