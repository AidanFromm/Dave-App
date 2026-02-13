// Simple in-memory rate limiter for API routes
const rateMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (val.resetAt < now) rateMap.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 10, windowSeconds: 60 }
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateMap.set(identifier, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { success: true, remaining: config.limit - 1 };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: config.limit - entry.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
