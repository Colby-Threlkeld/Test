"use client";

import { useState, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

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
];

type Stage = "idle" | "listening" | "translating" | "playing";

interface VoiceTranslatorProps {
  onTranslated: (text: string) => void;
}

export function VoiceTranslator({ onTranslated }: VoiceTranslatorProps) {
  const [language, setLanguage] = useState("Spanish");
  const [stage, setStage] = useState<Stage>("idle");
  const [transcript, setTranscript] = useState("");
  const [translated, setTranslated] = useState("");
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition() as InstanceType<typeof window.SpeechRecognition>;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    setStage("listening");
    setTranscript("");
    setTranslated("");

    recognition.onresult = async (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setStage("translating");

      const translateRes = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLanguage: language }),
      });
      const { translated: translatedText } = await translateRes.json() as { translated: string };
      setTranslated(translatedText);
      onTranslated(translatedText);

      setStage("playing");
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translatedText }),
      });
      const blob = await ttsRes.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setStage("idle");
      audio.play();
    };

    recognition.onerror = () => setStage("idle");
    recognition.onend = () => {
      if (stage === "listening") setStage("idle");
    };

    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setStage("idle");
  }

  const isActive = stage !== "idle";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isActive}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400/20 focus:border-brand-400 disabled:cursor-not-allowed"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <button
          onClick={stage === "listening" ? stopListening : startListening}
          disabled={stage === "translating" || stage === "playing"}
          className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${
            stage === "listening"
              ? "bg-red-500 text-white hover:bg-red-600"
              : stage === "translating" || stage === "playing"
              ? "bg-brand-600 text-white opacity-70"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {stage === "idle" && <><Mic className="h-4 w-4" /> Speak</>}
          {stage === "listening" && <><MicOff className="h-4 w-4" /> Stop</>}
          {stage === "translating" && <><Loader2 className="h-4 w-4 animate-spin" /> Translating…</>}
          {stage === "playing" && <><Loader2 className="h-4 w-4 animate-spin" /> Playing…</>}
        </button>
      </div>

      {(transcript || translated) && (
        <div className="space-y-1.5 text-sm">
          {transcript && (
            <p className="text-slate-500">
              <span className="font-medium text-slate-600">You said:</span> {transcript}
            </p>
          )}
          {translated && (
            <p className="text-slate-700">
              <span className="font-medium text-slate-800">Translated:</span> {translated}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
