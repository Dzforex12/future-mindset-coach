import { create } from "zustand";
import { persist } from "zustand/middleware";

type TradingMode = "Forex" | "Crypto" | "Stocks";
type RiskProfile = "Conservative" | "Moderate" | "Aggressive";
type CoachPersonality = "Soft" | "Neutral" | "Aggressive";
type Theme = "dark" | "ultra-dark";

export type HabitHistoryEntry = {
  date: string;
  habits: (number | string)[];
};

export type DynamicHabit = {
  id: string;
  title: string;
  description: string;
};

export type WeeklyReport = {
  date: string;
  report: string;
};

export type MonthlyReport = {
  month: string;
  summary: string;
  consistencyScore: number;
  disciplineScore: number;
  tradingMindsetScore: number;
  bestDay: string;
  worstDay: string;
  habitsCompleted: number;
  streakHigh: number;
  streakLow: number;
};

export type MonthlyTrend = {
  month: string;
  consistencyScore: number;
  disciplineScore: number;
  tradingMindsetScore: number;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  progress: number;
};

export type MonthlyGoal = Goal & { month: string };
export type QuarterlyGoal = Goal & { quarter: string };
export type YearlyGoal = Goal & { year: string };

export type EmotionHistoryEntry = {
  date: string;
  emotion: string;
  intensity: number;
};

export type EmotionTrendEntry = {
  week: string;
  dominantEmotion: string;
  stabilityScore: number;
};

export type LifeRoadmap = {
  sixMonth: {
    summary: string;
    milestones: string[];
    focusAreas: string[];
    disciplineTargets: string[];
    emotionalTargets: string[];
    tradingMindsetTargets: string[];
  };
  oneYear: {
    summary: string;
    milestones: string[];
    identityShift: string[];
    disciplineEvolution: string[];
    emotionalEvolution: string[];
    tradingPsychologyEvolution: string[];
  };
  fiveYear: {
    summary: string;
    milestones: string[];
    lifestyleVision: string[];
    disciplineIdentity: string[];
    emotionalIdentity: string[];
    tradingIdentity: string[];
  };
};

export type PersonalityEvolutionEntry = {
  date: string;
  personality: string;
  reason: string;
};

export type PersonalityTrendEntry = {
  month: string;
  dominantPersonality: string;
  evolutionScore: number;
};

export type AdaptivePersonality = {
  current: string;
  evolutionHistory: PersonalityEvolutionEntry[];
  trend: PersonalityTrendEntry[];
};

export type FutureSelfSection = {
  identity: string;
  disciplineIdentity: string[];
  emotionalIdentity: string[];
  lifestyleIdentity: string[];
  tradingIdentity: string[];
  milestones: string[];
  challenges: string[];
  opportunities: string[];
};

export type FutureSelf = {
  oneYear: FutureSelfSection;
  fiveYear: FutureSelfSection;
  tenYear: FutureSelfSection;
};

export type AlignmentHistoryEntry = { date: string; score: number; reasons: string[] };
export type AlignmentState = {
  dailyScore: number;
  weeklyScore: number;
  misalignmentReasons: string[];
  weeklyReport: string;
  history: AlignmentHistoryEntry[];
  weeklyReportIsNew: boolean;
};

export type ShadowHistoryEntry = {
  date: string;
  triggers: string[];
  patterns: string[];
  weaknesses: string[];
  strengths: string[];
  stabilityScore: number;
};

export type ShadowSelf = {
  triggers: string[];
  patterns: string[];
  weaknesses: string[];
  strengths: string[];
  stabilityScore: number;
  history: ShadowHistoryEntry[];
  monthlyReport: string;
  monthlyReportIsNew: boolean;
};

export type LightHistoryEntry = {
  date: string;
  triggers: string[];
  patterns: string[];
  strengths: string[];
  identityTraits: string[];
  stabilityScore: number;
};

export type LightSelf = {
  triggers: string[];
  patterns: string[];
  strengths: string[];
  identityTraits: string[];
  stabilityScore: number;
  history: LightHistoryEntry[];
  monthlyReport: string;
  monthlyReportIsNew: boolean;
};

export type DualityHistoryEntry = { date: string; balanceScore: number; dominantSide: string; conflictPoints: string[]; harmonyPoints: string[] };
export type Duality = { balanceScore: number; dominantSide: string; conflictPoints: string[]; harmonyPoints: string[]; history: DualityHistoryEntry[]; monthlyReport: string; monthlyReportIsNew: boolean };

export type IdentityFusionHistoryEntry = { date: string; unifiedIdentity: string; fusedTraits: string[]; fusedStrengths: string[]; fusedWeaknesses: string[]; fusionScore: number; conflictAreas: string[]; harmonyAreas: string[] };
export type IdentityFusion = { unifiedIdentity: string; fusedTraits: string[]; fusedStrengths: string[]; fusedWeaknesses: string[]; fusionScore: number; conflictAreas: string[]; harmonyAreas: string[]; history: IdentityFusionHistoryEntry[]; monthlyReport: string; monthlyReportIsNew: boolean };

export type MetaCoachHistoryEntry = { date: string; evaluationScore: number; improvementAreas: string[]; strengths: string[]; behaviorAdjustments: string[] };
export type MetaCoach = { evaluationScore: number; improvementAreas: string[]; strengths: string[]; behaviorAdjustments: string[]; history: MetaCoachHistoryEntry[]; monthlyReport: string; monthlyReportIsNew: boolean };

type MemoryStore = {
  displayName: string;
  mainLifeGoal: string;
  dailyFocus: string;
  preferredTradingRiskLimit: string;
  dailyTradingLimit: string;
  tradingMode: TradingMode;
  riskProfile: RiskProfile;
  coachPersonality: CoachPersonality;
  theme: Theme;
  dailyReminder: boolean;
  dailyHabitsCompleted: (number | string)[];
  disciplineStreak: number;
  habitHistory: HabitHistoryEntry[];
  weeklyReports: WeeklyReport[];
  recommendedHabits: DynamicHabit[];
  recommendedHabitsIsNew: boolean;
  dynamicHabits: DynamicHabit[];
  monthlyReports: MonthlyReport[];
  monthlyTrend: MonthlyTrend[];
  monthlyReportIsNew: boolean;
  monthlyGoals: MonthlyGoal[];
  quarterlyGoals: QuarterlyGoal[];
  yearlyGoals: YearlyGoal[];
  monthlyGoalsIsNew: boolean;
  quarterlyGoalsIsNew: boolean;
  yearlyGoalsIsNew: boolean;
  currentEmotion: string | null;
  emotionHistory: EmotionHistoryEntry[];
  emotionTrend: EmotionTrendEntry[];
  emotionTrendIsNew: boolean;
  lifeRoadmap: LifeRoadmap;
  lifeRoadmapIsNew: boolean;
  adaptivePersonality: AdaptivePersonality;
  adaptivePersonalityIsNew: boolean;
  futureSelf: FutureSelf;
  futureSelfIsNew: boolean;
  alignment: AlignmentState;
  shadowSelf: ShadowSelf;
  lightSelf: LightSelf;
  duality: Duality;
  identityFusion: IdentityFusion;
  metaCoach: MetaCoach;
  dailySummary: string;
  weeklyReportIsNew: boolean;
  lastActiveDate: string | null;
  setTradingMode: (tradingMode: TradingMode) => void;
  setRiskProfile: (riskProfile: RiskProfile) => void;
  setCoachPersonality: (coachPersonality: CoachPersonality) => void;
  setTheme: (theme: Theme) => void;
  setDisplayName: (displayName: string) => void;
  setMainLifeGoal: (mainLifeGoal: string) => void;
  setDailyFocus: (dailyFocus: string) => void;
  setPreferredTradingRiskLimit: (preferredTradingRiskLimit: string) => void;
  setDailyTradingLimit: (dailyTradingLimit: string) => void;
  setDailyReminder: (dailyReminder: boolean) => void;
  setDailyHabitsCompleted: (dailyHabitsCompleted: (number | string)[]) => void;
  setDisciplineStreak: (disciplineStreak: number) => void;
  setHabitHistory: (habitHistory: HabitHistoryEntry[]) => void;
  setWeeklyReports: (weeklyReports: WeeklyReport[]) => void;
  setDailySummary: (dailySummary: string) => void;
  setWeeklyReportIsNew: (weeklyReportIsNew: boolean) => void;
  setLastActiveDate: (lastActiveDate: string) => void;
  setRecommendedHabits: (recommendedHabits: DynamicHabit[]) => void;
  addRecommendedHabit: (habit: DynamicHabit) => void;
  removeRecommendedHabit: (habitId: string) => void;
  setRecommendedHabitsIsNew: (recommendedHabitsIsNew: boolean) => void;
  setDynamicHabits: (dynamicHabits: DynamicHabit[]) => void;
  addDynamicHabit: (habit: DynamicHabit) => void;
  addMonthlyReport: (report: MonthlyReport) => void;
  addMonthlyTrend: (trend: MonthlyTrend) => void;
  setMonthlyReportIsNew: (monthlyReportIsNew: boolean) => void;
  setMonthlyGoals: (goals: MonthlyGoal[]) => void;
  setQuarterlyGoals: (goals: QuarterlyGoal[]) => void;
  setYearlyGoals: (goals: YearlyGoal[]) => void;
  updateGoalProgress: (scope: "monthly" | "quarterly" | "yearly", id: string, progress: number) => void;
  completeGoal: (scope: "monthly" | "quarterly" | "yearly", id: string) => void;
  setMonthlyGoalsIsNew: (value: boolean) => void;
  setQuarterlyGoalsIsNew: (value: boolean) => void;
  setYearlyGoalsIsNew: (value: boolean) => void;
  setCurrentEmotion: (currentEmotion: string | null) => void;
  addEmotionHistoryEntry: (entry: EmotionHistoryEntry) => void;
  addEmotionTrendEntry: (entry: EmotionTrendEntry) => void;
  setEmotionTrendIsNew: (value: boolean) => void;
  setLifeRoadmap: (lifeRoadmap: LifeRoadmap) => void;
  updateLifeRoadmapSection: <K extends keyof LifeRoadmap>(section: K, value: LifeRoadmap[K]) => void;
  setLifeRoadmapIsNew: (value: boolean) => void;
  setAdaptivePersonality: (adaptivePersonality: AdaptivePersonality) => void;
  addPersonalityEvolutionEntry: (entry: PersonalityEvolutionEntry) => void;
  addPersonalityTrendEntry: (entry: PersonalityTrendEntry) => void;
  setAdaptivePersonalityIsNew: (value: boolean) => void;
  setFutureSelf: (futureSelf: FutureSelf) => void;
  updateFutureSelfSection: <K extends keyof FutureSelf>(section: K, value: FutureSelf[K]) => void;
  setFutureSelfIsNew: (value: boolean) => void;
  setDailyAlignmentScore: (score: number) => void;
  addAlignmentHistoryEntry: (entry: AlignmentHistoryEntry) => void;
  setWeeklyAlignmentScore: (score: number) => void;
  setMisalignmentReasons: (reasons: string[]) => void;
  setWeeklyAlignmentReport: (report: string) => void;
  setAlignmentWeeklyReportIsNew: (value: boolean) => void;
  setShadowSelf: (shadowSelf: ShadowSelf) => void;
  addShadowHistoryEntry: (entry: ShadowHistoryEntry) => void;
  setShadowMonthlyReport: (report: string) => void;
  setShadowMonthlyReportIsNew: (value: boolean) => void;
  setLightSelf: (lightSelf: LightSelf) => void;
  addLightHistoryEntry: (entry: LightHistoryEntry) => void;
  setLightMonthlyReport: (report: string) => void;
  setLightMonthlyReportIsNew: (value: boolean) => void;
  setDuality: (duality: Duality) => void;
  addDualityHistoryEntry: (entry: DualityHistoryEntry) => void;
  setDualityMonthlyReport: (report: string) => void;
  setDualityMonthlyReportIsNew: (value: boolean) => void;
  setIdentityFusion: (identityFusion: IdentityFusion) => void;
  addIdentityFusionHistoryEntry: (entry: IdentityFusionHistoryEntry) => void;
  setIdentityFusionMonthlyReport: (report: string) => void;
  setIdentityFusionMonthlyReportIsNew: (value: boolean) => void;
  setMetaCoach: (metaCoach: MetaCoach) => void;
  addMetaCoachHistoryEntry: (entry: MetaCoachHistoryEntry) => void;
  setMetaCoachMonthlyReport: (report: string) => void;
  setMetaCoachMonthlyReportIsNew: (value: boolean) => void;
};

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set) => ({
      displayName: "Edonis",
      mainLifeGoal: "",
      dailyFocus: "",
      preferredTradingRiskLimit: "1%",
      dailyTradingLimit: "",
      tradingMode: "Forex",
      riskProfile: "Moderate",
      coachPersonality: "Neutral",
      theme: "dark",
      dailyReminder: true,
      dailyHabitsCompleted: [],
      disciplineStreak: 0,
      habitHistory: [],
      weeklyReports: [],
      recommendedHabits: [],
      recommendedHabitsIsNew: false,
      dynamicHabits: [],
      monthlyReports: [],
      monthlyTrend: [],
      monthlyReportIsNew: false,
      monthlyGoals: [],
      quarterlyGoals: [],
      yearlyGoals: [],
      monthlyGoalsIsNew: false,
      quarterlyGoalsIsNew: false,
      yearlyGoalsIsNew: false,
      currentEmotion: null,
      emotionHistory: [],
      emotionTrend: [],
      emotionTrendIsNew: false,
      lifeRoadmap: {
        sixMonth: { summary: "", milestones: [], focusAreas: [], disciplineTargets: [], emotionalTargets: [], tradingMindsetTargets: [] },
        oneYear: { summary: "", milestones: [], identityShift: [], disciplineEvolution: [], emotionalEvolution: [], tradingPsychologyEvolution: [] },
        fiveYear: { summary: "", milestones: [], lifestyleVision: [], disciplineIdentity: [], emotionalIdentity: [], tradingIdentity: [] },
      },
      lifeRoadmapIsNew: false,
      adaptivePersonality: { current: "Neutral", evolutionHistory: [], trend: [] },
      adaptivePersonalityIsNew: false,
      futureSelf: {
        oneYear: { identity: "", disciplineIdentity: [], emotionalIdentity: [], lifestyleIdentity: [], tradingIdentity: [], milestones: [], challenges: [], opportunities: [] },
        fiveYear: { identity: "", disciplineIdentity: [], emotionalIdentity: [], lifestyleIdentity: [], tradingIdentity: [], milestones: [], challenges: [], opportunities: [] },
        tenYear: { identity: "", disciplineIdentity: [], emotionalIdentity: [], lifestyleIdentity: [], tradingIdentity: [], milestones: [], challenges: [], opportunities: [] },
      },
      futureSelfIsNew: false,
      alignment: { dailyScore: 0, weeklyScore: 0, misalignmentReasons: [], weeklyReport: "", history: [], weeklyReportIsNew: false },
      shadowSelf: { triggers: [], patterns: [], weaknesses: [], strengths: [], stabilityScore: 100, history: [], monthlyReport: "", monthlyReportIsNew: false },
      lightSelf: { triggers: [], patterns: [], strengths: [], identityTraits: [], stabilityScore: 0, history: [], monthlyReport: "", monthlyReportIsNew: false },
      duality: { balanceScore: 0, dominantSide: "shadow", conflictPoints: [], harmonyPoints: [], history: [], monthlyReport: "", monthlyReportIsNew: false },
      identityFusion: { unifiedIdentity: "", fusedTraits: [], fusedStrengths: [], fusedWeaknesses: [], fusionScore: 0, conflictAreas: [], harmonyAreas: [], history: [], monthlyReport: "", monthlyReportIsNew: false },
      metaCoach: { evaluationScore: 0, improvementAreas: [], strengths: [], behaviorAdjustments: [], history: [], monthlyReport: "", monthlyReportIsNew: false },
      dailySummary: "",
      weeklyReportIsNew: false,
      lastActiveDate: null,
      setTradingMode: (tradingMode) => set({ tradingMode }),
      setRiskProfile: (riskProfile) => set({ riskProfile }),
      setCoachPersonality: (coachPersonality) => set({ coachPersonality }),
      setTheme: (theme) => set({ theme }),
      setDisplayName: (displayName) => set({ displayName }),
      setMainLifeGoal: (mainLifeGoal) => set({ mainLifeGoal }),
      setDailyFocus: (dailyFocus) => set({ dailyFocus }),
      setPreferredTradingRiskLimit: (preferredTradingRiskLimit) => set({ preferredTradingRiskLimit }),
      setDailyTradingLimit: (dailyTradingLimit) => set({ dailyTradingLimit }),
      setDailyReminder: (dailyReminder) => set({ dailyReminder }),
      setDailyHabitsCompleted: (dailyHabitsCompleted) => set({ dailyHabitsCompleted }),
      setDisciplineStreak: (disciplineStreak) => set({ disciplineStreak }),
      setHabitHistory: (habitHistory) => set({ habitHistory }),
      setWeeklyReports: (weeklyReports) => set({ weeklyReports }),
      setDailySummary: (dailySummary) => set({ dailySummary }),
      setWeeklyReportIsNew: (weeklyReportIsNew) => set({ weeklyReportIsNew }),
      setLastActiveDate: (lastActiveDate) => set({ lastActiveDate }),
      setRecommendedHabits: (recommendedHabits) => set({ recommendedHabits }),
      addRecommendedHabit: (habit) => set((state) => ({
        recommendedHabits: [...state.recommendedHabits, habit],
      })),
      removeRecommendedHabit: (habitId) => set((state) => ({
        recommendedHabits: state.recommendedHabits.filter((habit) => habit.id !== habitId),
      })),
      setRecommendedHabitsIsNew: (recommendedHabitsIsNew) => set({ recommendedHabitsIsNew }),
      setDynamicHabits: (dynamicHabits) => set({ dynamicHabits }),
      addDynamicHabit: (habit) => set((state) => ({
        dynamicHabits: state.dynamicHabits.some((item) => item.id === habit.id)
          ? state.dynamicHabits
          : [...state.dynamicHabits, habit],
      })),
      addMonthlyReport: (report) => set((state) => ({
        monthlyReports: [
          ...state.monthlyReports.filter((item) => item.month !== report.month),
          report,
        ],
      })),
      addMonthlyTrend: (trend) => set((state) => ({
        monthlyTrend: [
          ...state.monthlyTrend.filter((item) => item.month !== trend.month),
          trend,
        ],
      })),
      setMonthlyReportIsNew: (monthlyReportIsNew) => set({ monthlyReportIsNew }),
      setMonthlyGoals: (monthlyGoals) => set({ monthlyGoals }),
      setQuarterlyGoals: (quarterlyGoals) => set({ quarterlyGoals }),
      setYearlyGoals: (yearlyGoals) => set({ yearlyGoals }),
      updateGoalProgress: (scope, id, progress) => set((state) => {
        const bounded = Math.max(0, Math.min(100, progress));
        const update = <T extends Goal>(goals: T[]) => goals.map((goal) =>
          goal.id === id ? { ...goal, progress: bounded, completed: bounded === 100 } : goal,
        );
        if (scope === "monthly") return { monthlyGoals: update(state.monthlyGoals) };
        if (scope === "quarterly") return { quarterlyGoals: update(state.quarterlyGoals) };
        return { yearlyGoals: update(state.yearlyGoals) };
      }),
      completeGoal: (scope, id) => set((state) => {
        const update = <T extends Goal>(goals: T[]) => goals.map((goal) =>
          goal.id === id ? { ...goal, progress: 100, completed: true } : goal,
        );
        if (scope === "monthly") return { monthlyGoals: update(state.monthlyGoals) };
        if (scope === "quarterly") return { quarterlyGoals: update(state.quarterlyGoals) };
        return { yearlyGoals: update(state.yearlyGoals) };
      }),
      setMonthlyGoalsIsNew: (monthlyGoalsIsNew) => set({ monthlyGoalsIsNew }),
      setQuarterlyGoalsIsNew: (quarterlyGoalsIsNew) => set({ quarterlyGoalsIsNew }),
      setYearlyGoalsIsNew: (yearlyGoalsIsNew) => set({ yearlyGoalsIsNew }),
      setCurrentEmotion: (currentEmotion) => set({ currentEmotion }),
      addEmotionHistoryEntry: (entry) => set((state) => ({
        emotionHistory: [...state.emotionHistory, entry],
      })),
      addEmotionTrendEntry: (entry) => set((state) => ({
        emotionTrend: [...state.emotionTrend.filter((item) => item.week !== entry.week), entry],
      })),
      setEmotionTrendIsNew: (emotionTrendIsNew) => set({ emotionTrendIsNew }),
      setLifeRoadmap: (lifeRoadmap) => set({ lifeRoadmap }),
      updateLifeRoadmapSection: (section, value) => set((state) => ({
        lifeRoadmap: { ...state.lifeRoadmap, [section]: value },
      })),
      setLifeRoadmapIsNew: (lifeRoadmapIsNew) => set({ lifeRoadmapIsNew }),
      setAdaptivePersonality: (adaptivePersonality) => set({ adaptivePersonality }),
      addPersonalityEvolutionEntry: (entry) => set((state) => ({
        adaptivePersonality: {
          ...state.adaptivePersonality,
          current: entry.personality,
          evolutionHistory: [...state.adaptivePersonality.evolutionHistory, entry],
        },
      })),
      addPersonalityTrendEntry: (entry) => set((state) => ({
        adaptivePersonality: {
          ...state.adaptivePersonality,
          trend: [...state.adaptivePersonality.trend.filter((item) => item.month !== entry.month), entry],
        },
      })),
      setAdaptivePersonalityIsNew: (adaptivePersonalityIsNew) => set({ adaptivePersonalityIsNew }),
      setFutureSelf: (futureSelf) => set({ futureSelf }),
      updateFutureSelfSection: (section, value) => set((state) => ({ futureSelf: { ...state.futureSelf, [section]: value } })),
      setFutureSelfIsNew: (futureSelfIsNew) => set({ futureSelfIsNew }),
      setDailyAlignmentScore: (dailyScore) => set((state) => ({ alignment: { ...state.alignment, dailyScore } })),
      addAlignmentHistoryEntry: (entry) => set((state) => ({ alignment: { ...state.alignment, history: [...state.alignment.history, entry] } })),
      setWeeklyAlignmentScore: (weeklyScore) => set((state) => ({ alignment: { ...state.alignment, weeklyScore } })),
      setMisalignmentReasons: (misalignmentReasons) => set((state) => ({ alignment: { ...state.alignment, misalignmentReasons } })),
      setWeeklyAlignmentReport: (weeklyReport) => set((state) => ({ alignment: { ...state.alignment, weeklyReport } })),
      setAlignmentWeeklyReportIsNew: (weeklyReportIsNew) => set((state) => ({ alignment: { ...state.alignment, weeklyReportIsNew } })),
      setShadowSelf: (shadowSelf) => set({ shadowSelf }),
      addShadowHistoryEntry: (entry) => set((state) => ({ shadowSelf: { ...state.shadowSelf, ...entry, history: [...state.shadowSelf.history, entry] } })),
      setShadowMonthlyReport: (monthlyReport) => set((state) => ({ shadowSelf: { ...state.shadowSelf, monthlyReport } })),
      setShadowMonthlyReportIsNew: (monthlyReportIsNew) => set((state) => ({ shadowSelf: { ...state.shadowSelf, monthlyReportIsNew } })),
      setLightSelf: (lightSelf) => set({ lightSelf }),
      addLightHistoryEntry: (entry) => set((state) => ({ lightSelf: { ...state.lightSelf, ...entry, history: [...state.lightSelf.history, entry] } })),
      setLightMonthlyReport: (monthlyReport) => set((state) => ({ lightSelf: { ...state.lightSelf, monthlyReport } })),
      setLightMonthlyReportIsNew: (monthlyReportIsNew) => set((state) => ({ lightSelf: { ...state.lightSelf, monthlyReportIsNew } })),
      setDuality: (duality) => set({ duality }),
      addDualityHistoryEntry: (entry) => set((state) => ({ duality: { ...state.duality, ...entry, history: [...state.duality.history, entry] } })),
      setDualityMonthlyReport: (monthlyReport) => set((state) => ({ duality: { ...state.duality, monthlyReport } })),
      setDualityMonthlyReportIsNew: (monthlyReportIsNew) => set((state) => ({ duality: { ...state.duality, monthlyReportIsNew } })),
      setIdentityFusion: (identityFusion) => set({ identityFusion }),
      addIdentityFusionHistoryEntry: (entry) => set((state) => ({ identityFusion: { ...state.identityFusion, ...entry, history: [...state.identityFusion.history, entry] } })),
      setIdentityFusionMonthlyReport: (monthlyReport) => set((state) => ({ identityFusion: { ...state.identityFusion, monthlyReport } })),
      setIdentityFusionMonthlyReportIsNew: (monthlyReportIsNew) => set((state) => ({ identityFusion: { ...state.identityFusion, monthlyReportIsNew } })),
      setMetaCoach: (metaCoach) => set({ metaCoach }),
      addMetaCoachHistoryEntry: (entry) => set((state) => ({ metaCoach: { ...state.metaCoach, ...entry, history: [...state.metaCoach.history, entry] } })),
      setMetaCoachMonthlyReport: (monthlyReport) => set((state) => ({ metaCoach: { ...state.metaCoach, monthlyReport } })),
      setMetaCoachMonthlyReportIsNew: (monthlyReportIsNew) => set((state) => ({ metaCoach: { ...state.metaCoach, monthlyReportIsNew } })),
    }),
    {
      name: "future-mindset-memory",
      partialize: (state) => ({
        displayName: state.displayName,
        mainLifeGoal: state.mainLifeGoal,
        dailyFocus: state.dailyFocus,
        preferredTradingRiskLimit: state.preferredTradingRiskLimit,
        dailyTradingLimit: state.dailyTradingLimit,
        tradingMode: state.tradingMode,
        riskProfile: state.riskProfile,
        coachPersonality: state.coachPersonality,
        theme: state.theme,
        dailyReminder: state.dailyReminder,
        dailyHabitsCompleted: state.dailyHabitsCompleted,
        disciplineStreak: state.disciplineStreak,
        habitHistory: state.habitHistory,
        weeklyReports: state.weeklyReports,
        dailySummary: state.dailySummary,
        weeklyReportIsNew: state.weeklyReportIsNew,
        recommendedHabits: state.recommendedHabits,
        recommendedHabitsIsNew: state.recommendedHabitsIsNew,
        dynamicHabits: state.dynamicHabits,
        monthlyReports: state.monthlyReports,
        monthlyTrend: state.monthlyTrend,
        monthlyReportIsNew: state.monthlyReportIsNew,
        monthlyGoals: state.monthlyGoals,
        quarterlyGoals: state.quarterlyGoals,
        yearlyGoals: state.yearlyGoals,
        monthlyGoalsIsNew: state.monthlyGoalsIsNew,
        quarterlyGoalsIsNew: state.quarterlyGoalsIsNew,
        yearlyGoalsIsNew: state.yearlyGoalsIsNew,
        currentEmotion: state.currentEmotion,
        emotionHistory: state.emotionHistory,
        emotionTrend: state.emotionTrend,
        emotionTrendIsNew: state.emotionTrendIsNew,
        lifeRoadmap: state.lifeRoadmap,
        lifeRoadmapIsNew: state.lifeRoadmapIsNew,
        adaptivePersonality: state.adaptivePersonality,
        adaptivePersonalityIsNew: state.adaptivePersonalityIsNew,
        futureSelf: state.futureSelf,
        futureSelfIsNew: state.futureSelfIsNew,
        alignment: state.alignment,
        shadowSelf: state.shadowSelf,
        lightSelf: state.lightSelf,
        duality: state.duality,
        identityFusion: state.identityFusion,
        metaCoach: state.metaCoach,
        lastActiveDate: state.lastActiveDate,
      }),
    },
  ),
);
