import { NextResponse } from "next/server";

const POKEMON_TCG_API = "https://api.pokemontcg.io/v2/cards";
const API_KEY = process.env.POKEMON_TCG_API_KEY || "";

async function fetchWithRetry(url: string, headers: Record<string, string>, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
      if (i === retries) return res;
    } catch {
      clearTimeout(timeout);
      if (i === retries) throw new Error("All retries failed");
    }
  }
  throw new Error("Unreachable");
}

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const page = searchParams.get("page") ?? "1";

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const trimmed = query.trim();

    // Build the search query for Pokemon TCG API
    // If it looks like a number, search by number; otherwise search by name
    let q: string;
    if (/^\d+$/.test(trimmed)) {
      q = `number:${trimmed}`;
    } else {
      q = `name:"${trimmed}*"`;
    }

    const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(q)}&page=${page}&pageSize=20&orderBy=-set.releaseDate`;

    const headers: Record<string, string> = { Accept: "application/json" };
    if (API_KEY) headers["X-Api-Key"] = API_KEY;

    const res = await fetchWithRetry(url, headers);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Pokemon TCG API error" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawCards = data.data ?? [];

    const cards = rawCards.map((c: Record<string, unknown>) => {
      const images = c.images as Record<string, string> | undefined;
      const set = c.set as Record<string, unknown> | undefined;
      const setImages = set?.images as Record<string, string> | undefined;
      const tcgplayer = c.tcgplayer as Record<string, unknown> | undefined;
      const prices = tcgplayer?.prices as Record<string, Record<string, number>> | undefined;

      // Get best market price from tcgplayer prices
      let marketPrice: number | null = null;
      if (prices) {
        for (const variant of Object.values(prices)) {
          if (variant.market != null) {
            marketPrice = variant.market;
            break;
          }
        }
      }

      return {
        id: c.id ?? "",
        name: c.name ?? "",
        number: c.number ?? "",
        rarity: c.rarity ?? "",
        supertype: c.supertype ?? "",
        subtypes: (c.subtypes as string[]) ?? [],
        imageSmall: images?.small ?? "",
        imageLarge: images?.large ?? "",
        setId: (set?.id as string) ?? "",
        setName: (set?.name as string) ?? "",
        setSeries: (set?.series as string) ?? "",
        setSymbol: setImages?.symbol ?? "",
        marketPrice,
        tcgplayerUrl: (tcgplayer?.url as string) ?? null,
      };
    });

    return NextResponse.json({
      cards,
      page: parseInt(page, 10),
      pageSize: 20,
      totalCount: data.totalCount ?? cards.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed - please try again." },
      { status: 500 }
    );
  }
}
