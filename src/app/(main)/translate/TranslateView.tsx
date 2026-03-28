"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Loader2, Volume2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
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

type Stage = "idle" | "listening" | "translating" | "playing";

interface HistoryEntry {
  language: string;
  transcript: string;
  translated: string;
}

async function playTTS(text: string, onEnd: () => void) {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  const blob = await res.blob();
  const audio = new Audio(URL.createObjectURL(blob));
  audio.onended = onEnd;
  audio.play();
}

export default function TranslateView() {
  const router = useRouter();
  const [language, setLanguage] = useState<string>("Spanish");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startListening() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg("Microphone access was denied. Please allow microphone access in your browser and try again.");
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

      try {
        setStage("translating");
        const transcribeRes = await fetch("/api/transcribe", { method: "POST", body: formData });
        const { transcript: text } = (await transcribeRes.json()) as { transcript: string };
        setTranscript(text);

        const translateRes = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, targetLanguage: language }),
        });
        const { translated: translatedText } = (await translateRes.json()) as { translated: string };
        setTranslated(translatedText);

        setStage("playing");
        setHistory((prev) =>
          [{ language, transcript: text, translated: translatedText }, ...prev].slice(0, 5)
        );

        await playTTS(translatedText, () => setStage("idle"));
      } catch {
        setErrorMsg("Translation failed. Check that OPENAI_API_KEY is set in .env.local.");
        setStage("idle");
      }
    };

    recorder.start();
    setStage("listening");
    setTranscript("");
    setTranslated("");
  }

  function stopListening() {
    mediaRecorderRef.current?.stop();
  }

  function handleMicClick() {
    setErrorMsg(null);
    if (stage === "listening") {
      stopListening();
    } else if (stage === "idle") {
      startListening();
    }
  }

  const isBusy = stage === "translating" || stage === "playing";

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm font-semibold text-slate-900">Voice Translator</span>
      </div>

      <div className="mx-auto max-w-2xl py-10 px-4 space-y-10">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          {/* Pulsing mic circle */}
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

          <p className="text-sm font-medium text-slate-500">
            {stage === "idle" && "Tap to speak"}
            {stage === "listening" && "Tap to stop"}
            {stage === "translating" && "Translating…"}
            {stage === "playing" && "Playing…"}
          </p>

          {errorMsg && (
            <p className="text-sm text-red-500 max-w-xs text-center">{errorMsg}</p>
          )}
        </div>

        {/* Language selector */}
        <div className="flex flex-wrap gap-2 justify-center">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              disabled={isBusy || stage === "listening"}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                language === lang
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-brand-400"
              )}
            >
              {FLAG_MAP[lang]} {lang}
            </button>
          ))}
        </div>

        {/* Result cards */}
        {(transcript || translated) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">You said</p>
              <p className="text-slate-700 text-sm">{transcript}</p>
            </div>
            <div className="relative rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-400 mb-2">Translation</p>
              <p className="text-brand-800 text-sm pr-8">{translated}</p>
              {translated && (
                <button
                  onClick={() => playTTS(translated, () => {})}
                  className="absolute top-3 right-3 rounded-full p-1.5 text-brand-500 hover:bg-brand-100 transition-colors"
                  title="Replay audio"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent</p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {history.map((entry, i) => (
                <button
                  key={i}
                  onClick={() => playTTS(entry.translated, () => {})}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className="text-lg">{FLAG_MAP[entry.language]}</span>
                  <span className="flex-1 truncate text-slate-600">{entry.transcript}</span>
                  <span className="text-slate-400 shrink-0">→</span>
                  <span className="flex-1 truncate text-slate-700">{entry.translated}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
