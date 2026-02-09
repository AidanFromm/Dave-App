import { NextResponse } from "next/server";
import { STOCKX_API_BASE } from "@/lib/constants";
import { getStockXHeaders } from "@/lib/stockx";

// Convert urlKey to Title-Case for StockX CDN
function toTitleCase(str: string): string {
  return str.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join("-");
}

// StockX CDN image URL construction
// Pattern: Title-Case slug + variations
function buildStockXImageUrl(urlKey: string): string {
  if (!urlKey) return "";
  const titleCased = toTitleCase(urlKey);
  return `https://images.stockx.com/images/${titleCased}-Product.jpg?fit=fill&bg=FFFFFF&w=500&h=500&fm=jpg&auto=compress`;
}

function buildStockXThumbUrl(urlKey: string): string {
  if (!urlKey) return "";
  const titleCased = toTitleCase(urlKey);
  return `https://images.stockx.com/images/${titleCased}-Product.jpg?fit=fill&bg=FFFFFF&w=200&h=200&fm=jpg&auto=compress`;
}

// Build multiple image URLs for different angles
function buildStockXImageUrls(urlKey: string): string[] {
  if (!urlKey) return [];
  const titleCased = toTitleCase(urlKey);
  const base = "https://images.stockx.com/images/";
  const params = "?fit=fill&bg=FFFFFF&w=500&h=500&fm=jpg&auto=compress";
  
  // StockX uses multiple image patterns
  return [
    `${base}${titleCased}-Product.jpg${params}`,        // Main product shot
    `${base}${titleCased}.jpg${params}`,                 // Alternate angle
    `${base}${titleCased}_02.jpg${params}`,              // Side view
    `${base}${titleCased}_03.jpg${params}`,              // Back view
    `${base}${titleCased}_04.jpg${params}`,              // Detail shot
  ];
}

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
        (v: Record<string, unknown>) => {
          // GTINs are objects like {identifier: "123", type: "UPC"} - extract identifiers
          const gtinsRaw = Array.isArray(v.gtins) ? v.gtins : [];
          const gtins = gtinsRaw.map((g: unknown) => {
            if (typeof g === "string") return g;
            if (g && typeof g === "object" && "identifier" in g) return (g as { identifier: string }).identifier;
            return "";
          }).filter(Boolean);

          // Size is in variantValue or sizeChart.defaultConversion.size
          const sizeChart = v.sizeChart as Record<string, unknown> | undefined;
          const defaultConversion = sizeChart?.defaultConversion as Record<string, unknown> | undefined;
          const size = (v.variantValue as string) ?? 
                       (defaultConversion?.size as string) ?? 
                       (v.sizeUS as string) ?? 
                       (v.size as string) ?? 
                       "";

          return {
            // Variant ID is "variantId" not "id"
            id: (v.variantId as string) ?? (v.id as string) ?? (v.productVariantId as string) ?? "",
            size,
            gtins,
          };
        }
      );
    } else {
      console.log("Variants fetch failed:", variantsRes.status);
    }

    // Product attributes are nested
    const attrs = product.productAttributes as Record<string, unknown> | undefined;
    
    // StockX v2 API doesn't return images - construct from urlKey
    const urlKey = product.urlKey ?? product.urlSlug ?? "";
    const imageUrl = buildStockXImageUrl(urlKey);
    const thumbUrl = buildStockXThumbUrl(urlKey);
    const imageUrls = buildStockXImageUrls(urlKey);

    return NextResponse.json({
      id: product.productId ?? product.id,
      title: product.title ?? product.name ?? "",
      brand: product.brand ?? "",
      colorway: (attrs?.colorway as string) ?? product.colorway ?? "",
      styleId: product.styleId ?? "",
      description: product.description ?? "",
      retailPrice: (attrs?.retailPrice as number) ?? product.retailPrice ?? 0,
      imageUrl,
      thumbUrl,
      imageUrls,
      urlSlug: urlKey,
      variants,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
