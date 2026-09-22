type DualityContext = {
  shadowSelf?: { triggers: string[]; patterns: string[]; stabilityScore: number };
  lightSelf?: { triggers: string[]; patterns: string[]; stabilityScore: number };
  alignment?: { dailyScore: number };
  emotionTrend?: { stabilityScore: number }[];
  disciplineStreak?: number;
  futureSelf?: unknown;
};

export function calculateDualityBalance(context: DualityContext = {}) {
  const shadow = context.shadowSelf || { triggers: [], patterns: [], stabilityScore: 50 };
  const light = context.lightSelf || { triggers: [], patterns: [], stabilityScore: 50 };
  const balanceScore = Math.max(0, Math.min(100, Math.round((light.stabilityScore + (context.alignment?.dailyScore || 0) + Math.min(100, (context.disciplineStreak || 0) * 5) - shadow.triggers.length * 8 - shadow.patterns.length * 6) / 2)));
  const dominantSide = light.stabilityScore >= shadow.stabilityScore ? "light" : "shadow";
  const conflictPoints = [...shadow.patterns, ...(shadow.triggers.length ? ["active shadow triggers"] : [])];
  const harmonyPoints = [...light.patterns, ...(light.triggers.length ? ["light momentum"] : [])];
  return { balanceScore, dominantSide, conflictPoints, harmonyPoints };
}

export function generateDualityMonthlyReport(context: DualityContext = {}) {
  const result = calculateDualityBalance(context);
  return `Duality report: balance is ${result.balanceScore}/100 with the ${result.dominantSide} side leading. ${result.conflictPoints.length ? `Resolve: ${result.conflictPoints.join(", ")}.` : "Conflict is limited."} ${result.harmonyPoints.length ? `Build on: ${result.harmonyPoints.join(", ")}.` : "Create one repeatable harmony practice."}`;
}