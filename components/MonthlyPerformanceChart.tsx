"use client";

import { Bar, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { HabitHistoryEntry, MonthlyTrend } from "@/app/state/memoryStore";
import { ChartSection } from "@/components/analytics/ChartShell";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

type MonthlyPerformanceChartProps = {
  title: string;
  kind: "habits" | "consistency" | "discipline" | "mindset";
  habitHistory?: HabitHistoryEntry[];
  monthlyTrend?: MonthlyTrend[];
};

export function MonthlyPerformanceChart({
  title,
  kind,
  habitHistory = [],
  monthlyTrend = [],
}: MonthlyPerformanceChartProps) {
  const isHabitChart = kind === "habits";
  const labels = isHabitChart
    ? habitHistory.map((entry) => entry.date)
    : monthlyTrend.map((entry) => entry.month);
  const values = isHabitChart
    ? habitHistory.map((entry) => entry.habits.length)
    : monthlyTrend.map((entry) => {
      if (kind === "discipline") return entry.disciplineScore;
      if (kind === "mindset") return entry.tradingMindsetScore;
      return entry.consistencyScore;
    });
  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        borderColor: "#A78BFA",
        backgroundColor: isHabitChart ? "rgba(167, 139, 250, 0.18)" : "rgba(139, 92, 246, 0.75)",
        borderRadius: 8,
        pointBackgroundColor: "#C4B5FD",
        pointBorderColor: "#F3E8FF",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
      },
    ],
  };

  return (
    <ChartSection title={title} description="A rolling view of your performance structure over time." legend={[{ label: title, color: "#A78BFA" }]}>
      {isHabitChart ? (
        <Line
          data={data}
          options={{
            animation: { duration: 700, easing: "easeOutQuart" },
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: "rgba(15, 23, 42, 0.96)", titleColor: "#F8FAFC", bodyColor: "#E2E8F0", borderColor: "rgba(167, 139, 250, 0.3)", borderWidth: 1 },
            },
            scales: {
              x: { ticks: { color: "#94A3B8", font: { size: 11 } }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
              y: { beginAtZero: false, ticks: { color: "#94A3B8", font: { size: 11 } }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
            },
          }}
        />
      ) : (
        <Bar
          data={data}
          options={{
            animation: { duration: 700, easing: "easeOutQuart" },
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: "rgba(15, 23, 42, 0.96)", titleColor: "#F8FAFC", bodyColor: "#E2E8F0", borderColor: "rgba(167, 139, 250, 0.3)", borderWidth: 1 },
            },
            scales: {
              x: { ticks: { color: "#94A3B8", font: { size: 11 } }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
              y: { beginAtZero: false, ticks: { color: "#94A3B8", font: { size: 11 } }, grid: { color: "rgba(148, 163, 184, 0.08)" } },
            },
          }}
        />
      )}
    </ChartSection>
  );
}
