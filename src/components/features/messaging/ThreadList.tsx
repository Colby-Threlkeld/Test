"use client";

import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { MessageThread } from "@/types/domain";

interface ThreadListProps {
  threads: MessageThread[];
  activeThreadId?: string;
  onSelect: (threadId: string) => void;
}

export function ThreadList({ threads, activeThreadId, onSelect }: ThreadListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <p className="text-sm font-medium text-slate-700">No conversations yet</p>
        <p className="mt-1 text-xs text-slate-400">Start by messaging someone from a community or their profile.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {threads.map((thread) => {
        const isActive = thread.id === activeThreadId;
        const displayName = thread.isGroup
          ? thread.groupName ?? "Group"
          : thread.participants[0]?.name ?? "Unknown";
        const avatarSrc = thread.isGroup ? undefined : thread.participants[0]?.avatarUrl;

        return (
          <button
            key={thread.id}
            onClick={() => onSelect(thread.id)}
            className={cn(
              "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors",
              isActive ? "bg-brand-50" : "hover:bg-slate-50"
            )}
          >
            {thread.isGroup ? (
              <AvatarGroup avatars={thread.participants.map((p) => ({ src: p.avatarUrl, name: p.name }))} max={2} size="md" />
            ) : (
              <Avatar src={avatarSrc} name={displayName} size="md" />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className={cn("truncate text-sm", thread.unreadCount > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
                  {displayName}
                </p>
                <span className="shrink-0 text-[11px] text-slate-400">
                  {formatRelativeTime(thread.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={cn("truncate text-xs", thread.unreadCount > 0 ? "text-slate-700 font-medium" : "text-slate-400")}>
                  {thread.lastMessage?.body}
                </p>
                {thread.unreadCount > 0 && (
                  <span className="ml-2 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
