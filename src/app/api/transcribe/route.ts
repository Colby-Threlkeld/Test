import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const languageA = (formData.get("languageA") as string | null) ?? "en";
  const languageB = (formData.get("languageB") as string | null) ?? "es";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    // No language hint — let Whisper auto-detect
  });

  const detected = transcription.language ?? "";

  // Map detected ISO code to whichever of the two languages it matches
  let detectedLanguage: string;
  if (detected === languageB) {
    detectedLanguage = languageB;
  } else if (detected === languageA) {
    detectedLanguage = languageA;
  } else {
    // Ambiguous — default to languageA
    detectedLanguage = languageA;
  }

  return NextResponse.json({ transcript: transcription.text, detectedLanguage });
}
