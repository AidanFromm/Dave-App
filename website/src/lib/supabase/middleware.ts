import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Detect admin subdomain
  const hostname = request.headers.get("host") ?? "";
  const isAdminSubdomain = hostname.startsWith("admin.");

  // If on admin subdomain, rewrite all paths to /admin/*
  if (isAdminSubdomain) {
    const pathname = request.nextUrl.pathname;

    // Allow admin login page without auth
    if (pathname === "/admin/login") {
      return supabaseResponse;
    }

    // If not on an /admin path, rewrite to /admin
    if (!pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }

    // Protect admin subdomain routes
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    // Check admin role from profiles table or user_metadata
    const isAdmin = user.user_metadata?.role === "admin" ||
      user.user_metadata?.role === "owner" ||
      user.user_metadata?.role === "staff";

    if (!isAdmin) {
      // Fall back to checking profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      const profileRole = profile?.role;
      if (!profileRole || profileRole === "customer") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  }

  // Protect /account routes
  if (!user && request.nextUrl.pathname.startsWith("/account")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Protect /admin routes (non-subdomain access)
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Allow admin login
    if (request.nextUrl.pathname === "/admin/login") {
      return supabaseResponse;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      return NextResponse.redirect(url);
    }

    // Check admin role from user metadata
    const isAdmin = user.user_metadata?.role === "admin" ||
      user.user_metadata?.role === "owner" ||
      user.user_metadata?.role === "staff";

    if (!isAdmin) {
      // Fall back to checking profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      const profileRole = profile?.role;
      if (!profileRole || profileRole === "customer") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
