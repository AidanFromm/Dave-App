import { NextResponse } from "next/server";
import { STOCKX_API_BASE } from "@/lib/constants";
import { getStockXHeaders } from "@/lib/stockx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) {
  const { productId, variantId } = await params;

  if (!productId || !variantId) {
    return NextResponse.json(
      { error: "Product ID and Variant ID required" },
      { status: 400 }
    );
  }

  const headers = await getStockXHeaders();
  if (!headers) {
    return NextResponse.json({
      lastSale: null,
      highestBid: null,
      lowestAsk: null,
      salesLast72Hours: null,
    });
  }

  try {
    const res = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${productId}/variants/${variantId}/market-data`,
      { headers }
    );

    if (!res.ok) {
      return NextResponse.json({
        lastSale: null,
        highestBid: null,
        lowestAsk: null,
        salesLast72Hours: null,
      });
    }

    const data = await res.json();

    return NextResponse.json({
      lastSale: data.lastSalePrice ?? data.lastSale ?? null,
      highestBid: data.highestBid ?? data.highestBidPrice ?? null,
      lowestAsk: data.lowestAsk ?? data.lowestAskPrice ?? null,
      salesLast72Hours: data.salesLast72Hours ?? data.numberOfAsks ?? null,
    });
  } catch {
    return NextResponse.json({
      lastSale: null,
      highestBid: null,
      lowestAsk: null,
      salesLast72Hours: null,
    });
  }
}
