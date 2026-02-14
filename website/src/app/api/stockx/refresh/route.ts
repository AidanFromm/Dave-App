import { NextResponse } from "next/server";
import { STOCKX_TOKEN_URL } from "@/lib/constants";
import { getStockXTokens, saveStockXTokens } from "@/lib/stockx";

const STOCKX_CLIENT_ID = process.env.STOCKX_CLIENT_ID || "CQN5rKVX2haC1VWcRH1uAAFiWsQuHv7h";
const STOCKX_CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || "aw7KR2ZbGlY43sG84yf11UDYfAVGAgkYhad317ll-fU32lm-O75jmYaimw-oVpO4";

export async function POST() {
  const tokens = await getStockXTokens();
  if (!tokens || !tokens.refresh_token) {
    return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
  }

  try {
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: STOCKX_CLIENT_ID,
        client_secret: STOCKX_CLIENT_SECRET,
        refresh_token: tokens.refresh_token,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("StockX token refresh failed:", res.status, errorText);
      return NextResponse.json(
        { error: "Token refresh failed", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();

    await saveStockXTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("StockX token refresh error:", error);
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 });
  }
}
