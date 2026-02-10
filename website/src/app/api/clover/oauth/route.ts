import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CLOVER_APP_ID = process.env.CLOVER_APP_ID ?? "";
const CLOVER_APP_SECRET = process.env.CLOVER_APP_SECRET ?? "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const merchantId = searchParams.get("merchant_id");

  if (!code) {
    console.error("Clover OAuth callback: missing code parameter");
    return NextResponse.redirect(
      new URL("/admin/settings?error=missing_code", request.url)
    );
  }

  if (!merchantId) {
    console.error("Clover OAuth callback: missing merchant_id parameter");
    return NextResponse.redirect(
      new URL("/admin/settings?error=missing_merchant_id", request.url)
    );
  }

  try {
    // Exchange code for access token
    const tokenUrl = `https://sandbox.dev.clover.com/oauth/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLOVER_APP_ID,
        client_secret: CLOVER_APP_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Clover token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/admin/settings?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
    };

    if (!tokenData.access_token) {
      console.error("Clover token response missing access_token");
      return NextResponse.redirect(
        new URL("/admin/settings?error=no_access_token", request.url)
      );
    }

    // Store tokens in Supabase
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Deactivate any existing settings
    await supabase
      .from("clover_settings")
      .update({ is_active: false, updated_at: now })
      .eq("is_active", true);

    // Insert new settings
    const { error: insertError } = await supabase.from("clover_settings").insert({
      merchant_id: merchantId,
      access_token: tokenData.access_token,
      refresh_token: null,
      webhook_secret: null,
      is_active: true,
      last_sync_at: null,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error("Failed to store Clover settings:", insertError.message);
      return NextResponse.redirect(
        new URL("/admin/settings?error=storage_failed", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/admin/settings?clover=connected", request.url)
    );
  } catch (error) {
    console.error("Clover OAuth error:", error);
    return NextResponse.redirect(
      new URL("/admin/settings?error=oauth_failed", request.url)
    );
  }
}
