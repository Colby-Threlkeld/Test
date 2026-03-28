import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") ?? "";
  const state = searchParams.get("state") ?? "";
  const country = searchParams.get("country") ?? "US";

  if (!city) {
    return NextResponse.json({ error: "city param required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const threeMonthsOut = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const prompt = `You are a sports event assistant. Today's date is ${today}. Return a JSON array of up to 6 UPCOMING sporting or entertainment events happening near ${city}, ${state}, ${country} between ${today} and ${threeMonthsOut}. Prioritize events that are CURRENTLY IN SEASON and happening SOONEST — for example if the NBA/NHL/MLS regular season is active right now, list those upcoming home games before any future season openers. Do NOT suggest events from next season or after ${threeMonthsOut}. Sort by date ascending (soonest first). Format: [{name, date (YYYY-MM-DD), venue, type (e.g. 'Soccer', 'Basketball', 'Hockey', 'Baseball', 'Football', 'Concert'), description, ticketUrl (empty string if unknown)}]. Return only the JSON array, no markdown.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "OpenAI request failed" }, { status: 502 });
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "[]";

    let events: unknown[] = [];
    try {
      events = JSON.parse(content);
    } catch {
      // Try extracting JSON array from text
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        events = JSON.parse(match[0]);
      }
    }

    return NextResponse.json(events);
  } catch (err) {
    console.error("Events API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
