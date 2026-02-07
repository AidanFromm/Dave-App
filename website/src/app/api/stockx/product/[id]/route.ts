import { NextResponse } from "next/server";
import { STOCKX_API_BASE } from "@/lib/constants";
import { getStockXHeaders } from "@/lib/stockx";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  const headers = await getStockXHeaders();
  console.log("StockX headers available:", !!headers);
  if (!headers) {
    return NextResponse.json(
      { error: "StockX not connected - no valid tokens found" },
      { status: 401 }
    );
  }

  try {
    const productRes = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${id}`,
      { headers }
    );

    if (!productRes.ok) {
      return NextResponse.json(
        { error: "StockX product not found" },
        { status: productRes.status }
      );
    }

    const product = await productRes.json();
    console.log("StockX product response:", JSON.stringify(product, null, 2));

    const variantsRes = await fetch(
      `${STOCKX_API_BASE}/v2/catalog/products/${id}/variants?limit=100`,
      { headers }
    );

    let variants: Array<{ id: string; size: string; gtins: string[] }> = [];
    if (variantsRes.ok) {
      const variantsData = await variantsRes.json();
      console.log("StockX variants response:", JSON.stringify(variantsData, null, 2));
      // Handle both array at root or nested under "variants"
      const variantsList = Array.isArray(variantsData) ? variantsData : (variantsData.variants ?? []);
      variants = variantsList.map(
        (v: Record<string, unknown>) => ({
          // Try multiple ID field names
          id: v.id ?? v.variantId ?? v.productVariantId ?? "",
          // Try multiple size field names
          size: v.sizeUS ?? v.size ?? v.sizeTitle ?? "",
          gtins: Array.isArray(v.gtins) ? v.gtins : (v.gtin ? [v.gtin] : []),
        })
      );
    } else {
      console.log("Variants fetch failed:", variantsRes.status);
    }

    const media = product.media as Record<string, unknown> | undefined;
    const attrs = product.productAttributes as Record<string, unknown> | undefined;
    console.log("StockX media object:", JSON.stringify(media, null, 2));
    console.log("StockX productAttributes:", JSON.stringify(attrs, null, 2));
    
    // Try multiple possible image fields
    const imageUrl =
      (media && "imageUrl" in media ? (media.imageUrl as string) : "") ||
      (media && "smallImageUrl" in media ? (media.smallImageUrl as string) : "") ||
      (media && "thumbUrl" in media ? (media.thumbUrl as string) : "");
    
    // Try gallery, all360Images, or gallery360
    const gallery = 
      (media && "gallery" in media && Array.isArray(media.gallery) ? (media.gallery as string[]) : []) ||
      (media && "all360Images" in media && Array.isArray(media.all360Images) ? (media.all360Images as string[]) : []) ||
      [];
    
    const imageUrls = imageUrl
      ? [imageUrl, ...gallery.filter((u) => u !== imageUrl)]
      : gallery;

    return NextResponse.json({
      id: product.productId ?? product.id,
      title: product.title ?? product.name ?? "",
      brand: product.brand ?? "",
      colorway: product.colorway ?? (attrs && attrs.colorway) ?? "",
      styleId: product.styleId ?? "",
      description: product.description ?? "",
      retailPrice: product.retailPrice ?? (attrs && attrs.retailPrice) ?? 0,
      imageUrl,
      imageUrls,
      urlSlug: product.urlKey ?? product.urlSlug ?? "",
      variants,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
