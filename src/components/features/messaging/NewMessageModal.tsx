"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

interface UserResult {
  id: string;
  name: string;
  avatar_url?: string;
  nationality?: string;
}

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
  onThreadCreated: (threadId: string, user: UserResult) => void;
  currentUserId: string;
}

export function NewMessageModal({
  open,
  onClose,
  onThreadCreated,
  currentUserId,
}: NewMessageModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autofocus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setUsers([]);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!val.trim()) { setUsers([]); return; }
      setLoading(true);
      try {
        const res = await fetch(`/api/user-search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        // Filter out the current user
        setUsers((Array.isArray(data) ? data : []).filter((u: UserResult) => u.id !== currentUserId));
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  async function handleUserSelect(selectedUser: UserResult) {
    if (creating) return;
    setCreating(true);

    try {
      // Find threads that contain both users
      const { data: myThreads } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", currentUserId);

      const { data: theirThreads } = await supabase
        .from("thread_participants")
        .select("thread_id")
        .eq("user_id", selectedUser.id);

      const mySet = new Set((myThreads ?? []).map((t: any) => t.thread_id));
      const sharedThreadIds = (theirThreads ?? [])
        .map((t: any) => t.thread_id)
        .filter((id: string) => mySet.has(id));

      if (sharedThreadIds.length > 0) {
        // Verify it's a 1-on-1 thread (not a group)
        const { data: threadData } = await supabase
          .from("message_threads")
          .select("id, is_group")
          .in("id", sharedThreadIds)
          .eq("is_group", false)
          .limit(1)
          .single();

        if (threadData) {
          onThreadCreated(threadData.id, selectedUser);
          onClose();
          return;
        }
      }

      // Create a new thread
      const { data: newThread, error: threadErr } = await supabase
        .from("message_threads")
        .insert({ is_group: false, group_name: null })
        .select("id")
        .single();

      if (threadErr || !newThread) {
        console.error("Failed to create thread:", threadErr);
        return;
      }

      await supabase.from("thread_participants").insert([
        { thread_id: newThread.id, user_id: currentUserId },
        { thread_id: newThread.id, user_id: selectedUser.id },
      ]);

      onThreadCreated(newThread.id, selectedUser);
      onClose();
    } finally {
      setCreating(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">New Message</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search for a fan…"
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none py-1"
          />
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {!loading && query && users.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No users found</p>
          )}

          {!loading && !query && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">
              Search for a fan to message
            </p>
          )}

          {!loading && users.map((u) => (
            <button
              key={u.id}
              onClick={() => handleUserSelect(u)}
              disabled={creating}
              className="flex w-full items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left disabled:opacity-60"
            >
              <Avatar src={u.avatar_url} name={u.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{u.name}</p>
                {u.nationality && (
                  <p className="text-xs text-slate-400">{u.nationality}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-3">
          <Button variant="ghost" size="sm" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
