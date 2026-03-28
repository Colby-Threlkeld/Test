"use client";

import { create } from "zustand";
import type { AppNotification } from "@/types/domain";
import { MOCK_NOTIFICATIONS } from "@/data/mock";

interface NotificationsSlice {
  notifications: AppNotification[];
  unreadCount: number;
  isOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;
  toggleNotifications: () => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

type UIStore = NotificationsSlice & UISlice;

export const useUIStore = create<UIStore>((set) => ({
  // ── Notifications ──────────────────────────
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length,
  isOpen: false,

  openNotifications: () => set({ isOpen: true }),
  closeNotifications: () => set({ isOpen: false }),
  toggleNotifications: () => set((s) => ({ isOpen: !s.isOpen })),

  markRead: (id) =>
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      };
    }),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  // ── Sidebar ────────────────────────────────
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));
