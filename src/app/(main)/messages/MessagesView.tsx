"use client";

import { useState } from "react";
import { PenSquare, MessageCircle } from "lucide-react";
import { ThreadList } from "@/components/features/messaging/ThreadList";
import { ChatWindow } from "@/components/features/messaging/ChatWindow";
import { MessageComposer } from "@/components/features/messaging/MessageComposer";
import { Button } from "@/components/ui/Button";
import { MOCK_THREADS, MOCK_MESSAGES } from "@/data/mock";
import { cn } from "@/lib/utils";
import type { Message, MessageThread } from "@/types/domain";

export function MessagesView() {
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const activeMessages = activeThreadId ? (messages[activeThreadId] ?? []) : [];

  function handleSend(body: string) {
    if (!activeThreadId) return;
    const newMsg: Message = {
      id: `m_${Date.now()}`,
      threadId: activeThreadId,
      senderId: "u1",
      body,
      createdAt: new Date().toISOString(),
      isRead: true,
    };
    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] ?? []), newMsg],
    }));
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Thread list — always visible on desktop, visible on mobile when no thread selected */}
      <div
        className={cn(
          "flex w-full flex-col border-r border-slate-100 bg-white lg:w-72 xl:w-80",
          activeThreadId && "hidden lg:flex"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
          <Button variant="ghost" size="icon" title="New message">
            <PenSquare className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ThreadList
            threads={threads}
            activeThreadId={activeThreadId ?? undefined}
            onSelect={(id) => setActiveThreadId(id)}
          />
        </div>
      </div>

      {/* Chat area */}
      <div
        className={cn(
          "flex flex-1 flex-col",
          !activeThreadId && "hidden lg:flex"
        )}
      >
        {activeThread ? (
          <>
            {/* Mobile back */}
            <button
              onClick={() => setActiveThreadId(null)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-brand-600 hover:text-brand-700 lg:hidden"
            >
              ← Back to messages
            </button>

            <ChatWindow thread={activeThread} messages={activeMessages} />
            <MessageComposer onSend={handleSend} />
          </>
        ) : (
          <div className="hidden flex-1 flex-col items-center justify-center gap-3 lg:flex">
            <MessageCircle className="h-12 w-12 text-slate-200" />
            <p className="text-sm font-medium text-slate-600">Select a conversation</p>
            <p className="text-xs text-slate-400">
              Or start a new message from a community or user profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
