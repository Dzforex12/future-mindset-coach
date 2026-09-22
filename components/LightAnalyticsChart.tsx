"use client";

import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement } from "chart.js";
import type { LightHistoryEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

export function LightAnalyticsChart({ title, kind, history, stabilityScore, disciplineStreak, dailyScore, currentEmotion, tradingMode }: { title: string; kind: "activation" | "discipline" | "emotion" | "alignment" | "trading"; history: LightHistoryEntry[]; stabilityScore: number; disciplineStreak: number; dailyScore: number; currentEmotion: string | null; tradingMode: string }) {
  const labels = kind === "activation" ? history.map((entry) => entry.date) : ["Reference", "Current"];
  const values = kind === "activation" ? history.map((entry) => entry.triggers.length + entry.patterns.length) : kind === "discipline" ? [disciplineStreak * 5, stabilityScore] : kind === "emotion" ? [currentEmotion ? 70 : 40, stabilityScore] : kind === "alignment" ? [dailyScore, history.at(-1)?.patterns.length ? 70 : 40] : [tradingMode.length * 4, history.at(-1)?.strengths.length ? 80 : 40];
  const data = { labels, datasets: [{ label: title, data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79, 70, 229, 0.2)", borderRadius: 6, tension: 0.4 }] };
  return <div className="bg-navy-dark p-6 rounded-xl border border-border"><h2 className="text-lg font-semibold text-white mb-4">{title}</h2>{kind === "activation" ? <Line data={data} /> : <Bar data={data} />}</div>;
}
