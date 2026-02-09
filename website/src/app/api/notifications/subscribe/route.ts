import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const { email, dropId, productName } = await request.json();

    if (!email || !dropId) {
      return NextResponse.json(
        { error: "Email and drop ID are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("drop_subscribers")
      .select("id")
      .eq("email", email)
      .eq("drop_id", dropId)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "Already subscribed", subscribed: true },
        { status: 200 }
      );
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from("drop_subscribers")
      .insert({
        email,
        drop_id: dropId,
        product_name: productName ?? "",
      });

    if (insertError) {
      console.error("Failed to insert subscriber:", insertError);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    // Send confirmation email if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: "Secured Tampa <drops@securedtampa.com>",
          to: email,
          subject: `You're on the list! 🔥 ${productName || "Upcoming Drop"}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>You're on the list!</title>
              </head>
              <body style="margin: 0; padding: 0; background-color: #0D0D0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #161616;">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <h1 style="color: #FF6B3D; font-size: 28px; margin: 0 0 10px;">🔥 You're on the list!</h1>
                      <p style="color: #FFFFFF; font-size: 18px; margin: 0;">
                        ${productName || "Upcoming Drop"}
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; text-align: center;">
                      <p style="color: #A0A0A0; font-size: 16px; line-height: 1.6; margin: 0;">
                        We'll notify you the moment this drops. Be ready to cop!
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px; text-align: center;">
                      <a href="https://securedtampa.com/drops" style="display: inline-block; background-color: #FF6B3D; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        View Drops
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #262626;">
                      <p style="color: #666666; font-size: 12px; margin: 0;">
                        Secured Tampa • Tampa's Premier Sneaker & Card Shop
                      </p>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, subscribed: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
