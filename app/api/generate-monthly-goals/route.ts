import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 500 });
    }
    const month = new Date().toISOString().slice(0, 7);
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: `Generate 2 to 4 personalized monthly goals for DZ. Return only valid JSON as an array of objects with id, month, title, description, completed, progress. Use month ${month}, completed false, progress 0. Consider the latest monthly report, habit history, monthly trend, ${body.coachPersonality || "Neutral"} personality, ${body.tradingMode || "Forex"} mode, and ${body.riskProfile || "Moderate"} risk profile.` },
          { role: "user", content: JSON.stringify(body) },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data?.error?.message || "Monthly goal generation failed." }, { status: response.status });
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "Empty monthly goal response." }, { status: 502 });
    const goals = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
    return NextResponse.json({ goals: Array.isArray(goals) ? goals.slice(0, 4) : [] });
  } catch {
    return NextResponse.json({ error: "Monthly goal generation failed." }, { status: 500 });
  }
}
