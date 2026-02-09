import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Schedule a drop
export async function POST(request: Request) {
  try {
    const { productId, dropDate } = await request.json();

    if (!productId || !dropDate) {
      return NextResponse.json(
        { error: "Product ID and drop date are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({
        is_drop: true,
        drop_date: dropDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      console.error("Failed to schedule drop:", error);
      return NextResponse.json(
        { error: "Failed to schedule drop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Schedule drop error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Toggle drop status
export async function PATCH(request: Request) {
  try {
    const { productId, isDrop } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({
        is_drop: isDrop ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      console.error("Failed to update drop status:", error);
      return NextResponse.json(
        { error: "Failed to update drop status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update drop error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove drop
export async function DELETE(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("products")
      .update({
        is_drop: false,
        drop_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      console.error("Failed to remove drop:", error);
      return NextResponse.json(
        { error: "Failed to remove drop" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove drop error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
