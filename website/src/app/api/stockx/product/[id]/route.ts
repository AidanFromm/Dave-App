import { NextResponse } from "next/server";

const STOCKX_API_KEY = process.env.STOCKX_API_KEY || "SQijlNY3Vl1QtyztWOb2R5cKdzyTvi272fpepFH6";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const res = await fetch(
      `https://api.stockx.com/v2/catalog/products/${id}`,
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
    const p = data.product || data.Product || data;

    // Get variants
    let variants: any[] = [];
    try {
      const varRes = await fetch(
        `https://api.stockx.com/v2/catalog/products/${id}/variants`,
        {
          headers: {
            "x-api-key": STOCKX_API_KEY,
            Accept: "application/json",
          },
        }
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

    return NextResponse.json({
      id: p.id || id,
      name: p.title || p.name,
      brand: p.brand,
      sku: p.styleId || p.sku,
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
