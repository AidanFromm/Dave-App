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
    const urlKey = p.urlKey || p.url_key || "";

    // StockX v2 doesn't include media URLs in product response
    // Try multiple CDN patterns to find a working image
    let imageUrl = "";
    let thumbUrl = "";
    const styleId = p.styleId || attrs.sku || "";
    
    if (urlKey || productName || styleId) {
      // StockX uses LOWERCASE urlKey for images!
      const lowerKey = urlKey ? urlKey.toLowerCase() : "";
      // Product title as hyphenated lowercase (remove parentheses)
      const cleanTitle = productName.replace(/[()]/g, "").trim().replace(/\s+/g, "-").replace(/--+/g, "-").toLowerCase();
      // Without year suffix
      const titleNoYear = productName.replace(/\s*\(\d{4}\)\s*/g, "").trim().replace(/\s+/g, "-").toLowerCase();
      // For Jordans: StockX CDN uses "air-" prefix
      const airPrefix = productName.toLowerCase().startsWith("jordan") ? "air-" + cleanTitle : "";
      const airPrefixNoYear = productName.toLowerCase().startsWith("jordan") ? "air-" + titleNoYear : "";
      // Style ID (SKU)
      const skuKey = styleId ? styleId.replace(/\s+/g, "-") : "";

      const candidates = new Set([
        // URL key lowercase (MOST RELIABLE)
        ...(lowerKey ? [`https://images.stockx.com/images/${lowerKey}.jpg`] : []),
        // Air-prefixed lowercase
        ...(airPrefix ? [`https://images.stockx.com/images/${airPrefix}.jpg`] : []),
        ...(airPrefixNoYear ? [`https://images.stockx.com/images/${airPrefixNoYear}.jpg`] : []),
        // Clean title lowercase
        `https://images.stockx.com/images/${cleanTitle}.jpg`,
        `https://images.stockx.com/images/${titleNoYear}.jpg`,
        // SKU-based
        ...(skuKey ? [`https://images.stockx.com/images/${skuKey}.jpg`] : []),
        // 360 view path (backup)
        ...(lowerKey ? [`https://images.stockx.com/360/${urlKey}/Images/${urlKey}/Lv2/img01.jpg`] : []),
        // PNG variants
        ...(lowerKey ? [`https://images.stockx.com/images/${lowerKey}.png`] : []),
      ]);

      // Try each candidate with a HEAD request (parallel for speed)
      const results = await Promise.allSettled(
        Array.from(candidates).map(async (candidate) => {
          try {
            const imgRes = await fetch(candidate, { method: "HEAD", signal: AbortSignal.timeout(2000) });
            return imgRes.ok ? candidate : null;
          } catch {
            return null;
          }
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          // StockX CDN no longer supports query params - use base URL only
          imageUrl = result.value;
          thumbUrl = result.value;
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
