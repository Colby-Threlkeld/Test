"use client";

import { useState } from "react";
import { Users, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatCount } from "@/lib/utils";
import type { Community } from "@/types/domain";

interface CommunityCardProps {
  community: Community;
  onView?: (id: string) => void;
}

const TYPE_BADGE: Record<string, string> = {
  national_supporters: "National",
  city_based: "City",
  travel_group: "Travel",
  fan_identity: "Fans",
  event_official: "Official",
  watch_party: "Watch Party",
};

export function CommunityCard({ community, onView }: CommunityCardProps) {
  const [joined, setJoined] = useState(community.isJoined);

  return (
    <Card hover padding="none" className="overflow-hidden" onClick={() => onView?.(community.id)}>
      {/* Cover strip */}
      <div className="h-16 w-full bg-gradient-to-r from-brand-500 to-brand-700 relative">
        {community.isPrivate && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white">
            <Lock className="h-2.5 w-2.5" /> Private
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Title + type badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100 leading-snug">
            {community.name}
          </h3>
          <Badge variant="outline" className="shrink-0 mt-0.5">
            {TYPE_BADGE[community.type] ?? community.type}
          </Badge>
        </div>

        {/* Description */}
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500 line-clamp-2">
          {community.description}
        </p>

        {/* Tags */}
        {community.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] font-medium text-brand-400">#{tag}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" />
            {formatCount(community.memberCount)} members
          </span>

          <Button
            size="sm"
            variant={joined ? "secondary" : "primary"}
            onClick={(e) => {
              e.stopPropagation();
              setJoined((v) => !v);
            }}
          >
            {joined ? "Joined" : "Join"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
