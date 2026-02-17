"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getSiteUrl(): string {
  let url = process.env.NEXT_PUBLIC_SITE_URL || "https://securedtampa.com";
  // Remove any trailing newlines or whitespace
  url = url.trim();
  // Ensure https
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { error: null };
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
) {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    // SignUp failed
    return { error: error.message };
  }

  // Create customer profile using service role (bypasses RLS)
  if (data.user) {
    try {
      const serviceClient = getServiceClient();
      const { error: insertError } = await serviceClient.from("customers").insert({
        auth_user_id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
      });

      if (insertError) {
        // Customer insert failed - user can still verify email
        // Don't fail signup if customer insert fails - user can still verify email
      }
    } catch (err) {
      // Customer insert exception - non-fatal
    }
  }

  return { error: null };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function resetPassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { error: null };
}
