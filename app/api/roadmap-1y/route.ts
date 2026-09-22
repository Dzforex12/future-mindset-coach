import { NextResponse } from "next/server";
import { generateOneYearRoadmap } from "@/app/state/roadmapEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fallback = generateOneYearRoadmap(body);
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ roadmap: fallback });
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: "Create a practical one-year life roadmap. Return only valid JSON with keys summary, milestones, identityShift, disciplineEvolution, emotionalEvolution, tradingPsychologyEvolution. Each list must contain strings." },
          { role: "user", content: JSON.stringify(body) },
        ],
      }),
    });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const roadmap = content ? JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()) : fallback;
    return NextResponse.json({ roadmap });
  } catch {
    return NextResponse.json({ roadmap: generateOneYearRoadmap() });
  }
}
