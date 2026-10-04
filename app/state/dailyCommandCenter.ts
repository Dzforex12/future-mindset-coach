import { getLocalDateKey } from "./localDate";
import { readStorageJson, writeStorageJson } from "./persistence";

export const DAILY_COMMAND_CENTER_STORAGE_KEY = "future-mindset-daily-command-center";

export const PRIORITY_SOURCE_TYPES = [
    "Goal",
    "Habit",
    "Project",
    "Business",
    "Finance",
    "Trading",
    "Personal",
] as const;

export type PrioritySourceType = (typeof PRIORITY_SOURCE_TYPES)[number];

export type DailyPriority = {
    id: string;
    title: string;
    note?: string;
    sourceType: PrioritySourceType;
    sourceId?: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
};

export type GoalAction = {
    goalId: string;
    action: string;
    completed: boolean;
    updatedAt: string;
};

export type EveningReview = {
    completed: string;
    avoided: string;
    wentWell: string;
    improveTomorrow: string;
    score?: number;
    updatedAt: string;
};

export type DailyCommandCenterState = {
    version: 1;
    prioritiesByDate: Record<string, DailyPriority[]>;
    goalActionsByDate: Record<string, GoalAction>;
    projectFocusByDate: Record<string, { projectId: string; taskId: string }>;
    businessFocusByDate: Record<string, { taskId: string }>;
    eveningReviewsByDate: Record<string, EveningReview>;
    weeklyFocusByWeek: Record<string, string>;
    reminders: {
        morningPlan: boolean;
        eveningReview: boolean;
        weeklyReview: boolean;
    };
};

export const EMPTY_DAILY_COMMAND_CENTER: DailyCommandCenterState = {
    version: 1,
    prioritiesByDate: {},
    goalActionsByDate: {},
    projectFocusByDate: {},
    businessFocusByDate: {},
    eveningReviewsByDate: {},
    weeklyFocusByWeek: {},
    reminders: { morningPlan: false, eveningReview: false, weeklyReview: false },
};

type PriorityInput = Pick<DailyPriority, "title" | "sourceType"> &
    Partial<Pick<DailyPriority, "note" | "sourceId">>;

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDateKey(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return getLocalDateKey(date) === value;
}

function isPriority(value: unknown): value is DailyPriority {
    if (!isRecord(value)) return false;
    return typeof value.id === "string" && Boolean(value.id) &&
        typeof value.title === "string" && Boolean(value.title.trim()) && value.title.length <= 120 &&
        (value.note === undefined || (typeof value.note === "string" && value.note.length <= 240)) &&
        PRIORITY_SOURCE_TYPES.includes(value.sourceType as PrioritySourceType) &&
        (value.sourceId === undefined || typeof value.sourceId === "string") &&
        typeof value.completed === "boolean" &&
        typeof value.createdAt === "string" &&
        typeof value.updatedAt === "string";
}

export function isDailyCommandCenterState(value: unknown): value is DailyCommandCenterState {
    if (!isRecord(value) || value.version !== 1) return false;
    const dateLists = ["prioritiesByDate"] as const;
    for (const field of dateLists) {
        const records = value[field];
        if (!isRecord(records)) return false;
        for (const [date, priorities] of Object.entries(records)) {
            if (!isDateKey(date) || !Array.isArray(priorities) || !priorities.every(isPriority) ||
                priorities.filter((priority) => !priority.completed).length > 3) return false;
        }
    }

    for (const field of ["goalActionsByDate", "projectFocusByDate", "businessFocusByDate", "eveningReviewsByDate"] as const) {
        const records = value[field];
        if (!isRecord(records) || !Object.keys(records).every(isDateKey)) return false;
    }
    for (const [date, action] of Object.entries(value.goalActionsByDate as Record<string, unknown>)) {
        if (!isRecord(action) || typeof action.goalId !== "string" || !action.goalId ||
            typeof action.action !== "string" || !action.action.trim() || action.action.length > 300 ||
            typeof action.completed !== "boolean" || typeof action.updatedAt !== "string" || !isDateKey(date)) return false;
    }
    for (const [date, focus] of Object.entries(value.projectFocusByDate as Record<string, unknown>)) {
        if (!isRecord(focus) || typeof focus.projectId !== "string" || typeof focus.taskId !== "string" || !isDateKey(date)) return false;
    }
    for (const [date, focus] of Object.entries(value.businessFocusByDate as Record<string, unknown>)) {
        if (!isRecord(focus) || typeof focus.taskId !== "string" || !isDateKey(date)) return false;
    }
    for (const [date, review] of Object.entries(value.eveningReviewsByDate as Record<string, unknown>)) {
        if (!isRecord(review) || !["completed", "avoided", "wentWell", "improveTomorrow"].every((key) => typeof review[key] === "string" && String(review[key]).length <= 500) ||
            (review.score !== undefined && (!Number.isInteger(review.score) || Number(review.score) < 1 || Number(review.score) > 10)) ||
            typeof review.updatedAt !== "string" || !isDateKey(date)) return false;
    }
    if (!isRecord(value.weeklyFocusByWeek) ||
        !Object.entries(value.weeklyFocusByWeek).every(([week, focus]) => isDateKey(week) && typeof focus === "string")) return false;
    return isRecord(value.reminders) &&
        typeof value.reminders.morningPlan === "boolean" &&
        typeof value.reminders.eveningReview === "boolean" &&
        typeof value.reminders.weeklyReview === "boolean";
}

function normalizeState(value: unknown): DailyCommandCenterState {
    if (isDailyCommandCenterState(value)) return value;
    if (!isRecord(value)) return EMPTY_DAILY_COMMAND_CENTER;

    const next: DailyCommandCenterState = {
        ...EMPTY_DAILY_COMMAND_CENTER,
        prioritiesByDate: {},
        goalActionsByDate: {},
        projectFocusByDate: {},
        businessFocusByDate: {},
        eveningReviewsByDate: {},
        weeklyFocusByWeek: {},
    };
    if (isRecord(value.prioritiesByDate)) {
        for (const [date, priorities] of Object.entries(value.prioritiesByDate)) {
            if (!isDateKey(date) || !Array.isArray(priorities)) continue;
            const validPriorities = priorities.filter(isPriority);
            let activeCount = 0;
            next.prioritiesByDate[date] = validPriorities.filter((priority) => {
                if (priority.completed) return true;
                activeCount += 1;
                return activeCount <= 3;
            });
        }
    }
    if (isRecord(value.goalActionsByDate)) {
        for (const [date, action] of Object.entries(value.goalActionsByDate)) {
            if (isDateKey(date) && isRecord(action) && typeof action.goalId === "string" && typeof action.action === "string" &&
                typeof action.completed === "boolean" && typeof action.updatedAt === "string") next.goalActionsByDate[date] = action as unknown as GoalAction;
        }
    }
    if (isRecord(value.projectFocusByDate)) {
        for (const [date, focus] of Object.entries(value.projectFocusByDate)) {
            if (isDateKey(date) && isRecord(focus) && typeof focus.projectId === "string" && typeof focus.taskId === "string") {
                next.projectFocusByDate[date] = { projectId: focus.projectId, taskId: focus.taskId };
            }
        }
    }
    if (isRecord(value.businessFocusByDate)) {
        for (const [date, focus] of Object.entries(value.businessFocusByDate)) {
            if (isDateKey(date) && isRecord(focus) && typeof focus.taskId === "string") next.businessFocusByDate[date] = { taskId: focus.taskId };
        }
    }
    if (isRecord(value.eveningReviewsByDate)) {
        for (const [date, review] of Object.entries(value.eveningReviewsByDate)) {
            if (isDateKey(date) && isRecord(review) &&
                ["completed", "avoided", "wentWell", "improveTomorrow"].every((key) => typeof review[key] === "string") &&
                (review.score === undefined || (Number.isInteger(review.score) && Number(review.score) >= 1 && Number(review.score) <= 10)) &&
                typeof review.updatedAt === "string") next.eveningReviewsByDate[date] = review as unknown as EveningReview;
        }
    }
    if (isRecord(value.weeklyFocusByWeek)) {
        for (const [week, focus] of Object.entries(value.weeklyFocusByWeek)) {
            if (isDateKey(week) && typeof focus === "string") next.weeklyFocusByWeek[week] = focus;
        }
    }
    if (isRecord(value.reminders)) {
        next.reminders = {
            morningPlan: value.reminders.morningPlan === true,
            eveningReview: value.reminders.eveningReview === true,
            weeklyReview: value.reminders.weeklyReview === true,
        };
    }
    return next;
}

export function getDailyCommandCenter(): DailyCommandCenterState {
    return normalizeState(readStorageJson<unknown>(DAILY_COMMAND_CENTER_STORAGE_KEY, EMPTY_DAILY_COMMAND_CENTER));
}

function saveState(state: DailyCommandCenterState): DailyCommandCenterState {
    return writeStorageJson(DAILY_COMMAND_CENTER_STORAGE_KEY, state);
}

function createId(): string {
    return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `priority-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function addDailyPriority(date: string, input: PriorityInput): DailyPriority {
    const title = input.title.trim();
    if (!title) throw new Error("Priority title is required.");
    if (title.length > 120 || (input.note?.length ?? 0) > 240) throw new Error("Priority title or note is too long.");
    const state = getDailyCommandCenter();
    const priorities = state.prioritiesByDate[date] ?? [];
    if (priorities.filter((priority) => !priority.completed).length >= 3) {
        throw new Error("Complete or remove an active priority before adding another.");
    }
    const now = new Date().toISOString();
    const priority: DailyPriority = {
        id: createId(),
        title,
        ...(input.note?.trim() ? { note: input.note.trim() } : {}),
        sourceType: input.sourceType,
        ...(input.sourceId ? { sourceId: input.sourceId } : {}),
        completed: false,
        createdAt: now,
        updatedAt: now,
    };
    saveState({ ...state, prioritiesByDate: { ...state.prioritiesByDate, [date]: [...priorities, priority] } });
    return priority;
}

export function updateDailyPriority(date: string, id: string, input: PriorityInput): DailyPriority[] {
    if (input.title.trim().length > 120 || (input.note?.length ?? 0) > 240) throw new Error("Priority title or note is too long.");
    const state = getDailyCommandCenter();
    const priorities = (state.prioritiesByDate[date] ?? []).map((priority) => priority.id === id
        ? {
            ...priority,
            title: input.title.trim() || priority.title,
            note: input.note?.trim() || undefined,
            sourceType: input.sourceType,
            sourceId: input.sourceId || undefined,
            updatedAt: new Date().toISOString(),
        }
        : priority);
    saveState({ ...state, prioritiesByDate: { ...state.prioritiesByDate, [date]: priorities } });
    return priorities;
}

export function setDailyPriorityCompleted(date: string, id: string, completed: boolean): DailyPriority[] {
    const state = getDailyCommandCenter();
    const priorities = state.prioritiesByDate[date] ?? [];
    if (!completed && priorities.filter((priority) => !priority.completed).length >= 3) {
        throw new Error("Only three priorities can be active for a day.");
    }
    const next = priorities.map((priority) => priority.id === id
        ? { ...priority, completed, updatedAt: new Date().toISOString() }
        : priority);
    saveState({ ...state, prioritiesByDate: { ...state.prioritiesByDate, [date]: next } });
    return next;
}

export function deleteDailyPriority(date: string, id: string): DailyPriority[] {
    const state = getDailyCommandCenter();
    const priorities = (state.prioritiesByDate[date] ?? []).filter((priority) => priority.id !== id);
    saveState({ ...state, prioritiesByDate: { ...state.prioritiesByDate, [date]: priorities } });
    return priorities;
}

export function setGoalAction(date: string, goalId: string, action: string, completed = false): GoalAction | null {
    const state = getDailyCommandCenter();
    if (!goalId || !action.trim()) {
        const goalActionsByDate = { ...state.goalActionsByDate };
        delete goalActionsByDate[date];
        saveState({ ...state, goalActionsByDate });
        return null;
    }
    const next = { goalId, action: action.trim(), completed, updatedAt: new Date().toISOString() };
    saveState({ ...state, goalActionsByDate: { ...state.goalActionsByDate, [date]: next } });
    return next;
}

export function toggleGoalAction(date: string, completed: boolean): GoalAction | null {
    const current = getDailyCommandCenter().goalActionsByDate[date];
    return current ? setGoalAction(date, current.goalId, current.action, completed) : null;
}

export function setEveningReview(date: string, review: Omit<EveningReview, "updatedAt">): EveningReview {
    if (Object.values(review).some((value) => typeof value === "string" && value.length > 500) ||
        (review.score !== undefined && (!Number.isInteger(review.score) || review.score < 1 || review.score > 10))) {
        throw new Error("Evening review contains a value outside the supported range.");
    }
    const state = getDailyCommandCenter();
    const next = { ...review, updatedAt: new Date().toISOString() };
    saveState({ ...state, eveningReviewsByDate: { ...state.eveningReviewsByDate, [date]: next } });
    return next;
}

export function setWeeklyFocus(week: string, focus: string): void {
    if (focus.length > 300) throw new Error("Weekly focus must be 300 characters or fewer.");
    const state = getDailyCommandCenter();
    saveState({ ...state, weeklyFocusByWeek: { ...state.weeklyFocusByWeek, [week]: focus } });
}

export function setReminderPreference(
    reminder: keyof DailyCommandCenterState["reminders"],
    enabled: boolean,
): void {
    const state = getDailyCommandCenter();
    saveState({ ...state, reminders: { ...state.reminders, [reminder]: enabled } });
}

export function setProjectFocus(date: string, projectId: string, taskId: string): void {
    const state = getDailyCommandCenter();
    const projectFocusByDate = { ...state.projectFocusByDate };
    if (projectId && taskId) projectFocusByDate[date] = { projectId, taskId };
    else delete projectFocusByDate[date];
    saveState({ ...state, projectFocusByDate });
}

export function setBusinessFocus(date: string, taskId: string): void {
    const state = getDailyCommandCenter();
    const businessFocusByDate = { ...state.businessFocusByDate };
    if (taskId) businessFocusByDate[date] = { taskId };
    else delete businessFocusByDate[date];
    saveState({ ...state, businessFocusByDate });
}
