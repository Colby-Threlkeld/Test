"use client";

import Link from "next/link";
import { Globe, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
  const { user } = useAuth();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur-sm",
        className
      )}
    >
      {/* Mobile: Logo */}
      <Link href="/home" className="flex items-center gap-2 lg:hidden">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
          <Globe className="h-4 w-4 text-white" />
        </span>
        <span className="text-sm font-bold tracking-tight text-slate-900">FanZone</span>
      </Link>

      {/* Desktop: page title */}
      {title && (
        <h1 className="hidden text-base font-semibold text-slate-900 lg:block">{title}</h1>
      )}

      <div className="flex flex-1 items-center justify-end gap-2">
        {/* Search — desktop */}
        <button className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-100 lg:flex">
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded bg-white px-1 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-200">⌘K</kbd>
        </button>

        {/* Mobile search icon */}
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Avatar (mobile) */}
        <Avatar src={user?.image} name={user?.name ?? ""} size="sm" className="lg:hidden" />
      </div>
    </header>
  );
}
