import type { Goal } from "@/app/state/memoryStore";

export type HabitHistoryEntryLike = {
    date: string;
    habits: Array<number | string>;
};

export function buildWeeklyHistory(
    habitHistory: HabitHistoryEntryLike[],
    dailyHabitsCompleted: Array<number | string>,
    today = new Date().toISOString().slice(0, 10),
): HabitHistoryEntryLike[] {
    const historyWithToday = [
        ...habitHistory.slice(-6),
        { date: today, habits: dailyHabitsCompleted },
    ];

    return Array.from({ length: 7 }, (_, index) => {
        const fallback = historyWithToday[index - (7 - historyWithToday.length)] ?? {
            date: `Day ${index + 1}`,
            habits: [],
        };

        return {
            date: fallback.date,
            habits: Array.isArray(fallback.habits) ? fallback.habits : [],
        };
    });
}

export function buildGoalSummary(goals: Goal[]) {
    if (!goals.length) return 0;

    return Math.round(
        goals.reduce((total, goal) => total + Math.max(0, Math.min(100, goal.progress)), 0) /
        goals.length,
    );
}

export function buildAnalyticsSummary(
    habitHistory: HabitHistoryEntryLike[],
    dailyHabitsCompleted: Array<number | string>,
    monthlyGoals: Goal[],
    quarterlyGoals: Goal[],
    yearlyGoals: Goal[],
) {
    const weeklyHistory = buildWeeklyHistory(habitHistory, dailyHabitsCompleted);

    const consistencyScore = Math.min(
        100,
        Math.round(
            (weeklyHistory.reduce((total, entry) => total + entry.habits.length, 0) / 28) * 100,
        ),
    );

    const allGoals = [...monthlyGoals, ...quarterlyGoals, ...yearlyGoals];
    const goalAlignmentScore = buildGoalSummary(allGoals) || consistencyScore;

    return {
        weeklyHistory,
        consistencyScore,
        goalAlignmentScore,
    };
}
