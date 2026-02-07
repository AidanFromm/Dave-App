import { NextResponse } from "next/server";
import { STOCKX_TOKEN_URL } from "@/lib/constants";
import { saveStockXTokens } from "@/lib/stockx";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle errors from StockX
  if (error) {
    console.error("StockX OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/admin/stockx?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/stockx?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    // Exchange code for tokens
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.STOCKX_CLIENT_ID,
        client_secret: process.env.STOCKX_CLIENT_SECRET,
        code,
        redirect_uri: "https://securedtampa.com/stockx/callback",
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("StockX token exchange failed:", res.status, errorText);
      return NextResponse.redirect(
        `${origin}/admin/stockx?error=${encodeURIComponent("Token exchange failed")}`
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

    // Redirect back to admin with success
    return NextResponse.redirect(`${origin}/admin/stockx?connected=true`);
  } catch (err) {
    console.error("StockX callback error:", err);
    return NextResponse.redirect(
      `${origin}/admin/stockx?error=${encodeURIComponent("Connection failed")}`
    );
  }
}
