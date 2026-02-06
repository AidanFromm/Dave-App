"use server";

import { isStockXConnected } from "@/lib/stockx";

export async function checkStockXConnection(): Promise<boolean> {
  return isStockXConnected();
}

export async function getStockXAuthUrl(): Promise<string> {
  const clientId = process.env.STOCKX_CLIENT_ID!;

  // Build redirect URI, handling whether SITE_URL has protocol or not
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "securedtampa.com";
  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    // Already has protocol
  } else {
    siteUrl = `https://${siteUrl}`;
  }
  const redirectUri = `${siteUrl}/stockx/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "offline_access openid",
    audience: "urn:gateway.stockx.com",
    state: "web",
  });

  return `https://accounts.stockx.com/authorize?${params.toString()}`;
}
