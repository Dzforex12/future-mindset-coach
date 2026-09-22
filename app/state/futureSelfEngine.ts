import type { AdaptivePersonality, EmotionTrendEntry, FutureSelfSection, HabitHistoryEntry, LifeRoadmap, MonthlyGoal, MonthlyTrend, QuarterlyGoal, YearlyGoal } from "./memoryStore";

type FutureContext = {
  lifeRoadmap?: LifeRoadmap;
  adaptivePersonality?: AdaptivePersonality;
  emotionTrend?: EmotionTrendEntry[];
  monthlyTrend?: MonthlyTrend[];
  disciplineStreak?: number;
  habitHistory?: HabitHistoryEntry[];
  monthlyGoals?: MonthlyGoal[];
  quarterlyGoals?: QuarterlyGoal[];
  yearlyGoals?: YearlyGoal[];
  tradingMode?: string;
  riskProfile?: string;
};

function generate(section: string, context: FutureContext): FutureSelfSection {
  const personality = context.adaptivePersonality?.current || "Neutral";
  const mode = context.tradingMode || "Forex";
  return {
    identity: `A ${personality.toLowerCase()} and intentional person building a sustainable ${mode} practice.`,
    disciplineIdentity: [`Keeps promises through repeatable systems`, `Builds on a ${context.disciplineStreak || 0}-day streak`],
    emotionalIdentity: [`Responds with awareness instead of reaction`, `Builds stability through emotional resets`],
    lifestyleIdentity: [`Protects time, health, and attention`, `Creates routines that support meaningful work`],
    tradingIdentity: [`Uses ${context.riskProfile || "Moderate"} risk rules consistently`, `Prioritizes process over short-term outcomes`],
    milestones: [`Complete the ${section} roadmap review`, "Sustain consistent monthly progress", "Document the next identity shift"],
    challenges: ["Avoiding inconsistency during pressure", "Keeping ambition aligned with recovery"],
    opportunities: ["Turn history into better decisions", "Use emotional and habit data to refine the system"],
  };
}

export function generateOneYearFutureSelf(context: FutureContext = {}) { return generate("one-year", context); }
export function generateFiveYearFutureSelf(context: FutureContext = {}) { return generate("five-year", context); }
export function generateTenYearFutureSelf(context: FutureContext = {}) { return generate("ten-year", context); }