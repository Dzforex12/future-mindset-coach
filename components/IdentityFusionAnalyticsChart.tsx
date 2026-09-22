"use client";

import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement } from "chart.js";
import type { IdentityFusionHistoryEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

export function IdentityFusionAnalyticsChart({ title, kind, history, fusionScore, disciplineStreak, dailyScore, currentEmotion, tradingMode }: { title: string; kind: "fusion" | "discipline" | "emotion" | "alignment" | "trading"; history: IdentityFusionHistoryEntry[]; fusionScore: number; disciplineStreak: number; dailyScore: number; currentEmotion: string | null; tradingMode: string }) {
  const labels = kind === "fusion" ? history.map((entry) => entry.date) : ["Reference", "Current"];
  const values = kind === "fusion" ? history.map((entry) => entry.fusionScore) : kind === "discipline" ? [disciplineStreak * 5, fusionScore] : kind === "emotion" ? [currentEmotion ? 70 : 40, fusionScore] : kind === "alignment" ? [dailyScore, history.at(-1)?.conflictAreas.length ? 40 : 80] : [tradingMode.length * 4, fusionScore];
  const data = { labels, datasets: [{ label: title, data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79, 70, 229, 0.2)", borderRadius: 6, tension: 0.4 }] };
  return <div className="bg-navy-dark p-6 rounded-xl border border-border"><h2 className="text-lg font-semibold text-white mb-4">{title}</h2>{kind === "fusion" ? <Line data={data} /> : <Bar data={data} />}</div>;
}
