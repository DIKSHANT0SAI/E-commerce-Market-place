import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting is OPTIONAL: if Upstash isn't configured (e.g. local dev without
// keys), every check is skipped so nothing breaks.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let defaultLimiter = null; // general API traffic
let searchLimiter = null;  // /api/product/search (cheap to abuse, hits the DB)
let aiLimiter = null;      // /api/product/generate-description (costs money per call)

if (hasUpstash) {
  const redis = Redis.fromEnv();
  // slidingWindow(maxRequests, window) — per client IP.
  defaultLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, "10 s"), prefix: "rl:api" });
  searchLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, "10 s"), prefix: "rl:search" });
  aiLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "rl:ai" });
}

function getClientIp(req) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}

// Returns a 429 Response if the caller is over the limit, otherwise null (allow).
// Only applies to /api routes; webhooks (/api/inngest) are exempt.
export async function getRateLimitResponse(req) {
  if (!hasUpstash) return null;

  const path = req.nextUrl.pathname;
  if (!path.startsWith("/api/")) return null;
  if (path.startsWith("/api/inngest")) return null; // trusted webhook (own signature check)
  // Razorpay verifies itself with an HMAC signature, and it RETRIES failed deliveries —
  // throttling those retries could permanently lose a paid order. Never rate-limit it.
  if (path.startsWith("/api/payment/webhook")) return null;

  let limiter = defaultLimiter;
  if (path.startsWith("/api/product/search")) limiter = searchLimiter;
  else if (path.startsWith("/api/product/generate-description")) limiter = aiLimiter;

  try {
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    if (success) return null;

    return new Response(
      JSON.stringify({ success: false, message: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (e) {
    // If Redis is unreachable, FAIL OPEN (allow the request) so a Redis blip
    // never takes the whole site down.
    console.error("rate limit check failed:", e.message);
    return null;
  }
}
