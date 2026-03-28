"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-700/40 bg-[#0d0d15]/90 px-4 backdrop-blur-sm",
          className
        )}
      >
        {/* Mobile: Logo */}
        <Link href="/home" className="flex items-center gap-2.5 lg:hidden">
          <Image src="/logo-circa.svg" alt="Circa" width={34} height={34} className="shrink-0" />
          <span className="text-xl font-bold tracking-tight text-slate-100">Circa</span>
        </Link>

        {/* Desktop: page title */}
        {title && (
          <h1 className="hidden text-base font-semibold text-slate-100 lg:block">{title}</h1>
        )}

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Search — desktop */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 rounded-lg border border-slate-700/50 bg-white/5 px-3 py-1.5 text-sm text-slate-400 hover:bg-white/8 lg:flex"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-2 rounded bg-white/10 px-1 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/50">⌘K</kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/8 lg:hidden"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <NotificationsDropdown />

          {/* Avatar (mobile) */}
          <Avatar src={user?.image} name={user?.name ?? ""} size="sm" className="lg:hidden" />
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
