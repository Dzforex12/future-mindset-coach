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
import type { EmotionHistoryEntry, EmotionTrendEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

type EmotionAnalyticsChartProps = {
  title: string;
  kind: "daily" | "stability" | "habit-correlation" | "trading-mode";
  emotionHistory?: EmotionHistoryEntry[];
  emotionTrend?: EmotionTrendEntry[];
  dailyHabitsCompleted?: (number | string)[];
  tradingMode?: string;
};

export function EmotionAnalyticsChart({
  title,
  kind,
  emotionHistory = [],
  emotionTrend = [],
  dailyHabitsCompleted = [],
  tradingMode = "Forex",
}: EmotionAnalyticsChartProps) {
  const history = emotionHistory.slice(-7);
  const labels = kind === "stability"
    ? emotionTrend.map((entry) => entry.week)
    : history.map((entry) => entry.date.slice(5, 10));
  const values = kind === "stability"
    ? emotionTrend.map((entry) => entry.stabilityScore)
    : kind === "habit-correlation"
      ? history.map((entry) => entry.intensity * Math.max(1, dailyHabitsCompleted.length))
      : history.map((entry) => entry.intensity);
  const data = {
    labels,
    datasets: [{
      label: kind === "trading-mode" ? `${tradingMode} emotional intensity` : title,
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
      {kind === "daily" || kind === "stability" ? <Line data={data} /> : <Bar data={data} />}
    </div>
  );
}
