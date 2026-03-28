"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, MessageCircle, Users, Calendar, Heart, Settings } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types/domain";
import { useUIStore } from "@/store/ui";

const typeIcon: Record<NotificationType, React.ReactNode> = {
  message: <MessageCircle className="h-3.5 w-3.5" />,
  community_activity: <Users className="h-3.5 w-3.5" />,
  event_reminder: <Calendar className="h-3.5 w-3.5" />,
  planning_update: <Calendar className="h-3.5 w-3.5" />,
  social_interaction: <Heart className="h-3.5 w-3.5" />,
  system: <Settings className="h-3.5 w-3.5" />,
};

const typeColor: Record<NotificationType, string> = {
  message: "bg-blue-500/20 text-blue-400",
  community_activity: "bg-violet-500/20 text-violet-400",
  event_reminder: "bg-amber-500/20 text-amber-400",
  planning_update: "bg-emerald-500/20 text-emerald-400",
  social_interaction: "bg-pink-500/20 text-pink-400",
  system: "bg-white/10 text-slate-400",
};

function NotificationItem({ notification, userId }: { notification: AppNotification; userId?: string }) {
  const router = useRouter();
  const { markRead } = useNotifications();

  function handleClick() {
    markRead(notification.id, userId);
    if (notification.linkTo) router.push(notification.linkTo);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
        !notification.isRead && "bg-brand-600/10"
      )}
    >
      <div className="relative mt-0.5 shrink-0">
        <Avatar
          src={notification.actorAvatarUrl}
          name={notification.title}
          size="sm"
        />
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full",
            typeColor[notification.type]
          )}
        >
          {typeIcon[notification.type]}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm leading-snug", !notification.isRead ? "font-semibold text-slate-100" : "font-medium text-slate-300")}>
          {notification.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{notification.body}</p>
        <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(notification.createdAt)}</p>
      </div>

      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
      )}
    </button>
  );
}

export function NotificationsDropdown() {
  const { notifications, unreadCount, isOpen, toggleNotifications, closeNotifications, markAllRead, setNotifications } =
    useNotifications();
  const { user } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (user as any)?.id as string | undefined;
  const ref = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeRef = useRef<any>(null);

  // Load notifications from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("notifications")
      .select("id, type, title, body, is_read, link_to, actor_avatar_url, created_at")
      .eq("user_id", userId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNotifications(data.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          isRead: n.is_read,
          linkTo: n.link_to ?? undefined,
          actorAvatarUrl: n.actor_avatar_url ?? undefined,
          createdAt: n.created_at,
        })));
      });
  }, [userId, setNotifications]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!userId) return;

    realtimeRef.current = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const n = payload.new;
          const newNotif: AppNotification = {
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            isRead: n.is_read,
            linkTo: n.link_to ?? undefined,
            actorAvatarUrl: n.actor_avatar_url ?? undefined,
            createdAt: n.created_at,
          };
          const { notifications: current, setNotifications } = useUIStore.getState();
          setNotifications([newNotif, ...current]);
        }
      )
      .subscribe();

    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current);
        realtimeRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closeNotifications();
      }
    }
    if (isOpen) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, closeNotifications]);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={toggleNotifications}
        aria-label="Notifications"
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          isOpen ? "bg-brand-600/15 text-brand-400" : "text-slate-400 hover:bg-white/8"
        )}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-slate-700/50 bg-[#12121a] shadow-dropdown sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/40 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead(userId)}
                className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Items */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">You're all caught up</p>
              </div>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} notification={n} userId={userId} />)
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700/40 px-4 py-2">
            <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500">
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
