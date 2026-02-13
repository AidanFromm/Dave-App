// Twilio SMS helper — sends via REST API (no SDK needed)

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const FROM_PHONE = process.env.TWILIO_PHONE_NUMBER ?? "";

export async function sendSMS(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: FROM_PHONE, Body: body }).toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Twilio error:", data);
      return { success: false, error: data.message ?? "SMS failed" };
    }
    return { success: true, sid: data.sid };
  } catch (err: any) {
    console.error("Twilio fetch error:", err);
    return { success: false, error: err.message };
  }
}
