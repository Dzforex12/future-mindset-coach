"use client";

import { buildAnalyticsSummary } from "@/app/state/analyticsDomain";
import { useMemoryStore } from "@/app/state/memoryStore";
import { AlignmentAnalyticsChart } from "@/components/AlignmentAnalyticsChart";
import { AnalyticsBarChart } from "@/components/AnalyticsBarChart";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { AnalyticsDonutChart } from "@/components/AnalyticsDonutChart";
import { DualityAnalyticsChart } from "@/components/DualityAnalyticsChart";
import { EmotionAnalyticsChart } from "@/components/EmotionAnalyticsChart";
import { FutureSelfAnalyticsChart } from "@/components/FutureSelfAnalyticsChart";
import { GoalAlignmentSection } from "@/components/analytics/GoalAlignmentSection";
import { OverviewSection } from "@/components/analytics/OverviewSection";
import { WeeklySummarySection } from "@/components/analytics/WeeklySummarySection";
import { GoalProgressChart } from "@/components/GoalProgressChart";
import { HabitRecommendationImpactChart } from "@/components/HabitRecommendationImpactChart";
import { IdentityFusionAnalyticsChart } from "@/components/IdentityFusionAnalyticsChart";
import { LightAnalyticsChart } from "@/components/LightAnalyticsChart";
import { MetaCoachAnalyticsChart } from "@/components/MetaCoachAnalyticsChart";
import { MonthlyPerformanceChart } from "@/components/MonthlyPerformanceChart";
import { PersonalityAnalyticsChart } from "@/components/PersonalityAnalyticsChart";
import { RoadmapAnalyticsChart } from "@/components/RoadmapAnalyticsChart";
import { ShadowAnalyticsChart } from "@/components/ShadowAnalyticsChart";

export default function AnalyticsPage() {
  const {
    dailyHabitsCompleted,
    disciplineStreak,
    habitHistory,
    dynamicHabits,
    monthlyTrend,
    monthlyGoals,
    quarterlyGoals,
    yearlyGoals,
    emotionHistory,
    emotionTrend,
    currentEmotion,
    tradingMode,
    riskProfile,
    alignment,
    shadowSelf,
    lightSelf,
    duality,
    identityFusion,
    metaCoach,
    adaptivePersonality,
    futureSelf,
  } = useMemoryStore();
  const { weeklyHistory, consistencyScore, goalAlignmentScore, activeGoalCount } = buildAnalyticsSummary(
    habitHistory,
    dailyHabitsCompleted,
    monthlyGoals,
    quarterlyGoals,
    yearlyGoals,
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition duration-300 hover:border-violet-500/20 hover:shadow-violet-900/10 animate-[fadeIn_0.3s_ease-out]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-violet-300">Performance</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Analytics</h1>
        <p className="mt-2 text-sm text-slate-300">
          A living view of consistency, goal alignment, and the patterns shaping your mindset.
        </p>
      </header>

      <OverviewSection
        consistencyScore={consistencyScore}
        goalAlignmentScore={goalAlignmentScore}
        activeGoalCount={activeGoalCount}
      />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <WeeklySummarySection weeklyHistory={weeklyHistory} />
        <GoalAlignmentSection goals={[...monthlyGoals, ...quarterlyGoals, ...yearlyGoals]} />
      </div>

      <AnalyticsChart habitHistory={weeklyHistory} disciplineStreak={disciplineStreak} />
      <AnalyticsBarChart habitHistory={weeklyHistory} disciplineStreak={disciplineStreak} />
      <AnalyticsDonutChart habitHistory={weeklyHistory} disciplineStreak={disciplineStreak} />
      <HabitRecommendationImpactChart
        habitHistory={habitHistory}
        dynamicHabits={dynamicHabits}
      />
      <MonthlyPerformanceChart
        title="30-Day Habit Trend"
        kind="habits"
        habitHistory={habitHistory.slice(-30)}
      />
      <MonthlyPerformanceChart
        title="Monthly Consistency Chart"
        kind="consistency"
        monthlyTrend={monthlyTrend}
      />
      <GoalProgressChart title="Monthly Goal Completion" goals={monthlyGoals} />
      <GoalProgressChart title="Quarterly Goal Progress" goals={quarterlyGoals} />
      <GoalProgressChart title="Yearly Goal Progress" goals={yearlyGoals} />
      <EmotionAnalyticsChart
        title="Daily Emotion Chart"
        kind="daily"
        emotionHistory={emotionHistory}
      />
      <EmotionAnalyticsChart
        title="Weekly Stability Chart"
        kind="stability"
        emotionTrend={emotionTrend}
      />
      <EmotionAnalyticsChart
        title="Emotion vs Habit Correlation"
        kind="habit-correlation"
        emotionHistory={emotionHistory}
        dailyHabitsCompleted={dailyHabitsCompleted}
      />
      <EmotionAnalyticsChart
        title={`Emotion vs ${tradingMode} Mode`}
        kind="trading-mode"
        emotionHistory={emotionHistory}
        tradingMode={tradingMode}
        dailyHabitsCompleted={currentEmotion ? dailyHabitsCompleted : []}
      />
      <MonthlyPerformanceChart
        title="Monthly Discipline Chart"
        kind="discipline"
        monthlyTrend={monthlyTrend}
      />
      <MonthlyPerformanceChart
        title="Monthly Trading Mindset Chart"
        kind="mindset"
        monthlyTrend={monthlyTrend}
      />
      <RoadmapAnalyticsChart
        title="Long-Term Discipline Trend"
        kind="discipline"
        monthlyTrend={monthlyTrend}
        quarterlyGoals={quarterlyGoals}
        yearlyGoals={yearlyGoals}
      />
      <PersonalityAnalyticsChart
        title="Personality Evolution Chart"
        kind="evolution"
        evolutionHistory={adaptivePersonality.evolutionHistory}
        currentPersonality={adaptivePersonality.current}
        disciplineStreak={disciplineStreak}
      />
      <FutureSelfAnalyticsChart title="Identity Evolution Chart" kind="identity" futureSelf={futureSelf} disciplineStreak={disciplineStreak} monthlyTrend={monthlyTrend} emotionTrend={emotionTrend} habitHistory={habitHistory} tradingMode={tradingMode} riskProfile={riskProfile} />
      <FutureSelfAnalyticsChart title="Discipline Identity Trajectory" kind="discipline" futureSelf={futureSelf} disciplineStreak={disciplineStreak} monthlyTrend={monthlyTrend} emotionTrend={emotionTrend} habitHistory={habitHistory} tradingMode={tradingMode} riskProfile={riskProfile} />
      <FutureSelfAnalyticsChart title="Emotional Identity Trajectory" kind="emotion" futureSelf={futureSelf} disciplineStreak={disciplineStreak} monthlyTrend={monthlyTrend} emotionTrend={emotionTrend} habitHistory={habitHistory} tradingMode={tradingMode} riskProfile={riskProfile} />
      <FutureSelfAnalyticsChart title="Lifestyle Identity Trajectory" kind="lifestyle" futureSelf={futureSelf} disciplineStreak={disciplineStreak} monthlyTrend={monthlyTrend} emotionTrend={emotionTrend} habitHistory={habitHistory} tradingMode={tradingMode} riskProfile={riskProfile} />
      <FutureSelfAnalyticsChart title="Trading Identity Trajectory" kind="trading" futureSelf={futureSelf} disciplineStreak={disciplineStreak} monthlyTrend={monthlyTrend} emotionTrend={emotionTrend} habitHistory={habitHistory} tradingMode={tradingMode} riskProfile={riskProfile} />
      <AlignmentAnalyticsChart title="Alignment Trend Chart" kind="trend" history={alignment.history} dailyScore={alignment.dailyScore} disciplineStreak={disciplineStreak} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <AlignmentAnalyticsChart title="Alignment vs Discipline" kind="discipline" history={alignment.history} dailyScore={alignment.dailyScore} disciplineStreak={disciplineStreak} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <AlignmentAnalyticsChart title="Alignment vs Emotion" kind="emotion" history={alignment.history} dailyScore={alignment.dailyScore} disciplineStreak={disciplineStreak} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <AlignmentAnalyticsChart title="Alignment vs Habits" kind="habits" history={alignment.history} dailyScore={alignment.dailyScore} disciplineStreak={disciplineStreak} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <AlignmentAnalyticsChart title="Alignment vs Trading Mindset" kind="trading" history={alignment.history} dailyScore={alignment.dailyScore} disciplineStreak={disciplineStreak} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <ShadowAnalyticsChart title="Shadow Activation Chart" kind="activation" history={shadowSelf.history} stabilityScore={shadowSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <ShadowAnalyticsChart title="Shadow vs Discipline" kind="discipline" history={shadowSelf.history} stabilityScore={shadowSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <ShadowAnalyticsChart title="Shadow vs Emotion" kind="emotion" history={shadowSelf.history} stabilityScore={shadowSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <ShadowAnalyticsChart title="Shadow vs Alignment" kind="alignment" history={shadowSelf.history} stabilityScore={shadowSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <ShadowAnalyticsChart title="Shadow vs Trading Mindset" kind="trading" history={shadowSelf.history} stabilityScore={shadowSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} habits={dailyHabitsCompleted} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <LightAnalyticsChart title="Light Activation Chart" kind="activation" history={lightSelf.history} stabilityScore={lightSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <LightAnalyticsChart title="Light vs Discipline" kind="discipline" history={lightSelf.history} stabilityScore={lightSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <LightAnalyticsChart title="Light vs Emotion" kind="emotion" history={lightSelf.history} stabilityScore={lightSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <LightAnalyticsChart title="Light vs Alignment" kind="alignment" history={lightSelf.history} stabilityScore={lightSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <LightAnalyticsChart title="Light vs Trading Mindset" kind="trading" history={lightSelf.history} stabilityScore={lightSelf.stabilityScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <DualityAnalyticsChart title="Duality Balance Chart" kind="balance" history={duality.history} balanceScore={duality.balanceScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <DualityAnalyticsChart title="Duality vs Discipline" kind="discipline" history={duality.history} balanceScore={duality.balanceScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <DualityAnalyticsChart title="Duality vs Emotion" kind="emotion" history={duality.history} balanceScore={duality.balanceScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <DualityAnalyticsChart title="Duality vs Alignment" kind="alignment" history={duality.history} balanceScore={duality.balanceScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <DualityAnalyticsChart title="Duality vs Trading Mindset" kind="trading" history={duality.history} balanceScore={duality.balanceScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <PersonalityAnalyticsChart
        title="Monthly Personality Trend Chart"
        kind="trend"
        trend={adaptivePersonality.trend}
        currentPersonality={adaptivePersonality.current}
        disciplineStreak={disciplineStreak}
      />
      <PersonalityAnalyticsChart
        title="Personality vs Emotion Chart"
        kind="emotion"
        emotionHistory={emotionHistory}
        currentEmotion={currentEmotion}
        currentPersonality={adaptivePersonality.current}
        disciplineStreak={disciplineStreak}
      />
      <PersonalityAnalyticsChart
        title="Personality vs Discipline Chart"
        kind="discipline"
        currentPersonality={adaptivePersonality.current}
        disciplineStreak={disciplineStreak}
      />
      <RoadmapAnalyticsChart
        title="Emotional Evolution"
        kind="emotion"
        emotionTrend={emotionTrend}
      />
      <RoadmapAnalyticsChart
        title="Habit Evolution"
        kind="habits"
        habitHistory={habitHistory}
      />
      <RoadmapAnalyticsChart
        title="Roadmap Progress"
        kind="progress"
        quarterlyGoals={quarterlyGoals}
        yearlyGoals={yearlyGoals}
      />
      <IdentityFusionAnalyticsChart title="Identity Fusion Trend Chart" kind="fusion" history={identityFusion.history} fusionScore={identityFusion.fusionScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <IdentityFusionAnalyticsChart title="Fusion vs Discipline" kind="discipline" history={identityFusion.history} fusionScore={identityFusion.fusionScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <IdentityFusionAnalyticsChart title="Fusion vs Emotion" kind="emotion" history={identityFusion.history} fusionScore={identityFusion.fusionScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <IdentityFusionAnalyticsChart title="Fusion vs Alignment" kind="alignment" history={identityFusion.history} fusionScore={identityFusion.fusionScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <IdentityFusionAnalyticsChart title="Fusion vs Trading Mindset" kind="trading" history={identityFusion.history} fusionScore={identityFusion.fusionScore} disciplineStreak={disciplineStreak} dailyScore={alignment.dailyScore} currentEmotion={currentEmotion} tradingMode={tradingMode} />
      <MetaCoachAnalyticsChart title="Meta-Coach Evaluation Trend" kind="trend" history={metaCoach.history} evaluationScore={metaCoach.evaluationScore} dailyScore={alignment.dailyScore} dualityScore={duality.balanceScore} fusionScore={identityFusion.fusionScore} currentEmotion={currentEmotion} />
      <MetaCoachAnalyticsChart title="Coach Behavior vs Alignment" kind="alignment" history={metaCoach.history} evaluationScore={metaCoach.evaluationScore} dailyScore={alignment.dailyScore} dualityScore={duality.balanceScore} fusionScore={identityFusion.fusionScore} currentEmotion={currentEmotion} />
      <MetaCoachAnalyticsChart title="Coach Behavior vs Duality" kind="duality" history={metaCoach.history} evaluationScore={metaCoach.evaluationScore} dailyScore={alignment.dailyScore} dualityScore={duality.balanceScore} fusionScore={identityFusion.fusionScore} currentEmotion={currentEmotion} />
      <MetaCoachAnalyticsChart title="Coach Behavior vs Identity Fusion" kind="fusion" history={metaCoach.history} evaluationScore={metaCoach.evaluationScore} dailyScore={alignment.dailyScore} dualityScore={duality.balanceScore} fusionScore={identityFusion.fusionScore} currentEmotion={currentEmotion} />
      <MetaCoachAnalyticsChart title="Coach Behavior vs Emotion" kind="emotion" history={metaCoach.history} evaluationScore={metaCoach.evaluationScore} dailyScore={alignment.dailyScore} dualityScore={duality.balanceScore} fusionScore={identityFusion.fusionScore} currentEmotion={currentEmotion} />
    </div>
  );
}
