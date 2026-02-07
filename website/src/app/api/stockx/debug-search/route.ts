import { NextResponse } from "next/server";
import { getStockXHeaders } from "@/lib/stockx";

// Debug endpoint - returns raw StockX search response
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "197863038551";

  const headers = await getStockXHeaders();
  if (!headers) {
    return NextResponse.json({ error: "StockX not connected" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://api.stockx.com/v2/catalog/search?query=${encodeURIComponent(query)}&limit=5`,
      { headers }
    );

    const raw = await res.json();
    
    // Show the raw response AND the first product's keys
    const firstProduct = raw?.products?.[0] ?? null;
    
    return NextResponse.json({
      status: res.status,
      rawResponseKeys: Object.keys(raw ?? {}),
      productsCount: raw?.products?.length ?? 0,
      firstProductKeys: firstProduct ? Object.keys(firstProduct) : [],
      firstProduct: firstProduct,
      // Check common ID field names
      possibleIds: firstProduct ? {
        id: firstProduct.id,
        productId: firstProduct.productId,
        uuid: firstProduct.uuid,
        objectID: firstProduct.objectID,
        urlKey: firstProduct.urlKey,
        productUuid: firstProduct.productUuid,
      } : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
