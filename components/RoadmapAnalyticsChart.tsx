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
import type {
  EmotionTrendEntry,
  HabitHistoryEntry,
  MonthlyTrend,
  QuarterlyGoal,
  YearlyGoal,
} from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

type RoadmapAnalyticsChartProps = {
  title: string;
  kind: "discipline" | "emotion" | "habits" | "progress";
  monthlyTrend?: MonthlyTrend[];
  emotionTrend?: EmotionTrendEntry[];
  habitHistory?: HabitHistoryEntry[];
  quarterlyGoals?: QuarterlyGoal[];
  yearlyGoals?: YearlyGoal[];
};

export function RoadmapAnalyticsChart({
  title,
  kind,
  monthlyTrend = [],
  emotionTrend = [],
  habitHistory = [],
  quarterlyGoals = [],
  yearlyGoals = [],
}: RoadmapAnalyticsChartProps) {
  const labels = kind === "discipline"
    ? monthlyTrend.map((entry) => entry.month)
    : kind === "emotion"
      ? emotionTrend.map((entry) => entry.week)
      : kind === "habits"
        ? habitHistory.slice(-30).map((entry) => entry.date)
        : [...quarterlyGoals, ...yearlyGoals].map((goal) => goal.title);
  const values = kind === "discipline"
    ? monthlyTrend.map((entry) => entry.disciplineScore)
    : kind === "emotion"
      ? emotionTrend.map((entry) => entry.stabilityScore)
      : kind === "habits"
        ? habitHistory.slice(-30).map((entry) => entry.habits.length)
        : [...quarterlyGoals, ...yearlyGoals].map((goal) => goal.progress);
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
      {kind === "habits" || kind === "emotion" ? <Line data={data} /> : <Bar data={data} />}
    </div>
  );
}
