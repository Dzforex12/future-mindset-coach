type ShadowContext = {
  emotionHistory?: { emotion: string; intensity: number }[];
  disciplineStreak?: number;
  habitHistory?: { habits: (number | string)[] }[];
  misalignmentReasons?: string[];
  adaptivePersonality?: { evolutionHistory?: { personality: string }[] };
  lifeRoadmap?: unknown;
  goals?: { progress: number }[];
  currentEmotion?: string | null;
  alignmentHistory?: { score: number }[];
  tradingMode?: string;
};

export function detectShadowTriggers(context: ShadowContext = {}) {
  const triggers: string[] = [];
  const lastEmotion = context.emotionHistory?.at(-1);
  if (lastEmotion && ["stressed", "frustrated", "overwhelmed", "tired"].includes(lastEmotion.emotion)) triggers.push("emotional volatility");
  if ((context.disciplineStreak || 0) < 2) triggers.push("discipline drop");
  if ((context.habitHistory?.at(-1)?.habits.length || 0) < 2) triggers.push("habit avoidance");
  return triggers;
}

export function detectShadowPatterns(context: ShadowContext = {}) {
  const patterns: string[] = [];
  if ((context.misalignmentReasons || []).length) patterns.push("avoidance");
  if ((context.goals || []).some((goal) => goal.progress < 30)) patterns.push("goal resistance");
  if ((context.alignmentHistory?.at(-1)?.score || 100) < 40) patterns.push("future identity drift");
  if (context.currentEmotion === "distracted") patterns.push("distraction loop");
  return patterns;
}

export function calculateShadowStability(context: ShadowContext = {}) {
  const volatility = context.emotionHistory?.slice(-7).reduce((total, entry) => total + Math.abs(entry.intensity - 50), 0) || 0;
  const alignment = context.alignmentHistory?.at(-1)?.score || 50;
  return Math.max(0, Math.min(100, Math.round(100 - volatility / 7 - (100 - alignment) * 0.35)));
}

export function generateShadowMonthlyReport(context: ShadowContext = {}) {
  const triggers = detectShadowTriggers(context);
  const patterns = detectShadowPatterns(context);
  const stabilityScore = calculateShadowStability(context);
  return `Shadow analysis for this month: stability is ${stabilityScore}/100. Active triggers: ${triggers.join(", ") || "none"}. Recurring patterns: ${patterns.join(", ") || "none"}. Use one deliberate reset action to return to your future identity.`;
}