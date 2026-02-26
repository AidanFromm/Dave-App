import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const recentIPs = new Map<string, number>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of recentIPs) {
    if (now - time > 5 * 60 * 1000) recentIPs.delete(ip);
  }
}, 10 * 60 * 1000);

function getDeviceType(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|iphone|android.*mobile/i.test(ua)) return "mobile";
  return "desktop";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static assets, admin pages, Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Rate limit: once per IP per page per 5 minutes
  const rateKey = `${ip}:${pathname}`;
  const lastSeen = recentIPs.get(rateKey);
  if (lastSeen && Date.now() - lastSeen < 5 * 60 * 1000) {
    return NextResponse.next();
  }
  recentIPs.set(rateKey, Date.now());

  const visitorData = {
    ip,
    city: request.headers.get("x-vercel-ip-city") || null,
    country: request.headers.get("x-vercel-ip-country") || null,
    region: request.headers.get("x-vercel-ip-country-region") || null,
    latitude: parseFloat(request.headers.get("x-vercel-ip-latitude") || "") || null,
    longitude: parseFloat(request.headers.get("x-vercel-ip-longitude") || "") || null,
    page_path: pathname,
    user_agent: request.headers.get("user-agent") || null,
    device_type: getDeviceType(request.headers.get("user-agent") || ""),
    referrer: request.headers.get("referer") || null,
  };

  // Fire and forget
  const url = new URL("/api/visitors/log", request.url);
  fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(visitorData),
  }).catch(() => {});

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
