"use server";

import { isStockXConnected, getStockXHeaders } from "@/lib/stockx";

export async function checkStockXConnection(): Promise<boolean> {
  return isStockXConnected();
}

export async function connectStockX(): Promise<{ success: boolean; error?: string }> {
  // This triggers client credentials token fetch via getStockXHeaders
  const headers = await getStockXHeaders();
  if (!headers) {
    return {
      success: false,
      error: "Failed to connect to StockX. Check that your OAuth app supports client_credentials grant type in the StockX developer portal."
    };
  }
  return { success: true };
}
