import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { CommunitiesView } from "./CommunitiesView";

export const metadata: Metadata = { title: "Communities" };

export default function CommunitiesPage() {
  return (
    <AppShell pageTitle="Communities">
      <CommunitiesView />
    </AppShell>
  );
}
