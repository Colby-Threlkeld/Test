"use client";

import { useState, useEffect, useRef } from "react";
import { Cloud, Sun, Wind, Droplets, MapPin, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useUserLocation } from "@/hooks/useUserLocation";

interface WeatherData {
  city: string;
  temp: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: "sunny" | "cloudy" | "rainy" | "partly_cloudy";
}

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
  const { userLocation } = useUserLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [activeCity, setActiveCity] = useState("Dallas");
  const [inputValue, setInputValue] = useState("Dallas");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem("fanzone_weather_city");
    if (saved) {
      setActiveCity(saved);
      setInputValue(saved);
    }
  }, []);

  // When location is detected for the first time, update if no manual city is saved
  useEffect(() => {
    if (!userLocation) return;
    const saved = localStorage.getItem("fanzone_weather_city");
    if (!saved || saved === "Dallas") {
      setActiveCity(userLocation.locationLabel);
      setInputValue(userLocation.locationLabel);
    }
  }, [userLocation]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/weather?city=${encodeURIComponent(activeCity)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setWeather(null);
        } else {
          setWeather(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Network error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeCity]);

  useEffect(() => {
    if (!inputValue.trim() || inputValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(inputValue.trim())}`);
        const data = await res.json() as string[];
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      setActiveCity(trimmed);
      localStorage.setItem("fanzone_weather_city", trimmed);
      setSuggestions([]);
      setEditing(false);
    }
  }

  return (
    <Card padding="md" className="bg-gradient-to-br from-sky-50 to-blue-50 border-sky-100">
      {/* Location row */}
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-2">
        <MapPin className="h-3 w-3 shrink-0" />
        {editing ? (
          <form
            onSubmit={handleSubmit}
            className="flex gap-1 flex-1 relative"
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
          >
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="City, Country"
              className="flex-1 text-xs bg-white border border-sky-200 rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-sky-300"
            />
            <button
              type="submit"
              className="p-0.5 rounded hover:bg-sky-100 text-sky-500"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            {suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-sky-200 bg-white shadow-lg text-xs">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-sky-50 transition-colors"
                      onClick={() => {
                        setInputValue(s);
                        setActiveCity(s);
                        localStorage.setItem("fanzone_weather_city", s);
                        setSuggestions([]);
                        setEditing(false);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        ) : (
          <button
            onClick={() => { setEditing(true); setInputValue(weather?.city ?? activeCity); }}
            className="hover:underline hover:text-sky-600 transition-colors"
            title="Change location"
          >
            Weather near {weather?.city ?? activeCity}
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Fetching weather…</span>
        </div>
      ) : error ? (
        <p className="text-sm text-red-500 py-1">{error}</p>
      ) : weather ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-800">{weather.temp}°F</span>
                <span className="mb-1 text-sm text-slate-500">Feels {weather.feelsLike}°</span>
              </div>
              <p className="text-sm font-medium text-slate-600">{weather.condition}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {WEATHER_ICONS[weather.icon]}
              <div className="flex gap-3 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-blue-400" />
                  {weather.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="h-3 w-3 text-slate-400" />
                  {weather.wind} mph
                </span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">Match-day conditions</p>
        </>
      ) : null}
    </Card>
  );
}
