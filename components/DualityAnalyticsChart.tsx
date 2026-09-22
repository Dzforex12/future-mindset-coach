"use client";

import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement } from "chart.js";
import type { DualityHistoryEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

export function DualityAnalyticsChart({ title, kind, history, balanceScore, disciplineStreak, dailyScore, currentEmotion, tradingMode }: { title: string; kind: "balance" | "discipline" | "emotion" | "alignment" | "trading"; history: DualityHistoryEntry[]; balanceScore: number; disciplineStreak: number; dailyScore: number; currentEmotion: string | null; tradingMode: string }) {
  const labels = kind === "balance" ? history.map((entry) => entry.date) : ["Reference", "Current"];
  const values = kind === "balance" ? history.map((entry) => entry.balanceScore) : kind === "discipline" ? [disciplineStreak * 5, balanceScore] : kind === "emotion" ? [currentEmotion ? 70 : 40, balanceScore] : kind === "alignment" ? [dailyScore, history.at(-1)?.conflictPoints.length ? 40 : 80] : [tradingMode.length * 4, balanceScore];
  const data = { labels, datasets: [{ label: title, data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79, 70, 229, 0.2)", borderRadius: 6, tension: 0.4 }] };
  return <div className="bg-navy-dark p-6 rounded-xl border border-border"><h2 className="text-lg font-semibold text-white mb-4">{title}</h2>{kind === "balance" ? <Line data={data} /> : <Bar data={data} />}</div>;
}
