type WindowUnit = "s" | "m" | "h" | "d";
type WindowString = `${number} ${WindowUnit}`;

function parseWindow(window: WindowString): number {
  const [amount, unit] = window.split(" ") as [string, WindowUnit];
  const multipliers: Record<WindowUnit, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return parseInt(amount, 10) * multipliers[unit];
}

interface WindowEntry {
  timestamps: number[];
}

/**
 * In-memory sliding window rate limiter.
 * Mimics the Upstash Ratelimit API surface so all call sites stay unchanged.
 *
 * Note: state is per-process. For multi-instance deployments, swap the
 * `store` Map for a shared store (Redis, Postgres, etc.) while keeping
 * this same interface.
 */
class CustomRatelimit {
  private requests: number;
  private windowMs: number;
  private store = new Map<string, WindowEntry>();

  constructor(requests: number, window: WindowString) {
    this.requests = requests;
    this.windowMs = parseWindow(window);
  }

  async limit(
      identifier: string
  ): Promise<{ success: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = this.store.get(identifier);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(identifier, entry);
    }

    // Evict timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

    const count = entry.timestamps.length;

    if (count >= this.requests) {
      // Oldest timestamp tells us when the window opens up
      const oldestInWindow = entry.timestamps[0];
      const reset = oldestInWindow + this.windowMs;
      return {
        success: false,
        remaining: 0,
        reset,
      };
    }

    entry.timestamps.push(now);
    return {
      success: true,
      remaining: this.requests - entry.timestamps.length,
      reset: now + this.windowMs,
    };
  }
}

// ─── Factory (matches the original createRatelimit signature) ──────────────

function createRatelimit(requests: number, window: WindowString): CustomRatelimit {
  return new CustomRatelimit(requests, window);
}

// ─── Limiters (same exports, same semantics) ───────────────────────────────

export const aiRatelimit = createRatelimit(20, "1 h");    // 20 AI calls / hour
export const authRatelimit = createRatelimit(10, "15 m"); // 10 auth attempts / 15 min
export const apiRatelimit = createRatelimit(100, "1 m");  // 100 API calls / min
export const uploadRatelimit = createRatelimit(30, "1 h"); // 30 uploads / hour

// ─── checkRateLimit (identical signature & return shape) ──────────────────

export async function checkRateLimit(
    limiter: CustomRatelimit | null,
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

//new redist rae limit
// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
//
// // Only initialise if env vars are present — falls through silently in dev without Redis
// let redis: Redis | null = null;
// let _aiRatelimit: Ratelimit | null = null;
//
// if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
//   redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN,
//   });
//
//   _aiRatelimit = new Ratelimit({
//     redis,
//     // 10 AI requests per minute per user
//     limiter: Ratelimit.slidingWindow(10, "60 s"),
//     analytics: true,
//     prefix: "rl:ai",
//   });
// }
//
// export const aiRatelimit = _aiRatelimit;
//
// /**
//  * Check rate limit for a given identifier.
//  * Returns { success: true } when Redis is not configured (dev mode).
//  */
// export async function checkRateLimit(
//     limiter: Ratelimit | null,
//     identifier: string
// ): Promise<{ success: boolean; remaining?: number; reset?: number }> {
//   if (!limiter) return { success: true };
//   try {
//     const result = await limiter.limit(identifier);
//     return { success: result.success, remaining: result.remaining, reset: result.reset };
//   } catch {
//     // If Redis fails, allow the request rather than blocking the user
//     return { success: true };
//   }
// }

// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";
//
// // Only instantiate if env vars are present (graceful fallback for local dev)
// function createRatelimit(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`) {
//   if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
//     return null;
//   }
//   return new Ratelimit({
//     redis: new Redis({
//       url: process.env.UPSTASH_REDIS_REST_URL,
//       token: process.env.UPSTASH_REDIS_REST_TOKEN,
//     }),
//     limiter: Ratelimit.slidingWindow(requests, window),
//     analytics: true,
//   });
// }
//
// // Different limiters for different endpoints
// export const aiRatelimit = createRatelimit(20, "1 h");       // 20 AI calls / hour
// export const authRatelimit = createRatelimit(10, "15 m");    // 10 auth attempts / 15 min
// export const apiRatelimit = createRatelimit(100, "1 m");     // 100 API calls / min
// export const uploadRatelimit = createRatelimit(30, "1 h");   // 30 uploads / hour
//
// export async function checkRateLimit(
//   limiter: Ratelimit | null,
//   identifier: string
// ): Promise<{ success: boolean; remaining: number; reset: number }> {
//   if (!limiter) return { success: true, remaining: 999, reset: 0 };
//   const result = await limiter.limit(identifier);
//   return {
//     success: result.success,
//     remaining: result.remaining,
//     reset: result.reset,
//   };
// }
