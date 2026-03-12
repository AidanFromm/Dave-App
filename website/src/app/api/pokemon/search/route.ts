import { NextResponse } from "next/server";

const POKEMON_TCG_API = "https://api.pokemontcg.io/v2/cards";
const SCRYDEX_API = "https://api.scrydex.com/v1/cards";
const API_KEY = process.env.POKEMON_TCG_API_KEY || "";
const SCRYDEX_KEY = process.env.SCRYDEX_API_KEY || "";

async function tryFetch(url: string, headers: Record<string, string>, timeoutMs = 8000): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) return res;
    return null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
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

    // Try Pokemon TCG API first
    let cards = await searchPokemonTCG(trimmed, page);

    // If Pokemon TCG API fails, try Scrydex as fallback
    if (cards === null && SCRYDEX_KEY) {
      cards = await searchScrydex(trimmed, page);
    }

    // If both fail, return empty
    if (cards === null) {
      return NextResponse.json({
        cards: [],
        page: parseInt(page, 10),
        pageSize: 20,
        totalCount: 0,
      });
    }

    return NextResponse.json({
      cards,
      page: parseInt(page, 10),
      pageSize: 20,
      totalCount: cards.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed - please try again." },
      { status: 500 }
    );
  }
}

interface CardResult {
  id: string;
  name: string;
  number: string;
  rarity: string;
  supertype: string;
  subtypes: string[];
  imageSmall: string;
  imageLarge: string;
  setId: string;
  setName: string;
  setSeries: string;
  setSymbol: string;
  marketPrice: number | null;
  tcgplayerUrl: string | null;
}

async function searchPokemonTCG(query: string, page: string): Promise<CardResult[] | null> {
  let q: string;
  if (/^\d+$/.test(query)) {
    q = `number:${query}`;
  } else {
    q = `name:"${query}*"`;
  }

  const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(q)}&page=${page}&pageSize=20&orderBy=-set.releaseDate`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) headers["X-Api-Key"] = API_KEY;

  const res = await tryFetch(url, headers);
  if (!res) return null;

  const data = await res.json();
  const rawCards = data.data ?? [];

  return rawCards.map((c: Record<string, unknown>) => {
    const images = c.images as Record<string, string> | undefined;
    const set = c.set as Record<string, unknown> | undefined;
    const setImages = set?.images as Record<string, string> | undefined;
    const tcgplayer = c.tcgplayer as Record<string, unknown> | undefined;
    const prices = tcgplayer?.prices as Record<string, Record<string, number>> | undefined;

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
      id: (c.id as string) ?? "",
      name: (c.name as string) ?? "",
      number: (c.number as string) ?? "",
      rarity: (c.rarity as string) ?? "",
      supertype: (c.supertype as string) ?? "",
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
}

async function searchScrydex(query: string, page: string): Promise<CardResult[] | null> {
  const url = `${SCRYDEX_API}?name=${encodeURIComponent(query)}&game=pokemon&page=${page}&limit=20`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Api-Key": SCRYDEX_KEY,
  };

  const res = await tryFetch(url, headers, 10000);
  if (!res) return null;

  const data = await res.json();
  const rawCards = data.data ?? data.cards ?? [];

  return rawCards.map((c: Record<string, unknown>) => {
    const images = c.images as Record<string, string> | undefined;
    return {
      id: (c.id as string) ?? "",
      name: (c.name as string) ?? "",
      number: (c.number as string) ?? "",
      rarity: (c.rarity as string) ?? "",
      supertype: (c.supertype as string) ?? "",
      subtypes: (c.subtypes as string[]) ?? [],
      imageSmall: images?.small ?? (c.image as string) ?? "",
      imageLarge: images?.large ?? (c.image_large as string) ?? (c.image as string) ?? "",
      setId: (c.set_id as string) ?? (c.setId as string) ?? "",
      setName: (c.set_name as string) ?? (c.setName as string) ?? "",
      setSeries: (c.series as string) ?? "",
      setSymbol: "",
      marketPrice: (c.price as number) ?? (c.market_price as number) ?? null,
      tcgplayerUrl: null,
    };
  });
}
