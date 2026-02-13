import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeString, sanitizeEmail } from "@/lib/sanitize";

export async function POST(request: Request) {
  try {
    // Rate limit: 3 contact submissions per minute per IP
    const ip = getClientIp(request);
    const rl = rateLimit(`contact:${ip}`, { limit: 3, windowSeconds: 60 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const cleanName = sanitizeString(name, 200);
    const cleanSubject = subject ? sanitizeString(subject, 300) : null;
    const cleanMessage = sanitizeString(message, 5000);

    if (!cleanName || !cleanMessage) {
      return NextResponse.json(
        { error: "Name and message are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase.from("contact_messages").insert({
      name: cleanName,
      email: cleanEmail,
      subject: cleanSubject,
      message: cleanMessage,
    });

    if (error) {
      console.error("Failed to save contact message to Supabase:", error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to process contact form" },
      { status: 500 }
    );
  }
}
