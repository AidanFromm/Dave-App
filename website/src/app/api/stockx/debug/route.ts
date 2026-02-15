import { NextResponse } from "next/server";
import { getStockXToken } from "@/lib/stockx";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceKeyPreview = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + "...";
  const hasApiKey = !!process.env.STOCKX_API_KEY;
  const clientId = process.env.STOCKX_CLIENT_ID?.slice(0, 8) + "...";

  let tokenStatus = "unknown";
  let tokenError = "";
  try {
    const token = await getStockXToken();
    tokenStatus = token ? `valid (${token.slice(0, 20)}...)` : "null - no token retrieved";
  } catch (err) {
    tokenStatus = "error";
    tokenError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    supabaseUrl,
    hasServiceKey,
    serviceKeyPreview,
    hasApiKey,
    clientId,
    tokenStatus,
    tokenError,
  });
}
