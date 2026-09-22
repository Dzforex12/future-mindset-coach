import { NextResponse } from "next/server";
import { generateTenYearFutureSelf } from "@/app/state/futureSelfEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const fallback = generateTenYearFutureSelf(body);
    if (!process.env.GROQ_API_KEY) return NextResponse.json({ futureSelf: fallback });
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: JSON.stringify({ model: "qwen/qwen3.8-27b", messages: [{ role: "system", content: "Return only valid JSON for a ten-year future identity with keys identity, disciplineIdentity, emotionalIdentity, lifestyleIdentity, tradingIdentity, milestones, challenges, opportunities. Each list must contain strings." }, { role: "user", content: JSON.stringify(body) }] }) });
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return NextResponse.json({ futureSelf: content ? JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim()) : fallback });
  } catch { return NextResponse.json({ futureSelf: generateTenYearFutureSelf() }); }
}
