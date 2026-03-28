import { NextRequest, NextResponse } from "next/server";

async function fetchWeatherData(query: string, apiKey: string): Promise<Response> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=imperial`;
  return fetch(url, { cache: "no-store" });
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  if (!city) {
    return NextResponse.json({ error: "city is required" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(mockWeather(city));
  }

  let res: Response;
  try {
    res = await fetchWeatherData(city, apiKey);
    if (res.status === 404) {
      // Strip state/country suffix and retry: "Dallas, TX" → "Dallas"
      const cityOnly = city.split(",")[0].trim();
      if (cityOnly !== city) {
        res = await fetchWeatherData(cityOnly, apiKey);
      }
    }
  } catch {
    return NextResponse.json(mockWeather(city));
  }

  if (!res.ok) {
    return NextResponse.json(mockWeather(city));
  }

  const data = await res.json();

  const mainCode: string = data.weather?.[0]?.main ?? "";
  const iconCode: string = data.weather?.[0]?.icon ?? "";
  let icon: "sunny" | "cloudy" | "rainy" | "partly_cloudy" = "cloudy";
  if (mainCode === "Clear") icon = "sunny";
  else if (mainCode === "Rain" || mainCode === "Drizzle" || mainCode === "Thunderstorm") icon = "rainy";
  else if (mainCode === "Clouds") icon = iconCode.startsWith("02") ? "partly_cloudy" : "cloudy";

  return NextResponse.json({
    city: `${data.name}, ${data.sys?.country ?? ""}`.trim().replace(/,$/, ""),
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    condition: data.weather?.[0]?.description
      ? data.weather[0].description.replace(/\b\w/g, (c: string) => c.toUpperCase())
      : mainCode,
    humidity: data.main.humidity,
    wind: Math.round(data.wind?.speed ?? 0),
    icon,
  });
}

function mockWeather(city: string) {
  return {
    city,
    temp: 72,
    feelsLike: 69,
    condition: "Partly Cloudy",
    humidity: 54,
    wind: 8,
    icon: "partly_cloudy",
  };
}
