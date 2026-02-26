import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const { orderNumber, itemName, size, price, tax, total, paymentMethod, date } = body as {
      orderNumber: string;
      itemName: string;
      size?: string;
      price: number;
      tax: number;
      total: number;
      paymentMethod: string;
      date: string;
    };

    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt - ${orderNumber}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 80mm;
    max-width: 80mm;
    padding: 8mm 4mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .store-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
  .divider {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 14px;
    font-weight: bold;
  }
  .footer { margin-top: 8px; font-size: 10px; }
  @media screen {
    body { margin: 20px auto; border: 1px solid #ccc; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  }
</style>
</head>
<body>
  <div class="center">
    <div class="store-name">SECUREDTAMPA</div>
    <div>2398 Grand Cypress Dr STE 420</div>
    <div>Lutz, FL 33559</div>
    <div>(813) 943-2777</div>
  </div>
  <hr class="divider">
  <div class="row"><span>Date:</span><span>${formattedDate}</span></div>
  <div class="row"><span>Order:</span><span>${orderNumber}</span></div>
  <hr class="divider">
  <div style="padding: 4px 0;">
    <div class="bold">Item: ${itemName.length > 28 ? itemName.substring(0, 28) + "..." : itemName}</div>
    ${size ? `<div>Size: ${size}</div>` : ""}
  </div>
  <div class="row"><span>Price:</span><span>$${price.toFixed(2)}</span></div>
  <div class="row"><span>Tax (7.5%):</span><span>$${tax.toFixed(2)}</span></div>
  <hr class="divider">
  <div class="total-row"><span>TOTAL:</span><span>$${total.toFixed(2)}</span></div>
  <div class="row"><span>Payment:</span><span>${paymentMethod === "cash" ? "Cash" : "Card"}</span></div>
  <hr class="divider">
  <div class="center footer">
    <div class="bold">ALL SALES ARE FINAL</div>
    <div style="margin-top: 4px;">Thank you for shopping<br>at Secured Tampa!</div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("Receipt error:", err);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
