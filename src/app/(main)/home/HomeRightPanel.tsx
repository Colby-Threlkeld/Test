"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, Calendar, RotateCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui";
import { Badge } from "@/components/ui/Badge";
import { formatShortDate } from "@/lib/utils";

interface ItineraryItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
}

interface Community {
  id: string;
  name: string;
  member_count: number;
}

interface AIEvent {
  name: string;
  date: string;
  venue: string;
  type: string;
  description: string;
  ticketUrl: string;
}

const EVENTS_TTL_MS = 60 * 60 * 1000; // 1 hour

export function HomeRightPanel() {
  const { user } = useAuth();
  const userId = (user as any)?.id as string | undefined;
  const { userLocation, setEventsCache, clearEventsCache } = useUIStore();

  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [aiEvents, setAiEvents] = useState<AIEvent[]>([]);
  const [loadingItinerary, setLoadingItinerary] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  // Incrementing this forces the events effect to re-run and bust the cache
  const [refreshToken, setRefreshToken] = useState(0);

  // Load itinerary items
  useEffect(() => {
    if (!userId) { setLoadingItinerary(false); return; }
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("itinerary_items")
      .select("id, title, date, time, location")
      .eq("user_id", userId)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(2)
      .then(({ data }) => {
        setItinerary((data as ItineraryItem[]) ?? []);
        setLoadingItinerary(false);
      });
  }, [userId]);

  // Load communities the user has NOT joined
  useEffect(() => {
    async function loadCommunities() {
      setLoadingCommunities(true);

      if (userId) {
        const { data: joined } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", userId);

        const joinedIds = (joined ?? []).map((j: any) => j.community_id);

        let query = supabase
          .from("communities")
          .select("id, name, member_count")
          .order("member_count", { ascending: false })
          .limit(3);

        if (joinedIds.length > 0) {
          query = query.not("id", "in", `(${joinedIds.join(",")})`) as typeof query;
        }

        const { data } = await query;
        setCommunities((data as Community[]) ?? []);
      } else {
        const { data } = await supabase
          .from("communities")
          .select("id, name, member_count")
          .order("member_count", { ascending: false })
          .limit(3);
        setCommunities((data as Community[]) ?? []);
      }

      setLoadingCommunities(false);
    }

    loadCommunities();
  }, [userId]);

  // Load AI events with localStorage + Zustand caching to avoid redundant API calls
  useEffect(() => {
    if (!userLocation?.city) return;

    const locationKey = `${userLocation.city}|${userLocation.state ?? ""}`;
    const cacheKey = `circa_events_${userId ?? "anon"}_${locationKey}`;
    const now = Date.now();

    // 1. Check in-session Zustand store — zero cost, no I/O
    const { eventsCache: stored } = useUIStore.getState();
    if (
      stored &&
      stored.locationKey === locationKey &&
      now - stored.timestamp < EVENTS_TTL_MS
    ) {
      setAiEvents(stored.data as AIEvent[]);
      return;
    }

    // 2. Check localStorage — free on subsequent tabs/sessions within TTL
    let staleData: AIEvent[] | null = null;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: AIEvent[]; timestamp: number };
        staleData = parsed.data; // always keep as fallback even if expired
        if (now - parsed.timestamp < EVENTS_TTL_MS) {
          setAiEvents(parsed.data.slice(0, 3));
          setEventsCache({ data: parsed.data, timestamp: parsed.timestamp, locationKey });
          return;
        }
      }
    } catch {
      // ignore corrupt localStorage
    }

    // 3. Fetch fresh from AI API
    setLoadingEvents(true);
    fetch(
      `/api/events?city=${encodeURIComponent(userLocation.city)}&state=${encodeURIComponent(userLocation.state ?? "")}&country=${encodeURIComponent(userLocation.country ?? "US")}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const events = data.slice(0, 3) as AIEvent[];
          const timestamp = Date.now();
          setAiEvents(events);
          setEventsCache({ data: events, timestamp, locationKey });
          try { localStorage.setItem(cacheKey, JSON.stringify({ data: events, timestamp })); } catch {}
        } else if (staleData) {
          // API returned an error shape — show stale data rather than empty
          setAiEvents(staleData.slice(0, 3));
        }
      })
      .catch(() => {
        // Network/parse failure — fall back to stale cache if any
        if (staleData) setAiEvents(staleData.slice(0, 3));
      })
      .finally(() => setLoadingEvents(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.city, userLocation?.state, userLocation?.country, userId, refreshToken]);

  function handleRefreshEvents() {
    if (!userLocation?.city) return;
    const locationKey = `${userLocation.city}|${userLocation.state ?? ""}`;
    const cacheKey = `circa_events_${userId ?? "anon"}_${locationKey}`;
    clearEventsCache();
    try { localStorage.removeItem(cacheKey); } catch {}
    setRefreshToken((t) => t + 1);
  }

  return (
    <div className="space-y-5">
      {/* Upcoming plans */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</h3>
          <Link href="/planning" className="text-xs font-medium text-brand-400 hover:text-brand-300">View all</Link>
        </div>
        <div className="space-y-2">
          {loadingItinerary ? (
            <>
              {[1, 2].map((n) => (
                <div key={n} className="h-14 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </>
          ) : itinerary.length === 0 ? (
            <p className="text-xs text-slate-400">No upcoming plans. Start planning your trip.</p>
          ) : (
            itinerary.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-lg border border-slate-700/40 bg-white/5 p-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{item.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatShortDate(item.date)}{item.time ? ` · ${item.time}` : ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suggested communities */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested</h3>
          <Link href="/communities" className="text-xs font-medium text-brand-400 hover:text-brand-300">Browse</Link>
        </div>
        <div className="space-y-2">
          {loadingCommunities ? (
            <>
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-14 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </>
          ) : (
            communities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
                className="flex items-center gap-2.5 rounded-lg border border-slate-700/40 bg-white/5 p-2.5 hover:bg-white/8 transition-colors group"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/20">
                  <Users className="h-4 w-4 text-brand-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200 leading-snug">{community.name}</p>
                  <p className="text-[10px] text-slate-500">{community.member_count.toLocaleString()} members</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Events Near You */}
      {(userLocation?.city || loadingEvents) && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Events Near You</h3>
            {!loadingEvents && (
              <button
                onClick={handleRefreshEvents}
                title="Refresh events"
                className="text-slate-400 hover:text-brand-600 transition-colors"
              >
                <RotateCw className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            {loadingEvents ? (
              <>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </>
            ) : aiEvents.length === 0 ? (
              <p className="text-xs text-slate-400">No upcoming events found near you.</p>
            ) : (
              aiEvents.map((ev, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-700/40 bg-white/5 p-2.5"
                >
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200 leading-snug">{ev.name}</p>
                    <p className="text-[10px] text-slate-500">{ev.date}{ev.venue ? ` · ${ev.venue}` : ""}</p>
                    <span className="mt-1 inline-block rounded-full bg-brand-600/20 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                      {ev.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
