import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.stockx.com/v2/catalog/search?query=${encodeURIComponent(query)}&limit=20`,
      {
        headers: {
          "x-api-key": process.env.STOCKX_API_KEY!,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "StockX API error" },
        { status: res.status }
      );
    }

    const data = await res.json();

    const products = (data.products ?? []).map((p: Record<string, unknown>) => {
      const media = p.media as Record<string, unknown> | undefined;
      return {
        id: p.id,
        name: p.title ?? p.name,
        brand: p.brand,
        colorway: p.colorway,
        styleId: p.styleId,
        retailPrice: p.retailPrice ?? 0,
        thumbnailUrl: media && "thumbUrl" in media ? media.thumbUrl : "",
        imageUrl: media && "imageUrl" in media ? media.imageUrl : "",
        urlSlug: p.urlSlug ?? "",
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
