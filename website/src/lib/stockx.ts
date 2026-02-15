import { createClient } from "@supabase/supabase-js";
import { STOCKX_TOKEN_URL } from "./constants";

const STOCKX_CLIENT_ID = (process.env.STOCKX_CLIENT_ID || "CQN5rKVX2haC1VWcRH1uAAFiWsQuHv7h").trim();
const STOCKX_CLIENT_SECRET = (process.env.STOCKX_CLIENT_SECRET || "aw7KR2ZbGlY43sG84yf11UDYfAVGAgkYhad317ll-fU32lm-O75jmYaimw-oVpO4").trim();
const STOCKX_API_KEY = (process.env.STOCKX_API_KEY || "").trim();

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

export async function deleteStockXTokens(): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("stockx_tokens")
    .delete()
    .gt("created_at", "1900-01-01T00:00:00Z");
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
} | null> {
  try {
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: STOCKX_CLIENT_ID,
        client_secret: STOCKX_CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      console.error("StockX refresh token failed:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("StockX refresh token exception:", err);
    return null;
  }
}

async function fetchClientCredentialsToken(): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
} | null> {
  if (!STOCKX_CLIENT_ID || !STOCKX_CLIENT_SECRET) {
    console.error("StockX credentials missing");
    return null;
  }

  try {
    const res = await fetch(STOCKX_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: STOCKX_CLIENT_ID,
        client_secret: STOCKX_CLIENT_SECRET,
        audience: "gateway.stockx.com",
      }),
    });

    if (!res.ok) {
      console.error("StockX client_credentials failed:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("StockX client_credentials exception:", err);
    return null;
  }
}

export async function getStockXToken(): Promise<string | null> {
  const tokens = await getStockXTokens();
  if (!tokens) return null;

  const now = new Date();
  const expiresAt = new Date(tokens.expires_at);

  // If token is still valid (with 5 min buffer), return it
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokens.access_token;
  }

  // Try refresh token first (from OAuth authorization_code flow)
  if (tokens.refresh_token) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    if (refreshed) {
      await saveStockXTokens({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || tokens.refresh_token,
        token_type: refreshed.token_type,
        expires_in: refreshed.expires_in,
      });
      return refreshed.access_token;
    }
  }

  // Fallback to client_credentials
  const ccToken = await fetchClientCredentialsToken();
  if (ccToken) {
    await saveStockXTokens({
      access_token: ccToken.access_token,
      expires_in: ccToken.expires_in,
      token_type: ccToken.token_type,
    });
    return ccToken.access_token;
  }

  return null;
}

export async function stockxFetch(url: string): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // API key is required for all requests
  if (STOCKX_API_KEY) {
    headers["x-api-key"] = STOCKX_API_KEY;
  }

  // Try to get OAuth token (optional - needed for write operations)
  const token = await getStockXToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("StockX fetch headers:", { hasApiKey: !!STOCKX_API_KEY, hasToken: !!token, url });

  return fetch(url, { headers });
}

export async function getStockXHeaders(): Promise<Record<string, string> | null> {
  const token = await getStockXToken();

  // If no OAuth token, try fetching fresh client credentials
  if (!token) {
    const ccToken = await fetchClientCredentialsToken();
    if (!ccToken) return null;
    await saveStockXTokens({
      access_token: ccToken.access_token,
      expires_in: ccToken.expires_in,
    });
    return {
      "x-api-key": STOCKX_API_KEY,
      Authorization: `Bearer ${ccToken.access_token}`,
      Accept: "application/json",
    };
  }

  return {
    "x-api-key": STOCKX_API_KEY,
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

export async function isStockXConnected(): Promise<boolean> {
  const tokens = await getStockXTokens();
  if (!tokens) return false;
  const now = new Date();
  const expiresAt = new Date(tokens.expires_at);
  // Connected if token valid or has refresh token
  return expiresAt.getTime() > now.getTime() || !!tokens.refresh_token;
}
