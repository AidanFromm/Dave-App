import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STOCKX_TOKEN_URL, STOCKX_REDIRECT_URI } from "@/lib/constants";
import { saveStockXTokens } from "@/lib/stockx";

const STOCKX_CLIENT_ID = process.env.STOCKX_CLIENT_ID || "CQN5rKVX2haC1VWcRH1uAAFiWsQuHv7h";
const STOCKX_CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || "aw7KR2ZbGlY43sG84yf11UDYfAVGAgkYhad317ll-fU32lm-O75jmYaimw-oVpO4";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // iOS deep link support
  const isIOS = searchParams.get("platform") === "ios";

  // Handle errors from StockX
  if (error) {
    console.error("StockX OAuth error:", error, errorDescription);
    if (isIOS) {
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

  // Verify CSRF state from cookie
  if (state) {
    const cookieStore = await cookies();
    const savedState = cookieStore.get("stockx_oauth_state")?.value;
    if (savedState && savedState !== state) {
      return NextResponse.redirect(
        `${origin}/admin/settings?stockx=error&error=${encodeURIComponent("Invalid state - possible CSRF attack")}`
      );
    }
    // Clear the state cookie
    cookieStore.delete("stockx_oauth_state");
  }

  // Exchange code for tokens
  try {
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: STOCKX_CLIENT_ID,
        client_secret: STOCKX_CLIENT_SECRET,
        code,
        redirect_uri: STOCKX_REDIRECT_URI,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("StockX token exchange failed:", res.status, errorText);
      let errorMsg = "Token exchange failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error_description || errorJson.error || errorMsg;
      } catch {
        errorMsg = errorText.substring(0, 100) || errorMsg;
      }
      return NextResponse.redirect(
        `${origin}/admin/settings?stockx=error&error=${encodeURIComponent(errorMsg)}`
      );
    }

    const tokens = await res.json();

    if (!tokens.access_token) {
      console.error("No access_token in response:", tokens);
      return NextResponse.redirect(
        `${origin}/admin/settings?stockx=error&error=${encodeURIComponent("No access token received")}`
      );
    }

    await saveStockXTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in || 43200,
      scope: tokens.scope,
    });

    return NextResponse.redirect(`${origin}/admin/settings?stockx=connected`);
  } catch (err) {
    console.error("StockX callback error:", err);
    const errMsg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      `${origin}/admin/settings?stockx=error&error=${encodeURIComponent(errMsg)}`
    );
  }
}
