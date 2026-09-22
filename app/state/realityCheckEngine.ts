import type { FutureSelf, HabitHistoryEntry, MonthlyGoal, QuarterlyGoal, YearlyGoal } from "./memoryStore";

type RealityContext = {
  dailyHabitsCompleted?: (number | string)[];
  disciplineStreak?: number;
  currentEmotion?: string | null;
  monthlyGoals?: MonthlyGoal[];
  quarterlyGoals?: QuarterlyGoal[];
  yearlyGoals?: YearlyGoal[];
  lifeRoadmap?: unknown;
  futureSelf?: FutureSelf;
  habitHistory?: HabitHistoryEntry[];
  tradingMode?: string;
};

export function calculateDailyAlignment(context: RealityContext = {}) {
  const habits = context.dailyHabitsCompleted?.length || 0;
  const goalProgress = [...(context.monthlyGoals || []), ...(context.quarterlyGoals || []), ...(context.yearlyGoals || [])];
  const goalScore = goalProgress.length ? goalProgress.reduce((total, goal) => total + goal.progress, 0) / goalProgress.length : 50;
  const score = Math.max(0, Math.min(100, Math.round(habits / 4 * 30 + Math.min(100, (context.disciplineStreak || 0) * 5) * 0.25 + goalScore * 0.25 + (context.currentEmotion ? 20 : 10))));
  const reasons: string[] = [];
  if (habits < 2) reasons.push("Today’s habits are below the consistency needed by your future identity.");
  if ((context.disciplineStreak || 0) < 3) reasons.push("The current discipline streak needs reinforcement.");
  if (goalScore < 50) reasons.push("Active goal progress is behind the intended trajectory.");
  if (["stressed", "overwhelmed", "distracted"].includes(context.currentEmotion || "")) reasons.push("Your current emotional state may be competing with long-term alignment.");
  if (!reasons.length) reasons.push("Today’s actions are aligned with the current future-self direction.");
  return { score, reasons };
}

export function generateWeeklyAlignmentReport(history: { score: number; reasons: string[] }[] = []) {
  const average = history.length ? Math.round(history.reduce((total, entry) => total + entry.score, 0) / history.length) : 0;
  const reasons = [...new Set(history.flatMap((entry) => entry.reasons))].slice(0, 3);
  return `Weekly alignment score: ${average}/100. ${reasons.length ? `Primary alignment signals: ${reasons.join(" ")}` : "Build more daily data before drawing conclusions."} Next step: choose one repeatable action that moves today closer to your future identity.`;
}