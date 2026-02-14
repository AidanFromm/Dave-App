"use server";

import { isStockXConnected, deleteStockXTokens } from "@/lib/stockx";

export async function checkStockXConnection(): Promise<boolean> {
  return isStockXConnected();
}

export async function disconnectStockX(): Promise<void> {
  await deleteStockXTokens();
}
