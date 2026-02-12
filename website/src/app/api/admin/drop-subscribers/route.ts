import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("drop_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch subscribers:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscribers: data ?? [] });
  } catch (error) {
    console.error("Subscribers fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
