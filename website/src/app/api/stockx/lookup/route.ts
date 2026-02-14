import { NextResponse } from "next/server";

const STOCKX_API_KEY = process.env.STOCKX_API_KEY || "qAYBY1lFUv2PVXRldvSf4ya1pkjGhQZ9rxBj4LW7";

// Lookup a product by barcode/UPC via StockX
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get("barcode");

  if (!barcode) {
    return NextResponse.json({ error: "Barcode required" }, { status: 400 });
  }

  try {
    // Search StockX by barcode/UPC
    const res = await fetch(
      `https://api.stockx.com/v2/catalog/search?query=${encodeURIComponent(barcode)}&pageSize=5`,
      {
        headers: {
          "x-api-key": STOCKX_API_KEY,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `StockX API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const products = (data.products || data.Products || []);

    if (products.length === 0) {
      return NextResponse.json({ product: null, message: "No product found for this barcode" });
    }

    const p = products[0];
    return NextResponse.json({
      product: {
        id: p.id || p.productId,
        name: p.title || p.name,
        brand: p.brand,
        sku: p.styleId || p.sku,
        colorway: p.colorway,
        retailPrice: p.retailPrice,
        imageUrl: p.media?.thumbUrl || p.media?.imageUrl || p.thumbUrl || p.image,
        productType: p.productCategory || "sneaker",
      },
    });
  } catch (error) {
    console.error("StockX lookup error:", error);
    return NextResponse.json(
      { error: "Lookup failed" },
      { status: 500 }
    );
  }
}
