"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PenSquare, MessageCircle } from "lucide-react";
import { ThreadList } from "@/components/features/messaging/ThreadList";
import { ChatWindow } from "@/components/features/messaging/ChatWindow";
import { MessageComposer } from "@/components/features/messaging/MessageComposer";
import { NewMessageModal } from "@/components/features/messaging/NewMessageModal";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";
import type { Message, MessageThread } from "@/types/domain";

export function MessagesView() {
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (user as any)?.id as string | undefined;
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);

  // Deep-link: read ?thread= param and activate the thread
  useEffect(() => {
    const threadParam = searchParams.get("thread");
    if (threadParam && threads.length > 0) {
      setActiveThreadId(threadParam);
    }
  }, [searchParams, threads]);

  // Load threads for current user
  useEffect(() => {
    if (!userId) return;

    async function loadThreads() {
      const { data: participations } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", userId);

      if (!participations?.length) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const threadIds = participations.map((p: any) => p.thread_id);

      const [{ data: threadData }, { data: participantData }, { data: msgData }] =
        await Promise.all([
          supabase
            .from("message_threads")
            .select("id, is_group, group_name, updated_at")
            .in("id", threadIds)
            .order("updated_at", { ascending: false }),
          supabase
            .from("thread_participants")
            .select("thread_id, user_id, last_read_at, user:users!user_id(id, name, avatar_url)")
            .in("thread_id", threadIds),
          supabase
            .from("messages")
            .select("id, thread_id, sender_id, body, is_read, created_at")
            .in("thread_id", threadIds)
            .order("created_at", { ascending: false }),
        ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const built: MessageThread[] = (threadData ?? []).map((t: any) => {
        const participants = (participantData ?? [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((p: any) => p.thread_id === t.id && p.user_id !== userId)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((p: any) => ({
            id: p.user?.id ?? p.user_id,
            name: p.user?.name ?? "Unknown",
            avatarUrl: p.user?.avatar_url ?? undefined,
          }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const threadMsgs = (msgData ?? []).filter((m: any) => m.thread_id === t.id);
        const lastMsg = threadMsgs[0];

        // Compute unread count using per-user last_read_at instead of per-message is_read
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const myParticipation = (participantData ?? []).find((p: any) => p.thread_id === t.id && p.user_id === userId);
        const lastReadAt = myParticipation?.last_read_at ? new Date(myParticipation.last_read_at).getTime() : 0;
        const unreadCount = threadMsgs.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) => m.sender_id !== userId && new Date(m.created_at).getTime() > lastReadAt
        ).length;

        return {
          id: t.id,
          participants,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                threadId: lastMsg.thread_id,
                senderId: lastMsg.sender_id,
                body: lastMsg.body,
                createdAt: lastMsg.created_at,
                isRead: lastMsg.is_read,
              }
            : undefined,
          unreadCount,
          updatedAt: t.updated_at,
          isGroup: t.is_group,
          groupName: t.group_name ?? undefined,
        };
      });

      setThreads(built);
    }

    loadThreads();
  }, [userId]);

  // Load messages + realtime subscription when active thread changes
  useEffect(() => {
    if (!activeThreadId) return;

    supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, is_read, created_at")
      .eq("thread_id", activeThreadId)
      .order("created_at", { ascending: true })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }) => {
        if (data) {
          setMessages((prev) => ({
            ...prev,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [activeThreadId]: data.map((m: any) => ({
              id: m.id,
              threadId: m.thread_id,
              senderId: m.sender_id,
              body: m.body,
              createdAt: m.created_at,
              isRead: m.is_read,
            })),
          }));
        }
      });

    // Mark this thread as read by updating last_read_at for the current user
    if (userId) {
      supabase
        .from("thread_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("thread_id", activeThreadId)
        .eq("user_id", userId)
        .then(() => {});

      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, unreadCount: 0 } : t))
      );
    }

    // Dismiss all unread message notifications when a thread is opened
    if (userId) {
      supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("type", "message")
        .eq("is_read", false);

      const { notifications, setNotifications } = useUIStore.getState();
      setNotifications(notifications.filter((n) => !(n.type === "message" && !n.isRead)));
    }

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`thread-${activeThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${activeThreadId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const m = payload.new;
          if (m.sender_id === userId) return;
          setMessages((prev) => ({
            ...prev,
            [m.thread_id]: [
              ...(prev[m.thread_id] ?? []),
              {
                id: m.id,
                threadId: m.thread_id,
                senderId: m.sender_id,
                body: m.body,
                createdAt: m.created_at,
                isRead: m.is_read,
              },
            ],
          }));
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, userId]);

  async function handleSend(body: string) {
    if (!activeThreadId || !userId) return;

    const tempId = `temp_${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      threadId: activeThreadId,
      senderId: userId,
      body,
      createdAt: new Date().toISOString(),
      isRead: true,
    };

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] ?? []), tempMsg],
    }));

    const { data } = await supabase
      .from("messages")
      .insert({ thread_id: activeThreadId, sender_id: userId, body, is_read: false })
      .select("id, thread_id, sender_id, body, is_read, created_at")
      .single();

    if (data) {
      setMessages((prev) => ({
        ...prev,
        [activeThreadId]: (prev[activeThreadId] ?? []).map((m) =>
          m.id === tempId
            ? {
                id: data.id,
                threadId: data.thread_id,
                senderId: data.sender_id,
                body: data.body,
                createdAt: data.created_at,
                isRead: data.is_read,
              }
            : m
        ),
      }));

      supabase
        .from("message_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeThreadId);

      // Send notifications to all other participants
      const { data: participants } = await supabase
        .from("thread_participants")
        .select("user_id")
        .eq("thread_id", activeThreadId)
        .neq("user_id", userId);

      if (participants && participants.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const senderName = (user as any)?.name ?? "Someone";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notifRows = participants.map((p: any) => ({
          user_id: p.user_id,
          type: "message",
          title: `${senderName} sent you a message`,
          body: body.substring(0, 100),
          link_to: `/messages?thread=${activeThreadId}`,
          is_read: false,
        }));
        supabase.from("notifications").insert(notifRows);
      }
    }
  }

  async function handleDeleteThread(threadId: string) {
    if (!window.confirm("Delete this conversation? This cannot be undone.")) return;

    await supabase.from("message_threads").delete().eq("id", threadId);

    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[threadId];
      return next;
    });

    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
  }

  function handleThreadCreated(
    threadId: string,
    selectedUser: { id: string; name: string; avatar_url?: string }
  ) {
    setActiveThreadId(threadId);
    setNewMessageOpen(false);
    if (userId) {
      setThreads((prev) => {
        const exists = prev.find((t) => t.id === threadId);
        if (exists) return prev;
        return [
          {
            id: threadId,
            participants: [
              { id: selectedUser.id, name: selectedUser.name, avatarUrl: selectedUser.avatar_url },
            ],
            unreadCount: 0,
            updatedAt: new Date().toISOString(),
            isGroup: false,
          },
          ...prev,
        ];
      });
    }
  }

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;
  const activeMessages = activeThreadId ? (messages[activeThreadId] ?? []) : [];

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Thread list — always visible on desktop, visible on mobile when no thread selected */}
        <div
          className={cn(
            "flex w-full flex-col border-r border-slate-700/40 bg-[#0d0d15] lg:w-72 xl:w-80",
            activeThreadId && "hidden lg:flex"
          )}
        >
          <div className="flex items-center justify-between border-b border-slate-700/40 px-4 py-3.5">
            <h2 className="text-sm font-semibold text-slate-100">Messages</h2>
            <Button
              variant="ghost"
              size="icon"
              title="New message"
              onClick={() => setNewMessageOpen(true)}
            >
              <PenSquare className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ThreadList
              threads={threads}
              activeThreadId={activeThreadId ?? undefined}
              onSelect={(id) => setActiveThreadId(id)}
              onDelete={handleDeleteThread}
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-brand-400 hover:text-brand-300 lg:hidden"
              >
                ← Back to messages
              </button>

              <ChatWindow thread={activeThread} messages={activeMessages} />
              <MessageComposer onSend={handleSend} />
            </>
          ) : (
            <div className="hidden flex-1 flex-col items-center justify-center gap-3 lg:flex">
              <MessageCircle className="h-12 w-12 text-slate-700" />
              <p className="text-sm font-medium text-slate-400">Select a conversation</p>
              <p className="text-xs text-slate-500">
                Or start a new message from a community or user profile.
              </p>
            </div>
          )}
        </div>
      </div>

      {userId && (
        <NewMessageModal
          open={newMessageOpen}
          onClose={() => setNewMessageOpen(false)}
          onThreadCreated={handleThreadCreated}
          currentUserId={userId}
        />
      )}
    </>
  );
}
