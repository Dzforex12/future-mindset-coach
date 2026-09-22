import { NextResponse } from "next/server";

type HistoryEntry = {
  date: string;
  habits: number[];
};

type WeeklyReportRequest = {
  habitHistory?: HistoryEntry[];
  disciplineStreak?: number;
  coachPersonality?: string;
  tradingMode?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WeeklyReportRequest;
    const history = (body.habitHistory || []).slice(-7);
    const completedCounts = history.map((entry) => entry.habits.length);
    const totalHabitsCompleted = completedCounts.reduce((total, count) => total + count, 0);
    const bestIndex = completedCounts.length
      ? completedCounts.indexOf(Math.max(...completedCounts))
      : -1;
    const worstIndex = completedCounts.length
      ? completedCounts.indexOf(Math.min(...completedCounts))
      : -1;

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
            content: `You are DZ's ${body.coachPersonality || "Neutral"} mindset coach. Write a concise but complete weekly report. Include progress, mindset observations, and practical advice specific to ${body.tradingMode || "Forex"}. Never give financial advice or trading signals.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              history,
              totalHabitsCompleted,
              disciplineStreak: body.disciplineStreak || 0,
              bestDay: bestIndex >= 0 ? history[bestIndex] : null,
              worstDay: worstIndex >= 0 ? history[worstIndex] : null,
            }),
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Weekly report request failed." },
        { status: response.status },
      );
    }

    const report = data?.choices?.[0]?.message?.content;
    if (!report) {
      return NextResponse.json(
        { error: "Groq returned an empty weekly report." },
        { status: 502 },
      );
    }

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json(
      { error: "Weekly report request failed." },
      { status: 500 },
    );
  }
}
