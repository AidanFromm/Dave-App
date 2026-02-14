import { NextResponse } from "next/server";
import { stockxFetch } from "@/lib/stockx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string; variantId: string }> }
) {
  const { productId, variantId } = await params;

  try {
    const res = await stockxFetch(
      `https://api.stockx.com/v2/catalog/products/${productId}/variants/${variantId}/market-data`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `StockX API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      lowestAsk: data.lowestAsk || data.lowestAskAmount || null,
      highestBid: data.highestBid || data.highestBidAmount || null,
      lastSale: data.lastSale || data.lastSaleAmount || null,
      salesLast72Hours: data.salesLast72Hours || null,
      volatility: data.volatility || null,
    });
  } catch (error) {
    console.error("StockX market data error:", error);
    return NextResponse.json(
      { error: "Market data lookup failed" },
      { status: 500 }
    );
  }
}
