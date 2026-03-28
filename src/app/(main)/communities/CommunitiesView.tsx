"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { CommunityCard } from "@/components/features/communities/CommunityCard";
import { CommunityFilters } from "@/components/features/communities/CommunityFilters";
import { MOCK_COMMUNITIES } from "@/data/mock";
import type { Community } from "@/types/domain";

export function CommunitiesView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const joined = MOCK_COMMUNITIES.filter((c) => c.isJoined);
  const discover = MOCK_COMMUNITIES.filter((c) => !c.isJoined);

  function filtered(list: Community[]) {
    return list.filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      const matchesFilter = activeFilter === "all" || c.type === activeFilter;
      return matchesQuery && matchesFilter;
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      {/* Filters */}
      <CommunityFilters
        onSearch={setQuery}
        onFilter={setActiveFilter}
        activeFilter={activeFilter}
      />

      {/* Joined */}
      {joined.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users className="h-4 w-4 text-brand-400" /> Your communities
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered(joined).map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                onView={(id) => router.push(`/communities/${id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Discover */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Discover</h2>
        {filtered(discover).length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No communities match your search.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered(discover).map((c) => (
              <CommunityCard
                key={c.id}
                community={c}
                onView={(id) => router.push(`/communities/${id}`)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
