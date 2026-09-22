import { addHistoryEntry } from "./habitHistory";
import { useMemoryStore } from "./memoryStore";
import { generateMonthlyPerformance } from "./monthlyEngine";
import { evolveMonthlyPersonality, evolveQuarterlyPersonality, evolveYearlyPersonality } from "./personalityEngine";
import { calculateDailyAlignment, generateWeeklyAlignmentReport } from "./realityCheckEngine";
import { calculateShadowStability, detectShadowPatterns, detectShadowTriggers, generateShadowMonthlyReport } from "./shadowEngine";
import { calculateLightStability, detectLightPatterns, detectLightTriggers, generateLightMonthlyReport } from "./lightEngine";
import { calculateDualityBalance, generateDualityMonthlyReport } from "./dualityEngine";
import { calculateIdentityFusion, generateIdentityFusionMonthlyReport } from "./identityFusionEngine";
import { evaluateCoachBehavior, generateMetaCoachMonthlyReport } from "./metaCoachEngine";

function getDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function ensureDailyReset() {
  const state = useMemoryStore.getState();
  const today = getDateString();

  const alignment = calculateDailyAlignment({
    dailyHabitsCompleted: state.dailyHabitsCompleted,
    disciplineStreak: state.disciplineStreak,
    currentEmotion: state.currentEmotion,
    monthlyGoals: state.monthlyGoals,
    quarterlyGoals: state.quarterlyGoals,
    yearlyGoals: state.yearlyGoals,
    lifeRoadmap: state.lifeRoadmap,
    futureSelf: state.futureSelf,
    habitHistory: state.habitHistory,
    tradingMode: state.tradingMode,
  });
  if (state.alignment.history.at(-1)?.date !== today) {
    state.setDailyAlignmentScore(alignment.score);
    state.setMisalignmentReasons(alignment.reasons);
    state.addAlignmentHistoryEntry({ date: today, ...alignment });
  }

  const shadowContext = {
    emotionHistory: state.emotionHistory,
    disciplineStreak: state.disciplineStreak,
    habitHistory: state.habitHistory,
    misalignmentReasons: state.alignment.misalignmentReasons,
    adaptivePersonality: state.adaptivePersonality,
    lifeRoadmap: state.lifeRoadmap,
    goals: [...state.monthlyGoals, ...state.quarterlyGoals, ...state.yearlyGoals],
    currentEmotion: state.currentEmotion,
    alignmentHistory: state.alignment.history,
    tradingMode: state.tradingMode,
  };
  const shadowTriggers = detectShadowTriggers(shadowContext);
  const shadowPatterns = detectShadowPatterns(shadowContext);
  const shadowStability = calculateShadowStability(shadowContext);
  if (state.shadowSelf.history.at(-1)?.date !== today) {
    state.addShadowHistoryEntry({ date: today, triggers: shadowTriggers, patterns: shadowPatterns, weaknesses: shadowPatterns, strengths: shadowStability >= 70 ? ["recovery speed"] : [], stabilityScore: shadowStability });
  }
  const lightContext = {
    disciplineStreak: state.disciplineStreak,
    emotionTrend: state.emotionTrend,
    alignmentHistory: state.alignment.history,
    monthlyTrend: state.monthlyTrend,
    monthlyGoals: state.monthlyGoals,
    quarterlyGoals: state.quarterlyGoals,
    yearlyGoals: state.yearlyGoals,
    adaptivePersonality: state.adaptivePersonality,
    futureSelf: state.futureSelf,
    shadowSelf: state.shadowSelf,
  };
  if (state.lightSelf.history.at(-1)?.date !== today) {
    const lightTriggers = detectLightTriggers(lightContext);
    const lightPatterns = detectLightPatterns(lightContext);
    const lightStability = calculateLightStability(lightContext);
    state.addLightHistoryEntry({ date: today, triggers: lightTriggers, patterns: lightPatterns, strengths: lightTriggers, identityTraits: lightPatterns, stabilityScore: lightStability });
  }
  const dualityContext = { shadowSelf: state.shadowSelf, lightSelf: state.lightSelf, alignment: state.alignment, emotionTrend: state.emotionTrend, disciplineStreak: state.disciplineStreak, futureSelf: state.futureSelf };
  if (state.duality.history.at(-1)?.date !== today) state.addDualityHistoryEntry({ date: today, ...calculateDualityBalance(dualityContext) });
  const fusionContext = { futureSelf: state.futureSelf, lightSelf: state.lightSelf, shadowSelf: state.shadowSelf, adaptivePersonality: state.adaptivePersonality, duality: state.duality, alignment: state.alignment, emotionTrend: state.emotionTrend, monthlyTrend: state.monthlyTrend };
  if (state.identityFusion.history.at(-1)?.date !== today) state.addIdentityFusionHistoryEntry({ date: today, ...calculateIdentityFusion(fusionContext) });
  const metaContext = { adaptivePersonality: state.adaptivePersonality, alignment: state.alignment, shadowSelf: state.shadowSelf, lightSelf: state.lightSelf, duality: state.duality, identityFusion: state.identityFusion, emotionTrend: state.emotionTrend, monthlyTrend: state.monthlyTrend, futureSelf: state.futureSelf };
  if (state.metaCoach.history.at(-1)?.date !== today) state.addMetaCoachHistoryEntry({ date: today, ...evaluateCoachBehavior(metaContext) });

  if (!state.lastActiveDate) {
    state.setLastActiveDate(today);
    return;
  }

  if (state.lastActiveDate === today) return;

  addHistoryEntry(state.dailyHabitsCompleted, state.lastActiveDate);
  state.setDailyHabitsCompleted([]);
  state.setLastActiveDate(today);

  const latestState = useMemoryStore.getState();
  const summaryResponse = await fetch("/api/daily-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      habitHistory: latestState.habitHistory,
      todayHabits: latestState.dailyHabitsCompleted,
      disciplineStreak: latestState.disciplineStreak,
      tradingMode: latestState.tradingMode,
      riskProfile: latestState.riskProfile,
      coachPersonality: latestState.coachPersonality,
    }),
  });

  if (summaryResponse.ok) {
    const data = await summaryResponse.json();
    useMemoryStore.getState().setDailySummary(data.summary);
  }

  const dayOfWeek = new Date(`${today}T00:00:00`).getUTCDay();

  if (dayOfWeek === 0) {
    const current = useMemoryStore.getState();
    const recentEmotions = current.emotionHistory.slice(-7);
    const emotionCounts = recentEmotions.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
      return counts;
    }, {});
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([, left], [, right]) => right - left)[0]?.[0] || "calm";
    const averageIntensity = recentEmotions.length
      ? recentEmotions.reduce((total, entry) => total + entry.intensity, 0) / recentEmotions.length
      : 50;
    const intensityVariance = recentEmotions.length
      ? recentEmotions.reduce((total, entry) => total + Math.abs(entry.intensity - averageIntensity), 0) / recentEmotions.length
      : 0;
    current.addEmotionTrendEntry({
      week: today,
      dominantEmotion,
      stabilityScore: Math.max(0, Math.round(100 - intensityVariance)),
    });
    current.setEmotionTrendIsNew(true);

    const reportResponse = await fetch("/api/weekly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habitHistory: latestState.habitHistory.slice(-7),
        disciplineStreak: latestState.disciplineStreak,
        tradingMode: latestState.tradingMode,
        riskProfile: latestState.riskProfile,
        coachPersonality: latestState.coachPersonality,
      }),
    });

    if (reportResponse.ok) {
      const data = await reportResponse.json();
      const current = useMemoryStore.getState();
      current.setWeeklyReports([
        ...current.weeklyReports,
        { date: today, report: data.report },
      ]);
      current.setWeeklyReportIsNew(true);
    }
    const alignmentCurrent = useMemoryStore.getState();
    const weeklyHistory = alignmentCurrent.alignment.history.slice(-7);
    alignmentCurrent.setWeeklyAlignmentScore(Math.round(weeklyHistory.reduce((total, entry) => total + entry.score, 0) / Math.max(weeklyHistory.length, 1)));
    alignmentCurrent.setWeeklyAlignmentReport(generateWeeklyAlignmentReport(weeklyHistory));
    alignmentCurrent.setAlignmentWeeklyReportIsNew(true);
  }

  if (dayOfWeek === 1) {
    const current = useMemoryStore.getState();
    const recommendationResponse = await fetch("/api/habit-recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habitHistory: current.habitHistory.slice(-7),
        disciplineStreak: current.disciplineStreak,
        tradingMode: current.tradingMode,
        riskProfile: current.riskProfile,
        coachPersonality: current.coachPersonality,
      }),
    });

    if (recommendationResponse.ok) {
      const data = await recommendationResponse.json();
      current.setRecommendedHabits(data.recommendations || []);
      current.setRecommendedHabitsIsNew(true);
    }
  }

  if (new Date(`${today}T00:00:00`).getUTCDate() === 1) {
    const current = useMemoryStore.getState();
    const performance = generateMonthlyPerformance(
      current.habitHistory,
      current.disciplineStreak,
      today.slice(0, 7),
    );
    const reportResponse = await fetch("/api/monthly-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habitHistory: current.habitHistory,
        disciplineStreak: current.disciplineStreak,
        tradingMode: current.tradingMode,
        riskProfile: current.riskProfile,
        coachPersonality: current.coachPersonality,
      }),
    });

    if (reportResponse.ok) {
      const data = await reportResponse.json();
      const latest = useMemoryStore.getState();
      latest.addMonthlyReport({
        ...performance,
        summary: data.report,
      });
      latest.addMonthlyTrend({
        month: performance.month,
        consistencyScore: performance.consistencyScore,
        disciplineScore: performance.disciplineScore,
        tradingMindsetScore: performance.tradingMindsetScore,
      });
      latest.setMonthlyReportIsNew(true);
    }

    const monthlyGoalsResponse = await fetch("/api/generate-monthly-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lastMonthlyReport: current.monthlyReports[current.monthlyReports.length - 1],
        habitHistory: current.habitHistory,
        monthlyTrend: current.monthlyTrend,
        coachPersonality: current.coachPersonality,
        tradingMode: current.tradingMode,
        riskProfile: current.riskProfile,
      }),
    });
    if (monthlyGoalsResponse.ok) {
      const data = await monthlyGoalsResponse.json();
      const latest = useMemoryStore.getState();
      latest.setMonthlyGoals(data.goals || []);
      latest.setMonthlyGoalsIsNew(true);
    }
  }

  const date = new Date(`${today}T00:00:00`);
  const month = date.getUTCMonth();
  if (date.getUTCDate() === 1 && month % 3 === 0) {
    const current = useMemoryStore.getState();
    const quarterlyGoalsResponse = await fetch("/api/generate-quarterly-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyReports: current.monthlyReports.slice(-3),
        habitHistory: current.habitHistory.slice(-90),
        monthlyTrend: current.monthlyTrend,
        coachPersonality: current.coachPersonality,
        tradingMode: current.tradingMode,
      }),
    });
    if (quarterlyGoalsResponse.ok) {
      const data = await quarterlyGoalsResponse.json();
      const latest = useMemoryStore.getState();
      latest.setQuarterlyGoals(data.goals || []);
      latest.setQuarterlyGoalsIsNew(true);
    }
  }

  if (date.getUTCDate() === 1 && month === 0) {
    const current = useMemoryStore.getState();
    const yearlyGoalsResponse = await fetch("/api/generate-yearly-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyReports: current.monthlyReports.slice(-12),
        habitHistory: current.habitHistory,
        monthlyTrend: current.monthlyTrend,
        coachPersonality: current.coachPersonality,
        tradingMode: current.tradingMode,
        riskProfile: current.riskProfile,
      }),
    });
    if (yearlyGoalsResponse.ok) {
      const data = await yearlyGoalsResponse.json();
      const latest = useMemoryStore.getState();
      latest.setYearlyGoals(data.goals || []);
      latest.setYearlyGoalsIsNew(true);
    }
  }

  if (date.getUTCDate() === 1 && month % 3 === 0) {
    const current = useMemoryStore.getState();
    const payload = {
      monthlyReports: current.monthlyReports,
      quarterlyGoals: current.quarterlyGoals,
      yearlyGoals: current.yearlyGoals,
      emotionTrend: current.emotionTrend,
      habitHistory: current.habitHistory,
      monthlyTrend: current.monthlyTrend,
      disciplineStreak: current.disciplineStreak,
      coachPersonality: current.coachPersonality,
      tradingMode: current.tradingMode,
      riskProfile: current.riskProfile,
    };
    const response = await fetch("/api/roadmap-6m", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      useMemoryStore.getState().updateLifeRoadmapSection("sixMonth", data.roadmap);
      useMemoryStore.getState().setLifeRoadmapIsNew(true);
    }
  }

  if (date.getUTCDate() === 1 && month === 0) {
    const current = useMemoryStore.getState();
    const payload = {
      monthlyReports: current.monthlyReports,
      quarterlyGoals: current.quarterlyGoals,
      yearlyGoals: current.yearlyGoals,
      emotionTrend: current.emotionTrend,
      habitHistory: current.habitHistory,
      monthlyTrend: current.monthlyTrend,
      disciplineStreak: current.disciplineStreak,
      coachPersonality: current.coachPersonality,
      tradingMode: current.tradingMode,
      riskProfile: current.riskProfile,
    };
    const yearlyResponse = await fetch("/api/roadmap-1y", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (yearlyResponse.ok) {
      const data = await yearlyResponse.json();
      useMemoryStore.getState().updateLifeRoadmapSection("oneYear", data.roadmap);
      useMemoryStore.getState().setLifeRoadmapIsNew(true);
    }

    if (date.getUTCFullYear() % 5 === 0) {
      const fiveYearResponse = await fetch("/api/roadmap-5y", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (fiveYearResponse.ok) {
        const data = await fiveYearResponse.json();
        useMemoryStore.getState().updateLifeRoadmapSection("fiveYear", data.roadmap);
        useMemoryStore.getState().setLifeRoadmapIsNew(true);
      }
    }

    const futureState = useMemoryStore.getState();
    const futurePayload = {
      lifeRoadmap: futureState.lifeRoadmap,
      adaptivePersonality: futureState.adaptivePersonality,
      emotionTrend: futureState.emotionTrend,
      monthlyTrend: futureState.monthlyTrend,
      disciplineStreak: futureState.disciplineStreak,
      habitHistory: futureState.habitHistory,
      monthlyGoals: futureState.monthlyGoals,
      quarterlyGoals: futureState.quarterlyGoals,
      yearlyGoals: futureState.yearlyGoals,
      tradingMode: futureState.tradingMode,
      riskProfile: futureState.riskProfile,
    };
    const oneYearResponse = await fetch("/api/future-self-1y", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(futurePayload) });
    if (oneYearResponse.ok) {
      const data = await oneYearResponse.json();
      useMemoryStore.getState().updateFutureSelfSection("oneYear", data.futureSelf);
      useMemoryStore.getState().setFutureSelfIsNew(true);
    }

    if (date.getUTCFullYear() % 5 === 0) {
      const response = await fetch("/api/future-self-5y", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(futurePayload) });
      if (response.ok) {
        const data = await response.json();
        useMemoryStore.getState().updateFutureSelfSection("fiveYear", data.futureSelf);
        useMemoryStore.getState().setFutureSelfIsNew(true);
      }
    }

    if (date.getUTCFullYear() % 10 === 0) {
      const response = await fetch("/api/future-self-10y", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(futurePayload) });
      if (response.ok) {
        const data = await response.json();
        useMemoryStore.getState().updateFutureSelfSection("tenYear", data.futureSelf);
        useMemoryStore.getState().setFutureSelfIsNew(true);
      }
    }
  }

  if (date.getUTCDate() === 1) {
    const current = useMemoryStore.getState();
    const context = {
      emotionTrend: current.emotionTrend,
      monthlyTrend: current.monthlyTrend,
      disciplineStreak: current.disciplineStreak,
      habitHistory: current.habitHistory,
      monthlyGoals: current.monthlyGoals,
      quarterlyGoals: current.quarterlyGoals,
      yearlyGoals: current.yearlyGoals,
      lifeRoadmap: current.lifeRoadmap,
      coachPersonality: current.coachPersonality,
    };
    const evolution = month % 3 === 0
      ? evolveQuarterlyPersonality(context)
      : evolveMonthlyPersonality(context);
    const entry = {
      date: today,
      personality: evolution.personality,
      reason: evolution.reason,
    };
    current.addPersonalityEvolutionEntry(entry);
    current.addPersonalityTrendEntry({
      month: today.slice(0, 7),
      dominantPersonality: evolution.personality,
      evolutionScore: evolution.evolutionScore,
    });
    current.setAdaptivePersonalityIsNew(true);

    current.setShadowMonthlyReport(generateShadowMonthlyReport(shadowContext));
    current.setShadowMonthlyReportIsNew(true);
    current.setLightMonthlyReport(generateLightMonthlyReport(lightContext));
    current.setLightMonthlyReportIsNew(true);
    current.setDualityMonthlyReport(generateDualityMonthlyReport(dualityContext));
    current.setDualityMonthlyReportIsNew(true);
    current.setIdentityFusionMonthlyReport(generateIdentityFusionMonthlyReport(fusionContext));
    current.setIdentityFusionMonthlyReportIsNew(true);
    current.setMetaCoachMonthlyReport(generateMetaCoachMonthlyReport(metaContext));
    current.setMetaCoachMonthlyReportIsNew(true);

    if (month === 0) {
      const yearlyEvolution = evolveYearlyPersonality(context);
      const latest = useMemoryStore.getState();
      latest.addPersonalityEvolutionEntry({
        date: today,
        personality: yearlyEvolution.personality,
        reason: yearlyEvolution.reason,
      });
      latest.addPersonalityTrendEntry({
        month: today.slice(0, 7),
        dominantPersonality: yearlyEvolution.personality,
        evolutionScore: yearlyEvolution.evolutionScore,
      });
    }
  }
}