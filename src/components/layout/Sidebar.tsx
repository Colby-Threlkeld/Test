"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Users,
  CalendarDays,
  Settings,
  LogOut,
  Languages,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Translate", href: "/translate", icon: Languages },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Planning", href: "/planning", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
}

function SidebarNavItem({ label, href, icon: Icon, active }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-600/15 text-brand-400"
          : "text-slate-400 hover:bg-white/8 hover:text-slate-200"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-brand-400" : "text-slate-500")} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-700/40 bg-[#0d0d15] px-3 py-4">
      {/* Logo */}
      <Link href="/home" className="mb-6 flex items-center gap-3 px-3 py-1">
        <Image src="/logo-circa.png" alt="Circa" width={40} height={40} className="shrink-0" />
        <span className="text-2xl font-bold tracking-tight text-slate-100">Circa</span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.href}
            {...item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* User / Sign out */}
      <div className="mt-2 border-t border-slate-700/40 pt-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar src={user?.image} name={user?.name ?? ""} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="rounded p-1 text-slate-500 hover:bg-white/8 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
