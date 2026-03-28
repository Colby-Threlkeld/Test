"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Users, CalendarDays, Settings, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Messages", href: "/messages", icon: MessageCircle },
  { label: "Translate", href: "/translate", icon: Languages },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Planning", href: "/planning", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-slate-100 bg-white/95 backdrop-blur-sm lg:hidden">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active ? "text-brand-600" : "text-slate-500 hover:text-slate-800"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
