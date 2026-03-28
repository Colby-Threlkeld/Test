"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { Message, MessageThread } from "@/types/domain";

const CURRENT_USER_ID = "u1";

interface ChatWindowProps {
  thread: MessageThread;
  messages: Message[];
}

export function ChatWindow({ thread, messages }: ChatWindowProps) {
  const displayName = thread.isGroup
    ? thread.groupName ?? "Group"
    : thread.participants[0]?.name ?? "Unknown";
  const avatarSrc = thread.isGroup ? undefined : thread.participants[0]?.avatarUrl;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
        <Avatar src={avatarSrc} name={displayName} size="md" />
        <div>
          <p className="text-sm font-semibold text-slate-900">{displayName}</p>
          {thread.isGroup && (
            <p className="text-xs text-slate-500">{thread.participants.length} members</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === CURRENT_USER_ID;
          const sender = thread.participants.find((p) => p.id === msg.senderId);

          return (
            <div key={msg.id} className={cn("flex items-end gap-2", isOwn && "flex-row-reverse")}>
              {!isOwn && (
                <Avatar src={sender?.avatarUrl} name={sender?.name} size="xs" className="mb-0.5 shrink-0" />
              )}
              <div className={cn("max-w-[72%] space-y-1", isOwn && "items-end flex flex-col")}>
                {!isOwn && thread.isGroup && (
                  <p className="px-1 text-[10px] font-medium text-slate-500">{sender?.name}</p>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    isOwn
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-800"
                  )}
                >
                  {msg.body}
                </div>
                <p className="px-1 text-[10px] text-slate-400">
                  {formatRelativeTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
