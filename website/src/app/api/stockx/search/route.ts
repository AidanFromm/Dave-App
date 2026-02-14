import { NextResponse } from "next/server";
import { stockxFetch } from "@/lib/stockx";

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
    const products = (data.products || data.Products || []).map((p: any) => ({
      id: p.id || p.productId,
      name: p.title || p.name,
      brand: p.brand,
      sku: p.styleId || p.sku,
      colorway: p.colorway,
      retailPrice: p.retailPrice,
      imageUrl: p.media?.thumbUrl || p.media?.imageUrl || p.thumbUrl || p.image,
      productType: p.productCategory || "sneaker",
    }));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("StockX search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
