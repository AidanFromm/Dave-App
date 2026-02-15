import { NextResponse } from "next/server";
import { stockxFetch } from "@/lib/stockx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await stockxFetch(
      `https://api.stockx.com/v2/catalog/products/${id}`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `StockX API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const p = data.product || data.Product || data;

    // Get variants
    let variants: any[] = [];
    try {
      const varRes = await stockxFetch(
        `https://api.stockx.com/v2/catalog/products/${id}/variants`
      );
      if (varRes.ok) {
        const varData = await varRes.json();
        variants = (varData.variants || varData.Variants || []).map((v: any) => ({
          id: v.id,
          size: v.sizeChart?.displayOptions?.[0]?.size || v.size || "",
          gtins: v.gtins || [],
        }));
      }
    } catch {}

    const productName = p.title || p.name || "";
    return NextResponse.json({
      id: p.id || id,
      title: productName,
      name: productName,
      brand: p.brand,
      sku: p.styleId || p.sku,
      styleId: p.styleId || p.sku,
      colorway: p.colorway,
      retailPrice: p.retailPrice,
      imageUrl: p.media?.thumbUrl || p.media?.imageUrl || "",
      imageUrls: [
        p.media?.imageUrl,
        p.media?.thumbUrl,
        p.media?.smallImageUrl,
      ].filter(Boolean),
      variants,
    });
  } catch (error) {
    console.error("StockX product error:", error);
    return NextResponse.json(
      { error: "Product lookup failed" },
      { status: 500 }
    );
  }
}
