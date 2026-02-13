import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

// Generate a unique build ID at startup (changes on every deploy)
const BUILD_ID = `${packageJson.version}-${Date.now()}`;

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      buildId: BUILD_ID,
      version: packageJson.version,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
