import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) return NextResponse.json({ error: "lat and lon required" }, { status: 400 });

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });

    const data = await res.json() as Array<{ name: string; state?: string; country: string }>;
    if (!data.length) return NextResponse.json({ error: "No results" }, { status: 404 });

    const { name, state, country } = data[0];
    return NextResponse.json({
      city: name,
      state: state ?? "",
      country,
      locationLabel: [name, state, country].filter(Boolean).join(", "),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
