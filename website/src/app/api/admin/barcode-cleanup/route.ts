import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";

// GET: List barcodes without images
// DELETE: Remove barcodes without images
export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = await createClient();

  // Find barcodes with no image_url AND empty/null image_urls array
  const { data, error } = await supabase
    .from("barcode_catalog")
    .select("id, barcode, product_name, brand, style_id, image_url, image_urls, created_at")
    .or("image_url.is.null,image_url.eq.")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter to only those with no usable images
  const noImages = (data ?? []).filter((entry) => {
    const hasImageUrl = entry.image_url && entry.image_url.trim() !== "";
    const hasImageUrls = Array.isArray(entry.image_urls) && entry.image_urls.length > 0;
    return !hasImageUrl && !hasImageUrls;
  });

  return NextResponse.json({
    total: noImages.length,
    entries: noImages,
  });
}

export async function DELETE() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = await createClient();

  // First get all entries
  const { data: allEntries } = await supabase
    .from("barcode_catalog")
    .select("id, barcode, image_url, image_urls");

  if (!allEntries) {
    return NextResponse.json({ deleted: 0 });
  }

  // Filter to entries without images
  const toDelete = allEntries.filter((entry) => {
    const hasImageUrl = entry.image_url && entry.image_url.trim() !== "";
    const hasImageUrls = Array.isArray(entry.image_urls) && entry.image_urls.length > 0;
    return !hasImageUrl && !hasImageUrls;
  });

  if (toDelete.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No entries without images found" });
  }

  const idsToDelete = toDelete.map((e) => e.id);

  const { error } = await supabase
    .from("barcode_catalog")
    .delete()
    .in("id", idsToDelete);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    deleted: idsToDelete.length,
    barcodes: toDelete.map((e) => e.barcode),
  });
}
