"use client";

import { useState, useEffect } from "react";
import { PenSquare, Flame, Compass, Users } from "lucide-react";
import { FeedCard } from "@/components/features/feed/FeedCard";
import { WeatherWidget } from "@/components/features/feed/WeatherWidget";
import { PostComposerModal } from "@/components/features/feed/PostComposerModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { FeedItem, FeedItemType } from "@/types/domain";
import { useUserLocation } from "@/hooks/useUserLocation";

const TABS = [
  { label: "For You", icon: Flame, value: "for_you" },
  { label: "Nearby", icon: Compass, value: "nearby" },
  { label: "Following", icon: Users, value: "following" },
];

export function HomeFeed() {
  const { userLocation } = useUserLocation();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (user as any)?.id as string | undefined;
  const [activeTab, setActiveTab] = useState("for_you");
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nearbyItems, setNearbyItems] = useState<FeedItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_stateLabelById, setStateLabelById] = useState<Record<string, string>>({});
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id, type, body, image_url, city_id, event_id, tags,
          likes_count, comments_count, created_at, state_label, location_label, tagged_users_json,
          author:users!author_id(id, name, avatar_url, nationality)
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !data) { setLoading(false); return; }

      let likedIds = new Set<string>();
      if (userId) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", userId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        likedIds = new Set(likes?.map((l: any) => l.post_id) ?? []);
      }

      const statesMap: Record<string, string> = {};
      const mapped = // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((p: any) => {
          if (p.state_label) statesMap[p.id] = p.state_label;
          return {
            id: p.id,
            type: p.type as FeedItemType,
            author: {
              id: p.author?.id ?? "",
              name: p.author?.name ?? "Unknown",
              avatarUrl: p.author?.avatar_url ?? undefined,
              nationality: p.author?.nationality ?? undefined,
            },
            body: p.body,
            imageUrl: p.image_url ?? undefined,
            cityId: p.city_id ?? undefined,
            eventId: p.event_id ?? undefined,
            tags: p.tags ?? [],
            likesCount: p.likes_count,
            commentsCount: p.comments_count,
            isLiked: likedIds.has(p.id),
            createdAt: p.created_at,
            taggedUsersJson: p.tagged_users_json ?? [],
          };
        });

      setItems(mapped);
      setStateLabelById(statesMap);
      setLoading(false);
    }
    load();
  }, [userId]);

  // Load nearby posts when tab selected or location changes
  useEffect(() => {
    if (activeTab !== "nearby") return;

    async function loadNearby() {
      setNearbyLoading(true);

      const city = userLocation?.city;
      const state = userLocation?.state;

      let query = supabase
        .from("posts")
        .select(`
          id, type, body, image_url, city_id, event_id, tags,
          likes_count, comments_count, created_at, state_label, location_label, tagged_users_json,
          author:users!author_id(id, name, avatar_url, nationality)
        `)
        .order("created_at", { ascending: false })
        .limit(30);

      // Filter by city first; fall back to state if no city
      if (city) {
        query = query.ilike("city_id", city);
      } else if (state) {
        query = query.ilike("state_label", `%${state}%`);
      }

      const { data } = await query;

      // If city filter returned nothing, try state fallback
      if (city && (!data || data.length === 0) && state) {
        const { data: stateData } = await supabase
          .from("posts")
          .select(`
            id, type, body, image_url, city_id, event_id, tags,
            likes_count, comments_count, created_at, state_label, location_label, tagged_users_json,
            author:users!author_id(id, name, avatar_url, nationality)
          `)
          .ilike("state_label", `%${state}%`)
          .order("created_at", { ascending: false })
          .limit(20);

        buildNearbyItems(stateData ?? []);
        setNearbyLoading(false);
        return;
      }

      buildNearbyItems(data ?? []);
      setNearbyLoading(false);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function buildNearbyItems(data: any[]) {
      let likedIds = new Set<string>();
      // Use already-loaded liked IDs from main feed (best effort)
      const mapped = data.map((p: any) => ({
        id: p.id,
        type: p.type as FeedItemType,
        author: {
          id: p.author?.id ?? "",
          name: p.author?.name ?? "Unknown",
          avatarUrl: p.author?.avatar_url ?? undefined,
          nationality: p.author?.nationality ?? undefined,
        },
        body: p.body,
        imageUrl: p.image_url ?? undefined,
        cityId: p.city_id ?? undefined,
        eventId: p.event_id ?? undefined,
        tags: p.tags ?? [],
        likesCount: p.likes_count,
        commentsCount: p.comments_count,
        isLiked: likedIds.has(p.id),
        createdAt: p.created_at,
        taggedUsersJson: p.tagged_users_json ?? [],
      }));
      setNearbyItems(mapped);
    }

    loadNearby();
  }, [activeTab, userLocation, userId]);

  function handleLike(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item || !userId) return;

    const newIsLiked = !item.isLiked;
    const newCount = newIsLiked ? item.likesCount + 1 : item.likesCount - 1;

    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, isLiked: newIsLiked, likesCount: newCount } : i
      )
    );

    if (newIsLiked) {
      supabase
        .from("post_likes")
        .upsert({ post_id: id, user_id: userId })
        .then(() =>
          supabase.from("posts").update({ likes_count: newCount }).eq("id", id)
        );
    } else {
      supabase
        .from("post_likes")
        .delete()
        .match({ post_id: id, user_id: userId })
        .then(() =>
          supabase.from("posts").update({ likes_count: newCount }).eq("id", id)
        );
    }
  }

  const nearbyLabel = userLocation
    ? userLocation.city
      ? `${userLocation.city}, ${userLocation.state}`
      : userLocation.state ?? "Your area"
    : "Nearby";

  return (
    <div className="mx-auto max-w-xl px-4 pt-4 pb-6">
      {/* Compose bar */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-card">
        <Avatar src={user?.image} name={user?.name ?? ""} size="sm" />
        <button
          className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100 transition-colors"
          onClick={() => setComposerOpen(true)}
        >
          Share a tip, find a fan, plan a meetup…
        </button>
        <Button
          size="sm"
          variant="primary"
          disabled={!userId}
          onClick={() => setComposerOpen(true)}
        >
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
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === "nearby" ? (
            nearbyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-32 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : nearbyItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-14 text-center">
                <Compass className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">
                  No posts near {userLocation?.city ?? "your location"} yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Be the first to post from {userLocation?.city ?? "here"}!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">{nearbyLabel}</span>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-600">
                    Near you
                  </span>
                  <div className="h-px flex-1 bg-slate-100" />
                </div>
                {nearbyItems.map((item) => (
                  <FeedCard key={item.id} item={item} onLike={handleLike} userId={userId} />
                ))}
              </div>
            )
          ) : (
            items.map((item) => (
              <FeedCard key={item.id} item={item} onLike={handleLike} userId={userId} />
            ))
          )}
        </div>
      )}

      {/* Load more */}
      {!loading && items.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" size="sm">
            Load more posts
          </Button>
        </div>
      )}

      {/* Post composer modal */}
      {userId && (
        <PostComposerModal
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onPosted={(item) => setItems((prev) => [item, ...prev])}
          userId={userId}
          userName={user?.name ?? ""}
          userImage={user?.image}
        />
      )}
    </div>
  );
}
