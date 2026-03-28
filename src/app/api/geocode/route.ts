import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY?.trim();
  if (!apiKey) return NextResponse.json([]);

  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json([]);
    const data = await res.json() as Array<{ name: string; state?: string; country: string }>;
    const seen = new Set<string>();
    const formatted = data
      .map((item) => [item.name, item.state, item.country].filter(Boolean).join(", "))
      .filter((s) => {
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
      });
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([]);
  }
}
