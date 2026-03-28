import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { PlanningView } from "./PlanningView";

export const metadata: Metadata = { title: "Planning" };

export default function PlanningPage() {
  return (
    <AppShell pageTitle="Planning">
      <PlanningView />
    </AppShell>
  );
}
