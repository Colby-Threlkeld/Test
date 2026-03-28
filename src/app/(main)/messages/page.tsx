import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { MessagesView } from "./MessagesView";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <AppShell pageTitle="Messages">
      <MessagesView />
    </AppShell>
  );
}
