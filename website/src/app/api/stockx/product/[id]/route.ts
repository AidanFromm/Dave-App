import { NextResponse } from "next/server";
import { STOCKX_API_BASE } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  try {
    // Fetch product details
    const productRes = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${id}`,
      {
        headers: {
          "x-api-key": process.env.STOCKX_API_KEY!,
          Accept: "application/json",
        },
      }
    );

    if (!productRes.ok) {
      return NextResponse.json(
        { error: "StockX product not found" },
        { status: productRes.status }
      );
    }

    const product = await productRes.json();

    // Fetch variants (sizes)
    const variantsRes = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${id}/variants?limit=100`,
      {
        headers: {
          "x-api-key": process.env.STOCKX_API_KEY!,
          Accept: "application/json",
        },
      }
    );

    let variants: Array<{ id: string; size: string; gtins: string[] }> = [];
    if (variantsRes.ok) {
      const variantsData = await variantsRes.json();
      variants = (variantsData.variants ?? []).map(
        (v: Record<string, unknown>) => ({
          id: v.id,
          size: v.sizeUS ?? v.size ?? "",
          gtins: Array.isArray(v.gtins) ? v.gtins : [],
        })
      );
    }

    const media = product.media as Record<string, unknown> | undefined;
    const imageUrl =
      media && "imageUrl" in media ? (media.imageUrl as string) : "";
    const gallery = media && "gallery" in media && Array.isArray(media.gallery)
      ? (media.gallery as string[])
      : [];
    const imageUrls = imageUrl
      ? [imageUrl, ...gallery.filter((u) => u !== imageUrl)]
      : gallery;

    return NextResponse.json({
      id: product.id,
      title: product.title ?? product.name,
      brand: product.brand,
      colorway: product.colorway,
      styleId: product.styleId,
      description: product.description ?? "",
      retailPrice: product.retailPrice ?? 0,
      imageUrl,
      imageUrls,
      urlSlug: product.urlSlug ?? "",
      variants,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
