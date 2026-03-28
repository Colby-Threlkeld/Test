"use client";

import { Cloud, Sun, Wind, Droplets, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Scaffold: replace with real OpenWeatherMap data via /api/weather route
interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: "sunny" | "cloudy" | "rainy" | "partly_cloudy";
}

const MOCK_WEATHER: WeatherData = {
  city: "Dallas, TX",
  temp: 88,
  feelsLike: 93,
  condition: "Partly Cloudy",
  humidity: 58,
  wind: 12,
  icon: "partly_cloudy",
};

const WEATHER_ICONS = {
  sunny: <Sun className="h-8 w-8 text-amber-400" />,
  cloudy: <Cloud className="h-8 w-8 text-slate-400" />,
  rainy: <Droplets className="h-8 w-8 text-blue-400" />,
  partly_cloudy: (
    <div className="relative h-8 w-8">
      <Sun className="absolute h-6 w-6 text-amber-400 top-0 left-0" />
      <Cloud className="absolute h-5 w-5 text-slate-400 bottom-0 right-0" />
    </div>
  ),
};

export function WeatherWidget() {
  const w = MOCK_WEATHER;

  return (
    <Card padding="md" className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <MapPin className="h-3 w-3" />
            <span>Weather near {w.city}</span>
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-800">{w.temp}°F</span>
            <span className="mb-1 text-sm text-slate-500">Feels {w.feelsLike}°</span>
          </div>
          <p className="text-sm font-medium text-slate-600">{w.condition}</p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {WEATHER_ICONS[w.icon]}
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" />
              {w.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3 text-slate-400" />
              {w.wind} mph
            </span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Match-day conditions — good visibility expected
      </p>
    </Card>
  );
}
