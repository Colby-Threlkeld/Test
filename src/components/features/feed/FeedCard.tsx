"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, MapPin, Bookmark } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime, formatCount } from "@/lib/utils";
import type { FeedItem, FeedItemType } from "@/types/domain";

const TYPE_LABELS: Record<FeedItemType, { label: string; color: string }> = {
  fan_post: { label: "Fan Post", color: "default" },
  local_tip: { label: "Local Tip", color: "success" },
  match_update: { label: "Match Update", color: "primary" },
  meetup: { label: "Meetup", color: "warning" },
  travel_tip: { label: "Travel Tip", color: "outline" },
  community_highlight: { label: "Community", color: "primary" },
};

interface FeedCardProps {
  item: FeedItem;
  onLike?: (id: string) => void;
}

export function FeedCard({ item, onLike }: FeedCardProps) {
  const [liked, setLiked] = useState(item.isLiked);
  const [likes, setLikes] = useState(item.likesCount);
  const typeInfo = TYPE_LABELS[item.type];

  function handleLike() {
    setLiked((prev) => {
      const next = !prev;
      setLikes((l) => (next ? l + 1 : l - 1));
      onLike?.(item.id);
      return next;
    });
  }

  return (
    <article className="rounded-xl border border-slate-100 bg-white shadow-card">
      {/* Author row */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar src={item.author.avatarUrl} name={item.author.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{item.author.name}</span>
            {item.author.nationality && (
              <span className="text-sm">{getFlagEmoji(item.author.nationality)}</span>
            )}
            <Badge variant={typeInfo.color as "default" | "success" | "primary" | "warning" | "outline"}>
              {typeInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
        </div>
        <button className="rounded p-1 text-slate-300 hover:text-slate-500 transition-colors">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed text-slate-800">{item.body}</p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs font-medium text-brand-600 hover:text-brand-700 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Optional image placeholder */}
      {item.imageUrl && (
        <div className="mx-4 mb-3 overflow-hidden rounded-lg bg-slate-100 aspect-video">
          {/* Image would render here */}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 border-t border-slate-50 px-4 py-2.5">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            liked
              ? "text-rose-500 hover:bg-rose-50"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {formatCount(likes)}
        </button>

        <button className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <MessageCircle className="h-4 w-4" />
          {formatCount(item.commentsCount)}
        </button>

        <div className="flex-1" />

        {item.cityId && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            {item.cityId.toUpperCase()}
          </span>
        )}

        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = [...countryCode.toUpperCase()].map(
    (c) => 127397 + c.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}
