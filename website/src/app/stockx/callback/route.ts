import { NextResponse } from "next/server";
import { STOCKX_TOKEN_URL } from "@/lib/constants";
import { saveStockXTokens } from "@/lib/stockx";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const userAgent = request.headers.get("user-agent") || "";

  // Only redirect to iOS app if explicitly requested via platform=ios
  // (iOS app should add this param, web browsers won't)
  const isIOS = searchParams.get("platform") === "ios";

  // Handle errors from StockX
  if (error) {
    console.error("StockX OAuth error:", error, errorDescription);
    if (isIOS) {
      // Redirect to iOS app with error
      return NextResponse.redirect(
        `securedapp://stockx/callback?error=${encodeURIComponent(errorDescription || error)}`
      );
    }
    return NextResponse.redirect(
      `${origin}/admin/settings?stockx=error&error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    if (isIOS) {
      return NextResponse.redirect(`securedapp://stockx/callback?error=no_code`);
    }
    return NextResponse.redirect(
      `${origin}/admin/settings?stockx=error&error=${encodeURIComponent("No authorization code received")}`
    );
  }

  // For iOS: redirect to app with code (app handles token exchange)
  if (isIOS) {
    const iosParams = new URLSearchParams({ code });
    if (state) iosParams.set("state", state);
    return NextResponse.redirect(`securedapp://stockx/callback?${iosParams}`);
  }

  // For web: exchange code for tokens
  try {
    // Hardcoded credentials (same as iOS app)
    const clientId = "6iancV9MkHjtn9dlE8VoflhwK0H3jCFc";
    const clientSecret = "oTNzarbhweQGzF2aQJn_TPWFbT5y5wvRHuQFxjH-hJ5oweeFocZJ:";
    
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: "https://securedtampa.com/stockx/callback",
      }).toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("StockX token exchange failed:", res.status, errorText);
      return NextResponse.redirect(
        `${origin}/admin/settings?stockx=error&error=${encodeURIComponent("Token exchange failed")}`
      );
    }

    const tokens = await res.json();
    
    // Save tokens to Supabase
    await saveStockXTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      scope: tokens.scope,
    });

    // Redirect back to settings with success
    return NextResponse.redirect(`${origin}/admin/settings?stockx=connected`);
  } catch (err) {
    console.error("StockX callback error:", err);
    return NextResponse.redirect(
      `${origin}/admin/settings?stockx=error&error=${encodeURIComponent("Connection failed")}`
    );
  }
}
