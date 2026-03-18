/**
 * Label Generation API — generates printable store labels for Zebra printers.
 * 
 * GET /api/admin/labels?productId=xxx — single product label
 * GET /api/admin/labels?productIds=xxx,yyy — batch labels
 * 
 * Returns HTML optimized for Zebra thermal printer (2.25" x 1.25" labels).
 * The barcode is scannable in Clover POS to ring up the product.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bwipjs = require("bwip-js");

interface LabelProduct {
  id: string;
  name: string;
  price: number;
  size: string | null;
  condition: string;
  sku: string | null;
  barcode: string | null;
  brand: string | null;
  clover_item_id: string | null;
}

async function generateBarcodeSvg(data: string, type: string = "code128"): Promise<string> {
  try {
    const svg = bwipjs.toSVG({
      bcid: type,
      text: data,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
      textsize: 8,
    });
    return svg;
  } catch {
    // Fallback — try with just code128
    try {
      const svg = bwipjs.toSVG({
        bcid: "code128",
        text: data,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: "center",
        textsize: 8,
      });
      return svg;
    } catch {
      return `<div style="font-size:10px;color:#999;text-align:center">No barcode</div>`;
    }
  }
}

function getBarcodeData(product: LabelProduct): { data: string; type: string } {
  // Priority: barcode (UPC) > SKU > clover_item_id > product ID
  if (product.barcode) {
    // Detect UPC-A (12 digits) or EAN-13 (13 digits)
    const clean = product.barcode.replace(/\D/g, "");
    if (clean.length === 12) return { data: clean, type: "upca" };
    if (clean.length === 13) return { data: clean, type: "ean13" };
    return { data: product.barcode, type: "code128" };
  }
  if (product.sku) return { data: product.sku, type: "code128" };
  if (product.clover_item_id) return { data: product.clover_item_id, type: "code128" };
  return { data: product.id.slice(0, 20), type: "code128" };
}

function conditionLabel(condition: string): string {
  const map: Record<string, string> = {
    new: "NEW",
    used_like_new: "LIKE NEW",
    used_good: "GOOD",
    used_fair: "FAIR",
    DS: "DS",
    VNDS: "VNDS",
    "Used-Excellent": "EXCELLENT",
    "Used-Good": "GOOD",
    "Used-Fair": "FAIR",
  };
  return map[condition] || condition.toUpperCase();
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

async function buildLabelHtml(product: LabelProduct): Promise<string> {
  const { data, type } = getBarcodeData(product);
  const barcodeSvg = await generateBarcodeSvg(data, type);
  const cond = conditionLabel(product.condition);
  const sizeText = product.size ? `Size ${product.size}` : "";
  const condSize = [cond, sizeText].filter(Boolean).join(" | ");

  return `
    <div class="label">
      <div class="header">SECURED FL</div>
      <div class="price">${formatPrice(product.price)}</div>
      <div class="product-name">${escapeHtml(truncate(product.name, 45))}</div>
      <div class="details">${escapeHtml(condSize)}</div>
      <div class="barcode">${barcodeSvg}</div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const productId = request.nextUrl.searchParams.get("productId");
  const productIds = request.nextUrl.searchParams.get("productIds");
  const productName = request.nextUrl.searchParams.get("name");
  const copies = parseInt(request.nextUrl.searchParams.get("copies") ?? "1", 10);
  // Label size: "small" = 2.25x1.25, "medium" = 3x2, "large" = 4x2 (ZD421 max width 4.25")
  const labelSize = request.nextUrl.searchParams.get("size") ?? "medium";

  if (!productId && !productIds && !productName) {
    return NextResponse.json({ error: "productId, productIds, or name required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("products")
    .select("id, name, price, size, condition, sku, barcode, brand, clover_item_id");

  if (productName) {
    query = query.ilike("name", productName);
  } else {
    const ids = productIds ? productIds.split(",") : [productId!];
    query = query.in("id", ids);
  }

  const { data: products, error } = await query;

  if (error || !products || products.length === 0) {
    return NextResponse.json({ error: "Products not found" }, { status: 404 });
  }

  const labelPromises = products.flatMap((p) =>
    Array.from({ length: Math.min(copies, 50) }, () => buildLabelHtml(p as LabelProduct))
  );
  const labels = await Promise.all(labelPromises);

  // ZD421 compatible label sizes
  const sizes: Record<string, { w: string; h: string; pricePt: string; namePt: string; detailPt: string; headerPt: string; barcodeH: string; pad: string; nameMax: number }> = {
    small:  { w: "2.25in", h: "1.25in", pricePt: "18pt", namePt: "6.5pt", detailPt: "6pt", headerPt: "9pt", barcodeH: "0.32in", pad: "0.06in 0.08in", nameMax: 40 },
    medium: { w: "3in",    h: "2in",    pricePt: "28pt", namePt: "9pt",   detailPt: "7.5pt", headerPt: "11pt", barcodeH: "0.5in",  pad: "0.08in 0.12in", nameMax: 50 },
    large:  { w: "4in",    h: "2in",    pricePt: "32pt", namePt: "11pt",  detailPt: "9pt", headerPt: "13pt", barcodeH: "0.6in",  pad: "0.1in 0.15in", nameMax: 60 },
  };
  const sz = sizes[labelSize] ?? sizes.medium;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Print Labels — SecuredTampa</title>
  <style>
    @page {
      size: ${sz.w} ${sz.h};
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      width: ${sz.w};
      height: ${sz.h};
      padding: ${sz.pad};
      page-break-after: always;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
    }
    .header {
      width: 100%;
      background: #000;
      color: #fff;
      text-align: center;
      font-size: ${sz.headerPt};
      font-weight: 900;
      letter-spacing: 2px;
      padding: 2px 0;
      text-transform: uppercase;
    }
    .price {
      font-size: ${sz.pricePt};
      font-weight: 900;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin: 2px 0;
    }
    .product-name {
      font-size: ${sz.namePt};
      font-weight: 600;
      text-align: center;
      line-height: 1.2;
      overflow: hidden;
      width: 100%;
    }
    .details {
      font-size: ${sz.detailPt};
      color: #444;
      text-align: center;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .barcode {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      max-height: ${sz.barcodeH};
      overflow: hidden;
    }
    .barcode svg {
      max-width: calc(${sz.w} - 0.3in);
      max-height: ${sz.barcodeH};
      height: auto;
    }
    
    /* Screen preview styles */
    @media screen {
      body {
        background: #e5e7eb;
        padding: 20px;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;
      }
      .label {
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .no-print {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 100;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .print-btn {
        background: #000;
        color: #fff;
        border: none;
        padding: 12px 32px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        letter-spacing: 0.5px;
      }
      .print-btn:hover { background: #333; }
      .size-select {
        padding: 10px 16px;
        font-size: 14px;
        border: 2px solid #d1d5db;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
    }
    @media print {
      .no-print { display: none !important; }
      body { background: white; padding: 0; display: block; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <select class="size-select" onchange="window.location.href=window.location.href.replace(/[&?]size=[^&]*/,'')+(window.location.href.includes('?')?'&':'?')+'size='+this.value">
      <option value="small" ${labelSize === "small" ? "selected" : ""}>Small (2.25×1.25")</option>
      <option value="medium" ${labelSize === "medium" ? "selected" : ""}>Medium (3×2") — ZD421</option>
      <option value="large" ${labelSize === "large" ? "selected" : ""}>Large (4×2") — ZD421 Max</option>
    </select>
    <button class="print-btn" onclick="window.print()">🖨️ Print Labels</button>
  </div>
  ${labels.join("\n")}
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
