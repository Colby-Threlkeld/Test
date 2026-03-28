"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "National", value: "national_supporters" },
  { label: "City", value: "city_based" },
  { label: "Travel", value: "travel_group" },
  { label: "Fan Groups", value: "fan_identity" },
  { label: "Watch Parties", value: "watch_party" },
];

interface CommunityFiltersProps {
  onSearch: (q: string) => void;
  onFilter: (type: string) => void;
  activeFilter: string;
}

export function CommunityFilters({ onSearch, onFilter, activeFilter }: CommunityFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search communities..."
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" title="More filters">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilter(opt.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeFilter === opt.value
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
