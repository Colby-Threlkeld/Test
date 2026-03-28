"use client";

import { useState, useCallback } from "react";
import { useUIStore } from "@/store/ui";

export function useUserLocation() {
  const { userLocation, locationDetected, setUserLocation, setLocationDetected } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (locationDetected) return;
    if (!navigator.geolocation) {
      setLocationDetected();
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            setUserLocation(data);
            localStorage.setItem("circa_weather_city", data.locationLabel);
          }
        } catch {
          // silent — fallback to defaults
        } finally {
          setLocationDetected();
          setLoading(false);
        }
      },
      () => {
        setLocationDetected();
        setLoading(false);
        setError("Location unavailable");
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [locationDetected, setUserLocation, setLocationDetected]);

  return { userLocation, loading, error, detect };
}
