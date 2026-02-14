import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STOCKX_TOKEN_URL, STOCKX_REDIRECT_URI } from "@/lib/constants";
import { saveStockXTokens } from "@/lib/stockx";

const STOCKX_CLIENT_ID = process.env.STOCKX_CLIENT_ID || "CQN5rKVX2haC1VWcRH1uAAFiWsQuHv7h";
const STOCKX_CLIENT_SECRET = process.env.STOCKX_CLIENT_SECRET || "aw7KR2ZbGlY43sG84yf11UDYfAVGAgkYhad317ll-fU32lm-O75jmYaimw-oVpO4";

export async function POST(request: Request) {
  const body = await request.json();
  const { code, state } = body;

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("stockx_oauth_state")?.value;
  if (!savedState || savedState !== state) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 403 });
  }

  // Clear the state cookie
  cookieStore.delete("stockx_oauth_state");

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
      return NextResponse.json(
        { error: "Token exchange failed", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();

    await saveStockXTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      scope: data.scope,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("StockX token exchange error:", error);
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
