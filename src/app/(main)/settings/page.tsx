import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "./SettingsView";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <AppShell pageTitle="Settings">
      <SettingsView />
    </AppShell>
  );
}
