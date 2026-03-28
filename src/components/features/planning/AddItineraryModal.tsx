"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import type { ItineraryItem, ItineraryItemType } from "@/types/domain";
import { useUserLocation } from "@/hooks/useUserLocation";

interface AddItineraryModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: ItineraryItem) => void;
  userId: string;
  tripId?: string;
}

const TYPE_OPTIONS: { label: string; value: ItineraryItemType }[] = [
  { label: "Match", value: "match" },
  { label: "Travel", value: "travel" },
  { label: "Accommodation", value: "accommodation" },
  { label: "Activity", value: "activity" },
  { label: "Meetup", value: "meetup" },
  { label: "Food", value: "food" },
  { label: "Transport", value: "transport" },
];

const fieldClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400";

export function AddItineraryModal({ open, onClose, onAdd, userId, tripId }: AddItineraryModalProps) {
  const { userLocation } = useUserLocation();
  const [type, setType] = useState<ItineraryItemType>("activity");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
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

  useEffect(() => {
    if (open && userLocation && !location) {
      setLocation(userLocation.city);
    }
  }, [open, userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setType("activity");
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setNotes("");
    setConfirmed(false);
    setErrorMsg(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!title.trim() || !date || loading) return;
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase
      .from("itinerary_items")
      .insert({
        user_id: userId,
        trip_id: tripId || null,
        type,
        title: title.trim(),
        date,
        time: time || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        confirmed,
      })
      .select("id")
      .single();

    if (error || !data) {
      setErrorMsg("Failed to save. Please try again.");
      setLoading(false);
      return;
    }

    onAdd({
      id: data.id,
      type,
      title: title.trim(),
      date,
      time: time || undefined,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
      confirmed,
    });
    reset();
    onClose();
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900 mb-4">Add to itinerary</h2>

        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ItineraryItemType)}
              className={fieldClass}
            >
              {TYPE_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Argentina vs France"
              className={fieldClass}
            />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Time (optional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue, address, or city"
              className={fieldClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${fieldClass} resize-none`}
            />
          </div>

          {/* Confirmed */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-700">Mark as confirmed</span>
          </label>
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-500 mt-3">{errorMsg}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!title.trim() || !date}
            onClick={handleSubmit}
          >
            Add Item
          </Button>
        </div>
      </div>
    </div>
  );
}
