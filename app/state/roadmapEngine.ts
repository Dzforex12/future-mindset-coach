import type {
  EmotionTrendEntry,
  HabitHistoryEntry,
  LifeRoadmap,
  MonthlyReport,
  MonthlyTrend,
  QuarterlyGoal,
  YearlyGoal,
} from "./memoryStore";

type RoadmapContext = {
  monthlyReports?: MonthlyReport[];
  quarterlyGoals?: QuarterlyGoal[];
  yearlyGoals?: YearlyGoal[];
  emotionTrend?: EmotionTrendEntry[];
  habitHistory?: HabitHistoryEntry[];
  monthlyTrend?: MonthlyTrend[];
  disciplineStreak?: number;
  coachPersonality?: string;
  tradingMode?: string;
  riskProfile?: string;
};

const contextSummary = (context: RoadmapContext) => {
  const history = context.habitHistory || [];
  const averageHabits = history.length
    ? history.reduce((total, entry) => total + entry.habits.length, 0) / history.length
    : 0;
  return `${context.tradingMode || "Forex"} focus, ${context.riskProfile || "Moderate"} risk, ${context.disciplineStreak || 0}-day streak, ${averageHabits.toFixed(1)} average habits.`;
};

export function generateSixMonthRoadmap(context: RoadmapContext = {}): LifeRoadmap["sixMonth"] {
  const summary = contextSummary(context);
  return {
    summary: `Build a reliable operating rhythm over six months: ${summary}`,
    milestones: ["Establish a repeatable weekly routine", "Complete a 90-day consistency review", "Refine the next six-month plan"],
    focusAreas: ["Daily execution", "Weekly reflection", `${context.tradingMode || "Trading"} process`],
    disciplineTargets: ["Complete core habits at least five days per week", "Protect a consistent review block"],
    emotionalTargets: ["Name emotions before acting", "Use a reset routine during stress"],
    tradingMindsetTargets: ["Follow process before outcome", `Respect the ${context.riskProfile || "Moderate"} risk profile`],
  };
}

export function generateOneYearRoadmap(context: RoadmapContext = {}): LifeRoadmap["oneYear"] {
  return {
    summary: `Become a consistent, self-aware operator over the next year through measurable practice in ${context.tradingMode || "your chosen market"}.`,
    milestones: ["Build four strong quarters", "Review monthly performance every month", "Document a personal operating system"],
    identityShift: ["From reactive to intentional", "From short bursts to durable consistency"],
    disciplineEvolution: ["Make core habits automatic", "Increase follow-through under pressure"],
    emotionalEvolution: ["Recover faster from setbacks", "Turn emotion into useful information"],
    tradingPsychologyEvolution: ["Think in probabilities", "Prioritize risk and process over excitement"],
  };
}

export function generateFiveYearRoadmap(context: RoadmapContext = {}): LifeRoadmap["fiveYear"] {
  return {
    summary: `Create a sustainable life and trading identity that reflects disciplined progress, emotional steadiness, and long-term focus.`,
    milestones: ["Build a durable personal system", "Reach stable multi-year consistency", "Reassess the vision annually"],
    lifestyleVision: ["Protect health, time, and attention", "Design weeks around meaningful priorities"],
    disciplineIdentity: ["Be someone who keeps promises to himself", "Use systems instead of willpower alone"],
    emotionalIdentity: ["Stay grounded through uncertainty", "Respond instead of react"],
    tradingIdentity: [`Be a patient ${context.tradingMode || "market"} participant`, "Let risk rules define decisions"],
  };
}