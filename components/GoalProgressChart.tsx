"use client";

import { Bar } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
} from "chart.js";
import type { Goal } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale);

export function GoalProgressChart({
  title,
  goals,
}: {
  title: string;
  goals: Goal[];
}) {
  const data = {
    labels: goals.map((goal) => goal.title),
    datasets: [{
      label: "Progress",
      data: goals.map((goal) => goal.progress),
      backgroundColor: "#4F46E5",
      borderRadius: 6,
    }],
  };

  return (
    <div className="bg-navy-dark p-6 rounded-xl border border-border">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <Bar data={data} />
    </div>
  );
}
