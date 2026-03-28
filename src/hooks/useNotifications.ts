"use client";

import { useUIStore } from "@/store/ui";

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isOpen,
    openNotifications,
    closeNotifications,
    toggleNotifications,
    setNotifications,
    markRead,
    markAllRead,
  } = useUIStore();

  return {
    notifications,
    unreadCount,
    isOpen,
    openNotifications,
    closeNotifications,
    toggleNotifications,
    setNotifications,
    markRead,
    markAllRead,
  };
}
