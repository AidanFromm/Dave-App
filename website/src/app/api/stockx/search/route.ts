import { NextResponse } from "next/server";
import { getStockXHeaders } from "@/lib/stockx";

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
      const media = p.media as Record<string, unknown> | undefined;
      const attrs = p.productAttributes as Record<string, unknown> | undefined;
      
      // StockX uses "productId" not "id"
      const productId = p.productId ?? p.id ?? "";
      
      return {
        id: productId,
        name: p.title ?? p.name ?? "",
        brand: p.brand ?? "",
        // Colorway can be top-level or nested in productAttributes
        colorway: p.colorway ?? (attrs && attrs.colorway) ?? "",
        styleId: p.styleId ?? "",
        // RetailPrice can be top-level or nested in productAttributes
        retailPrice: p.retailPrice ?? (attrs && attrs.retailPrice) ?? 0,
        // Images - try multiple fields
        thumbnailUrl: (media && media.thumbUrl) || (media && media.smallImageUrl) || "",
        imageUrl: (media && media.imageUrl) || (media && media.smallImageUrl) || "",
        urlSlug: p.urlKey ?? p.urlSlug ?? "",
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
