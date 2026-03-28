"use client";

import { useState, useEffect } from "react";
import { User, Bell, Lock, Palette, LogOut, ChevronRight, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          enabled ? "bg-brand-600" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
            enabled ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </h2>
  );
}

export function SettingsView() {
  const { user, signOut } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (user as any)?.id as string | undefined;

  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [notifications, setNotificationsState] = useState({
    messages: true,
    communityActivity: true,
    eventReminders: true,
    marketing: false,
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showLocation: false,
    allowMessages: true,
  });

  // Load persisted prefs on mount
  useEffect(() => {
    if (!userId) return;
    if (user?.name) setDisplayName(user.name);

    // Load bio from DB
    supabase.from("users").select("bio").eq("id", userId).single().then(({ data }) => {
      if (data?.bio) setBio(data.bio);
    });

    // Load notification/privacy prefs from localStorage
    try {
      const savedNotifs = localStorage.getItem(`fanzone_notifs_${userId}`);
      if (savedNotifs) setNotificationsState(JSON.parse(savedNotifs));
      const savedPrivacy = localStorage.getItem(`fanzone_privacy_${userId}`);
      if (savedPrivacy) setPrivacy(JSON.parse(savedPrivacy));
    } catch {
      // ignore corrupt localStorage
    }
  }, [userId, user?.name]);

  function handleNotifChange(key: keyof typeof notifications, v: boolean) {
    const next = { ...notifications, [key]: v };
    setNotificationsState(next);
    if (userId) localStorage.setItem(`fanzone_notifs_${userId}`, JSON.stringify(next));
  }

  function handlePrivacyChange(key: keyof typeof privacy, v: boolean) {
    const next = { ...privacy, [key]: v };
    setPrivacy(next);
    if (userId) localStorage.setItem(`fanzone_privacy_${userId}`, JSON.stringify(next));
  }

  async function handleSaveProfile() {
    if (!userId || saving || !displayName.trim()) return;
    setSaving(true);
    await supabase
      .from("users")
      .update({ name: displayName.trim(), bio: bio.trim() || null })
      .eq("id", userId);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* Profile section */}
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-card">
        <SectionHeading><User className="h-3.5 w-3.5" /> Profile</SectionHeading>

        <div className="mt-4 flex items-center gap-4">
          <Avatar src={user?.image} name={user?.name ?? ""} size="xl" />
          <div>
            <p className="text-base font-semibold text-slate-900">{displayName || user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            type="email"
            value={user?.email ?? ""}
            readOnly
            placeholder="you@example.com"
          />
          <div>
            <label className="text-sm font-medium text-slate-700">Bio</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other fans a bit about you…"
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <Button
          className="mt-4 w-full"
          variant="primary"
          size="md"
          onClick={handleSaveProfile}
          disabled={saving || !displayName.trim()}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <><Check className="h-4 w-4" /> Saved</>
          ) : (
            "Save changes"
          )}
        </Button>
      </section>

      {/* Notification preferences */}
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-card">
        <SectionHeading><Bell className="h-3.5 w-3.5" /> Notifications</SectionHeading>
        <div className="mt-2 divide-y divide-slate-50">
          <Toggle
            label="Direct messages"
            description="When someone sends you a message"
            enabled={notifications.messages}
            onChange={(v) => handleNotifChange("messages", v)}
          />
          <Toggle
            label="Community activity"
            description="Posts and updates from communities you've joined"
            enabled={notifications.communityActivity}
            onChange={(v) => handleNotifChange("communityActivity", v)}
          />
          <Toggle
            label="Event reminders"
            description="Match-day and itinerary reminders"
            enabled={notifications.eventReminders}
            onChange={(v) => handleNotifChange("eventReminders", v)}
          />
          <Toggle
            label="Marketing & updates"
            description="New features and FanZone announcements"
            enabled={notifications.marketing}
            onChange={(v) => handleNotifChange("marketing", v)}
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-card">
        <SectionHeading><Lock className="h-3.5 w-3.5" /> Privacy</SectionHeading>
        <div className="mt-2 divide-y divide-slate-50">
          <Toggle
            label="Public profile"
            description="Anyone can view your profile and posts"
            enabled={privacy.publicProfile}
            onChange={(v) => handlePrivacyChange("publicProfile", v)}
          />
          <Toggle
            label="Show location"
            description="Display your current city on your profile"
            enabled={privacy.showLocation}
            onChange={(v) => handlePrivacyChange("showLocation", v)}
          />
          <Toggle
            label="Allow direct messages"
            description="Let other users message you"
            enabled={privacy.allowMessages}
            onChange={(v) => handlePrivacyChange("allowMessages", v)}
          />
        </div>
      </section>

      {/* App preferences */}
      <section className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-card">
        <SectionHeading><Palette className="h-3.5 w-3.5" /> Preferences</SectionHeading>
        <div className="mt-3 space-y-1">
          {[
            { label: "Language", value: "English" },
            { label: "Timezone", value: "Auto-detect" },
            { label: "Temperature unit", value: "°F" },
          ].map(({ label, value }) => (
            <button
              key={label}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-700">{label}</span>
              <span className="flex items-center gap-1 text-slate-500">
                {value}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" className="w-full justify-start text-slate-600">
            Change password
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:bg-red-50"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          <Button variant="ghost" className="w-full justify-start text-red-400 hover:bg-red-50 text-sm">
            Delete account
          </Button>
        </div>
      </section>
    </div>
  );
}
