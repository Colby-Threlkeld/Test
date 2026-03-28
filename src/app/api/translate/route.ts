import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { text, targetLanguage } = await req.json() as { text: string; targetLanguage: string };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Translate the following text to ${targetLanguage}. Return only the translated text, nothing else.`,
      },
      { role: "user", content: text },
    ],
  });

  const translated = completion.choices[0]?.message?.content ?? "";
  return NextResponse.json({ translated });
}
