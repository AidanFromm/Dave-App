import { NextResponse } from "next/server";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

interface TCGPlayerPriceEntry {
  productId?: number;
  lowPrice?: number | null;
  midPrice?: number | null;
  highPrice?: number | null;
  marketPrice?: number | null;
  directLowPrice?: number | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Card ID required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${TCGDEX_BASE}/cards/${id}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: res.status }
      );
    }

    const card = await res.json();

    const image = card.image as string | undefined;
    const set = card.set as Record<string, unknown> | undefined;
    const pricing = card.pricing as Record<string, unknown> | undefined;
    const tcgplayer = pricing?.tcgplayer as Record<string, unknown> | undefined;

    const variantPrices: Record<
      string,
      { low: number | null; mid: number | null; high: number | null; market: number | null }
    > = {};

    if (tcgplayer) {
      for (const [variant, priceData] of Object.entries(tcgplayer)) {
        if (variant === "updated" || variant === "unit") continue;
        const p = priceData as TCGPlayerPriceEntry;
        variantPrices[variant] = {
          low: p.lowPrice ?? null,
          mid: p.midPrice ?? null,
          high: p.highPrice ?? null,
          market: p.marketPrice ?? null,
        };
      }
    }

    return NextResponse.json({
      id: card.id,
      name: card.name,
      supertype: card.category ?? "",
      subtypes: card.stage ? [card.stage] : [],
      hp: card.hp != null ? String(card.hp) : null,
      types: card.types ?? [],
      number: card.localId ?? "",
      rarity: card.rarity ?? "Unknown",
      artist: card.illustrator ?? null,
      imageSmall: image ? `${image}/low.png` : "",
      imageLarge: image ? `${image}/high.png` : "",
      set: {
        id: set?.id ?? "",
        name: set?.name ?? "",
        series: "",
        releaseDate: "",
        symbol: set?.symbol ? `${set.symbol}.png` : "",
        logo: set?.logo ? `${set.logo}.png` : "",
      },
      tcgplayerUrl: null,
      variantPrices,
      regulationMark: card.regulationMark ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch card" },
      { status: 500 }
    );
  }
}
