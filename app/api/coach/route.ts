import { NextResponse } from "next/server";
import { detectEmotionFromMessage } from "@/app/state/emotionEngine";

function formatCoachResponse({
  message,
  tradingMode,
  riskProfile,
  coachPersonality,
  disciplineStreak,
  recentAverage,
  alignment,
  roadmapMilestones,
  futureIdentity,
  adaptivePersonality,
  emotion,
  emotionIntensity,
}: {
  message: string;
  tradingMode: string;
  riskProfile: string;
  coachPersonality: string;
  disciplineStreak: number;
  recentAverage: number;
  alignment: { dailyScore?: number; weeklyScore?: number };
  roadmapMilestones: string[];
  futureIdentity: string[];
  adaptivePersonality: string;
  emotion: string;
  emotionIntensity: number;
}) {
  const focus = message.trim() || "your current direction";
  const alignmentMessage =
    (alignment.dailyScore ?? 0) >= 70
      ? "Your alignment is holding well today, so keep the system simple and protect the momentum."
      : "Your alignment is pulling under pressure, so reduce the next decision to one deliberate move.";

  const coachGuidance = [
    `You’re operating in ${tradingMode} mode with a ${riskProfile.toLowerCase()} risk profile.`,
    `Coach tone: ${coachPersonality}.`,
    `Current emotional signal: ${emotion} (${emotionIntensity}/10).`,
    alignmentMessage,
    `Discipline streak: ${disciplineStreak}. Recent habit average: ${recentAverage.toFixed(1)} entries per day.`,
    roadmapMilestones.length
      ? `Your next best action is to anchor around: ${roadmapMilestones[0]}.`
      : "Choose one clear action that supports your future identity rather than your current emotion.",
    futureIdentity.length
      ? `Your strongest future-self cue is ${futureIdentity[0]}. Let that be the filter for the next decision.`
      : "Define your future self in one sentence and make the next choice from that identity.",
    `Adaptive personality: ${adaptivePersonality}.`,
    `The key for ${focus.toLowerCase()} is to keep your next move simple, measurable, and emotionally steady.`
  ];

  return coachGuidance.join(" \n\n");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      message = "",
      tradingMode = "Forex",
      riskProfile = "Moderate",
      coachPersonality = "Neutral",
      disciplineStreak = 0,
      habitHistory = [],
      currentEmotion = null,
      lifeRoadmap = null,
      adaptivePersonality = "Neutral",
      futureSelf = null,
      alignment = { dailyScore: 0, weeklyScore: 0, misalignmentReasons: [], weeklyReport: "" },
    } = body;

    const detectedEmotion = detectEmotionFromMessage(message);
    const emotion = currentEmotion || detectedEmotion.emotion;
    const emotionIntensity = detectedEmotion.intensity;

    const recentHistory = Array.isArray(habitHistory) ? habitHistory.slice(-7) : [];
    const totalHabits = recentHistory.reduce(
      (sum: number, entry: { habits?: number[] }) => {
        const habits = Array.isArray(entry?.habits) ? entry.habits : [];
        return sum + habits.length;
      },
      0,
    );
    const recentAverage = recentHistory.length ? totalHabits / recentHistory.length : 0;

    const roadmapMilestones = [
      ...(lifeRoadmap?.sixMonth?.milestones || []),
      ...(lifeRoadmap?.oneYear?.milestones || []),
      ...(lifeRoadmap?.fiveYear?.milestones || []),
    ];

    const futureIdentity = [
      futureSelf?.oneYear?.identity,
      futureSelf?.fiveYear?.identity,
      futureSelf?.tenYear?.identity,
    ].filter(Boolean);

    const reply = formatCoachResponse({
      message,
      tradingMode,
      riskProfile,
      coachPersonality,
      disciplineStreak,
      recentAverage,
      alignment,
      roadmapMilestones,
      futureIdentity,
      adaptivePersonality,
      emotion,
      emotionIntensity,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Coach request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
