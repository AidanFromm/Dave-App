import { NextResponse } from "next/server";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const page = searchParams.get("page") ?? "1";

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(
      `${TCGDEX_BASE}/cards?name=${encodeURIComponent(query)}&pagination:itemsPerPage=20&pagination:page=${page}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: "TCGdex API error" },
        { status: res.status }
      );
    }

    const data = await res.json();

    const cards = (Array.isArray(data) ? data : []).map(
      (c: Record<string, unknown>) => {
        const image = c.image as string | undefined;
        const id = c.id as string;
        const setId = id.includes("-")
          ? id.substring(0, id.lastIndexOf("-"))
          : "";

        return {
          id,
          name: c.name ?? "",
          number: c.localId ?? "",
          rarity: "",
          supertype: "",
          subtypes: [],
          imageSmall: image ? `${image}/low.png` : "",
          imageLarge: image ? `${image}/high.png` : "",
          setId,
          setName: "",
          setSeries: "",
          setSymbol: "",
          marketPrice: null,
          tcgplayerUrl: null,
        };
      }
    );

    return NextResponse.json({
      cards,
      page: parseInt(page, 10),
      pageSize: 20,
      totalCount: cards.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed — please try again." },
      { status: 500 }
    );
  }
}
