import { NextResponse } from "next/server";
import { STOCKX_TOKEN_URL, STOCKX_REDIRECT_URI } from "@/lib/constants";
import { saveStockXTokens } from "@/lib/stockx";

export async function POST(request: Request) {
  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  try {
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: process.env.STOCKX_CLIENT_ID,
        client_secret: process.env.STOCKX_CLIENT_SECRET,
        code,
        redirect_uri: STOCKX_REDIRECT_URI,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: "Token exchange failed", detail: error },
        { status: res.status }
      );
    }

    const tokens = await res.json();

    await saveStockXTokens(tokens);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 500 }
    );
  }
}
