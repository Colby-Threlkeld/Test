"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Calendar, User, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUIStore } from "@/store/ui";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface UserResult {
  id: string;
  name: string;
  avatar_url?: string;
  nationality?: string;
}

interface CommunityResult {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  tags?: string[];
}

interface EventResult {
  name: string;
  date: string;
  venue: string;
  type: string;
  description: string;
  ticketUrl: string;
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

// Module-level cache — fetched once per page session
let cachedCommunities: CommunityResult[] = [];

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const { userLocation } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [communities, setCommunities] = useState<CommunityResult[]>([]);
  const [events, setEvents] = useState<EventResult[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventResult | null>(null);
  const [allCommunities, setAllCommunities] = useState<CommunityResult[]>(cachedCommunities);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load all communities once per session
  useEffect(() => {
    if (!open) return;
    if (cachedCommunities.length > 0) {
      setAllCommunities(cachedCommunities);
      return;
    }
    supabase
      .from("communities")
      .select("id, name, description, member_count, tags")
      .limit(50)
      .then(({ data }) => {
        if (data) {
          cachedCommunities = data as CommunityResult[];
          setAllCommunities(cachedCommunities);
        }
      });
  }, [open]);

  // Autofocus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setUsers([]);
      setCommunities([]);
      setEvents([]);
      setSelectedEvent(null);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setUsers([]);
        setCommunities([]);
        setEvents([]);
        setLoadingUsers(false);
        setLoadingEvents(false);
        return;
      }

      setLoadingUsers(true);
      setLoadingEvents(true);

      const lq = q.toLowerCase();

      // Filter communities client-side immediately
      const filteredCommunities = allCommunities.filter(
        (c) =>
          c.name.toLowerCase().includes(lq) ||
          c.tags?.some((t) => t.toLowerCase().includes(lq))
      );
      setCommunities(filteredCommunities.slice(0, 5));

      // Fetch users — show results as soon as this resolves
      try {
        const userRes = await fetch(`/api/user-search?q=${encodeURIComponent(q)}`);
        if (userRes.ok) {
          const userData = await userRes.json();
          setUsers(Array.isArray(userData) ? userData.slice(0, 5) : []);
        }
      } catch {
        setUsers([]);
      }

      setLoadingUsers(false); // Show user + community results NOW

      // Fetch events separately — doesn't block user results
      if (userLocation?.city) {
        try {
          const eventRes = await fetch(
            `/api/events?city=${encodeURIComponent(userLocation.city)}&state=${encodeURIComponent(userLocation.state ?? "")}&country=${encodeURIComponent(userLocation.country ?? "US")}`
          );
          if (eventRes.ok) {
            const allEvents: EventResult[] = await eventRes.json();
            if (Array.isArray(allEvents)) {
              const filtered = allEvents.filter(
                (e) =>
                  e.name?.toLowerCase().includes(lq) ||
                  e.venue?.toLowerCase().includes(lq) ||
                  e.type?.toLowerCase().includes(lq)
              );
              setEvents(filtered.slice(0, 3));
            }
          }
        } catch {
          setEvents([]);
        }
      }

      setLoadingEvents(false);
    },
    [allCommunities, userLocation]
  );

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 150);
  }

  function handleUserClick(userId: string) {
    router.push(`/profile/${userId}`);
    onClose();
  }

  function handleCommunityClick(communityId: string) {
    router.push(`/communities/${communityId}`);
    onClose();
  }

  const hasResults = users.length > 0 || communities.length > 0 || events.length > 0;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl mx-4 rounded-2xl bg-[#12121a] border border-slate-700/40 shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/40">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search fans, communities, events…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setUsers([]);
                setCommunities([]);
                setEvents([]);
              }}
              className="rounded-full p-0.5 text-slate-400 hover:text-slate-200 hover:bg-white/8"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-1 text-xs font-medium text-slate-500 hover:text-slate-300 border border-slate-700/50 rounded px-1.5 py-0.5"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Loading skeleton — only while users are fetching */}
          {loadingUsers && (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-white/10 rounded" />
                    <div className="h-2.5 w-20 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingUsers && !query && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="h-8 w-8 text-slate-700 mb-2" />
              <p className="text-sm text-slate-500">Search for fans, communities, and events</p>
            </div>
          )}

          {!loadingUsers && !loadingEvents && query && !hasResults && (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <p className="text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Selected event detail card */}
          {selectedEvent && (
            <div className="m-3 rounded-xl border border-brand-500/20 bg-brand-600/10 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="inline-block rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white mb-1.5">
                    {selectedEvent.type}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-100">{selectedEvent.name}</h4>
                  <p className="mt-0.5 text-xs text-slate-400">{selectedEvent.venue}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{selectedEvent.date}</p>
                  <p className="mt-2 text-xs text-slate-300">{selectedEvent.description}</p>
                  {selectedEvent.ticketUrl && (
                    <a
                      href={selectedEvent.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-brand-400 hover:underline"
                    >
                      Get tickets →
                    </a>
                  )}
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="ml-2 rounded-full p-1 text-slate-400 hover:text-slate-200 hover:bg-white/8"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* People */}
          {!loadingUsers && users.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  People
                </span>
              </div>
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleUserClick(u.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <Avatar src={u.avatar_url} name={u.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{u.name}</p>
                    {u.nationality && (
                      <p className="text-xs text-slate-500">{u.nationality}</p>
                    )}
                  </div>
                  <User className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                </button>
              ))}
            </div>
          )}

          {/* Communities */}
          {!loadingUsers && communities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 pt-3 pb-1">
                <Users className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Communities
                </span>
              </div>
              {communities.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCommunityClick(c.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600/15">
                    <Users className="h-4 w-4 text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{c.name}</p>
                    <p className="text-xs text-slate-500">
                      {c.member_count.toLocaleString()} members
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Events */}
          <div className="pb-2">
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Events
              </span>
              {loadingEvents && (
                <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
              )}
            </div>
            {events.map((ev, i) => (
              <button
                key={i}
                onClick={() => setSelectedEvent(ev)}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left",
                  selectedEvent === ev && "bg-brand-600/10"
                )}
              >
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{ev.name}</p>
                  <p className="text-xs text-slate-500">
                    {ev.date} · {ev.venue}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-600/15 px-2 py-0.5 text-[10px] font-semibold text-brand-400">
                  {ev.type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
