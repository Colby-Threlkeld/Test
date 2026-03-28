"use client";

import { useState, useEffect } from "react";
import { Plus, CalendarDays, Ticket, Plane, ChevronLeft, Map } from "lucide-react";
import { ItineraryCard } from "@/components/features/planning/ItineraryCard";
import { AddItineraryModal } from "@/components/features/planning/AddItineraryModal";
import { CreateTripModal } from "@/components/features/planning/CreateTripModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatFullDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ItineraryItem, ItineraryItemType } from "@/types/domain";

interface Trip {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  event_name: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const TYPE_FILTERS: { label: string; value: ItineraryItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Matches", value: "match" },
  { label: "Travel", value: "travel" },
  { label: "Stays", value: "accommodation" },
  { label: "Meetups", value: "meetup" },
  { label: "Activities", value: "activity" },
];

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  if (start && end) {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  if (start) return `From ${new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  return "";
}

export function PlanningView() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (user as any)?.id as string | undefined;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripItemCounts, setTripItemCounts] = useState<Record<string, number>>({});
  const [tripsLoading, setTripsLoading] = useState(true);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [createTripOpen, setCreateTripOpen] = useState(false);

  // Detail view state
  const [filter, setFilter] = useState<ItineraryItemType | "all">("all");
  const [planItems, setPlanItems] = useState<ItineraryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Load trips
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTrips((data as Trip[]) ?? []);
        setTripsLoading(false);
      });
  }, [userId]);

  // Load item counts for trip list
  useEffect(() => {
    if (!userId || trips.length === 0) return;
    supabase
      .from("itinerary_items")
      .select("trip_id")
      .eq("user_id", userId)
      .not("trip_id", "is", null)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of (data ?? []) as any[]) {
          if (row.trip_id) counts[row.trip_id] = (counts[row.trip_id] ?? 0) + 1;
        }
        setTripItemCounts(counts);
      });
  }, [userId, trips]);

  // Load items for selected trip
  useEffect(() => {
    if (!userId || !selectedTripId) return;
    supabase
      .from("itinerary_items")
      .select("id, type, title, date, time, location, notes, confirmed")
      .eq("user_id", userId)
      .eq("trip_id", selectedTripId)
      .order("date", { ascending: true })
      .then(({ data }) => {
        setPlanItems(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data ?? []).map((item: any) => ({
            id: item.id,
            type: item.type as ItineraryItemType,
            title: item.title,
            date: item.date,
            time: item.time ?? undefined,
            location: item.location ?? undefined,
            notes: item.notes ?? undefined,
            confirmed: item.confirmed,
          }))
        );
      });
  }, [userId, selectedTripId]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null;

  const sortedItems = [...planItems].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filtered =
    filter === "all" ? sortedItems : sortedItems.filter((i) => i.type === filter);

  const byDate = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const confirmedCount = sortedItems.filter((i) => i.confirmed).length;
  const totalCount = sortedItems.length;
  const matchCount = sortedItems.filter((i) => i.type === "match").length;
  const hasTravel = sortedItems.some((i) => i.type === "travel");

  // ── Trip list view ──────────────────────────────────────
  if (selectedTripId === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">My Trips</h2>
          <Button size="sm" variant="primary" onClick={() => setCreateTripOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Trip
          </Button>
        </div>

        {tripsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/50 py-16 text-center">
            <Map className="h-8 w-8 text-slate-600" />
            <p className="mt-2 text-sm text-slate-500">No trips yet.</p>
            <p className="text-xs text-slate-400 mb-3">Plan your World Cup experience.</p>
            <Button variant="primary" size="sm" onClick={() => setCreateTripOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Create first trip
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => {
              const itemCount = tripItemCounts[trip.id] ?? 0;
              const dateRange = formatDateRange(trip.start_date, trip.end_date);
              return (
                <button
                  key={trip.id}
                  onClick={() => { setSelectedTripId(trip.id); setFilter("all"); setPlanItems([]); }}
                  className="w-full text-left rounded-xl border border-slate-700/40 bg-[#12121a] p-4 shadow-card hover:border-brand-500/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-100 truncate">{trip.name}</p>
                      {trip.event_name && (
                        <p className="text-xs text-slate-500 mt-0.5">{trip.event_name}</p>
                      )}
                      {dateRange && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {dateRange}
                        </p>
                      )}
                    </div>
                    {itemCount > 0 && (
                      <Badge variant="default">{itemCount} item{itemCount !== 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                  {trip.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">{trip.description}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <CreateTripModal
          open={createTripOpen}
          onClose={() => setCreateTripOpen(false)}
          onCreated={(trip) => {
            setTrips((prev) => [trip, ...prev]);
            setCreateTripOpen(false);
          }}
          userId={userId ?? ""}
        />
      </div>
    );
  }

  // ── Trip detail view ────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      {/* Back button */}
      <button
        onClick={() => setSelectedTripId(null)}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
      >
        <ChevronLeft className="h-4 w-4" />
        My Trips
      </button>

      {/* Trip banner */}
      <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">
              {selectedTrip?.event_name ?? "Your trip"}
            </p>
            <h2 className="mt-0.5 text-base font-bold">{selectedTrip?.name}</h2>
            {selectedTrip?.description && (
              <p className="mt-1 text-xs text-brand-200 line-clamp-1">{selectedTrip.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{confirmedCount}/{totalCount}</p>
            <p className="text-xs text-brand-200">items confirmed</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          {(selectedTrip?.start_date || selectedTrip?.end_date) && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateRange(selectedTrip?.start_date ?? null, selectedTrip?.end_date ?? null)}
            </div>
          )}
          {matchCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
              <Ticket className="h-3.5 w-3.5" />
              {matchCount} match{matchCount !== 1 ? "es" : ""} saved
            </div>
          )}
          {hasTravel && (
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
              <Plane className="h-3.5 w-3.5" />
              Travel set
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Itinerary</h3>
        <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add item
        </Button>
      </div>

      {/* Filter chips */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === value
                ? "border-brand-500/50 bg-brand-600/15 text-brand-400"
                : "border-slate-700/50 bg-white/5 text-slate-400 hover:bg-white/8"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grouped by date */}
      {Object.keys(byDate).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/50 py-14 text-center">
          <CalendarDays className="h-8 w-8 text-slate-600" />
          <p className="mt-2 text-sm text-slate-500">Nothing planned yet</p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => setModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add first item
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).map(([date, dateItems]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {formatFullDate(date)}
                </span>
                <div className="h-px flex-1 bg-white/8" />
                <Badge variant="default">{dateItems.length} item{dateItems.length > 1 ? "s" : ""}</Badge>
              </div>
              <div className="space-y-2">
                {dateItems.map((item) => (
                  <ItineraryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddItineraryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={(item) => setPlanItems((prev) => [item, ...prev])}
        userId={userId ?? ""}
        tripId={selectedTripId ?? undefined}
      />
    </div>
  );
}
