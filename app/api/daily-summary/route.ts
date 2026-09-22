import { NextResponse } from "next/server";

type DailySummaryRequest = {
  habitHistory?: { date: string; habits: number[] }[];
  todayHabits?: number[];
  disciplineStreak?: number;
  tradingMode?: string;
  riskProfile?: string;
  coachPersonality?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DailySummaryRequest;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "system",
            content: `You are DZ's ${body.coachPersonality || "Neutral"} mindset coach. Write a short, direct daily summary based on the supplied habit and trading data. Mention one clear next step. Do not give financial advice or trading signals.`,
          },
          {
            role: "user",
            content: JSON.stringify(body),
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Daily summary request failed." },
        { status: response.status },
      );
    }

    const summary = data?.choices?.[0]?.message?.content;
    if (!summary) {
      return NextResponse.json(
        { error: "Groq returned an empty daily summary." },
        { status: 502 },
      );
    }

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json(
      { error: "Daily summary request failed." },
      { status: 500 },
    );
  }
}
