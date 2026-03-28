"use client";

import { Plane, Ticket, Users, Building2, Utensils, Bus, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn, formatShortDate } from "@/lib/utils";
import type { ItineraryItem, ItineraryItemType } from "@/types/domain";

const TYPE_CONFIG: Record<
  ItineraryItemType,
  { icon: React.ElementType; color: string; badgeVariant: "default" | "primary" | "success" | "warning" | "outline" }
> = {
  match:          { icon: Ticket,    color: "text-brand-600 bg-brand-50",    badgeVariant: "primary" },
  travel:         { icon: Plane,     color: "text-sky-600 bg-sky-50",        badgeVariant: "outline" },
  accommodation:  { icon: Building2, color: "text-violet-600 bg-violet-50",  badgeVariant: "outline" },
  activity:       { icon: Star,      color: "text-amber-600 bg-amber-50",    badgeVariant: "warning" },
  meetup:         { icon: Users,     color: "text-emerald-600 bg-emerald-50",badgeVariant: "success" },
  food:           { icon: Utensils,  color: "text-orange-600 bg-orange-50",  badgeVariant: "warning" },
  transport:      { icon: Bus,       color: "text-slate-600 bg-slate-100",   badgeVariant: "default" },
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
        "flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-card",
        "transition-shadow hover:shadow-card-hover",
        !item.confirmed && "border-dashed opacity-80"
      )}
    >
      {/* Icon */}
      <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.color)}>
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</p>
          <Badge variant={config.badgeVariant} className="shrink-0 capitalize">
            {item.type.replace("_", " ")}
          </Badge>
        </div>

        {item.location && (
          <p className="mt-0.5 text-xs text-slate-500 truncate">{item.location}</p>
        )}

        {item.notes && (
          <p className="mt-1 text-xs text-slate-400 line-clamp-1">{item.notes}</p>
        )}

        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs font-medium text-slate-600">
            {formatShortDate(item.date)}{item.time ? ` · ${item.time}` : ""}
          </span>
          {!item.confirmed && (
            <span className="text-xs text-amber-600 font-medium">Unconfirmed</span>
          )}
          {item.confirmed && (
            <span className="text-xs text-emerald-600 font-medium">Confirmed</span>
          )}
        </div>
      </div>
    </div>
  );
}
