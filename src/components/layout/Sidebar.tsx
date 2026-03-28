"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Users,
  CalendarDays,
  Settings,
  Globe,
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
          ? "bg-brand-50 text-brand-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", active ? "text-brand-600" : "text-slate-400")} />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-100 bg-white px-3 py-4">
      {/* Logo */}
      <Link href="/home" className="mb-6 flex items-center gap-2.5 px-3 py-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Globe className="h-5 w-5 text-white" />
        </span>
        <span className="text-base font-bold tracking-tight text-slate-900">FanZone</span>
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
      <div className="mt-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar src={user?.image} name={user?.name ?? ""} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
