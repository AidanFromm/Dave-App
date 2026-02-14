import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STOCKX_AUTH_URL, STOCKX_REDIRECT_URI, STOCKX_AUDIENCE } from "@/lib/constants";

const STOCKX_CLIENT_ID = process.env.STOCKX_CLIENT_ID || "CQN5rKVX2haC1VWcRH1uAAFiWsQuHv7h";

export async function GET() {
  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set("stockx_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: STOCKX_CLIENT_ID,
    redirect_uri: STOCKX_REDIRECT_URI,
    audience: STOCKX_AUDIENCE,
    scope: "offline_access openid",
    state,
  });

  return NextResponse.redirect(`${STOCKX_AUTH_URL}?${params}`);
}
