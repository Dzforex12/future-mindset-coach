type FusionContext = {
  futureSelf?: { oneYear?: { identity: string; disciplineIdentity: string[]; emotionalIdentity: string[]; tradingIdentity: string[] }; fiveYear?: { identity: string }; tenYear?: { identity: string } };
  lightSelf?: { strengths: string[]; identityTraits: string[] };
  shadowSelf?: { weaknesses: string[]; patterns: string[] };
  adaptivePersonality?: { current: string };
  duality?: { balanceScore: number };
  alignment?: { dailyScore: number };
  emotionTrend?: { stabilityScore: number }[];
  monthlyTrend?: { disciplineScore: number }[];
  roadmapMilestones?: string[];
};

export function calculateIdentityFusion(context: FusionContext = {}) {
  const future = context.futureSelf?.oneYear;
  const fusedTraits = [...(future?.disciplineIdentity || []), ...(future?.emotionalIdentity || [])].slice(0, 4);
  const fusedStrengths = [...(context.lightSelf?.strengths || []), ...(context.lightSelf?.identityTraits || [])].slice(0, 4);
  const fusedWeaknesses = [...(context.shadowSelf?.weaknesses || []), ...(context.shadowSelf?.patterns || [])].slice(0, 4);
  const harmonyAreas = (context.lightSelf?.identityTraits || []).slice(0, 3);
  const conflictAreas = (context.shadowSelf?.patterns || []).slice(0, 3);
  const fusionScore = Math.max(0, Math.min(100, Math.round(((context.duality?.balanceScore || 0) + (context.alignment?.dailyScore || 0) + (context.emotionTrend?.at(-1)?.stabilityScore || 0) + (context.monthlyTrend?.at(-1)?.disciplineScore || 0)) / 4)));
  return { unifiedIdentity: future?.identity || "A disciplined, emotionally aware person in deliberate growth.", fusedTraits, fusedStrengths, fusedWeaknesses, fusionScore, conflictAreas, harmonyAreas };
}

export function generateIdentityFusionMonthlyReport(context: FusionContext = {}) {
  const fusion = calculateIdentityFusion(context);
  return `Identity fusion report: ${fusion.fusionScore}/100. Your unified identity is ${fusion.unifiedIdentity} Harmony is growing through ${fusion.harmonyAreas.join(", ") || "consistent action"}; resolve ${fusion.conflictAreas.join(", ") || "remaining friction"}.`;
}