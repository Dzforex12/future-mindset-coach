import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      habitHistory = [],
      disciplineStreak = 0,
      tradingMode = "Forex",
      riskProfile = "Moderate",
      coachPersonality = "Neutral",
    } = await req.json();

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
            content: `You are DZ's ${coachPersonality} mindset coach. Recommend 1 to 3 practical habits based on the supplied consistency history, ${disciplineStreak}-day streak, ${tradingMode} focus, and ${riskProfile} risk profile. Return only valid JSON: an array of objects with string id, title, and description. Do not include markdown or extra text.`,
          },
          {
            role: "user",
            content: JSON.stringify({ habitHistory: habitHistory.slice(-7), disciplineStreak, tradingMode, riskProfile }),
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Habit recommendation request failed." },
        { status: response.status },
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Groq returned no recommendations." }, { status: 502 });
    }

    const jsonContent = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
    const recommendations = JSON.parse(jsonContent);
    if (!Array.isArray(recommendations)) throw new Error("Invalid recommendation format.");

    return NextResponse.json({ recommendations: recommendations.slice(0, 3) });
  } catch {
    return NextResponse.json(
      { error: "Habit recommendation request failed." },
      { status: 500 },
    );
  }
}
