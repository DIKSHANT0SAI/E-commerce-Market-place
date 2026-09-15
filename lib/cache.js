import { Redis } from "@upstash/redis";

// Caching is OPTIONAL: with no Upstash configured, `cached()` just runs the
// compute function directly (no caching) so nothing breaks in local dev.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasUpstash ? Redis.fromEnv() : null;

/**
 * Get-or-compute with a TTL.
 * @param {string} key            cache key
 * @param {number} ttlSeconds     how long to keep the value
 * @param {() => Promise<any>} compute  produces the value on a cache miss
 */
export async function cached(key, ttlSeconds, compute) {
  if (!redis) return compute();

  // Try the cache first; on any Redis error, fall back to computing.
  try {
    const hit = await redis.get(key); // @upstash/redis auto-serializes JSON
    if (hit !== null && hit !== undefined) return hit;
  } catch (e) {
    console.error("cache read failed:", e.message);
    return compute();
  }

  const value = await compute();
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (e) {
    console.error("cache write failed:", e.message);
  }
  return value;
}
