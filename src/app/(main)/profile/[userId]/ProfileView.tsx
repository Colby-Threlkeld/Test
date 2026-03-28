"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, UserPlus, UserCheck, Calendar, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FeedCard } from "@/components/features/feed/FeedCard";
import { cn, formatShortDate } from "@/lib/utils";
import type { FeedItem, FeedItemType } from "@/types/domain";

interface ProfileUser {
  id: string;
  name: string;
  avatar_url?: string;
  nationality?: string;
  created_at: string;
}

interface ProfileViewProps {
  userId: string;
}

export function ProfileView({ userId }: ProfileViewProps) {
  const router = useRouter();
  const { user } = useAuth();
  const currentUserId = (user as any)?.id as string | undefined;

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<FeedItem[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    async function load() {
      setLoading(true);

      const [userRes, postsRes, followersRes, followingRes] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, avatar_url, nationality, created_at")
          .eq("id", userId)
          .single(),
        supabase
          .from("posts")
          .select(`
            id, type, body, image_url, city_id, event_id, tags,
            likes_count, comments_count, created_at, state_label, location_label,
            author:users!author_id(id, name, avatar_url, nationality)
          `)
          .eq("author_id", userId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("follows")
          .select("follower_id", { count: "exact" })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("following_id", { count: "exact" })
          .eq("follower_id", userId),
      ]);

      if (userRes.data) setProfileUser(userRes.data as ProfileUser);

      if (postsRes.data) {
        setPosts(
          postsRes.data.map((p: any) => ({
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
            isLiked: false,
            createdAt: p.created_at,
          }))
        );
      }

      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);

      // Check if current user follows this profile
      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUserId)
          .eq("following_id", userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    }

    load();
  }, [userId, currentUserId]);

  async function handleFollowToggle() {
    if (!currentUserId || followLoading) return;
    setFollowLoading(true);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .match({ follower_id: currentUserId, following_id: userId });
      setIsFollowing(false);
      setFollowersCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: userId });
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }

    setFollowLoading(false);
  }

  async function handleSendMessage() {
    if (!currentUserId || messageLoading) return;
    setMessageLoading(true);

    try {
      // Find or create a thread
      const { data: myThreads } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", currentUserId);

      const { data: theirThreads } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", userId);

      const mySet = new Set((myThreads ?? []).map((t: any) => t.thread_id));
      const sharedIds = (theirThreads ?? [])
        .map((t: any) => t.thread_id)
        .filter((id: string) => mySet.has(id));

      if (sharedIds.length > 0) {
        const { data: existing } = await supabase
          .from("message_threads")
          .select("id")
          .in("id", sharedIds)
          .eq("is_group", false)
          .limit(1)
          .single();
        if (existing) {
          router.push("/messages");
          return;
        }
      }

      const { data: newThread } = await supabase
        .from("message_threads")
        .insert({ is_group: false })
        .select("id")
        .single();

      if (newThread) {
        await supabase.from("thread_participants").insert([
          { thread_id: newThread.id, user_id: currentUserId },
          { thread_id: newThread.id, user_id: userId },
        ]);
      }

      router.push("/messages");
    } finally {
      setMessageLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-8 pb-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 rounded bg-slate-200" />
              <div className="h-3 w-24 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-10 w-full rounded-lg bg-slate-100" />
          {[1, 2].map((n) => (
            <div key={n} className="h-28 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-16 text-center">
        <p className="text-slate-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-10">
      {/* Profile header */}
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-card mb-4">
        <div className="flex items-start gap-4">
          <Avatar src={profileUser.avatar_url} name={profileUser.name} size="xl" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 truncate">{profileUser.name}</h1>
            {profileUser.nationality && (
              <p className="text-sm text-slate-500 mt-0.5">{profileUser.nationality}</p>
            )}
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {formatShortDate(profileUser.created_at)}
            </p>

            {/* Stats */}
            <div className="mt-3 flex items-center gap-5">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">{followersCount}</p>
                <p className="text-[11px] text-slate-400">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">{followingCount}</p>
                <p className="text-[11px] text-slate-400">Following</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">{posts.length}</p>
                <p className="text-[11px] text-slate-400">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && currentUserId && (
          <div className="mt-4 flex gap-2">
            <Button
              variant={isFollowing ? "outline" : "primary"}
              size="sm"
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={cn(
                "flex-1 gap-1.5",
                isFollowing && "text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              )}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Follow
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendMessage}
              disabled={messageLoading}
              className="flex-1 gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Message
            </Button>
          </div>
        )}
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Posts</h2>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No posts yet.</p>
        ) : (
          <div className="space-y-3">
            {posts.map((item) => (
              <FeedCard key={item.id} item={item} userId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
