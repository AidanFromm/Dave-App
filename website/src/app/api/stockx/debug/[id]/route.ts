import { NextResponse } from "next/server";
import { STOCKX_API_BASE } from "@/lib/constants";
import { getStockXHeaders } from "@/lib/stockx";

// Debug endpoint - returns raw StockX response for inspection
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const headers = await getStockXHeaders();
  if (!headers) {
    return NextResponse.json(
      { error: "StockX not connected" },
      { status: 401 }
    );
  }

  try {
    const productRes = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${id}`,
      { headers }
    );

    const productRaw = await productRes.json();

    const variantsRes = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${id}/variants?limit=100`,
      { headers }
    );

    const variantsRaw = await variantsRes.json();

    // Return both raw responses for inspection
    return NextResponse.json({
      productStatus: productRes.status,
      product: productRaw,
      variantsStatus: variantsRes.status,
      variants: variantsRaw,
      // Also show all top-level keys for easy inspection
      productKeys: Object.keys(productRaw ?? {}),
      variantsKeys: Object.keys(variantsRaw ?? {}),
      // Check if variants is an array or has nested data
      variantsType: Array.isArray(variantsRaw) ? "array" : typeof variantsRaw,
      firstVariant: Array.isArray(variantsRaw) 
        ? variantsRaw[0] 
        : (variantsRaw?.variants?.[0] ?? variantsRaw?.data?.[0] ?? null),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch", detail: String(e) },
      { status: 500 }
    );
  }
}
