const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM = "Secured Tampa Support <orders@securedtampa.com>";

function emailTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:#FB4F14;padding:20px 32px">
<span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:1px">SECURED TAMPA</span>
</td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 16px;color:#002244;font-size:18px">${title}</h2>
<div style="color:#333;font-size:14px;line-height:1.6">${body}</div>
</td></tr>
<tr><td style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #eee">
<p style="margin:0;color:#999;font-size:12px">Secured Tampa | securedtampa.com</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

export async function sendTicketConfirmation(email: string, name: string, subject: string) {
  const html = emailTemplate(
    "We received your request",
    `<p>Hi ${name},</p>
<p>Thank you for reaching out. We've received your support ticket regarding: <strong>${subject}</strong></p>
<p>Our team will review your request and get back to you as soon as possible, typically within a few hours during business hours.</p>
<p>No action is needed from you at this time.</p>`
  );
  await sendEmail(email, `Ticket Received: ${subject} — Secured Tampa`, html);
}

export async function sendTicketNotification(customerName: string, customerEmail: string, subject: string, category: string) {
  const html = emailTemplate(
    "New Support Ticket",
    `<p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
<p><strong>Category:</strong> ${category}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><a href="https://securedtampa.com/admin/tickets" style="display:inline-block;padding:10px 20px;background:#FB4F14;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View in Admin</a></p>`
  );
  await sendEmail("securedtampa.llc@gmail.com", `New Ticket: ${subject}`, html);
}

export async function sendTicketReply(email: string, customerName: string, ticketSubject: string, replyText: string) {
  const html = emailTemplate(
    `Re: ${ticketSubject}`,
    `<p>Hi ${customerName},</p>
<div style="background:#f5f5f5;border-left:3px solid #FB4F14;padding:12px 16px;margin:16px 0;border-radius:4px">${replyText.replace(/\n/g, "<br/>")}</div>
<p>If you need further assistance, simply reply to your original ticket or contact us again.</p>`
  );
  await sendEmail(email, `Re: ${ticketSubject} — Secured Tampa`, html);
}
