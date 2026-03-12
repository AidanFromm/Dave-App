import { NextResponse } from "next/server";

// CardLedger Supabase (read-only, anon key — public product data)
const CARDLEDGER_URL = "https://vbedydaozlvujkpcojct.supabase.co";
const CARDLEDGER_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiZWR5ZGFvemx2dWprcGNvamN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjg5MjIsImV4cCI6MjA4NTY0NDkyMn0.dkF1RBdAOCqQIOHbF04o6bcit6L9vlLWz98Wo5VE-dc";

// Fallbacks
const POKEMON_TCG_API = "https://api.pokemontcg.io/v2/cards";
const API_KEY = process.env.POKEMON_TCG_API_KEY || "";

export const maxDuration = 15;

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const trimmed = query.trim();

  try {
    // Strategy 1: CardLedger Supabase (instant, free, has 120K+ cards)
    const clCards = await searchCardLedger(trimmed);
    if (clCards && clCards.length > 0) {
      return NextResponse.json({
        cards: clCards,
        page: 1,
        pageSize: 20,
        totalCount: clCards.length,
      });
    }

    // Strategy 2: Pokemon TCG API (might be down)
    const tcgCards = await searchPokemonTCG(trimmed);
    if (tcgCards && tcgCards.length > 0) {
      return NextResponse.json({
        cards: tcgCards,
        page: 1,
        pageSize: 20,
        totalCount: tcgCards.length,
      });
    }

    // Nothing found
    return NextResponse.json({
      cards: [],
      page: 1,
      pageSize: 20,
      totalCount: 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed - please try again." },
      { status: 500 }
    );
  }
}

async function searchCardLedger(query: string): Promise<CardResult[] | null> {
  try {
    // Search by name using Supabase text search
    const url = `${CARDLEDGER_URL}/rest/v1/products?game=eq.pokemon&name=ilike.*${encodeURIComponent(query)}*&select=id,name,set_name,image_url,market_price,card_number,rarity,category&order=market_price.desc.nullslast&limit=20`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: {
        apikey: CARDLEDGER_ANON,
        Authorization: `Bearer ${CARDLEDGER_ANON}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // Sort: cards WITH images first, then by price
    data.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aHasImg = a.image_url ? 1 : 0;
      const bHasImg = b.image_url ? 1 : 0;
      if (bHasImg !== aHasImg) return bHasImg - aHasImg;
      return ((b.market_price as number) || 0) - ((a.market_price as number) || 0);
    });

    // Map to CardResult format
    return data
      .filter((p: Record<string, unknown>) => p.name)
      .map((p: Record<string, unknown>) => {
        const imageUrl = (p.image_url as string) || "";
        // Upgrade TCGdex low to high quality if possible
        const imageLarge = imageUrl.replace("/low.", "/high.");
        
        return {
          id: (p.id as string) || "",
          name: (p.name as string) || "",
          number: (p.card_number as string) || "",
          rarity: (p.rarity as string) || "",
          supertype: "Pokémon",
          subtypes: [],
          imageSmall: imageUrl,
          imageLarge: imageLarge || imageUrl,
          setId: "",
          setName: (p.set_name as string) || "",
          setSeries: "",
          setSymbol: "",
          marketPrice: (p.market_price as number) || null,
          tcgplayerUrl: null,
        };
      });
  } catch {
    return null;
  }
}

async function searchPokemonTCG(query: string): Promise<CardResult[] | null> {
  try {
    let q: string;
    if (/^\d+$/.test(query)) {
      q = `number:${query}`;
    } else {
      q = `name:"${query}*"`;
    }

    const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(q)}&pageSize=20&orderBy=-set.releaseDate`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (API_KEY) headers["X-Api-Key"] = API_KEY;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

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
  } catch {
    return null;
  }
}
