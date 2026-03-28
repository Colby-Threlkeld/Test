import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Lock, ChevronLeft, Globe } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_COMMUNITIES } from "@/data/mock";

interface Props {
  params: { id: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const community = MOCK_COMMUNITIES.find((c) => c.id === params.id);
  return { title: community?.name ?? "Community" };
}

export default function CommunityDetailPage({ params }: Props) {
  const community = MOCK_COMMUNITIES.find((c) => c.id === params.id);
  if (!community) notFound();

  return (
    <AppShell pageTitle={community.name}>
      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Back */}
        <Link
          href="/communities"
          className="mb-4 flex w-fit items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All communities
        </Link>

        {/* Cover */}
        <div className="relative h-32 w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 to-brand-700">
          {community.isPrivate && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white">
              <Lock className="h-3 w-3" /> Private
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-slate-900 leading-snug">{community.name}</h1>
            <Button variant={community.isJoined ? "secondary" : "primary"} size="sm">
              {community.isJoined ? "Joined" : "Join community"}
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {community.memberCount.toLocaleString()} members
            </span>
            {community.cityId && (
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {community.cityId.toUpperCase()}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">{community.description}</p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {community.tags.map((tag) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Posts placeholder */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent posts</h2>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-14 text-center">
            <p className="text-sm text-slate-400">Community posts will appear here.</p>
            {community.isJoined && (
              <Button variant="primary" size="sm" className="mt-3">
                Post to community
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
