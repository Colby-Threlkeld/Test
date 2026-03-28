"use client";

import { Plane, Ticket, Users, Building2, Utensils, Bus, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatShortDate } from "@/lib/utils";
import type { ItineraryItem, ItineraryItemType } from "@/types/domain";

const TYPE_CONFIG: Record<
  ItineraryItemType,
  { icon: React.ElementType; color: string; badgeVariant: "default" | "primary" | "success" | "warning" | "outline" }
> = {
  match:         { icon: Ticket,    color: "text-brand-400 bg-brand-600/15",   badgeVariant: "primary" },
  travel:        { icon: Plane,     color: "text-sky-400 bg-sky-500/15",       badgeVariant: "outline" },
  accommodation: { icon: Building2, color: "text-violet-400 bg-violet-500/15", badgeVariant: "outline" },
  activity:      { icon: Star,      color: "text-amber-400 bg-amber-500/15",   badgeVariant: "warning" },
  meetup:        { icon: Users,     color: "text-emerald-400 bg-emerald-500/15",badgeVariant: "success" },
  food:          { icon: Utensils,  color: "text-orange-400 bg-orange-500/15", badgeVariant: "warning" },
  transport:     { icon: Bus,       color: "text-slate-400 bg-white/8",        badgeVariant: "default" },
};

interface ItineraryCardProps {
  item: ItineraryItem;
  onEdit?: (id: string) => void;
}

export function ItineraryCard({ item, onEdit }: ItineraryCardProps) {
  const config = TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-slate-700/40 bg-[#12121a] p-4 shadow-card",
        "transition-shadow hover:shadow-card-hover",
        !item.confirmed && "border-dashed opacity-70"
      )}
    >
      {/* Icon */}
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.color)}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-100 leading-snug">{item.title}</p>
          <Badge variant={config.badgeVariant} className="shrink-0 capitalize">
            {item.type.replace("_", " ")}
          </Badge>
        </div>

        {item.location && (
          <p className="mt-0.5 text-xs text-slate-500 truncate">{item.location}</p>
        )}

        {item.notes && (
          <p className="mt-1 text-xs text-slate-500 line-clamp-1">{item.notes}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">
            {formatShortDate(item.date)}{item.time ? ` · ${item.time}` : ""}
          </span>
          {!item.confirmed && (
            <span className="text-xs text-amber-400 font-medium">Unconfirmed</span>
          )}
          {item.confirmed && (
            <span className="text-xs text-emerald-400 font-medium">Confirmed</span>
          )}
        </div>
      </div>
    </div>
  );
}
