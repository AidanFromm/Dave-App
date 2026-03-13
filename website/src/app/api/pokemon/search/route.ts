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
    
    // Check if CardLedger has an EXACT card number match
    const hasExactNumberMatch = cardNumberHint && clCards?.some(
      (c) => c.number === cardNumberHint || c.number.replace(/^0+/, "") === cardNumberHint.replace(/^0+/, "")
    );

    if (clCards && clCards.length > 0 && hasExactNumberMatch) {
      return NextResponse.json({
        cards: clCards,
        page: 1,
        pageSize: 20,
        totalCount: clCards.length,
      });
    }

    // Strategy 2: TCGdex (free, fast, has EVERY card with images)
    const tcgdexCards = await searchTCGdex(trimmed, cardNumberHint);
    if (tcgdexCards && tcgdexCards.length > 0) {
      // Merge with CardLedger results for price data
      const merged = tcgdexCards;
      if (clCards) {
        // Add any CardLedger cards not already in tcgdex results
        for (const cl of clCards) {
          if (!merged.some((m) => m.number === cl.number && m.setName === cl.setName)) {
            merged.push(cl);
          }
        }
      }
      return NextResponse.json({
        cards: merged,
        page: 1,
        pageSize: 20,
        totalCount: merged.length,
      });
    }

    // Strategy 3: Return CardLedger results even without exact match
    if (clCards && clCards.length > 0) {
      return NextResponse.json({
        cards: clCards,
        page: 1,
        pageSize: 20,
        totalCount: clCards.length,
      });
    }

    // Strategy 4: Pokemon TCG API (often down, last resort)
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
    // Use first word as primary search (handles "PIKACHU GREY FELT HAT" → search "PIKACHU")
    // Then scoring refines by card number, set, etc.
    const firstWord = query.split(/\s+/)[0];
    const searchTerm = query.length > 30 ? firstWord : query;
    const url = `${CARDLEDGER_URL}/rest/v1/products?game=eq.pokemon&image_url=not.is.null&name=ilike.*${encodeURIComponent(searchTerm)}*&select=id,name,set_name,image_url,market_price,card_number,rarity,category&limit=80`;

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
      const aYear = "";
      const bYear = "";

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

      // Name matching — check how many query words appear in the name
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
      if (aName === queryLower) aScore += 30;
      if (bName === queryLower) bScore += 30;
      // Name starts with query
      if (aName.startsWith(queryLower)) aScore += 15;
      if (bName.startsWith(queryLower)) bScore += 15;
      // Count how many query words appear in card name (handles "PIKACHU GREY FELT HAT" matching "Pikachu with Grey Felt Hat")
      const aWordMatch = queryWords.filter(w => aName.includes(w)).length;
      const bWordMatch = queryWords.filter(w => bName.includes(w)).length;
      aScore += aWordMatch * 10;
      bScore += bWordMatch * 10;

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


// TCGdex API — free, fast, has EVERY card with images
async function searchTCGdex(
  query: string,
  cardNumberHint: string = ""
): Promise<CardResult[] | null> {
  try {
    // Search by name first
    const url = `https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(query)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    // If we have a card number hint, find the exact match first
    let sorted = [...data];
    if (cardNumberHint) {
      sorted.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aLocal = String(a.localId || "");
        const bLocal = String(b.localId || "");
        const aMatch = aLocal === cardNumberHint ? 100 : 0;
        const bMatch = bLocal === cardNumberHint ? 100 : 0;
        return bMatch - aMatch;
      });
    }

    // Fetch full card data for top results (need image URLs)
    const results: CardResult[] = [];
    const topCards = sorted.slice(0, 12);

    // Batch: fetch details for each card (TCGdex has individual card endpoints)
    const fetches = topCards.map(async (card: Record<string, unknown>) => {
      try {
        const cardId = card.id as string;
        const detailRes = await fetch(
          `https://api.tcgdex.net/v2/en/cards/${cardId}`,
          { signal: AbortSignal.timeout(3000) }
        );
        if (!detailRes.ok) return null;
        const detail = await detailRes.json();
        const imageBase = detail.image as string;
        if (!imageBase) return null;

        const setData = detail.set as Record<string, unknown> | undefined;
        return {
          id: cardId,
          name: (detail.name as string) || "",
          number: String(detail.localId || ""),
          rarity: (detail.rarity as string) || "",
          supertype: "Pokémon",
          subtypes: [],
          imageSmall: `${imageBase}/low.webp`,
          imageLarge: `${imageBase}/high.webp`,
          setId: (setData?.id as string) || "",
          setName: (setData?.name as string) || "",
          setSeries: "",
          setSymbol: setData?.logo ? `${String(setData.logo)}/low.webp` : "",
          marketPrice: null,
          tcgplayerUrl: null,
        };
      } catch {
        return null;
      }
    });

    const resolved = await Promise.all(fetches);
    for (const r of resolved) {
      if (r) results.push(r);
    }

    return results.length > 0 ? results : null;
  } catch {
    return null;
  }
}
