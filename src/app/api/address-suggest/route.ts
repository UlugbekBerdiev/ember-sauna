import { NextResponse } from "next/server";
import { addressFromEsri, isMagicKey, normalizeQuery, suggestionsFromEsri } from "@/lib/address-suggest";

export const dynamic = "force-dynamic";

const SUGGEST_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest";
const FIND_URL = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";
const DAMASCUS = "-77.2036,39.2884";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim() ?? "";
  try {
    if (id) {
      if (!isMagicKey(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
      const resolved = addressFromEsri(await esriGet(FIND_URL, {
        magicKey: id,
        f: "json",
        outFields: "StAddr,City,RegionAbbr,Region,Postal",
        maxLocations: "1",
      }));
      if (!resolved) return NextResponse.json({ error: "nomatch" }, { status: 404 });
      return NextResponse.json(resolved);
    }

    const query = normalizeQuery(url.searchParams.get("q") ?? "");
    if (!query) return NextResponse.json({ suggestions: [] });
    const suggestions = suggestionsFromEsri(await esriGet(SUGGEST_URL, {
      text: query,
      f: "json",
      countryCode: "USA",
      category: "Address",
      maxSuggestions: "5",
      location: DAMASCUS,
    }));
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "private, max-age=30" } });
  } catch {
    return NextResponse.json({ suggestions: [], error: "lookup" }, { status: 503 });
  }
}

async function esriGet(endpoint: string, params: Record<string, string>) {
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const token = process.env.ARCGIS_API_KEY?.trim();
  if (token) url.searchParams.set("token", token);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("lookup");
  const payload: unknown = await response.json();
  if (payload && typeof payload === "object" && "error" in payload && payload.error) throw new Error("lookup");
  return payload;
}
