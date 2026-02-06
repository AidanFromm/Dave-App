import { createClient } from "@supabase/supabase-js";
import { STOCKX_TOKEN_URL } from "./constants";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface StockXTokenRow {
  id: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string | null;
}

export async function getStockXTokens(): Promise<StockXTokenRow | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("stockx_tokens")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data;
}

export async function saveStockXTokens(tokens: {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in: number;
  scope?: string;
}): Promise<void> {
  const supabase = getServiceClient();
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  await supabase
    .from("stockx_tokens")
    .delete()
    .gt("created_at", "1900-01-01T00:00:00Z");

  await supabase.from("stockx_tokens").insert({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? "",
    token_type: tokens.token_type ?? "Bearer",
    expires_at: expiresAt,
    scope: tokens.scope ?? null,
  });
}

async function fetchClientCredentialsToken(): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
} | null> {
  try {
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: (process.env.STOCKX_CLIENT_ID || "").trim(),
        client_secret: (process.env.STOCKX_CLIENT_SECRET || "").trim(),
        audience: "gateway.stockx.com",
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getStockXHeaders(): Promise<Record<string, string> | null> {
  let tokens = await getStockXTokens();

  // Auto-fetch if no tokens exist
  if (!tokens) {
    const newTokens = await fetchClientCredentialsToken();
    if (!newTokens) return null;
    await saveStockXTokens({
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
    });
    tokens = await getStockXTokens();
    if (!tokens) return null;
  }

  // Check expiry - fetch new token if within 5 min of expiring
  const now = new Date();
  const expiresAt = new Date(tokens.expires_at);
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const newTokens = await fetchClientCredentialsToken();
    if (!newTokens) return null;
    await saveStockXTokens({
      access_token: newTokens.access_token,
      expires_in: newTokens.expires_in,
    });
    return {
      "x-api-key": (process.env.STOCKX_API_KEY || "").trim(),
      Authorization: `Bearer ${newTokens.access_token}`,
      Accept: "application/json",
    };
  }

  return {
    "x-api-key": (process.env.STOCKX_API_KEY || "").trim(),
    Authorization: `Bearer ${tokens.access_token}`,
    Accept: "application/json",
  };
}

export async function isStockXConnected(): Promise<boolean> {
  const tokens = await getStockXTokens();
  if (!tokens) return false;

  // Check if token is still valid
  const now = new Date();
  const expiresAt = new Date(tokens.expires_at);
  return expiresAt.getTime() > now.getTime();
}
