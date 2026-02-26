import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fire and forget — don't await, don't block the response
    Promise.resolve(
      supabase.from("visitors").insert({
        ip,
        city: request.headers.get("x-vercel-ip-city") || null,
        country: request.headers.get("x-vercel-ip-country") || null,
        region: request.headers.get("x-vercel-ip-country-region") || null,
        latitude:
          parseFloat(request.headers.get("x-vercel-ip-latitude") || "") || null,
        longitude:
          parseFloat(request.headers.get("x-vercel-ip-longitude") || "") || null,
        page_path: pathname,
        user_agent: request.headers.get("user-agent") || null,
        device_type: getDeviceType(request.headers.get("user-agent") || ""),
        referrer: request.headers.get("referer") || null,
      })
    ).catch(() => {});
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|admin).*)"],
};
