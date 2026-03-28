import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { HomeFeed } from "./HomeFeed";
import { HomeRightPanel } from "./HomeRightPanel";

export const metadata: Metadata = { title: "Home" };

export default function HomePage() {
  return (
    <AppShell pageTitle="Home" rightPanel={<HomeRightPanel />}>
      <HomeFeed />
    </AppShell>
  );
}
