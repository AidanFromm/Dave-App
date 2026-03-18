/**
 * Clover Auto-Sync — fires after product create/update in Supabase.
 * Uses admin client + Clover REST API to push changes to Clover POS.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getCloverClient } from "@/lib/clover";

export async function syncProductToClover(productId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const clover = await getCloverClient();
    if (!clover) {
      // Clover not configured — silently skip
      return;
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("id, name, price, quantity, sku, barcode, clover_item_id, is_active, size, condition")
      .eq("id", productId)
      .single();

    if (error || !product) {
      console.error(`clover-auto-sync: product ${productId} not found`);
      return;
    }

    // Build item name (include size + condition if available)
    let itemName = product.name || "Unnamed Product";
    if (product.size) itemName += ` Size ${product.size}`;
    if (product.condition && product.condition !== "new" && product.condition !== "New") {
      itemName += ` ${product.condition}`;
    }
    itemName = itemName.substring(0, 127); // Clover max

    const priceInCents = Math.round((product.price || 0) * 100);

    if (product.clover_item_id) {
      // UPDATE existing Clover item
      await clover.updateItem(product.clover_item_id, {
        name: itemName,
        price: priceInCents,
        sku: product.sku || undefined,
        code: product.barcode || undefined,
      });

      // Update stock
      await clover.updateStock(product.clover_item_id, product.quantity ?? 0);

      console.log(`clover-auto-sync: updated ${product.name} (${product.clover_item_id})`);
    } else {
      // CREATE new Clover item
      const cloverItem = await clover.createItem({
        name: itemName,
        price: priceInCents,
        sku: product.sku || undefined,
        code: product.barcode || undefined,
        priceType: "FIXED",
      });

      // Set stock
      if (product.quantity > 0) {
        await clover.updateStock(cloverItem.id, product.quantity);
      }

      // Store clover_item_id back in Supabase
      await supabase
        .from("products")
        .update({ clover_item_id: cloverItem.id })
        .eq("id", productId);

      console.log(`clover-auto-sync: created ${product.name} -> ${cloverItem.id}`);
    }
  } catch (err) {
    console.error(`clover-auto-sync error for ${productId}:`, err);
    // Don't throw — sync failures shouldn't break product operations
  }
}
