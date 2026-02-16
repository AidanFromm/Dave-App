import { NextResponse } from "next/server";
import { stockxFetch } from "@/lib/stockx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await stockxFetch(
      `https://api.stockx.com/v2/catalog/products/${id}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `StockX API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // v2 API returns flat object (no wrapper)
    const p = data.product || data.Product || data;

    const productName = p.title || p.name || "";
    const attrs = p.productAttributes || {};
    const urlKey = p.urlKey || "";

    // StockX v2 doesn't include media URLs in product response
    // Try multiple CDN patterns to find a working image
    let imageUrl = "";
    let thumbUrl = "";
    if (urlKey || productName) {
      // Convert urlKey to Title-Case
      const titleKey = urlKey ? urlKey.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("-") : "";
      // Product title as hyphenated
      const titleHyphen = productName.split(/\s+/).join("-");
      // For Jordans: StockX CDN often prefixes "Air-" 
      const airPrefix = productName.startsWith("Jordan") ? "Air-" + titleHyphen : "";
      // Try urlKey without common colorway suffixes (white, black, etc.)
      const simplifiedKey = titleKey
        .replace(/-White(?=-|$)/g, "")
        .replace(/-Black(?=-|$)/g, "")
        .replace(/-Grey(?=-|$)/g, "")
        .replace(/-Gray(?=-|$)/g, "");

      const candidates = new Set([
        // Most likely: Air-prefixed title
        ...(airPrefix ? [`https://images.stockx.com/images/${airPrefix}.jpg`] : []),
        // Title-cased urlKey
        ...(titleKey ? [`https://images.stockx.com/images/${titleKey}.jpg`] : []),
        // Simplified urlKey (without colorway words)
        ...(simplifiedKey !== titleKey ? [`https://images.stockx.com/images/${simplifiedKey}.jpg`] : []),
        // Plain title
        `https://images.stockx.com/images/${titleHyphen}.jpg`,
        // PNG variants
        ...(titleKey ? [`https://images.stockx.com/images/${titleKey}.png`] : []),
      ]);

      // Try each candidate with a HEAD request (parallel for speed)
      const results = await Promise.allSettled(
        Array.from(candidates).map(async (candidate) => {
          const imgRes = await fetch(candidate, { method: "HEAD", signal: AbortSignal.timeout(2000) });
          return imgRes.ok ? candidate : null;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          const base = result.value;
          imageUrl = base + "?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&trim=color";
          thumbUrl = base + "?fit=fill&bg=FFFFFF&w=300&h=214&fm=webp&auto=compress&q=80&trim=color";
          break;
        }
      }
    }

    // Get variants with proper v2 field mapping
    let variants: any[] = [];
    try {
      const varRes = await stockxFetch(
        `https://api.stockx.com/v2/catalog/products/${id}/variants?pageSize=100`
      );
      if (varRes.ok) {
        const varData = await varRes.json();
        // v2 returns array directly (not wrapped in {variants:[]})
        const rawVariants = Array.isArray(varData) ? varData : (varData.variants || varData.Variants || []);
        variants = rawVariants.map((v: any) => ({
          id: v.variantId || v.id,
          size: v.sizeChart?.defaultConversion?.size || v.variantValue || v.size || "",
          // v2 gtins are objects {identifier, type} — extract identifier strings
          gtins: (v.gtins || []).map((g: any) => typeof g === "string" ? g : g.identifier).filter(Boolean),
        }));
      }
    } catch (e) {
      console.error("StockX variants error:", e);
    }

    return NextResponse.json({
      id: p.productId || p.id || id,
      title: productName,
      name: productName,
      brand: p.brand,
      sku: p.styleId || attrs.sku,
      styleId: p.styleId || attrs.sku,
      colorway: attrs.colorway || p.colorway,
      retailPrice: attrs.retailPrice || p.retailPrice,
      imageUrl,
      imageUrls: [imageUrl, thumbUrl].filter(Boolean),
      variants,
    });
  } catch (error) {
    console.error("StockX product error:", error);
    return NextResponse.json(
      { error: "Product lookup failed" },
      { status: 500 }
    );
  }
}
