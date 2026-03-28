"use client";

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  rightPanel?: React.ReactNode;
}

export function AppShell({ children, pageTitle, rightPanel }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
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
            <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-100 bg-white p-4 xl:block">
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
