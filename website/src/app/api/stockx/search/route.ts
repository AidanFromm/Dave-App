import { NextResponse } from "next/server";
import { getStockXHeaders } from "@/lib/stockx";

// Convert urlKey to Title-Case for StockX CDN
function toTitleCase(str: string): string {
  return str.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join("-");
}

// StockX CDN image URL construction
// Pattern: Title-Case slug + variations
function buildStockXImageUrl(urlKey: string): string {
  if (!urlKey) return "";
  const titleCased = toTitleCase(urlKey);
  return `https://images.stockx.com/images/${titleCased}-Product.jpg?fit=fill&bg=FFFFFF&w=500&h=500&fm=jpg&auto=compress`;
}

function buildStockXThumbUrl(urlKey: string): string {
  if (!urlKey) return "";
  const titleCased = toTitleCase(urlKey);
  return `https://images.stockx.com/images/${titleCased}-Product.jpg?fit=fill&bg=FFFFFF&w=200&h=200&fm=jpg&auto=compress`;
}

// Build multiple image URLs for different angles
function buildStockXImageUrls(urlKey: string): string[] {
  if (!urlKey) return [];
  const titleCased = toTitleCase(urlKey);
  const base = "https://images.stockx.com/images/";
  const params = "?fit=fill&bg=FFFFFF&w=500&h=500&fm=jpg&auto=compress";
  
  // StockX uses multiple image patterns
  return [
    `${base}${titleCased}-Product.jpg${params}`,        // Main product shot
    `${base}${titleCased}.jpg${params}`,                 // Alternate angle
    `${base}${titleCased}_02.jpg${params}`,              // Side view
    `${base}${titleCased}_03.jpg${params}`,              // Back view
    `${base}${titleCased}_04.jpg${params}`,              // Detail shot
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const headers = await getStockXHeaders();
  if (!headers) {
    return NextResponse.json(
      { error: "StockX not connected. Please connect in Settings." },
      { status: 401 }
    );
  }

  try {
    const res = await fetch(
      `https://api.stockx.com/v2/catalog/search?query=${encodeURIComponent(query)}&limit=20`,
      { headers }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `StockX API error: ${res.status}`, detail: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();

    const products = (data.products ?? []).map((p: Record<string, unknown>) => {
      const attrs = p.productAttributes as Record<string, unknown> | undefined;
      
      const productId = p.productId ?? p.id ?? p.uuid ?? p.objectID ?? p.productUuid ?? "";
      const urlKey = (p.urlKey ?? p.urlSlug ?? "") as string;
      
      // Try to extract image from API response first (v2 may include media)
      const media = p.media as Record<string, unknown> | undefined;
      const apiImageUrl = (media?.imageUrl as string) ?? (media?.thumbUrl as string) ?? (p.imageUrl as string) ?? (p.image as string) ?? (p.thumbUrl as string) ?? "";
      const apiImages: string[] = [];
      if (media?.all && Array.isArray(media.all)) {
        for (const m of media.all) {
          if (typeof m === "string") apiImages.push(m);
          else if (m && typeof m === "object" && "imageUrl" in (m as Record<string, unknown>)) apiImages.push((m as Record<string, string>).imageUrl);
        }
      }
      
      // Use API images if available, otherwise construct from urlKey
      const imageUrl = apiImageUrl || buildStockXImageUrl(urlKey);
      const thumbUrl = apiImageUrl || buildStockXThumbUrl(urlKey);
      const imageUrls = apiImages.length > 0 ? apiImages : buildStockXImageUrls(urlKey);
      
      return {
        id: productId,
        name: p.title ?? p.name ?? "",
        brand: p.brand ?? "",
        colorway: (attrs?.colorway as string) ?? p.colorway ?? "",
        styleId: p.styleId ?? "",
        retailPrice: (attrs?.retailPrice as number) ?? p.retailPrice ?? 0,
        thumbnailUrl: thumbUrl,
        imageUrl,
        imageUrls,
        urlSlug: urlKey,
      };
    });

    return NextResponse.json({ products });
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
