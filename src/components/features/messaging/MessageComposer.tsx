"use client";

import { useState, type KeyboardEvent } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  onSend: (body: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageComposer({
  onSend,
  placeholder = "Type a message…",
  disabled = false,
}: MessageComposerProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-slate-100 bg-white px-4 py-3">
      <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/20 transition-all">
        <button className="mb-1 shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400",
            "focus:outline-none min-h-[24px] max-h-32 overflow-y-auto",
            "disabled:cursor-not-allowed"
          )}
          style={{ height: "auto" }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />

        <button className="mb-1 shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors">
          <Smile className="h-4 w-4" />
        </button>

        <button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          className={cn(
            "mb-1 shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
            value.trim()
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "text-slate-300 cursor-not-allowed"
          )}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-slate-300">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
