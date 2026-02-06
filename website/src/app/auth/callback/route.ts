import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from Supabase
  if (error) {
    const errorMsg = errorDescription || error;
    return NextResponse.redirect(
      `${origin}/auth/sign-in?error=${encodeURIComponent(errorMsg)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/sign-in?error=auth_failed`);
}
