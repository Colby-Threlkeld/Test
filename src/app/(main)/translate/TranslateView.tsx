"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Loader2, ArrowLeft, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Portuguese",
  "German",
  "Japanese",
  "Arabic",
  "Korean",
  "Mandarin",
  "Italian",
  "Russian",
  "Turkish",
  "Dutch",
  "Polish",
  "Swedish",
  "Norwegian",
  "Danish",
  "Greek",
  "Hebrew",
  "Persian",
  "Hindi",
  "Bengali",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Swahili",
  "Ukrainian",
  "Romanian",
  "Czech",
  "Hungarian",
  "Serbian",
  "Croatian",
  "Tagalog",
  "Amharic",
  "Afrikaans",
] as const;

const FLAG_MAP: Record<string, string> = {
  English: "🇺🇸",
  Spanish: "🇪🇸",
  French: "🇫🇷",
  Portuguese: "🇧🇷",
  German: "🇩🇪",
  Japanese: "🇯🇵",
  Arabic: "🇸🇦",
  Korean: "🇰🇷",
  Mandarin: "🇨🇳",
  Italian: "🇮🇹",
  Russian: "🇷🇺",
  Turkish: "🇹🇷",
  Dutch: "🇳🇱",
  Polish: "🇵🇱",
  Swedish: "🇸🇪",
  Norwegian: "🇳🇴",
  Danish: "🇩🇰",
  Greek: "🇬🇷",
  Hebrew: "🇮🇱",
  Persian: "🇮🇷",
  Hindi: "🇮🇳",
  Bengali: "🇧🇩",
  Thai: "🇹🇭",
  Vietnamese: "🇻🇳",
  Indonesian: "🇮🇩",
  Swahili: "🇰🇪",
  Ukrainian: "🇺🇦",
  Romanian: "🇷🇴",
  Czech: "🇨🇿",
  Hungarian: "🇭🇺",
  Serbian: "🇷🇸",
  Croatian: "🇭🇷",
  Tagalog: "🇵🇭",
  Amharic: "🇪🇹",
  Afrikaans: "🇿🇦",
};

const ISO_MAP: Record<string, string> = {
  English: "en",
  Spanish: "es",
  French: "fr",
  Portuguese: "pt",
  German: "de",
  Japanese: "ja",
  Arabic: "ar",
  Korean: "ko",
  Mandarin: "zh",
  Italian: "it",
  Russian: "ru",
  Turkish: "tr",
  Dutch: "nl",
  Polish: "pl",
  Swedish: "sv",
  Norwegian: "no",
  Danish: "da",
  Greek: "el",
  Hebrew: "he",
  Persian: "fa",
  Hindi: "hi",
  Bengali: "bn",
  Thai: "th",
  Vietnamese: "vi",
  Indonesian: "id",
  Swahili: "sw",
  Ukrainian: "uk",
  Romanian: "ro",
  Czech: "cs",
  Hungarian: "hu",
  Serbian: "sr",
  Croatian: "hr",
  Tagalog: "tl",
  Amharic: "am",
  Afrikaans: "af",
};

type Stage = "idle" | "listening" | "translating" | "playing";

interface ConversationEntry {
  spokenLang: string;
  targetLang: string;
  transcript: string;
  translated: string;
}

async function playTTSAuto(text: string, onEnd: () => void) {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speed: 1.25 }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.onended = onEnd;
  audio.play();
}

async function replayTTS(text: string) {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speed: 1.25 }),
  });
  if (!res.ok) return;
  const blob = await res.blob();
  new Audio(URL.createObjectURL(blob)).play();
}

const selectClass =
  "w-full rounded-lg border border-slate-700/50 bg-[#1a1a27] px-3 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors";

export default function TranslateView() {
  const router = useRouter();
  const [languageA, setLanguageA] = useState("English");
  const [languageB, setLanguageB] = useState("Spanish");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startListening() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg("Microphone access was denied. Please allow microphone access and try again.");
      return;
    }

    setErrorMsg(null);
    chunksRef.current = [];

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], "audio.webm", { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("languageA", ISO_MAP[languageA] ?? "en");
      formData.append("languageB", ISO_MAP[languageB] ?? "es");

      try {
        setStage("translating");

        const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
        const { transcript, detectedLanguage } = (await transcribeRes.json()) as {
          transcript: string;
          detectedLanguage: string;
        };

        const isoA = ISO_MAP[languageA] ?? "en";
        const spokenLang = detectedLanguage === isoA ? languageA : languageB;
        const targetLang = spokenLang === languageA ? languageB : languageA;

        const translateRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript, targetLanguage: targetLang }),
        });
        const { translated } = (await translateRes.json()) as { translated: string };

        setConversation((prev) => [
          ...prev,
          { spokenLang, targetLang, transcript, translated },
        ]);

        setStage("playing");
        await playTTSAuto(translated, () => setStage("idle"));
      } catch {
        setErrorMsg("Translation failed. Check that OPENAI_API_KEY is set in .env.local.");
        setStage("idle");
      }
    };

    recorder.start();
    setStage("listening");
  }

  function handleMicClick() {
    setErrorMsg(null);
    if (stage === "listening") {
      mediaRecorderRef.current?.stop();
    } else if (stage === "idle") {
      startListening();
    }
  }

  const isBusy = stage === "translating" || stage === "playing";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="sticky top-0 z-10 bg-[#0d0d15]/90 border-b border-slate-700/40 px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm font-semibold text-slate-100">Voice Translator</span>
      </div>

      <div className="mx-auto max-w-2xl py-8 px-4 space-y-8">
        {/* Language selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Language A
            </label>
            <select
              value={languageA}
              onChange={(e) => setLanguageA(e.target.value)}
              disabled={isBusy || stage === "listening"}
              className={selectClass}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {FLAG_MAP[lang]} {lang}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Language B
            </label>
            <select
              value={languageB}
              onChange={(e) => setLanguageB(e.target.value)}
              disabled={isBusy || stage === "listening"}
              className={selectClass}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {FLAG_MAP[lang]} {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mic button */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex items-center justify-center">
            {stage === "listening" && (
              <span className="absolute inline-flex h-24 w-24 rounded-full bg-brand-600/20 animate-ping" />
            )}
            <button
              onClick={handleMicClick}
              disabled={isBusy}
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed",
                stage === "listening"
                  ? "bg-red-500 animate-pulse"
                  : isBusy
                  ? "bg-brand-400"
                  : "bg-brand-600 hover:bg-brand-700"
              )}
            >
              {isBusy ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : stage === "listening" ? (
                <MicOff className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
          </div>

          <p className="text-sm font-medium text-slate-400">
            {stage === "idle" && "Tap to speak — either person"}
            {stage === "listening" && "Listening… tap to stop"}
            {stage === "translating" && "Translating…"}
            {stage === "playing" && "Playing translation…"}
          </p>

          {errorMsg && (
            <p className="text-sm text-red-400 max-w-xs">{errorMsg}</p>
          )}
        </div>

        {/* Conversation log */}
        {conversation.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Conversation
            </p>
            {conversation.map((entry, i) => {
              const isA = entry.spokenLang === languageA;
              return (
                <div
                  key={i}
                  className={cn("flex flex-col gap-1", isA ? "items-start" : "items-end")}
                >
                  <span className="text-xs text-slate-500">
                    {FLAG_MAP[entry.spokenLang]} {entry.spokenLang}
                  </span>
                  <div
                    className={cn(
                      "max-w-xs sm:max-w-sm rounded-2xl p-3",
                      isA
                        ? "rounded-tl-none bg-[#12121a] border border-slate-700/40"
                        : "rounded-tr-none bg-brand-600/10 border border-brand-500/20"
                    )}
                  >
                    <p className="text-sm text-slate-200">{entry.transcript}</p>
                    <p
                      className={cn(
                        "mt-1.5 text-xs border-t pt-1.5",
                        isA
                          ? "text-slate-400 border-slate-700/40"
                          : "text-brand-400 border-brand-500/20"
                      )}
                    >
                      {FLAG_MAP[entry.targetLang]} {entry.translated}
                    </p>
                  </div>
                  <button
                    onClick={() => replayTTS(entry.translated)}
                    className="text-slate-600 hover:text-slate-400 transition-colors"
                    title="Replay translation"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
