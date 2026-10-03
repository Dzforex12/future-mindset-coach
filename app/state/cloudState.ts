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
import {
    SUPPORTED_BACKUP_KEYS,
    validateBackupPayload,
    type StorageSnapshot,
    type SupportedBackupKey,
} from "./backup";
import { getStorage } from "./persistence";
import { useMemoryStore } from "./memoryStore";
import { getDefaultChecklist, getDefaultRules } from "./tradingEngine";

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

export type CloudSyncMetadata = {
    version: 1;
    userId: string;
    revision: string | null;
    lastSyncedAt: string | null;
    lastLocalChangedAt: string | null;
    localFingerprint: string | null;
    pendingChanges: boolean;
    initialMigrationResolved: boolean;
};

export type LocalStateSummary = {
    hasData: boolean;
    lastChangedAt: string | null;
    goals: number;
    habits: number;
    trades: number;
    projects: number;
};

const SYNC_METADATA_KEY = "future-mindset-cloud-sync";
const MEMORY_KEY = "future-mindset-memory";
const MEMORY_PROFILE_KEYS: ProfileKeys[] = [
    "displayName", "mainLifeGoal", "dailyFocus", "preferredTradingRiskLimit",
    "dailyTradingLimit", "tradingMode", "riskProfile", "coachPersonality",
    "theme", "dailyReminder",
];
const MEMORY_GOAL_KEYS: GoalMemoryKeys[] = [
    "monthlyGoals", "quarterlyGoals", "yearlyGoals", "monthlyReports",
    "monthlyTrend", "monthlyReportIsNew", "monthlyGoalsIsNew",
    "quarterlyGoalsIsNew", "yearlyGoalsIsNew",
];
const MEMORY_HABIT_KEYS: HabitMemoryKeys[] = [
    "dailyHabitsCompleted", "disciplineStreak", "habitHistory",
    "recommendedHabits", "recommendedHabitsIsNew", "dynamicHabits",
];

const EMPTY_BUSINESS: BusinessData = { goals: [], tasks: [], leads: [], monthlyTarget: 0, revenue: 0 };
const EMPTY_FINANCES: FinanceState = {
    income: 0, expenses: 0, savings: 0, savingsTarget: 0, goals: [], transactions: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isJsonValue(value: unknown, depth = 0): boolean {
    if (depth > 40) return false;
    if (value === null || typeof value === "string" || typeof value === "boolean") return true;
    if (typeof value === "number") return Number.isFinite(value);
    if (Array.isArray(value)) return value.every((entry) => isJsonValue(entry, depth + 1));
    return isRecord(value) && Object.values(value).every((entry) => isJsonValue(entry, depth + 1));
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isStringOrNumberArray(value: unknown): value is (string | number)[] {
    return Array.isArray(value) && value.every((entry) => isString(entry) || isNumber(entry));
}

function isObjectArray(value: unknown, required: Record<string, (entry: unknown) => boolean>): value is Record<string, unknown>[] {
    return Array.isArray(value) && value.every((entry) =>
        isRecord(entry) && Object.entries(required).every(([key, check]) => check(entry[key])));
}

const isString = (value: unknown): value is string => typeof value === "string";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

function validateMemory(memory: unknown): memory is CloudAppState["profile"] & Record<string, unknown> {
    if (!isRecord(memory)) return false;
    const requiredStringKeys = [
        "displayName", "mainLifeGoal", "dailyFocus", "preferredTradingRiskLimit",
        "dailyTradingLimit", "tradingMode", "riskProfile", "coachPersonality", "theme",
    ];
    if (!requiredStringKeys.every((key) => isString(memory[key])) || !isBoolean(memory.dailyReminder)) return false;
    if (!["Forex", "Crypto", "Stocks"].includes(String(memory.tradingMode))) return false;
    if (!["Conservative", "Moderate", "Aggressive"].includes(String(memory.riskProfile))) return false;
    if (!["Soft", "Neutral", "Aggressive"].includes(String(memory.coachPersonality))) return false;
    if (!["dark", "ultra-dark"].includes(String(memory.theme))) return false;
    return isJsonValue(memory);
}

function matchesMemoryShape(value: unknown, template: unknown): boolean {
    if (template === null) return value === null || typeof value === "string";
    if (Array.isArray(template)) return Array.isArray(value) && value.every(isJsonValue);
    if (isRecord(template)) {
        return isRecord(value) && Object.entries(template).every(([key, child]) =>
            Object.prototype.hasOwnProperty.call(value, key) && matchesMemoryShape(value[key], child));
    }
    if (typeof template === "number") return isNumber(value);
    return typeof value === typeof template;
}

function validateCloudAppState(value: unknown): value is CloudAppState {
    if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.trading)) return false;
    const goals = value.goals;
    const habits = value.habits;
    const goalMemory = isRecord(goals) ? goals.memory : null;
    const habitMemory = isRecord(habits) ? habits.memory : null;
    const finances = value.finances;
    if (!validateMemory(value.profile) || !isRecord(goals) || !isRecord(habits) ||
        !isRecord(value.mindset) || !isRecord(finances)) return false;
    if (!isObjectArray(goals.records, {
        id: isString, title: isString, description: isString, category: isString,
        progress: isNumber, completed: isBoolean, linkedHabitIds: isStringArray,
        createdAt: isString, updatedAt: isString,
    }) || !isRecord(goalMemory) || !isJsonValue(goalMemory) ||
        !["monthlyGoals", "quarterlyGoals", "yearlyGoals", "monthlyReports", "monthlyTrend"].every((key) => Array.isArray(goalMemory[key])) ||
        !["monthlyReportIsNew", "monthlyGoalsIsNew", "quarterlyGoalsIsNew", "yearlyGoalsIsNew"].every((key) => isBoolean(goalMemory[key]))) return false;
    const goalRecords = [
        ...goalMemory.monthlyGoals as unknown[],
        ...goalMemory.quarterlyGoals as unknown[],
        ...goalMemory.yearlyGoals as unknown[],
    ];
    if (!isObjectArray(goalRecords, {
        id: isString, title: isString, description: isString, completed: isBoolean, progress: isNumber,
    }) ||
        !isObjectArray(goalMemory.monthlyReports, {
            month: isString, summary: isString, consistencyScore: isNumber, disciplineScore: isNumber,
            tradingMindsetScore: isNumber, bestDay: isString, worstDay: isString,
            habitsCompleted: isNumber, streakHigh: isNumber, streakLow: isNumber,
        }) ||
        !isObjectArray(goalMemory.monthlyTrend, {
            month: isString, consistencyScore: isNumber, disciplineScore: isNumber, tradingMindsetScore: isNumber,
        })) return false;
    if (!isObjectArray(habits.records, {
        id: isString, title: isString, description: isString,
        createdAt: isString, updatedAt: isString, completedDates: isStringArray,
    }) || !isRecord(habits.streak) || !isNumber(habits.streak.current) ||
        !(habits.streak.lastCompletedDate === null || isString(habits.streak.lastCompletedDate)) ||
        !isRecord(habitMemory) || !isJsonValue(habitMemory) ||
        !["dailyHabitsCompleted", "habitHistory", "recommendedHabits", "dynamicHabits"].every((key) => Array.isArray(habitMemory[key])) ||
        !isNumber(habitMemory.disciplineStreak) ||
        !isBoolean(habitMemory.recommendedHabitsIsNew) ||
        !isJsonValue(value.mindset)) return false;
    if (!isObjectArray(habitMemory.habitHistory, {
        date: isString, habits: (entry) => Array.isArray(entry) && entry.every((id) => isString(id) || isNumber(id)),
    }) ||
        !isObjectArray(habitMemory.recommendedHabits, { id: isString, title: isString, description: isString }) ||
        !isObjectArray(habitMemory.dynamicHabits, { id: isString, title: isString, description: isString }) ||
        !isStringOrNumberArray(habitMemory.dailyHabitsCompleted)) return false;
    const completeMemory = {
        ...value.profile,
        ...goalMemory,
        ...habitMemory,
        ...value.mindset,
    };
    const initialMemory = useMemoryStore.getInitialState() as unknown as Record<string, unknown>;
    const memoryDefaults = Object.fromEntries(Object.entries(initialMemory).filter(([, entry]) => typeof entry !== "function"));
    if (!Object.entries(memoryDefaults).every(([key, template]) =>
        Object.prototype.hasOwnProperty.call(completeMemory, key) && matchesMemoryShape(completeMemory[key], template))) return false;
    if (!isRecord(value.business) ||
        !isObjectArray(value.business.goals, {
            id: isString, title: isString, description: isString, target: isString,
            deadline: isString, progress: isNumber, status: (entry) => ["New", "Active", "Reached", "Paused"].includes(String(entry)),
        }) ||
        !isObjectArray(value.business.tasks, {
            id: isString, title: isString, description: isString,
            priority: (entry) => ["Low", "Medium", "High"].includes(String(entry)),
            deadline: isString, complete: isBoolean,
        }) ||
        !isObjectArray(value.business.leads, {
            id: isString, name: isString, business: isString, note: isString,
            status: (entry) => ["New", "Contacted", "Interested", "Client", "Lost"].includes(String(entry)),
        }) ||
        !isNumber(value.business.monthlyTarget) || !isNumber(value.business.revenue)) return false;
    if (!isObjectArray(value.projects, {
        id: isString, title: isString, description: isString, category: isString,
        status: (entry) => ["Planning", "Active", "Paused", "Completed"].includes(String(entry)),
        progress: isNumber, deadline: isString, tasks: (entry) =>
            isObjectArray(entry, { id: isString, title: isString, complete: isBoolean }),
    })) return false;
    if (!["income", "expenses", "savings", "savingsTarget"].every((key) => isNumber(finances[key])) ||
        !isObjectArray(finances.goals, { id: isString, title: isString, target: isNumber, saved: isNumber }) ||
        !isObjectArray(finances.transactions, {
            id: isString, type: (entry) => entry === "income" || entry === "expense",
            description: isString, amount: isNumber, category: isString, date: isString,
        })) return false;
    if (!isObjectArray(value.trading.journal, {
        id: isString, date: isString, time: isString, instrument: isString,
        side: (entry) => entry === "BUY" || entry === "SELL",
        session: isString, setupName: isString, entryPrice: isString, stopLoss: isString,
        takeProfit: isString, riskPercent: isString, plannedRiskReward: isString,
        actualResult: isString, resultInR: isString,
        outcome: (entry) => entry === "" || entry === "Win" || entry === "Loss" || entry === "Break Even",
        reasonForEntry: isString, emotionBefore: isString, emotionAfter: isString,
        planFollowed: isBoolean, mistakes: isString, lessonLearned: isString, notes: isString,
        createdAt: isString, updatedAt: isString,
    }) || !isObjectArray(value.trading.rules, { id: isString, text: isString, enabled: isBoolean, order: isNumber }) ||
        !isObjectArray(value.trading.pretradeChecklist, { id: isString, label: isString, checked: isBoolean, critical: isBoolean })) return false;
    if (!isObjectArray(value.dailyCheckin, {
        id: isString, date: isString, mood: isString, energy: isNumber,
        discipline: isNumber, tradingToday: (entry) => entry === "Yes" || entry === "No" || entry === "Maybe",
        mainPriority: isString, distraction: isString, updatedAt: isString,
    }) || !isObjectArray(value.chat, {
        id: isString, sender: (entry) => entry === "coach" || entry === "user",
        text: isString, createdAt: isString,
    }) || !isStringArray(value.notificationReadState)) return false;
    return true;
}

function readRawBackupData(): Partial<Record<SupportedBackupKey, unknown>> {
    const storage = getStorage();
    if (!storage || typeof window === "undefined") {
        throw new Error("Cloud sync can only read browser storage after the page has loaded.");
    }
    const data: Partial<Record<SupportedBackupKey, unknown>> = {};
    for (const key of SUPPORTED_BACKUP_KEYS) {
        const raw = storage.getItem(key);
        if (raw === null) continue;
        try {
            data[key] = JSON.parse(raw) as unknown;
        } catch {
            throw new Error(`Local data for ${key} is invalid JSON. It was not uploaded or changed.`);
        }
    }
    const checked = validateBackupPayload({
        app: "Future Mindset Coach", backupVersion: 1, exportedAt: "", data,
    });
    if (!checked.valid) throw new Error(checked.error);
    return data;
}

function memoryDataFromStoredValue(value: unknown): Record<string, unknown> {
    if (value === undefined) {
        const initial = useMemoryStore.getInitialState() as unknown as Record<string, unknown>;
        return Object.fromEntries(Object.entries(initial).filter(([, entry]) => typeof entry !== "function"));
    }
    if (!isRecord(value) || !isRecord(value.state) || !Number.isInteger(value.version)) {
        throw new Error("Local profile/settings data has an invalid Zustand storage format.");
    }
    const initial = useMemoryStore.getInitialState() as unknown as Record<string, unknown>;
    const defaults = Object.fromEntries(Object.entries(initial).filter(([, entry]) => typeof entry !== "function"));
    return { ...defaults, ...value.state };
}

export function validateCloudState(value: unknown): value is CloudAppState {
    return validateCloudAppState(value);
}

export function createCloudStateFromLocal(): CloudAppState {
    const data = readRawBackupData();
    const memory = memoryDataFromStoredValue(data[MEMORY_KEY]);
    const state: CloudAppState = {
        schemaVersion: 1,
        profile: Object.fromEntries(MEMORY_PROFILE_KEYS.map((key) => [key, memory[key]])) as CloudAppState["profile"],
        goals: {
            records: (data["future-mindset-goals"] ?? []) as GoalRecord[],
            memory: Object.fromEntries(MEMORY_GOAL_KEYS.map((key) => [key, memory[key]])) as CloudAppState["goals"]["memory"],
        },
        habits: {
            records: (data["future-mindset-habits"] ?? []) as HabitRecord[],
            streak: (data["future-mindset-streak"] ?? { current: 0, lastCompletedDate: null }) as StreakState,
            memory: Object.fromEntries(MEMORY_HABIT_KEYS.map((key) => [key, memory[key]])) as CloudAppState["habits"]["memory"],
        },
        mindset: Object.fromEntries(Object.entries(memory).filter(([key]) =>
            !MEMORY_PROFILE_KEYS.includes(key as ProfileKeys) &&
            !MEMORY_GOAL_KEYS.includes(key as GoalMemoryKeys) &&
            !MEMORY_HABIT_KEYS.includes(key as HabitMemoryKeys))) as CloudAppState["mindset"],
        business: (data["future-mindset-business"] ?? EMPTY_BUSINESS) as BusinessData,
        projects: (data["future-mindset-projects"] ?? []) as Project[],
        finances: (data["future-mindset-finances"] ?? EMPTY_FINANCES) as FinanceState,
        trading: {
            journal: (data["future-mindset-trading-journal"] ?? []) as TradingJournalEntry[],
            rules: (data["future-mindset-trading-rules"] ?? getDefaultRules()) as TradingRule[],
            pretradeChecklist: (data["future-mindset-pretrade-checklist"] ?? getDefaultChecklist()) as ChecklistItem[],
        },
        dailyCheckin: (data["future-mindset-daily-checkin"] ?? []) as DailyCheckIn[],
        chat: (data["future-mindset-chat"] ?? []) as ChatMessage[],
        notificationReadState: (data["future-mindset-notification-read"] ?? []) as string[],
    };
    if (!validateCloudAppState(state)) {
        throw new Error("Local app data contains a malformed supported module. It was not uploaded or changed.");
    }
    return state;
}

export function createLocalSnapshotFromCloud(value: unknown): StorageSnapshot {
    if (!validateCloudAppState(value)) {
        throw new Error("Cloud data is not a valid Future Mindset Coach snapshot. Local data was not changed.");
    }
    const state = value;
    const memory = {
        ...state.profile,
        ...state.goals.memory,
        ...state.habits.memory,
        ...state.mindset,
    };
    const data: Record<SupportedBackupKey, unknown> = {
        [MEMORY_KEY]: { state: memory, version: 0 },
        "future-mindset-goals": state.goals.records,
        "future-mindset-habits": state.habits.records,
        "future-mindset-streak": state.habits.streak,
        "future-mindset-trading-journal": state.trading.journal,
        "future-mindset-trading-rules": state.trading.rules,
        "future-mindset-pretrade-checklist": state.trading.pretradeChecklist,
        "future-mindset-daily-checkin": state.dailyCheckin,
        "future-mindset-chat": state.chat,
        "future-mindset-business": state.business,
        "future-mindset-projects": state.projects,
        "future-mindset-finances": state.finances,
        "future-mindset-notification-read": state.notificationReadState,
    };
    const checked = validateBackupPayload({
        app: "Future Mindset Coach", backupVersion: 1, exportedAt: "", data,
    });
    if (!checked.valid) throw new Error(checked.error);
    return Object.fromEntries(SUPPORTED_BACKUP_KEYS.map((key) => [key, JSON.stringify(data[key])])) as StorageSnapshot;
}

export function summarizeLocalCloudState(state = createCloudStateFromLocal(), lastChangedAt: string | null = null): LocalStateSummary {
    const memory = { ...state.profile, ...state.goals.memory, ...state.habits.memory, ...state.mindset };
    const initialMemory = useMemoryStore.getInitialState() as unknown as Record<string, unknown>;
    const defaults = Object.fromEntries(Object.entries(initialMemory).filter(([, value]) => typeof value !== "function"));
    const stableJson = (value: unknown): string => {
        if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
        if (isRecord(value)) {
            return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
        }
        return JSON.stringify(value) ?? "undefined";
    };
    const hasMemoryData = Object.entries(memory).some(([key, value]) => stableJson(value) !== stableJson(defaults[key]));
    const availableTimestamps = [
        ...state.goals.records.flatMap((entry) => [entry.createdAt, entry.updatedAt]),
        ...state.habits.records.flatMap((entry) => [entry.createdAt, entry.updatedAt]),
        ...state.trading.journal.flatMap((entry) => [entry.createdAt, entry.updatedAt]),
        ...state.dailyCheckin.map((entry) => entry.updatedAt),
        ...state.chat.map((entry) => entry.createdAt),
        ...state.habits.memory.habitHistory.map((entry) => entry.date),
        ...state.business.tasks.map((entry) => entry.deadline),
        ...state.finances.transactions.map((entry) => entry.date),
    ].filter((value) => typeof value === "string" && !Number.isNaN(new Date(value).getTime()));
    const detectedTimestamp = availableTimestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
    const hasData = Boolean(
        hasMemoryData || state.goals.records.length || state.habits.records.length ||
        state.habits.streak.current || state.business.goals.length || state.business.tasks.length ||
        state.business.leads.length || state.business.monthlyTarget || state.business.revenue ||
        state.projects.length || state.finances.income || state.finances.expenses ||
        state.finances.savings || state.finances.goals.length || state.finances.transactions.length ||
        state.trading.journal.length || state.dailyCheckin.length ||
        state.chat.some((message) => message.sender === "user") || state.notificationReadState.length);
    return {
        hasData,
        lastChangedAt: lastChangedAt ?? detectedTimestamp,
        goals: state.goals.records.length,
        habits: state.habits.records.length,
        trades: state.trading.journal.length,
        projects: state.projects.length,
    };
}

export function readCloudSyncMetadata(): CloudSyncMetadata | null {
    const storage = getStorage();
    const raw = storage?.getItem(SYNC_METADATA_KEY);
    if (!raw) return null;
    try {
        const value: unknown = JSON.parse(raw);
        if (!isRecord(value) || value.version !== 1 || typeof value.userId !== "string" ||
            !(value.revision === null || typeof value.revision === "string") ||
            !(value.lastSyncedAt === null || typeof value.lastSyncedAt === "string") ||
            !(value.lastLocalChangedAt === null || typeof value.lastLocalChangedAt === "string") ||
            !(value.localFingerprint === null || typeof value.localFingerprint === "string") ||
            typeof value.pendingChanges !== "boolean" || typeof value.initialMigrationResolved !== "boolean") return null;
        return value as CloudSyncMetadata;
    } catch {
        return null;
    }
}

export function writeCloudSyncMetadata(metadata: CloudSyncMetadata): void {
    const storage = getStorage();
    if (!storage) throw new Error("Browser storage is unavailable; sync status could not be saved.");
    storage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
}

let isApplyingCloudSnapshotNow = false;

export function isApplyingCloudSnapshot(): boolean {
    return isApplyingCloudSnapshotNow;
}

export async function applyCloudSnapshot(snapshot: StorageSnapshot, metadata: CloudSyncMetadata): Promise<void> {
    const storage = getStorage();
    if (!storage) throw new Error("Browser storage is unavailable. Cloud data was not restored.");
    const before: StorageSnapshot = Object.fromEntries(
        SUPPORTED_BACKUP_KEYS.map((key) => [key, storage.getItem(key)]),
    ) as StorageSnapshot;
    const previousMetadata = storage.getItem(SYNC_METADATA_KEY);
    isApplyingCloudSnapshotNow = true;
    try {
        for (const key of SUPPORTED_BACKUP_KEYS) {
            const value = snapshot[key];
            if (value === null) storage.removeItem(key);
            else storage.setItem(key, value);
        }
        storage.setItem(SYNC_METADATA_KEY, JSON.stringify(metadata));
        await useMemoryStore.persist.rehydrate();
        window.dispatchEvent(new Event("mindset-store-update"));
    } catch (error) {
        try {
            for (const key of SUPPORTED_BACKUP_KEYS) {
                const value = before[key];
                if (value === null) storage.removeItem(key);
                else storage.setItem(key, value);
            }
            if (previousMetadata === null) storage.removeItem(SYNC_METADATA_KEY);
            else storage.setItem(SYNC_METADATA_KEY, previousMetadata);
            await useMemoryStore.persist.rehydrate();
        } catch (rollbackError) {
            throw new Error(
                `Cloud restore failed and rollback was incomplete: ${rollbackError instanceof Error ? rollbackError.message : "storage error"}`,
            );
        } finally {
            isApplyingCloudSnapshotNow = false;
        }
        throw error instanceof Error ? error : new Error("Cloud restore failed; prior local data was restored.");
    } finally {
        isApplyingCloudSnapshotNow = false;
    }
}

export function isValidRevision(value: unknown): value is number | string {
    if (typeof value === "number") return Number.isSafeInteger(value) && value >= 1;
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return false;
    try {
        return BigInt(value) >= BigInt(1);
    } catch {
        return false;
    }
}

export function canonicalizeCloudState(value: unknown): string {
    if (!validateCloudAppState(value)) {
        throw new Error("Cannot fingerprint an invalid cloud state.");
    }
    const sortJson = (entry: unknown): unknown => {
        if (Array.isArray(entry)) return entry.map(sortJson);
        if (isRecord(entry)) {
            return Object.fromEntries(Object.keys(entry).sort().map((key) => [key, sortJson(entry[key])]));
        }
        return entry;
    };
    return JSON.stringify(sortJson(value));
}

export function compareRevisions(left: number | string | null, right: number | string | null): number {
    if (left === right) return 0;
    if (left === null) return -1;
    if (right === null) return 1;
    const a = BigInt(left);
    const b = BigInt(right);
    return a < b ? -1 : a > b ? 1 : 0;
}
