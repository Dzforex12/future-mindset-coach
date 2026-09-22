import type { HabitHistoryEntry, MonthlyReport } from "./memoryStore";

export function generateMonthlyPerformance(
  habitHistory: HabitHistoryEntry[] = [],
  disciplineStreak = 0,
  month = new Date().toISOString().slice(0, 7),
): MonthlyReport {
  const entries = habitHistory.slice(-30);
  const counts = entries.map((entry) => entry.habits.length);
  const totalDays = Math.max(entries.length, 1);
  const habitsCompleted = counts.reduce((total, count) => total + count, 0);
  const consistencyScore = Math.min(100, Math.round((habitsCompleted / (totalDays * 4)) * 100));
  const completeDays = counts.filter((count) => count === 4).length;
  const disciplineScore = Math.min(100, Math.round((completeDays / totalDays) * 100));
  const tradingMindsetScore = Math.min(100, Math.round((consistencyScore + disciplineScore) / 2));
  const bestIndex = counts.length ? counts.indexOf(Math.max(...counts)) : -1;
  const worstIndex = counts.length ? counts.indexOf(Math.min(...counts)) : -1;

  return {
    month,
    summary: `Completed ${habitsCompleted} habits across ${entries.length} tracked days.`,
    consistencyScore,
    disciplineScore,
    tradingMindsetScore,
    bestDay: bestIndex >= 0 ? entries[bestIndex].date : "No data",
    worstDay: worstIndex >= 0 ? entries[worstIndex].date : "No data",
    habitsCompleted,
    streakHigh: Math.max(disciplineStreak, completeDays),
    streakLow: entries.length ? Math.min(...counts) : 0,
  };
}