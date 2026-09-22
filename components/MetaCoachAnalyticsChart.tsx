"use client";

import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement } from "chart.js";
import type { MetaCoachHistoryEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

export function MetaCoachAnalyticsChart({ title, kind, history, evaluationScore, dailyScore, dualityScore, fusionScore, currentEmotion }: { title: string; kind: "trend" | "alignment" | "duality" | "fusion" | "emotion"; history: MetaCoachHistoryEntry[]; evaluationScore: number; dailyScore: number; dualityScore: number; fusionScore: number; currentEmotion: string | null }) {
  const labels = kind === "trend" ? history.map((entry) => entry.date) : ["Reference", "Current"];
  const values = kind === "trend" ? history.map((entry) => entry.evaluationScore) : kind === "alignment" ? [dailyScore, evaluationScore] : kind === "duality" ? [dualityScore, evaluationScore] : kind === "fusion" ? [fusionScore, evaluationScore] : [currentEmotion ? 70 : 40, evaluationScore];
  const data = { labels, datasets: [{ label: title, data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79, 70, 229, 0.2)", borderRadius: 6, tension: 0.4 }] };
  return <div className="bg-navy-dark p-6 rounded-xl border border-border"><h2 className="text-lg font-semibold text-white mb-4">{title}</h2>{kind === "trend" ? <Line data={data} /> : <Bar data={data} />}</div>;
}
