"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, MapPin, Bookmark } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime, formatCount } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
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
  userId?: string;
}

export function FeedCard({ item, onLike, userId }: FeedCardProps) {
  const [liked, setLiked] = useState(item.isLiked);
  const [likes, setLikes] = useState(item.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<{ id: string; body: string; author_name: string; created_at: string }>>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(item.commentsCount);

  const typeInfo = TYPE_LABELS[item.type];

  function handleLike() {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((l) => (newLiked ? l + 1 : l - 1));
    onLike?.(item.id);
  }

  async function handleCommentClick() {
    const opening = !showComments;
    setShowComments(opening);
    if (opening && !commentsLoaded) {
      const { data } = await supabase
        .from("post_comments")
        .select("id, body, created_at, author:users!author_id(name)")
        .eq("post_id", item.id)
        .order("created_at", { ascending: true });

      setComments(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data ?? []).map((c: any) => ({
          id: c.id,
          body: c.body,
          author_name: c.author?.name ?? "Unknown",
          created_at: c.created_at,
        }))
      );
      setCommentsLoaded(true);
    }
  }

  async function handleCommentSubmit() {
    if (!commentInput.trim() || !userId || submittingComment) return;
    setSubmittingComment(true);
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: item.id, author_id: userId, body: commentInput.trim() })
      .select("id, created_at")
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, { id: data.id, body: commentInput.trim(), author_name: "You", created_at: data.created_at }]);
      setLocalCommentCount((n) => n + 1);
      await supabase.from("posts").update({ comments_count: localCommentCount + 1 }).eq("id", item.id);
      setCommentInput("");
    }
    setSubmittingComment(false);
  }

  return (
    <article className="rounded-xl border border-slate-700/40 bg-[#12121a] shadow-card">
      {/* Author row */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar src={item.author.avatarUrl} name={item.author.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-100">{item.author.name}</span>
            {item.author.nationality && (
              <span className="text-sm">{getFlagEmoji(item.author.nationality)}</span>
            )}
            <Badge variant={typeInfo.color as "default" | "success" | "primary" | "warning" | "outline"}>
              {typeInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(item.createdAt)}</p>
        </div>
        <button className="rounded p-1 text-slate-600 hover:text-slate-400 transition-colors">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm leading-relaxed text-slate-300">{item.body}</p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span key={tag} className="text-xs font-medium text-brand-400 hover:text-brand-300 cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Post image */}
      {item.imageUrl && (
        <div className="mx-4 mb-3 overflow-hidden rounded-lg bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt="Post image"
            className="w-full object-cover max-h-80"
          />
        </div>
      )}

      {/* Tagged users */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {((item as any).taggedUsersJson as { id: string; name: string }[] | undefined)?.length ? (
        <div className="px-4 pb-2 text-xs text-slate-500">
          with{" "}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {((item as any).taggedUsersJson as { id: string; name: string }[])
            .map((u) => `@${u.name}`)
            .join(", ")}
        </div>
      ) : null}

      {/* Action bar */}
      <div className="flex items-center gap-1 border-t border-white/5 px-4 py-2.5">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            liked
              ? "text-rose-400 hover:bg-rose-500/10"
              : "text-slate-500 hover:bg-white/8 hover:text-slate-300"
          )}
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
          {formatCount(likes)}
        </button>

        <button
          onClick={handleCommentClick}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
            showComments
              ? "text-brand-400 hover:bg-brand-600/10"
              : "text-slate-500 hover:bg-white/8 hover:text-slate-300"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          {formatCount(localCommentCount)}
        </button>

        <div className="flex-1" />

        {item.cityId && (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3 w-3" />
            {item.cityId.toUpperCase()}
          </span>
        )}

        <button className="rounded-lg p-1.5 text-slate-500 hover:bg-white/8 hover:text-slate-300 transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3">
          {!commentsLoaded ? (
            <p className="text-xs text-slate-500">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <span className="font-medium text-slate-200 shrink-0">{c.author_name}</span>
                  <span className="text-slate-400">{c.body}</span>
                </div>
              ))}
            </div>
          )}
          {userId && (
            <div className="flex gap-2 items-center border border-slate-700/50 rounded-lg bg-[#1a1a27] px-3 py-1.5">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleCommentSubmit(); } }}
                placeholder="Add a comment…"
                className="flex-1 text-sm bg-transparent text-slate-200 focus:outline-none placeholder:text-slate-500"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!commentInput.trim() || submittingComment}
                className="text-xs font-medium text-brand-400 disabled:text-slate-600 hover:text-brand-300 transition-colors"
              >
                {submittingComment ? "…" : "Post"}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = [...countryCode.toUpperCase()].map(
    (c) => 127397 + c.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}
