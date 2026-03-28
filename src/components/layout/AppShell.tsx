"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";
import { useUserLocation } from "@/hooks/useUserLocation";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  rightPanel?: React.ReactNode;
}

export function AppShell({ children, pageTitle, rightPanel }: AppShellProps) {
  const { detect } = useUserLocation();
  useEffect(() => { detect(); }, [detect]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a0f]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={pageTitle} />

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
            {children}
          </main>

          {/* Optional right panel (desktop only) */}
          {rightPanel && (
            <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-700/40 bg-[#0d0d15] p-4 xl:block">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
