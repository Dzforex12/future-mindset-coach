"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { HabitHistoryEntry } from "@/app/state/memoryStore";
import { ChartSection } from "@/components/analytics/ChartShell";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export function AnalyticsChart({
  habitHistory,
  disciplineStreak,
}: {
  habitHistory: HabitHistoryEntry[];
  disciplineStreak: number;
}) {
  const formatTrendLabel = (value: string) => {
    if (!value || /^Day \d+$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const data = {
    labels: habitHistory.map((entry) => formatTrendLabel(entry.date)),
    datasets: [
      {
        label: "Mindset score",
        data: habitHistory.map((entry) => entry.habits[0] ?? 0),
        borderColor: "#8B5CF6",
        backgroundColor: "rgba(139, 92, 246, 0.18)",
        pointBackgroundColor: "#A78BFA",
        pointBorderColor: "#E9D5FF",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.38,
        borderWidth: 3,
      },
      {
        label: "Streak continued",
        data: habitHistory.map((entry) => (entry.habits.length >= 4 ? disciplineStreak : 0)),
        borderColor: "#34D399",
        backgroundColor: "rgba(52, 211, 153, 0.14)",
        pointBackgroundColor: "#6EE7B7",
        pointBorderColor: "#D1FAE5",
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.32,
        borderWidth: 2,
      },
    ],
  };

  return (
    <ChartSection
      title="7-Day Habit Trend"
      description="A view of daily focus quality and the consistency pattern behind it."
      legend={[
        { label: "Mindset score", color: "#8B5CF6" },
        { label: "Streak continued", color: "#34D399" },
      ]}
    >
      <Line
        data={data}
        options={{
          animation: { duration: 800, easing: "easeOutCubic" },
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.96)",
              titleColor: "#F8FAFC",
              bodyColor: "#E2E8F0",
              borderColor: "rgba(139, 92, 246, 0.3)",
              borderWidth: 1,
            },
          },
          scales: {
            x: {
              ticks: { color: "#94A3B8", font: { size: 11 } },
              grid: { color: "rgba(148, 163, 184, 0.08)" },
            },
            y: {
              beginAtZero: true,
              max: 100,
              ticks: { color: "#94A3B8", font: { size: 11 } },
              grid: { color: "rgba(148, 163, 184, 0.08)" },
            },
          },
        }}
      />
    </ChartSection>
  );
}

export default AnalyticsChart;
