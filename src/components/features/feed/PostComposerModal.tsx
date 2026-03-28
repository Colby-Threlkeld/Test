"use client";

import { useState, useEffect, useRef } from "react";
import { ImageIcon, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import type { FeedItem, FeedItemType } from "@/types/domain";
import { useUserLocation } from "@/hooks/useUserLocation";

interface PostComposerModalProps {
  open: boolean;
  onClose: () => void;
  onPosted: (item: FeedItem) => void;
  userId: string;
  userName: string;
  userImage?: string | null;
}

const POST_TYPES: { label: string; value: FeedItemType }[] = [
  { label: "Fan Post", value: "fan_post" },
  { label: "Local Tip", value: "local_tip" },
  { label: "Meetup", value: "meetup" },
  { label: "Travel Tip", value: "travel_tip" },
];

interface MentionUser {
  id: string;
  name: string;
  avatar_url?: string;
}

export function PostComposerModal({
  open,
  onClose,
  onPosted,
  userId,
  userName,
  userImage,
}: PostComposerModalProps) {
  const [body, setBody] = useState("");
  const [selectedType, setSelectedType] = useState<FeedItemType>("fan_post");
  const [tagsInput, setTagsInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // User tagging state
  const [taggedUsers, setTaggedUsers] = useState<{ id: string; name: string }[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mentionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { userLocation } = useUserLocation();

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open && userLocation && !selectedLocation) {
      setLocationInput(userLocation.locationLabel);
      setSelectedLocation(userLocation.locationLabel);
    }
  }, [open, userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Location autocomplete
  useEffect(() => {
    if (!locationInput.trim() || locationInput.trim().length < 2) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationInput.trim())}`);
        const data = await res.json() as string[];
        setLocationSuggestions(data);
      } catch {
        setLocationSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationInput]);

  // Mention search
  useEffect(() => {
    if (mentionQuery === null) {
      setMentionResults([]);
      return;
    }
    if (mentionTimerRef.current) clearTimeout(mentionTimerRef.current);
    mentionTimerRef.current = setTimeout(async () => {
      if (mentionQuery.length < 1) { setMentionResults([]); return; }
      try {
        const res = await fetch(`/api/user-search?q=${encodeURIComponent(mentionQuery)}`);
        if (res.ok) setMentionResults(await res.json());
      } catch { setMentionResults([]); }
    }, 200);
  }, [mentionQuery]);

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setBody(val);

    const cursor = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.substring(0, cursor);
    const match = textBeforeCursor.match(/@(\w*)$/);

    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }

  function handleMentionSelect(u: MentionUser) {
    if (!taggedUsers.find((t) => t.id === u.id)) {
      setTaggedUsers((prev) => [...prev, { id: u.id, name: u.name }]);
    }
    const cursor = textareaRef.current?.selectionStart ?? body.length;
    const before = body.substring(0, cursor);
    const after = body.substring(cursor);
    const newBefore = before.replace(/@(\w*)$/, `@${u.name} `);
    setBody(newBefore + after);
    setMentionQuery(null);
    setMentionResults([]);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function reset() {
    setBody("");
    setSelectedType("fan_post");
    setTagsInput("");
    setLocationInput("");
    setLocationSuggestions([]);
    setSelectedLocation("");
    setErrorMsg(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    setTaggedUsers([]);
    setMentionQuery(null);
    setMentionResults([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    // Upload image if present
    let imageUrl: string | null = null;
    if (imageFile) {
      setUploadingImage(true);
      const ext = imageFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      await supabase.storage.from("post-images").upload(path, imageFile);
      const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
      setUploadingImage(false);
    }

    const tags = tagsInput
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, "").trim())
      .filter(Boolean);

    const parts = selectedLocation.split(",").map((s) => s.trim());
    const stateLabel = parts.length >= 2 ? parts[1] : null;
    const cityId = parts[0] || null;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: userId,
        type: selectedType,
        body: body.trim(),
        tags,
        likes_count: 0,
        comments_count: 0,
        location_label: selectedLocation || null,
        state_label: stateLabel,
        city_id: cityId,
        image_url: imageUrl,
        tagged_users_json: taggedUsers.length > 0 ? taggedUsers : [],
      })
      .select("id, created_at")
      .single();

    if (error || !data) {
      setErrorMsg("Failed to post. Please try again.");
      setSubmitting(false);
      return;
    }

    const newItem: FeedItem = {
      id: data.id,
      type: selectedType,
      author: {
        id: userId,
        name: userName,
        avatarUrl: userImage ?? undefined,
      },
      body: body.trim(),
      tags,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      createdAt: data.created_at,
      cityId: parts[0] || undefined,
      imageUrl: imageUrl ?? undefined,
    };

    onPosted(newItem);
    reset();
    onClose();
    setSubmitting(false);
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
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar src={userImage} name={userName} size="sm" />
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={handleBodyChange}
              placeholder="What's on your mind?"
              className="w-full min-h-[96px] resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {/* Mention dropdown */}
            {mentionResults.length > 0 && (
              <ul className="absolute bottom-full left-0 right-0 z-20 mb-1 rounded-lg border border-slate-200 bg-white shadow-lg text-sm max-h-40 overflow-y-auto">
                {mentionResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                      onMouseDown={(e) => { e.preventDefault(); handleMentionSelect(u); }}
                    >
                      <span className="font-medium text-slate-800">{u.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tagged user chips */}
        {taggedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 pl-10">
            {taggedUsers.map((u) => (
              <span
                key={u.id}
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
              >
                @{u.name}
                <button
                  type="button"
                  onClick={() => setTaggedUsers((prev) => prev.filter((t) => t.id !== u.id))}
                  className="hover:text-brand-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Image preview */}
        {imagePreview && (
          <div className="relative mb-3 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="h-40 w-full object-cover rounded-lg" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Image button */}
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ImageIcon className="h-4 w-4" />
            Add photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>

        {/* Post type */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Post type</p>
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedType(value)}
                className={
                  selectedType === value
                    ? "rounded-full px-3 py-1 text-xs font-medium bg-brand-600 text-white"
                    : "rounded-full px-3 py-1 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Tags (optional)</p>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="#worldcup #dallas"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400"
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-2">Location (optional)</p>
          <div
            className="relative"
            onBlur={() => setTimeout(() => setLocationSuggestions([]), 150)}
          >
            <input
              type="text"
              value={locationInput}
              onChange={(e) => { setLocationInput(e.target.value); setSelectedLocation(""); }}
              placeholder="City, State"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400"
            />
            {locationSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-sky-200 bg-white shadow-lg text-xs">
                {locationSuggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-sky-50 transition-colors"
                      onClick={() => {
                        setLocationInput(s);
                        setSelectedLocation(s);
                        setLocationSuggestions([]);
                      }}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-500 mb-3">{errorMsg}</p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={submitting || uploadingImage}
            disabled={!body.trim()}
            onClick={handleSubmit}
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
