"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { AppNotification } from "@/types/domain";

interface NotificationsSlice {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  setNotifications: (notifications: AppNotification[]) => void;
  markRead: (id: string, userId?: string) => void;
  markAllRead: (userId?: string) => void;
}

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

interface UserLocation {
  city: string;
  state: string;
  country: string;
  locationLabel: string;
}

interface LocationSlice {
  userLocation: UserLocation | null;
  locationDetected: boolean;
  setUserLocation: (loc: UserLocation) => void;
  setLocationDetected: () => void;
}

export interface EventsCacheEntry {
  data: unknown[];
  timestamp: number;
  /** "{city}|{state}" — scopes the cache to a location */
  locationKey: string;
}

interface EventsCacheSlice {
  eventsCache: EventsCacheEntry | null;
  setEventsCache: (entry: EventsCacheEntry) => void;
  clearEventsCache: () => void;
}

type UIStore = NotificationsSlice & UISlice & LocationSlice & EventsCacheSlice;

export const useUIStore = create<UIStore>((set) => ({
  // ── Notifications ──────────────────────────
  notifications: [] as AppNotification[],
  unreadCount: 0,
  isOpen: false,

  openNotifications: () => set({ isOpen: true }),
  closeNotifications: () => set({ isOpen: false }),
  toggleNotifications: () => set((s) => ({ isOpen: !s.isOpen })),

  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length }),

  markRead: (id, userId) => {
    if (userId) {
      supabase.from("notifications").update({ is_read: true }).eq("id", id).then(() => {});
    }
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length };
    });
  },

  markAllRead: (userId) => {
    if (userId) {
      supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)
        .then(() => {});
    }
    set({ notifications: [], unreadCount: 0 });
  },

  // ── Sidebar ────────────────────────────────
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  // ── Location ───────────────────────────────
  userLocation: null,
  locationDetected: false,
  setUserLocation: (loc) => set({ userLocation: loc }),
  setLocationDetected: () => set({ locationDetected: true }),

  // ── Events cache ───────────────────────────
  eventsCache: null,
  setEventsCache: (entry) => set({ eventsCache: entry }),
  clearEventsCache: () => set({ eventsCache: null }),
}));
