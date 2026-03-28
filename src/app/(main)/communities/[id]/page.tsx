import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Lock, ChevronLeft, Globe } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from("communities")
    .select("name")
    .eq("id", id)
    .single();
  return { title: data?.name ?? "Community" };
}

export default async function CommunityDetailPage({ params }: Props) {
  const { id } = await params;

  const [{ data: community }, session] = await Promise.all([
    supabase.from("communities").select("*").eq("id", id).single(),
    getServerSession(authOptions),
  ]);

  if (!community) notFound();

  const userId = (session?.user as any)?.id as string | undefined;
  let isJoined = false;
  if (userId) {
    const { data: membership } = await supabase
      .from("community_members")
      .select("user_id")
      .eq("community_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    isJoined = !!membership;
  }

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
          {community.is_private && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white">
              <Lock className="h-3 w-3" /> Private
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-slate-900 leading-snug">{community.name}</h1>
            <Button variant={isJoined ? "secondary" : "primary"} size="sm">
              {isJoined ? "Joined" : "Join community"}
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {community.member_count.toLocaleString()} members
            </span>
            {community.city_id && (
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {community.city_id.toUpperCase()}
              </span>
            )}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">{community.description}</p>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(community.tags ?? []).map((tag: string) => (
              <Badge key={tag} variant="outline">#{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Posts placeholder */}
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent posts</h2>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-14 text-center">
            <p className="text-sm text-slate-400">Community posts will appear here.</p>
            {isJoined && (
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
