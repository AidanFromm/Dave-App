import { NextResponse } from "next/server";
import { stockxFetch } from "@/lib/stockx";

// Abbreviations that should be UPPERCASED in title-cased URL keys
const ABBREVS = new Set(["ps", "gs", "td", "og", "se", "sp", "pe", "qs", "nrg", "wmns", "i", "w"]);

function buildTitleCase(key: string): string {
  return key.split("-").filter(Boolean)
    .map((w) => ABBREVS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

// Try multiple StockX CDN URL patterns
async function findCdnImage(urlKey: string | undefined): Promise<string | null> {
  if (!urlKey) return null;
  const lower = urlKey.toLowerCase();
  const title = buildTitleCase(urlKey);
  const candidates = [
    `https://images.stockx.com/images/${lower}.jpg`,
    `https://images.stockx.com/images/${title}.jpg`,
    `https://images.stockx.com/images/${lower}.png`,
    `https://images.stockx.com/images/${title}.png`,
  ];
  for (const url of candidates) {
    try {
      const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(2000) });
      if (r.ok) return url;
    } catch {}
  }
  return null;
}

// GOAT image fallback — search GOAT's Algolia index
async function findGoatImage(styleCode: string | undefined, productName: string | undefined): Promise<string | null> {
  const query = styleCode || productName;
  if (!query) return null;
  try {
    const algoliaUrl = "https://2fwotdvm2o-dsn.algolia.net/1/indexes/product_variants_v2/query";
    const resp = await fetch(
      `${algoliaUrl}?x-algolia-agent=Algolia&x-algolia-application-id=2FWOTDVM2O&x-algolia-api-key=ac96de6fef0e02bb95d433d8d5c7038a`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ params: `query=${encodeURIComponent(query)}&hitsPerPage=1` }),
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const hit = data?.hits?.[0];
    if (!hit) return null;
    return hit.main_picture_url || hit.grid_picture_url || hit.original_picture_url || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const res = await stockxFetch(
      `https://api.stockx.com/v2/catalog/search?query=${encodeURIComponent(query)}&pageSize=10`
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("StockX API error:", res.status, errorText);
      return NextResponse.json(
        { error: `StockX API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawProducts = data.products || data.Products || [];

    // Enrich products with images (parallel for speed)
    const products = await Promise.all(
      rawProducts.slice(0, 10).map(async (p: any) => {
        const id = p.id || p.productId;
        let imageUrl = p.media?.thumbUrl || p.media?.imageUrl || p.thumbUrl || p.image || "";
        const urlKey = p.urlKey || p.url_key || "";
        const styleId = p.styleId || p.sku || "";

        // Step 1: If no image from search, try product detail API
        if (!imageUrl && id) {
          try {
            const detailRes = await stockxFetch(
              `https://api.stockx.com/v2/catalog/products/${id}`
            );
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const prod = detail.product || detail;
              imageUrl =
                prod?.media?.imageUrl ||
                prod?.media?.thumbUrl ||
                prod?.media?.smallImageUrl ||
                prod?.thumbUrl ||
                "";
            }
          } catch {}
        }

        // Step 2: Try StockX CDN URL patterns from urlKey
        if (!imageUrl && urlKey) {
          imageUrl = (await findCdnImage(urlKey)) || "";
        }

        // Step 3: GOAT Algolia fallback
        if (!imageUrl) {
          imageUrl = (await findGoatImage(styleId, p.title || p.name)) || "";
        }

        return {
          id,
          name: p.title || p.name,
          brand: p.brand,
          sku: styleId,
          colorway: p.colorway,
          retailPrice: p.retailPrice,
          imageUrl,
          urlKey,
          productType: p.productCategory || "sneaker",
        };
      })
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("StockX search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
