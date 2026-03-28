import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MessagesView } from "./MessagesView";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <AppShell pageTitle="Messages">
      <Suspense fallback={<div />}>
        <MessagesView />
      </Suspense>
    </AppShell>
  );
}
