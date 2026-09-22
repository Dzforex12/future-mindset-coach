type MetaContext = {
  adaptivePersonality?: { current: string; trend?: { evolutionScore: number }[] };
  alignment?: { dailyScore: number; history?: { score: number }[] };
  shadowSelf?: { stabilityScore: number; patterns: string[] };
  lightSelf?: { stabilityScore: number; strengths: string[] };
  duality?: { balanceScore: number };
  identityFusion?: { fusionScore: number };
  emotionTrend?: { stabilityScore: number }[];
  monthlyTrend?: { disciplineScore: number }[];
  roadmapProgress?: number;
  futureSelf?: unknown;
};

export function evaluateCoachBehavior(context: MetaContext = {}) {
  const scores = [context.alignment?.dailyScore || 0, context.duality?.balanceScore || 0, context.identityFusion?.fusionScore || 0, context.lightSelf?.stabilityScore || 0, 100 - (context.shadowSelf?.stabilityScore || 0)];
  const evaluationScore = Math.max(0, Math.min(100, Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)));
  const improvementAreas = evaluationScore < 50 ? ["Use more precise next steps", "Adjust intensity to current emotional state"] : ["Continue refining adaptive guidance"];
  const strengths = [context.adaptivePersonality?.current ? "Adaptive personality awareness" : "Context gathering", ...(context.lightSelf?.strengths || []).slice(0, 2)];
  const behaviorAdjustments = evaluationScore < 50 ? ["Be shorter and more corrective", "Prioritize alignment before ambition"] : ["Reinforce effective patterns", "Keep long-term identity visible"];
  return { evaluationScore, improvementAreas, strengths, behaviorAdjustments };
}

export function generateMetaCoachMonthlyReport(context: MetaContext = {}) {
  const result = evaluateCoachBehavior(context);
  return `Meta-coach report: evaluation ${result.evaluationScore}/100. Strengths: ${result.strengths.join(", ")}. Improve: ${result.improvementAreas.join(", ")}. Adjustments: ${result.behaviorAdjustments.join(", ")}.`;
}