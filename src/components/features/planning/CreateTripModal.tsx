"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

interface Trip {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  event_name: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface CreateTripModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (trip: Trip) => void;
  userId: string;
}

const fieldClass =
  "w-full border border-slate-700/50 bg-[#1a1a27] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors";

export function CreateTripModal({ open, onClose, onCreated, userId }: CreateTripModalProps) {
  const [name, setName] = useState("");
  const [eventName, setEventName] = useState("FIFA World Cup 2026");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function reset() {
    setName("");
    setEventName("FIFA World Cup 2026");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setErrorMsg(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!name.trim() || loading) return;
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: userId,
        name: name.trim(),
        event_name: eventName.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        description: description.trim() || null,
      })
      .select("*")
      .single();

    if (error || !data) {
      setErrorMsg("Failed to create trip. Please try again.");
      setLoading(false);
      return;
    }

    onCreated(data as Trip);
    reset();
    onClose();
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[#12121a] border border-slate-700/40 rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-100 mb-4">New Trip</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Trip name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. World Cup Adventure"
              className={fieldClass}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Event</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. FIFA World Cup 2026"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Notes about this trip…"
              className={`${fieldClass} resize-none`}
            />
          </div>
        </div>

        {errorMsg && <p className="text-sm text-red-400 mt-3">{errorMsg}</p>}

        <div className="flex items-center justify-between border-t border-slate-700/40 pt-4 mt-4">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!name.trim()}
            onClick={handleSubmit}
          >
            Create Trip
          </Button>
        </div>
      </div>
    </div>
  );
}
