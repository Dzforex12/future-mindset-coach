"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { HabitHistoryEntry } from "@/app/state/memoryStore";
import { BreakdownSection } from "@/components/analytics/ChartShell";

ChartJS.register(ArcElement, Tooltip, Legend);

export function AnalyticsDonutChart({
  habitHistory,
  disciplineStreak,
}: {
  habitHistory: HabitHistoryEntry[];
  disciplineStreak: number;
}) {
  const currentHabits = habitHistory[habitHistory.length - 1]?.habits || [];
  const data = {
    labels: ["Focus", "Energy", "Mindset"],
    datasets: [
      {
        label: "Daily breakdown",
        data: [currentHabits.length, Math.max(0, 4 - currentHabits.length), disciplineStreak],
        backgroundColor: ["#8B5CF6", "#34D399", "#F59E0B"],
        borderColor: ["#E9D5FF", "#D1FAE5", "#FDE68A"],
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <BreakdownSection
      title="Consistency Breakdown"
      description="Where your daily structure is strongest and where recovery pressure still shows up."
      legend={[
        { label: "Focus", color: "#8B5CF6" },
        { label: "Energy", color: "#34D399" },
        { label: "Mindset", color: "#F59E0B" },
      ]}
    >
      <div className="max-w-md mx-auto">
        <Doughnut
          data={data}
          options={{
            animation: { duration: 800, easing: "easeOutCubic" },
            cutout: "62%",
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "rgba(15, 23, 42, 0.96)",
                titleColor: "#F8FAFC",
                bodyColor: "#E2E8F0",
                borderColor: "rgba(52, 211, 153, 0.25)",
                borderWidth: 1,
              },
            },
          }}
        />
      </div>
    </BreakdownSection>
  );
}
