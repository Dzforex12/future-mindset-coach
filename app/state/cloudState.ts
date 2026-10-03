import type { BusinessData } from "./businessEngine";
import type { ChatMessage } from "./chatDomain";
import type { FinanceState } from "./financeEngine";
import type { GoalRecord } from "./goalEngine";
import type { HabitRecord, StreakState } from "./habitEngine";
import type { MemoryStoreData } from "./memoryStore";
import type { Project } from "./projectsEngine";
import type {
    ChecklistItem,
    DailyCheckIn,
    TradingJournalEntry,
    TradingRule,
} from "./tradingEngine";

type ProfileKeys =
    | "displayName"
    | "mainLifeGoal"
    | "dailyFocus"
    | "preferredTradingRiskLimit"
    | "dailyTradingLimit"
    | "tradingMode"
    | "riskProfile"
    | "coachPersonality"
    | "theme"
    | "dailyReminder";

type GoalMemoryKeys =
    | "monthlyGoals"
    | "quarterlyGoals"
    | "yearlyGoals"
    | "monthlyReports"
    | "monthlyTrend"
    | "monthlyReportIsNew"
    | "monthlyGoalsIsNew"
    | "quarterlyGoalsIsNew"
    | "yearlyGoalsIsNew";

type HabitMemoryKeys =
    | "dailyHabitsCompleted"
    | "disciplineStreak"
    | "habitHistory"
    | "recommendedHabits"
    | "recommendedHabitsIsNew"
    | "dynamicHabits";

export type CloudAppState = {
    schemaVersion: 1;
    profile: Pick<MemoryStoreData, ProfileKeys>;
    goals: {
        records: GoalRecord[];
        memory: Pick<MemoryStoreData, GoalMemoryKeys>;
    };
    habits: {
        records: HabitRecord[];
        streak: StreakState;
        memory: Pick<MemoryStoreData, HabitMemoryKeys>;
    };
    mindset: Omit<MemoryStoreData, ProfileKeys | GoalMemoryKeys | HabitMemoryKeys>;
    business: BusinessData;
    projects: Project[];
    finances: FinanceState;
    trading: {
        journal: TradingJournalEntry[];
        rules: TradingRule[];
        pretradeChecklist: ChecklistItem[];
    };
    dailyCheckin: DailyCheckIn[];
    chat: ChatMessage[];
    notificationReadState: string[];
};

export type CloudStateRow = {
    user_id: string;
    schema_version: number;
    data: unknown;
    revision: number;
    created_at: string;
    updated_at: string;
};
