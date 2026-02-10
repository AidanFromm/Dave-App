import { NextResponse } from "next/server";

// Free UPC lookup fallback using UPCitemdb (no auth required for trial)
// and Open Food Facts as secondary fallback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const upc = searchParams.get("upc");

  if (!upc) {
    return NextResponse.json({ error: "UPC required" }, { status: 400 });
  }

  // Try UPCitemdb first
  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`, {
      headers: { "Accept": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return NextResponse.json({
          source: "upcitemdb",
          title: item.title || "",
          brand: item.brand || "",
          images: item.images || [],
          description: item.description || "",
        });
      }
    }
  } catch (e) {
    console.error("UPCitemdb lookup failed:", e);
  }

  return NextResponse.json({ source: "none", title: "", brand: "", images: [], description: "" });
}
