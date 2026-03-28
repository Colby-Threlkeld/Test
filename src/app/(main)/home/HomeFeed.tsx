"use client";

import { useState } from "react";
import { PenSquare, Flame, Compass, Users } from "lucide-react";
import { FeedCard } from "@/components/features/feed/FeedCard";
import { WeatherWidget } from "@/components/features/feed/WeatherWidget";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { MOCK_FEED_ITEMS } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types/domain";

const TABS = [
  { label: "For You", icon: Flame, value: "for_you" },
  { label: "Nearby", icon: Compass, value: "nearby" },
  { label: "Following", icon: Users, value: "following" },
];

export function HomeFeed() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("for_you");
  const [items, setItems] = useState<FeedItem[]>(MOCK_FEED_ITEMS);

  function handleLike(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isLiked: !item.isLiked } : item
      )
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      {/* Compose bar */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-card">
        <Avatar src={user?.image} name={user?.name ?? ""} size="sm" />
        <button className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100 transition-colors">
          Share a tip, find a fan, plan a meetup…
        </button>
        <Button size="sm" variant="primary">
          <PenSquare className="h-3.5 w-3.5" />
          Post
        </Button>
      </div>

      {/* Weather widget */}
      <div className="mb-4">
        <WeatherWidget />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-100 bg-white p-1 shadow-card">
        {TABS.map(({ label, icon: Icon, value }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors",
              activeTab === value
                ? "bg-brand-600 text-white"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} onLike={handleLike} />
        ))}
      </div>

      {/* Load more */}
      <div className="mt-6 text-center">
        <Button variant="outline" size="sm">
          Load more posts
        </Button>
      </div>
    </div>
  );
}
