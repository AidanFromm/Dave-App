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
    const styleId = p.styleId || attrs.sku || "";
    
    if (urlKey || productName || styleId) {
      // Helper to title-case a string
      const toTitleCase = (str: string) => str.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("-");
      
      // Convert urlKey to Title-Case
      const titleKey = urlKey ? toTitleCase(urlKey) : "";
      // Product title as hyphenated (remove parentheses and special chars)
      const cleanTitle = productName.replace(/[()]/g, "").replace(/\s+/g, "-").replace(/--+/g, "-");
      const titleHyphen = toTitleCase(cleanTitle);
      // Without year suffix like (2025)
      const titleNoYear = toTitleCase(productName.replace(/\s*\(\d{4}\)\s*/g, "").replace(/\s+/g, "-"));
      // For Jordans: StockX CDN often prefixes "Air-" 
      const airPrefix = productName.startsWith("Jordan") ? "Air-" + titleHyphen : "";
      const airPrefixNoYear = productName.startsWith("Jordan") ? "Air-" + titleNoYear : "";
      // Style ID (SKU) based - very reliable
      const skuKey = styleId ? styleId.replace(/\s+/g, "-") : "";

      const candidates = new Set([
        // SKU-based (most reliable)
        ...(skuKey ? [`https://images.stockx.com/images/${skuKey}.jpg`] : []),
        ...(skuKey ? [`https://images.stockx.com/images/${skuKey}_Product.jpg`] : []),
        // Air-prefixed without year (common pattern)
        ...(airPrefixNoYear ? [`https://images.stockx.com/images/${airPrefixNoYear}.jpg`] : []),
        // Air-prefixed with year
        ...(airPrefix ? [`https://images.stockx.com/images/${airPrefix}.jpg`] : []),
        // Title-cased urlKey
        ...(titleKey ? [`https://images.stockx.com/images/${titleKey}.jpg`] : []),
        // Title without year
        `https://images.stockx.com/images/${titleNoYear}.jpg`,
        // Plain title with year
        `https://images.stockx.com/images/${titleHyphen}.jpg`,
        // PNG variants
        ...(skuKey ? [`https://images.stockx.com/images/${skuKey}.png`] : []),
        ...(titleKey ? [`https://images.stockx.com/images/${titleKey}.png`] : []),
        // Product suffix pattern
        ...(titleNoYear ? [`https://images.stockx.com/images/${titleNoYear}_Product.jpg`] : []),
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
