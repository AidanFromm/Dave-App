import { createAdminClient } from "@/lib/supabase/admin";
import { getCloverClient, type CloverClient, type CloverItem } from "@/lib/clover";

interface SyncResult {
  success: boolean;
  total: number;
  matched: number;
  updated: number;
  created: number;
  skipped: number;
  errors: string[];
}

interface SyncStatus {
  lastSyncAt: string | null;
  isConnected: boolean;
  mismatches: Array<{
    productId: string;
    productName: string;
    websiteStock: number;
    cloverStock: number;
    cloverItemId: string | null;
  }>;
}

// --- Helpers ---

function getCloverClientOrThrow(client: CloverClient | null): CloverClient {
  if (!client) {
    throw new Error(
      "Clover not configured. Add your Clover API keys to enable sync."
    );
  }
  return client;
}

// --- Sync To Clover ---

/**
 * Push a single product to Clover. Creates or updates the item.
 * Stores clover_item_id back in Supabase for linking.
 */
export async function syncToClover(productId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getCloverClientOrThrow(await getCloverClient());
    const supabase = createAdminClient();

    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (error || !product) {
      return { success: false, error: "Product not found" };
    }

    // Price in cents for Clover
    const priceInCents = Math.round((product.price ?? 0) * 100);

    const cloverData = {
      name: product.name,
      price: priceInCents,
      sku: product.sku || undefined,
      code: product.barcode || undefined,
      hidden: !product.is_active,
    };

    let cloverItemId = product.clover_item_id;

    if (cloverItemId) {
      // Update existing
      await client.updateItem(cloverItemId, cloverData);
    } else {
      // Create new
      const created = await client.createItem(cloverData);
      cloverItemId = created.id;

      // Store the link
      await supabase
        .from("products")
        .update({
          clover_item_id: cloverItemId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId);
    }

    // Update stock
    if (cloverItemId) {
      await client.updateStock(cloverItemId, product.quantity ?? 0);
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // syncToClover error logged
    return { success: false, error: msg };
  }
}

// --- Sync From Clover ---

/**
 * Pull all Clover inventory and update our database.
 * Matches by SKU, barcode, or clover_item_id.
 */
export async function syncFromClover(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    total: 0,
    matched: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const client = getCloverClientOrThrow(await getCloverClient());
    const supabase = createAdminClient();

    const cloverItems = await client.getInventory();
    result.total = cloverItems.length;

    const { data: products } = await supabase.from("products").select("*");
    if (!products) {
      result.errors.push("Failed to fetch products from database");
      result.success = false;
      return result;
    }

    const now = new Date().toISOString();

    for (const ci of cloverItems) {
      const match = findMatchingProduct(products, ci);

      if (!match) {
        result.skipped += 1;
        continue;
      }

      result.matched += 1;

      const cloverQty = ci.itemStock?.quantity ?? ci.stockCount ?? 0;
      const currentQty = (match.quantity as number) ?? 0;

      // Link clover_item_id if not already linked
      const updates: Record<string, unknown> = {};
      if (!match.clover_item_id && ci.id) {
        updates.clover_item_id = ci.id;
      }

      if (cloverQty !== currentQty) {
        updates.quantity = cloverQty;
        updates.updated_at = now;

        // Log adjustment
        await supabase.from("inventory_adjustments").insert({
          product_id: match.id as string,
          quantity_change: cloverQty - currentQty,
          reason: "adjustment",
          previous_quantity: currentQty,
          new_quantity: cloverQty,
          notes: `Clover sync - ${ci.name}`,
          adjusted_by: "clover_sync",
          source: "clover_webhook",
        });
      }

      if (Object.keys(updates).length > 0) {
        if (!updates.updated_at) updates.updated_at = now;
        const { error } = await supabase
          .from("products")
          .update(updates)
          .eq("id", match.id as string);

        if (error) {
          result.errors.push(`Failed to update ${match.name}: ${error.message}`);
        } else {
          result.updated += 1;
        }
      } else {
        result.skipped += 1;
      }
    }

    // Update last_sync_at
    await supabase
      .from("clover_settings")
      .update({ last_sync_at: now, updated_at: now })
      .eq("is_active", true);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(msg);
    result.success = false;
  }

  return result;
}

// --- Handle Clover Sale ---

/**
 * When notified of a Clover sale, deduct from website inventory.
 */
export async function handleCloverSale(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getCloverClientOrThrow(await getCloverClient());
    const supabase = createAdminClient();

    const order = await client.getOrder(orderId);
    if (!order) {
      return { success: false, error: "Order not found in Clover" };
    }

    const lineItems = order.lineItems?.elements ?? [];
    const now = new Date().toISOString();

    for (const li of lineItems) {
      const cloverItemId = li.item?.id;
      if (!cloverItemId) continue;

      // Find matching product
      const { data: product } = await supabase
        .from("products")
        .select("id, quantity")
        .or(`clover_item_id.eq.${cloverItemId},name.ilike.${li.name}`)
        .single();

      if (!product) continue;

      const qty = li.unitQty || 1;
      const newQuantity = Math.max(0, product.quantity - qty);

      await supabase
        .from("products")
        .update({ quantity: newQuantity, updated_at: now })
        .eq("id", product.id);

      await supabase.from("inventory_adjustments").insert({
        product_id: product.id,
        quantity_change: -qty,
        reason: "sold_instore",
        previous_quantity: product.quantity,
        new_quantity: newQuantity,
        notes: `Clover order ${orderId}`,
        adjusted_by: "clover_webhook",
        source: "clover_webhook",
      });
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

// --- Handle Website Sale ---

/**
 * When a website sale happens, update Clover stock.
 */
export async function handleWebsiteSale(
  productId: string,
  quantitySold: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = await getCloverClient();
    if (!client) return { success: true }; // Clover not configured, skip silently

    const supabase = createAdminClient();
    const { data: product } = await supabase
      .from("products")
      .select("clover_item_id, quantity")
      .eq("id", productId)
      .single();

    if (!product?.clover_item_id) return { success: true }; // Not linked

    const newQty = Math.max(0, (product.quantity ?? 0) - quantitySold);
    await client.updateStock(product.clover_item_id, newQty);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // handleWebsiteSale error logged
    return { success: false, error: msg };
  }
}

// --- Full Sync ---

/**
 * Complete bi-directional sync. Clover is source of truth for stock counts.
 * Website products without Clover links get pushed to Clover.
 */
export async function fullSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    total: 0,
    matched: 0,
    updated: 0,
    created: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const client = getCloverClientOrThrow(await getCloverClient());
    const supabase = createAdminClient();

    // Step 1: Pull from Clover (Clover is source of truth for stock)
    const fromResult = await syncFromClover();
    result.matched += fromResult.matched;
    result.updated += fromResult.updated;
    result.errors.push(...fromResult.errors);

    // Step 2: Push unlinked website products to Clover
    const { data: unlinkedProducts } = await supabase
      .from("products")
      .select("id, name, price, sku, barcode, quantity, is_active")
      .is("clover_item_id", null)
      .eq("is_active", true);

    if (unlinkedProducts) {
      result.total += unlinkedProducts.length;
      for (const p of unlinkedProducts) {
        const pushResult = await syncToClover(p.id);
        if (pushResult.success) {
          result.created += 1;
        } else {
          result.errors.push(
            `Failed to push ${p.name}: ${pushResult.error}`
          );
        }
      }
    }

    result.total += fromResult.total;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(msg);
    result.success = false;
  }

  return result;
}

// --- Sync Status ---

export async function getSyncStatus(): Promise<SyncStatus> {
  const status: SyncStatus = {
    lastSyncAt: null,
    isConnected: false,
    mismatches: [],
  };

  try {
    const client = await getCloverClient();
    if (!client) return status;

    const supabase = createAdminClient();

    const { data: settings } = await supabase
      .from("clover_settings")
      .select("last_sync_at, is_active")
      .eq("is_active", true)
      .single();

    if (settings) {
      status.lastSyncAt = settings.last_sync_at;
      status.isConnected = true;
    }

    // Check for mismatches
    const cloverItems = await client.getInventory();
    const { data: products } = await supabase
      .from("products")
      .select("id, name, quantity, clover_item_id, sku, barcode");

    if (products && cloverItems.length > 0) {
      for (const ci of cloverItems) {
        const match = findMatchingProduct(products, ci);
        if (!match) continue;

        const cloverQty = ci.itemStock?.quantity ?? ci.stockCount ?? 0;
        const webQty = (match.quantity as number) ?? 0;

        if (cloverQty !== webQty) {
          status.mismatches.push({
            productId: match.id as string,
            productName: match.name as string,
            websiteStock: webQty,
            cloverStock: cloverQty,
            cloverItemId: ci.id,
          });
        }
      }
    }
  } catch (err) {
    // getSyncStatus error
  }

  return status;
}

// --- Utility ---

function findMatchingProduct(
  products: Array<Record<string, unknown>>,
  cloverItem: CloverItem
): Record<string, unknown> | undefined {
  return products.find((p) => {
    // Match by clover_item_id first
    if (p.clover_item_id && p.clover_item_id === cloverItem.id) return true;
    // Match by SKU
    if (cloverItem.sku && p.sku && cloverItem.sku === p.sku) return true;
    // Match by barcode
    if (cloverItem.code && p.barcode && cloverItem.code === p.barcode) return true;
    return false;
  });
}
