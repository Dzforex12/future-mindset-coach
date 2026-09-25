import { getHabitCompletionPercent, getCompletedHabitIdsForDate } from "./habitEngine";
import { getGoals, getOverallGoalProgress } from "./goalEngine";

export type SummarySnapshot = {
    habitCompletion: number;
    goalProgress: number;
    activity: number;
    summary: string;
};

export function getDailySummarySnapshot(): SummarySnapshot {
    const habitsCompleted = getCompletedHabitIdsForDate();
    const habitCompletion = getHabitCompletionPercent();
    const goalProgress = getOverallGoalProgress();

    let summary = "Start small today and keep momentum steady.";

    if (habitCompletion >= 80 && goalProgress >= 60) {
        summary = "You are operating with strong alignment. Keep the same rhythm and protect your recovery time.";
    } else if (habitCompletion >= 50) {
        summary = "The day is moving in the right direction. Focus on one more high-leverage action to lock in consistency.";
    } else if (habitsCompleted.length > 0) {
        summary = "Momentum is getting started. Choose the next action that restores clarity and keeps you moving.";
    } else if (getGoals().length > 0) {
        summary = "Your plan is set. Build the first win of the day to create momentum before the harder decisions appear.";
    }

    return {
        habitCompletion,
        goalProgress,
        activity: habitsCompleted.length,
        summary,
    };
}
