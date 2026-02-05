"use server";

import { isStockXConnected } from "@/lib/stockx";

export async function checkStockXConnection(): Promise<boolean> {
  return isStockXConnected();
}

export async function getStockXAuthUrl(): Promise<string> {
  const clientId = process.env.STOCKX_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_SITE_URL
    ? `https://${process.env.NEXT_PUBLIC_SITE_URL}/stockx/callback`
    : "https://securedtampa.com/stockx/callback";

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "offline_access openid",
    audience: "gateway.stockx.com",
    state: "web",
  });

  return `https://accounts.stockx.com/authorize?${params.toString()}`;
}
