type LightContext = {
  disciplineStreak?: number;
  emotionTrend?: { stabilityScore: number }[];
  alignmentHistory?: { score: number }[];
  monthlyTrend?: { consistencyScore: number; tradingMindsetScore: number }[];
  monthlyGoals?: { progress: number }[];
  quarterlyGoals?: { progress: number }[];
  yearlyGoals?: { progress: number }[];
  adaptivePersonality?: { current: string; trend?: { evolutionScore: number }[] };
  futureSelf?: { oneYear?: { identity: string }; fiveYear?: { identity: string }; tenYear?: { identity: string } };
  shadowSelf?: { stabilityScore: number; patterns: string[] };
};

export function detectLightTriggers(context: LightContext = {}) {
  const triggers: string[] = [];
  if ((context.disciplineStreak || 0) >= 3) triggers.push("discipline momentum");
  if ((context.alignmentHistory?.at(-1)?.score || 0) >= 70) triggers.push("future-self alignment");
  if ((context.emotionTrend?.at(-1)?.stabilityScore || 0) >= 70) triggers.push("emotional stability");
  if ((context.monthlyTrend?.at(-1)?.consistencyScore || 0) >= 70) triggers.push("consistency peak");
  return triggers;
}

export function detectLightPatterns(context: LightContext = {}) {
  const patterns: string[] = [];
  const goals = [...(context.monthlyGoals || []), ...(context.quarterlyGoals || []), ...(context.yearlyGoals || [])];
  if (goals.some((goal) => goal.progress >= 70)) patterns.push("goal follow-through");
  if ((context.shadowSelf?.stabilityScore || 0) >= 60) patterns.push("shadow suppression");
  if ((context.adaptivePersonality?.trend?.at(-1)?.evolutionScore || 0) >= 70) patterns.push("identity evolution");
  return patterns;
}

export function calculateLightStability(context: LightContext = {}) {
  const values = [context.emotionTrend?.at(-1)?.stabilityScore || 0, context.alignmentHistory?.at(-1)?.score || 0, context.monthlyTrend?.at(-1)?.consistencyScore || 0, Math.min(100, (context.disciplineStreak || 0) * 5)];
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function generateLightMonthlyReport(context: LightContext = {}) {
  const triggers = detectLightTriggers(context);
  const patterns = detectLightPatterns(context);
  return `Peak-performance report: ${triggers.length ? `Active strengths include ${triggers.join(", ")}.` : "Build more consistent peak days."} ${patterns.length ? `Emerging patterns: ${patterns.join(", ")}.` : "Your next opportunity is repeatable consistency."}`;
}