"use client";

import { useState } from "react";
import { Plus, CalendarDays, MapPin, Ticket, Plane } from "lucide-react";
import { ItineraryCard } from "@/components/features/planning/ItineraryCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_ITINERARY_ITEMS, MOCK_EVENT, MOCK_CITIES } from "@/data/mock";
import { formatFullDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ItineraryItemType } from "@/types/domain";

const TYPE_FILTERS: { label: string; value: ItineraryItemType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Matches", value: "match" },
  { label: "Travel", value: "travel" },
  { label: "Stays", value: "accommodation" },
  { label: "Meetups", value: "meetup" },
  { label: "Activities", value: "activity" },
];

export function PlanningView() {
  const [filter, setFilter] = useState<ItineraryItemType | "all">("all");

  const sortedItems = [...MOCK_ITINERARY_ITEMS].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filtered = filter === "all"
    ? sortedItems
    : sortedItems.filter((i) => i.type === filter);

  // Group by date
  const byDate = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const confirmedCount = sortedItems.filter((i) => i.confirmed).length;
  const totalCount = sortedItems.length;

  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      {/* Trip banner */}
      <div className="mb-5 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-brand-200 uppercase tracking-wide">Your trip</p>
            <h2 className="mt-0.5 text-base font-bold">{MOCK_EVENT.name}</h2>
            <p className="mt-1 text-xs text-brand-200">
              {MOCK_CITIES.slice(0, 3).map((c) => c.name).join(" · ")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{confirmedCount}/{totalCount}</p>
            <p className="text-xs text-brand-200">items confirmed</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
            <CalendarDays className="h-3.5 w-3.5" />
            Jun 11 – Jul 19
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
            <Ticket className="h-3.5 w-3.5" />
            1 match saved
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium">
            <Plane className="h-3.5 w-3.5" />
            Travel set
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Itinerary</h3>
        <Button size="sm" variant="primary">
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
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Items grouped by date */}
      {Object.keys(byDate).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-14 text-center">
          <CalendarDays className="h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Nothing planned yet</p>
          <Button variant="primary" size="sm" className="mt-3">
            <Plus className="h-3.5 w-3.5" /> Add first item
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).map(([date, items]) => (
            <div key={date}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {formatFullDate(date)}
                </span>
                <div className="h-px flex-1 bg-slate-100" />
                <Badge variant="default">{items.length} item{items.length > 1 ? "s" : ""}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <ItineraryCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
