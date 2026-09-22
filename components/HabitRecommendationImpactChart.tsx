"use client";

import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { DynamicHabit, HabitHistoryEntry } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export function HabitRecommendationImpactChart({
  habitHistory,
  dynamicHabits,
}: {
  habitHistory: HabitHistoryEntry[];
  dynamicHabits: DynamicHabit[];
}) {
  const history = habitHistory.slice(-7);
  const baseline = history.length
    ? history.reduce((total, entry) => total + entry.habits.length, 0) / history.length
    : 0;
  const current = Math.min(4 + dynamicHabits.length, 4 + dynamicHabits.length);

  const data = {
    labels: ["Baseline consistency", "Current consistency"],
    datasets: [
      {
        label: "Consistency score",
        data: [baseline, current],
        backgroundColor: ["#4F46E5", "#22C55E"],
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="bg-navy-dark p-6 rounded-xl border border-border">
      <h2 className="text-lg font-semibold text-white mb-4">
        Habit Recommendation Impact
      </h2>
      <p className="mb-4 text-textSecondary">
        {dynamicHabits.length} recommended habit{dynamicHabits.length === 1 ? "" : "s"} adopted.
      </p>
      <Bar data={data} />
    </div>
  );
}
