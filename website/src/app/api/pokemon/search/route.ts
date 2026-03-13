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
  const setHint = searchParams.get("set") || "";
  const yearHint = searchParams.get("year") || "";
  const cardNumberHint = searchParams.get("number") || "";

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const trimmed = query.trim();

  try {
    // Strategy 1: CardLedger Supabase (instant, free, has 120K+ cards)
    const clCards = await searchCardLedger(trimmed, setHint, yearHint, cardNumberHint);
    if (clCards && clCards.length > 0) {
      return NextResponse.json({
        cards: clCards,
        page: 1,
        pageSize: 20,
        totalCount: clCards.length,
      });
    }

    // Strategy 2: Pokemon TCG API (might be down)
    const tcgCards = await searchPokemonTCG(trimmed, yearHint, cardNumberHint);
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

async function searchCardLedger(
  query: string,
  setHint: string = "",
  yearHint: string = "",
  cardNumberHint: string = ""
): Promise<CardResult[] | null> {
  try {
    // Search by name — fetch extra results so we can filter/rank
    const url = `${CARDLEDGER_URL}/rest/v1/products?game=eq.pokemon&image_url=not.is.null&name=ilike.*${encodeURIComponent(query)}*&select=id,name,set_name,image_url,market_price,card_number,rarity,category,release_year&limit=80`;

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

    // Parse set hint keywords from PSA variety (e.g. "FUSION STRIKE-SECRET" → ["fusion", "strike"])
    const setKeywords = setHint
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["the", "secret", "holo", "rare"].includes(w));

    // Score and sort with much smarter matching
    data.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      let aScore = 0;
      let bScore = 0;

      const aSet = ((a.set_name as string) || "").toLowerCase();
      const bSet = ((b.set_name as string) || "").toLowerCase();
      const aName = ((a.name as string) || "").toLowerCase();
      const bName = ((b.name as string) || "").toLowerCase();
      const aNum = ((a.card_number as string) || "").toLowerCase();
      const bNum = ((b.card_number as string) || "").toLowerCase();
      const aYear = String((a.release_year as number) || "");
      const bYear = String((b.release_year as number) || "");

      // EXACT card number match = huge boost (most reliable identifier)
      if (cardNumberHint) {
        const numNorm = cardNumberHint.toLowerCase().replace(/^0+/, "");
        if (aNum === numNorm || aNum.replace(/^0+/, "") === numNorm) aScore += 100;
        if (bNum === numNorm || bNum.replace(/^0+/, "") === numNorm) bScore += 100;
      }

      // Year match = strong signal
      if (yearHint) {
        if (aYear === yearHint) aScore += 50;
        if (bYear === yearHint) bScore += 50;
      }

      // Exact name match (not just contains)
      const queryLower = query.toLowerCase();
      if (aName === queryLower) aScore += 30;
      if (bName === queryLower) bScore += 30;
      // Name starts with query
      if (aName.startsWith(queryLower)) aScore += 15;
      if (bName.startsWith(queryLower)) bScore += 15;

      // Set keyword matches
      const aSetMatch = setKeywords.filter((kw) => aSet.includes(kw)).length;
      const bSetMatch = setKeywords.filter((kw) => bSet.includes(kw)).length;
      aScore += aSetMatch * 20;
      bScore += bSetMatch * 20;

      // Check for promo indicators in set hint
      const isPromo = setHint.toLowerCase().includes("promo") || 
                       setHint.toLowerCase().includes("m-p") || 
                       setHint.toLowerCase().includes("mcdonald");
      if (isPromo) {
        if (aSet.includes("promo") || aSet.includes("mcdonald")) aScore += 40;
        if (bSet.includes("promo") || bSet.includes("mcdonald")) bScore += 40;
      }

      // Japanese card indicators
      const isJapanese = setHint.toLowerCase().includes("japanese") ||
                          setHint.toLowerCase().includes("japan");
      if (isJapanese) {
        if (aSet.includes("japanese") || aSet.includes("japan")) aScore += 30;
        if (bSet.includes("japanese") || bSet.includes("japan")) bScore += 30;
      }

      // Prefer English sets by default (unless PSA says Japanese)
      if (!isJapanese) {
        const aEnglish = /^[a-z0-9\s\-_.#()'&!:]+$/i.test(aSet) ? 1 : 0;
        const bEnglish = /^[a-z0-9\s\-_.#()'&!:]+$/i.test(bSet) ? 1 : 0;
        aScore += aEnglish * 10;
        bScore += bEnglish * 10;
      }

      // Tiebreaker: higher market price (usually more relevant/popular printings)
      if (bScore === aScore) {
        return ((b.market_price as number) || 0) - ((a.market_price as number) || 0);
      }

      return bScore - aScore;
    });

    // Only return cards with images, limit to 20
    return data
      .filter((p: Record<string, unknown>) => p.name && p.image_url)
      .slice(0, 20)
      .map((p: Record<string, unknown>) => {
        const imageUrl = (p.image_url as string) || "";
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

async function searchPokemonTCG(
  query: string,
  yearHint: string = "",
  cardNumberHint: string = ""
): Promise<CardResult[] | null> {
  try {
    // Build a smarter query using all available info
    const parts: string[] = [];
    parts.push(`name:"${query}*"`);
    if (cardNumberHint) parts.push(`number:"${cardNumberHint}"`);

    const q = parts.join(" ");
    const url = `${POKEMON_TCG_API}?q=${encodeURIComponent(q)}&pageSize=20&orderBy=-set.releaseDate`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (API_KEY) headers["X-Api-Key"] = API_KEY;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    let rawCards = data.data ?? [];

    // If we have a year hint, prioritize cards from that year
    if (yearHint) {
      rawCards.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aSet = a.set as Record<string, unknown> | undefined;
        const bSet = b.set as Record<string, unknown> | undefined;
        const aDate = (aSet?.releaseDate as string) || "";
        const bDate = (bSet?.releaseDate as string) || "";
        const aMatch = aDate.startsWith(yearHint) ? 1 : 0;
        const bMatch = bDate.startsWith(yearHint) ? 1 : 0;
        return bMatch - aMatch;
      });
    }

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
