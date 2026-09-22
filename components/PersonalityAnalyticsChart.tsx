"use client";

import { Bar, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
} from "chart.js";
import type { EmotionHistoryEntry, PersonalityEvolutionEntry, PersonalityTrendEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

type PersonalityAnalyticsChartProps = {
  title: string;
  kind: "evolution" | "trend" | "emotion" | "discipline";
  evolutionHistory?: PersonalityEvolutionEntry[];
  trend?: PersonalityTrendEntry[];
  emotionHistory?: EmotionHistoryEntry[];
  currentEmotion?: string | null;
  currentPersonality: string;
  disciplineStreak: number;
};

export function PersonalityAnalyticsChart({
  title,
  kind,
  evolutionHistory = [],
  trend = [],
  emotionHistory = [],
  currentEmotion,
  currentPersonality,
  disciplineStreak,
}: PersonalityAnalyticsChartProps) {
  const labels = kind === "evolution"
    ? evolutionHistory.map((entry) => entry.date)
    : kind === "trend"
      ? trend.map((entry) => entry.month)
      : [currentEmotion || "none", currentPersonality];
  const values = kind === "evolution"
    ? evolutionHistory.map((_, index) => index + 1)
    : kind === "trend"
      ? trend.map((entry) => entry.evolutionScore)
      : kind === "emotion"
        ? [emotionHistory.at(-1)?.intensity || 0, 100]
        : [disciplineStreak, currentPersonality === "Challenging" || currentPersonality === "Aggressive" ? 100 : 50];
  const data = {
    labels,
    datasets: [{
      label: title,
      data: values,
      borderColor: "#4F46E5",
      backgroundColor: "rgba(79, 70, 229, 0.2)",
      borderRadius: 6,
      tension: 0.4,
    }],
  };

  return (
    <div className="bg-navy-dark p-6 rounded-xl border border-border">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {kind === "trend" || kind === "evolution" ? <Line data={data} /> : <Bar data={data} />}
    </div>
  );
}
