"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { CommunityCard } from "@/components/features/communities/CommunityCard";
import { CommunityFilters } from "@/components/features/communities/CommunityFilters";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Community, CommunityType } from "@/types/domain";

export function CommunitiesView() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = (user as any)?.id as string | undefined;
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("member_count", { ascending: false });

      if (error || !data) { setLoading(false); return; }

      let joinedIds = new Set<string>();
      if (userId) {
        const { data: memberships } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", userId);
        joinedIds = new Set(memberships?.map((m: any) => m.community_id) ?? []);
      }

      setCommunities(
        data.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? "",
          type: c.type as CommunityType,
          coverImage: c.cover_image ?? undefined,
          memberCount: c.member_count,
          isJoined: joinedIds.has(c.id),
          isPrivate: c.is_private,
          cityId: c.city_id ?? undefined,
          eventId: c.event_id ?? undefined,
          tags: c.tags ?? [],
          createdAt: c.created_at,
        }))
      );
      setLoading(false);
    }
    load();
  }, [userId]);

  const joined = communities.filter((c) => c.isJoined);
  const discover = communities.filter((c) => !c.isJoined);

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

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <CommunityFilters onSearch={setQuery} onFilter={setActiveFilter} activeFilter={activeFilter} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
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
