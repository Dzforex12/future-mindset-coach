"use client";

import { Bar, Line } from "react-chartjs-2";
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement } from "chart.js";
import type { FutureSelf } from "@/app/state/memoryStore";

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement);

export function FutureSelfAnalyticsChart({
  title,
  kind,
  futureSelf,
  disciplineStreak,
  monthlyTrend,
  emotionTrend,
  habitHistory,
  tradingMode,
  riskProfile,
}: {
  title: string;
  kind: "identity" | "discipline" | "emotion" | "lifestyle" | "trading";
  futureSelf: FutureSelf;
  disciplineStreak: number;
  monthlyTrend: { disciplineScore: number }[];
  emotionTrend: { stabilityScore: number }[];
  habitHistory: { habits: (number | string)[] }[];
  tradingMode: string;
  riskProfile: string;
}) {
  const sections = [futureSelf.oneYear, futureSelf.fiveYear, futureSelf.tenYear];
  const labels = ["1 Year", "5 Years", "10 Years"];
  const values = kind === "identity"
    ? sections.map((section) => section.milestones.length)
    : kind === "discipline"
      ? sections.map((_, index) => (monthlyTrend.at(-(index + 1))?.disciplineScore || disciplineStreak * 5))
      : kind === "emotion"
        ? sections.map((_, index) => emotionTrend.at(-(index + 1))?.stabilityScore || 50)
        : kind === "lifestyle"
          ? sections.map((section) => section.lifestyleIdentity.length + habitHistory.slice(-30).reduce((total, entry) => total + entry.habits.length, 0))
          : sections.map((section) => section.tradingIdentity.length + tradingMode.length + riskProfile.length);
  const data = { labels, datasets: [{ label: title, data: values, borderColor: "#4F46E5", backgroundColor: "rgba(79, 70, 229, 0.2)", borderRadius: 6, tension: 0.4 }] };

  return (
    <div className="bg-navy-dark p-6 rounded-xl border border-border">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {kind === "identity" || kind === "emotion" ? <Line data={data} /> : <Bar data={data} />}
    </div>
  );
}
