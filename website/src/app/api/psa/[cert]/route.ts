import { NextResponse } from "next/server";

const PSA_API_BASE = "https://api.psacard.com/publicapi/cert/GetByCertNumber";
const PSA_API_KEY = process.env.PSA_API_KEY || "";

// Simple in-memory cache to avoid repeat calls
const cache = new Map<string, { data: PSACertResponse; ts: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export interface PSACertResponse {
  certNumber: string;
  year: string;
  brand: string;
  category: string;
  cardName: string;
  variety: string;
  grade: string;
  gradeName: string;
  labelType: string;
  reverseBarcode: string;
  subject: string;
  cardNumber: string;
  totalPopulation: number;
  totalPopulationWithHigher: number;
  specNumber: string;
  specId: number;
  isSoldOut: boolean;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cert: string }> }
) {
  const { cert } = await params;

  if (!cert || !/^\d+$/.test(cert)) {
    return NextResponse.json(
      { error: "Invalid cert number — must be numeric" },
      { status: 400 }
    );
  }

  if (!PSA_API_KEY) {
    return NextResponse.json(
      { error: "PSA API key not configured" },
      { status: 500 }
    );
  }

  // Check cache
  const cached = cache.get(cert);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ cert: cached.data, cached: true });
  }

  try {
    const res = await fetch(`${PSA_API_BASE}/${cert}`, {
      headers: {
        Authorization: `bearer ${PSA_API_KEY}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 404) {
        return NextResponse.json(
          { error: "Cert number not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `PSA API error (${status})` },
        { status }
      );
    }

    const data = await res.json();

    // PSA API returns the cert data directly
    const certData: PSACertResponse = {
      certNumber: data.PSACert?.CertNumber ?? cert,
      year: data.PSACert?.Year ?? "",
      brand: data.PSACert?.Brand ?? "",
      category: data.PSACert?.Category ?? "",
      cardName: data.PSACert?.Subject ?? "",
      variety: data.PSACert?.Variety ?? "",
      grade: data.PSACert?.CardGrade ?? "",
      gradeName: data.PSACert?.GradeName ?? "",
      labelType: data.PSACert?.LabelType ?? "",
      reverseBarcode: data.PSACert?.ReverseBarCode ?? "",
      subject: data.PSACert?.Subject ?? "",
      cardNumber: data.PSACert?.CardNumber ?? "",
      totalPopulation: data.PSACert?.TotalPopulation ?? 0,
      totalPopulationWithHigher: data.PSACert?.TotalPopulationWithHigher ?? 0,
      specNumber: data.PSACert?.SpecNumber ?? "",
      specId: data.PSACert?.SpecID ?? 0,
      isSoldOut: false,
    };

    // Cache
    cache.set(cert, { data: certData, ts: Date.now() });

    return NextResponse.json({ cert: certData, cached: false });
  } catch (err) {
    console.error("PSA API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch PSA cert data" },
      { status: 500 }
    );
  }
}
