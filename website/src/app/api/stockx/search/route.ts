import { NextResponse } from "next/server";
import { getStockXHeaders } from "@/lib/stockx";

// StockX CDN image URL construction
function buildStockXImageUrl(urlKey: string): string {
  if (!urlKey) return "";
  return `https://images.stockx.com/images/${urlKey}.jpg?fit=fill&bg=FFFFFF&w=700&h=500&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=0`;
}

function buildStockXThumbUrl(urlKey: string): string {
  if (!urlKey) return "";
  return `https://images.stockx.com/images/${urlKey}.jpg?fit=fill&bg=FFFFFF&w=140&h=100&fm=webp&auto=compress&q=90&dpr=2&trim=color&updated_at=0`;
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
      console.error("StockX API error:", res.status, errorText);
      return NextResponse.json(
        { error: `StockX API error: ${res.status}`, detail: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    console.log("StockX search raw response:", JSON.stringify(data, null, 2));

    const products = (data.products ?? []).map((p: Record<string, unknown>) => {
      const attrs = p.productAttributes as Record<string, unknown> | undefined;
      
      // StockX uses various ID field names - try them all
      const productId = p.productId ?? p.id ?? p.uuid ?? p.objectID ?? p.productUuid ?? "";
      const urlKey = (p.urlKey ?? p.urlSlug ?? "") as string;
      
      // Log what we found for debugging
      console.log("Product ID extraction:", { 
        productId: p.productId, 
        id: p.id, 
        uuid: p.uuid, 
        objectID: p.objectID,
        urlKey: p.urlKey,
        chosen: productId,
        allKeys: Object.keys(p)
      });
      
      return {
        id: productId,
        name: p.title ?? p.name ?? "",
        brand: p.brand ?? "",
        // Colorway is nested in productAttributes
        colorway: (attrs?.colorway as string) ?? p.colorway ?? "",
        styleId: p.styleId ?? "",
        // RetailPrice is nested in productAttributes
        retailPrice: (attrs?.retailPrice as number) ?? p.retailPrice ?? 0,
        // StockX v2 doesn't return images - construct from urlKey
        thumbnailUrl: buildStockXThumbUrl(urlKey),
        imageUrl: buildStockXImageUrl(urlKey),
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
