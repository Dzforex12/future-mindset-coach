"use client";

import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement } from "chart.js";
import type { AlignmentHistoryEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

export function AlignmentAnalyticsChart({
  title,
  kind,
  history,
  dailyScore,
  disciplineStreak,
  habits,
  currentEmotion,
  tradingMode,
}: {
  title: string;
  kind: "trend" | "discipline" | "emotion" | "habits" | "trading";
  history: AlignmentHistoryEntry[];
  dailyScore: number;
  disciplineStreak: number;
  habits: (number | string)[];
  currentEmotion: string | null;
  tradingMode: string;
}) {
  const labels = kind === "trend" ? history.map((entry) => entry.date) : ["Current"];
  const values = kind === "trend"
    ? history.map((entry) => entry.score)
    : kind === "discipline"
      ? [disciplineStreak * 5, dailyScore]
      : kind === "emotion"
        ? [currentEmotion ? 70 : 40, dailyScore]
        : kind === "habits"
          ? [habits.length * 25, dailyScore]
          : [tradingMode.length * 4, dailyScore];
  const data = { labels: kind === "trend" ? labels : ["Reference", "Alignment"], datasets: [{ label: title, data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79, 70, 229, 0.2)", borderRadius: 6, tension: 0.4 }] };
  return <div className="bg-navy-dark p-6 rounded-xl border border-border"><h2 className="text-lg font-semibold text-white mb-4">{title}</h2>{kind === "trend" ? <Line data={data} /> : <Bar data={data} />}</div>;
}
