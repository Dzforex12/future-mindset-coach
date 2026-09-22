"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { HabitHistoryEntry } from "@/app/state/memoryStore";
import { ChartSection } from "@/components/analytics/ChartShell";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function AnalyticsBarChart({
  habitHistory,
  disciplineStreak,
}: {
  habitHistory: HabitHistoryEntry[];
  disciplineStreak: number;
}) {
  const data = {
    labels: habitHistory.map((entry) => entry.date),
    datasets: [
      {
        label: "Focus level",
        data: habitHistory.map((entry) => entry.habits.length),
        backgroundColor: "#8B5CF6",
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Streak continued",
        data: habitHistory.map((entry) => (entry.habits.length === 4 ? disciplineStreak : 0)),
        backgroundColor: "#34D399",
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <ChartSection
      title="Streak Stability"
      description="Daily momentum and how often your system holds under repeated pressure."
      legend={[
        { label: "Focus level", color: "#8B5CF6" },
        { label: "Streak continued", color: "#34D399" },
      ]}
    >
      <Bar
        data={data}
        options={{
          animation: { duration: 700, easing: "easeOutQuart" },
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "rgba(15, 23, 42, 0.96)",
              titleColor: "#F8FAFC",
              bodyColor: "#E2E8F0",
              borderColor: "rgba(139, 92, 246, 0.25)",
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
              ticks: { color: "#94A3B8", font: { size: 11 } },
              grid: { color: "rgba(148, 163, 184, 0.08)" },
            },
          },
        }}
      />
    </ChartSection>
  );
}
