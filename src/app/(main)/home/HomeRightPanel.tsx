import Link from "next/link";
import { Users, ChevronRight, Calendar } from "lucide-react";
import { MOCK_COMMUNITIES, MOCK_ITINERARY_ITEMS } from "@/data/mock";
import { Badge } from "@/components/ui/Badge";
import { formatShortDate } from "@/lib/utils";

export function HomeRightPanel() {
  const upcoming = MOCK_ITINERARY_ITEMS.filter(
    (i) => new Date(i.date) >= new Date()
  ).slice(0, 2);

  return (
    <div className="space-y-5">
      {/* Upcoming plans */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming</h3>
          <Link href="/planning" className="text-xs font-medium text-brand-600 hover:text-brand-700">View all</Link>
        </div>
        <div className="space-y-2">
          {upcoming.length === 0 ? (
            <p className="text-xs text-slate-400">No upcoming plans. Start planning your trip.</p>
          ) : (
            upcoming.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{formatShortDate(item.date)}{item.time ? ` · ${item.time}` : ""}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Suggested communities */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggested</h3>
          <Link href="/communities" className="text-xs font-medium text-brand-600 hover:text-brand-700">Browse</Link>
        </div>
        <div className="space-y-2">
          {MOCK_COMMUNITIES.filter((c) => !c.isJoined).slice(0, 3).map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
              className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 hover:bg-white transition-colors group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100">
                <Users className="h-4 w-4 text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-800 leading-snug">{community.name}</p>
                <p className="text-[10px] text-slate-400">{community.memberCount.toLocaleString()} members</p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
