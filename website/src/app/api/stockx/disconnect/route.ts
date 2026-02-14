import { NextResponse } from "next/server";
import { deleteStockXTokens } from "@/lib/stockx";

export async function POST() {
  try {
    await deleteStockXTokens();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("StockX disconnect error:", error);
    return NextResponse.json({ error: "Disconnect failed" }, { status: 500 });
  }
}
