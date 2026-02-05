import { NextResponse } from "next/server";

const POKEMON_TCG_BASE = "https://api.pokemontcg.io/v2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const setId = searchParams.get("set");
  const page = searchParams.get("page") ?? "1";

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    // Build search query
    const parts: string[] = [];

    // Name search with wildcard
    parts.push(`name:${query}*`);

    // Optional set filter
    if (setId) {
      parts.push(`set.id:${setId}`);
    }

    const q = parts.join(" ");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      `${POKEMON_TCG_BASE}/cards?q=${encodeURIComponent(q)}&pageSize=12&page=${page}&select=id,name,number,rarity,images,set,tcgplayer,supertype,subtypes`,
      {
        headers: {
          "X-Api-Key": process.env.POKEMON_TCG_API_KEY!,
          Accept: "application/json",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Pokemon TCG API error" },
        { status: res.status }
      );
    }

    const data = await res.json();

    const cards = (data.data ?? []).map(
      (c: Record<string, unknown>) => {
        const set = c.set as Record<string, unknown> | undefined;
        const setImages = set?.images as Record<string, string> | undefined;
        const images = c.images as Record<string, string> | undefined;
        const tcgplayer = c.tcgplayer as Record<string, unknown> | undefined;
        const prices = tcgplayer?.prices as Record<string, Record<string, number | null>> | undefined;

        // Get best available market price
        let marketPrice: number | null = null;
        if (prices) {
          for (const variant of ["holofoil", "reverseHolofoil", "normal", "1stEditionHolofoil", "1stEditionNormal"]) {
            if (prices[variant]?.market != null) {
              marketPrice = prices[variant].market;
              break;
            }
          }
        }

        return {
          id: c.id,
          name: c.name,
          number: c.number,
          rarity: c.rarity ?? "Unknown",
          supertype: c.supertype,
          subtypes: c.subtypes ?? [],
          imageSmall: images?.small ?? "",
          imageLarge: images?.large ?? "",
          setId: set?.id ?? "",
          setName: set?.name ?? "",
          setSeries: set?.series ?? "",
          setSymbol: setImages?.symbol ?? "",
          marketPrice,
          tcgplayerUrl: tcgplayer?.url ?? null,
        };
      }
    );

    return NextResponse.json({
      cards,
      page: data.page ?? 1,
      pageSize: data.pageSize ?? 20,
      totalCount: data.totalCount ?? 0,
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
