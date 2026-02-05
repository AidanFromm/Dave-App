import { NextResponse } from "next/server";

const POKEMON_TCG_BASE = "https://api.pokemontcg.io/v2";

interface PriceEntry {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  market?: number | null;
  directLow?: number | null;
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
    const res = await fetch(`${POKEMON_TCG_BASE}/cards/${id}`, {
      headers: {
        "X-Api-Key": process.env.POKEMON_TCG_API_KEY!,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const card = data.data;

    const images = card.images as Record<string, string> | undefined;
    const set = card.set as Record<string, unknown>;
    const setImages = set?.images as Record<string, string> | undefined;
    const tcgplayer = card.tcgplayer as Record<string, unknown> | undefined;
    const prices = tcgplayer?.prices as Record<string, PriceEntry> | undefined;

    // Build variant prices
    const variantPrices: Record<
      string,
      { low: number | null; mid: number | null; high: number | null; market: number | null }
    > = {};

    if (prices) {
      for (const [variant, priceData] of Object.entries(prices)) {
        variantPrices[variant] = {
          low: priceData.low ?? null,
          mid: priceData.mid ?? null,
          high: priceData.high ?? null,
          market: priceData.market ?? null,
        };
      }
    }

    return NextResponse.json({
      id: card.id,
      name: card.name,
      supertype: card.supertype,
      subtypes: card.subtypes ?? [],
      hp: card.hp ?? null,
      types: card.types ?? [],
      number: card.number,
      rarity: card.rarity ?? "Unknown",
      artist: card.artist ?? null,
      imageSmall: images?.small ?? "",
      imageLarge: images?.large ?? "",
      set: {
        id: set.id,
        name: set.name,
        series: set.series,
        releaseDate: set.releaseDate,
        symbol: setImages?.symbol ?? "",
        logo: setImages?.logo ?? "",
      },
      tcgplayerUrl: tcgplayer?.url ?? null,
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
