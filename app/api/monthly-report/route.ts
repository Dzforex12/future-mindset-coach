import { NextResponse } from "next/server";
import { generateMonthlyPerformance } from "@/app/state/monthlyEngine";
import type { HabitHistoryEntry } from "@/app/state/memoryStore";

type MonthlyReportRequest = {
  habitHistory?: HabitHistoryEntry[];
  disciplineStreak?: number;
  coachPersonality?: string;
  tradingMode?: string;
  riskProfile?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MonthlyReportRequest;
    const performance = generateMonthlyPerformance(
      body.habitHistory || [],
      body.disciplineStreak || 0,
    );

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
            content: `You are DZ's ${body.coachPersonality || "Neutral"} mindset coach. Write a full monthly performance report with these headings: Summary, Strengths, Weaknesses, Mindset Notes, Trading Discipline Notes, Recommended Focus for Next Month. Be practical and concise. For ${body.tradingMode || "Forex"}, consider the ${body.riskProfile || "Moderate"} risk profile. Never give financial advice or trading signals.`,
          },
          {
            role: "user",
            content: JSON.stringify(performance),
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Monthly report request failed." },
        { status: response.status },
      );
    }

    const report = data?.choices?.[0]?.message?.content;
    if (!report) {
      return NextResponse.json({ error: "Groq returned an empty monthly report." }, { status: 502 });
    }

    return NextResponse.json({ report, performance });
  } catch {
    return NextResponse.json({ error: "Monthly report request failed." }, { status: 500 });
  }
}
