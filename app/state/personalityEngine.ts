import type { EmotionTrendEntry, HabitHistoryEntry, LifeRoadmap, MonthlyGoal, MonthlyTrend, QuarterlyGoal, YearlyGoal } from "./memoryStore";

type PersonalityContext = {
  emotionTrend?: EmotionTrendEntry[];
  monthlyTrend?: MonthlyTrend[];
  disciplineStreak?: number;
  habitHistory?: HabitHistoryEntry[];
  monthlyGoals?: MonthlyGoal[];
  quarterlyGoals?: QuarterlyGoal[];
  yearlyGoals?: YearlyGoal[];
  lifeRoadmap?: LifeRoadmap;
  coachPersonality?: string;
};

export function evolvePersonality(context: PersonalityContext = {}) {
  const averageHabits = context.habitHistory?.length
    ? context.habitHistory.reduce((total, entry) => total + entry.habits.length, 0) / context.habitHistory.length
    : 0;
  const stability = context.emotionTrend?.length
    ? context.emotionTrend.reduce((total, entry) => total + entry.stabilityScore, 0) / context.emotionTrend.length
    : 50;
  const goalProgress = [
    ...(context.monthlyGoals || []),
    ...(context.quarterlyGoals || []),
    ...(context.yearlyGoals || []),
  ];
  const alignment = goalProgress.length
    ? goalProgress.reduce((total, goal) => total + goal.progress, 0) / goalProgress.length
    : 50;
  const score = Math.round((averageHabits / 4 * 35) + (stability * 0.3) + (alignment * 0.2) + Math.min(100, (context.disciplineStreak || 0) * 5) * 0.15);
  const dominantEmotion = context.emotionTrend?.at(-1)?.dominantEmotion;
  const personality = score >= 75 && (context.disciplineStreak || 0) >= 7
    ? "Challenging"
    : stability < 40 || ["stressed", "overwhelmed"].includes(dominantEmotion || "")
      ? "Calm"
      : alignment >= 70
        ? "Strategic"
        : context.coachPersonality === "Aggressive"
          ? "Direct"
          : "Supportive";
  const reason = `${personality} fits current consistency, emotional stability, discipline, and goal alignment.`;
  return { personality, reason, evolutionScore: Math.max(0, Math.min(100, score)) };
}

export function evolveMonthlyPersonality(context: PersonalityContext = {}) {
  return evolvePersonality(context);
}

export function evolveQuarterlyPersonality(context: PersonalityContext = {}) {
  return evolvePersonality(context);
}

export function evolveYearlyPersonality(context: PersonalityContext = {}) {
  return evolvePersonality(context);
}