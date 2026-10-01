import { readStorageJson, writeStorageJson } from "./persistence";
import { removeHabitFromAllGoals } from "./goalEngine";

export type HabitRecord = {
    id: string;
    title: string;
    description: string;
    schedule?: string;
    paused?: boolean;
    archived?: boolean;
    createdAt: string;
    updatedAt: string;
    completedDates: string[];
};

export type HabitInput = {
    title: string;
    description?: string;
    schedule?: string;
    paused?: boolean;
    archived?: boolean;
};

const STORAGE_KEY = "future-mindset-habits";
const STREAK_STORAGE_KEY = "future-mindset-streak";

export function createId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getDateKey(date = new Date()): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
}

export function getHabitRecords(): HabitRecord[] {
    return readStorageJson<HabitRecord[]>(STORAGE_KEY, []);
}

export function saveHabitRecords(records: HabitRecord[]): HabitRecord[] {
    return writeStorageJson(STORAGE_KEY, records);
}

export function createHabit(input: HabitInput): HabitRecord {
    const trimmedTitle = input.title.trim();
    const habit: HabitRecord = {
        id: createId(),
        title: trimmedTitle || "New habit",
        description: input.description?.trim() || "",
        schedule: input.schedule || "Daily",
        paused: Boolean(input.paused),
        archived: Boolean(input.archived),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedDates: [],
    };

    const habits = getHabitRecords();
    saveHabitRecords([...habits, habit]);
    return habit;
}

export function updateHabit(id: string, updates: Partial<Pick<HabitRecord, "title" | "description" | "schedule" | "paused" | "archived">>): HabitRecord[] {
    const habits = getHabitRecords();
    const nextHabits = habits.map((habit) => {
        if (habit.id !== id) {
            return habit;
        }

        return {
            ...habit,
            title: updates.title?.trim() || habit.title,
            description: updates.description !== undefined ? updates.description.trim() : habit.description,
            schedule: updates.schedule !== undefined ? updates.schedule : habit.schedule,
            paused: updates.paused !== undefined ? Boolean(updates.paused) : Boolean(habit.paused),
            archived: updates.archived !== undefined ? Boolean(updates.archived) : Boolean(habit.archived),
            updatedAt: new Date().toISOString(),
        };
    });

    saveHabitRecords(nextHabits);
    return nextHabits;
}

export function deleteHabit(id: string): HabitRecord[] {
    const habits = getHabitRecords().filter((habit) => habit.id !== id);
    saveHabitRecords(habits);
    removeHabitFromAllGoals(id);
    return habits;
}

export function setHabitCompleted(id: string, completed: boolean, date = getDateKey()): HabitRecord[] {
    const habits = getHabitRecords();
    const nextHabits = habits.map((habit) => {
        if (habit.id !== id) {
            return habit;
        }

        const completedDates = new Set(habit.completedDates);
        if (completed) {
            completedDates.add(date);
        } else {
            completedDates.delete(date);
        }

        return {
            ...habit,
            completedDates: Array.from(completedDates).sort(),
            updatedAt: new Date().toISOString(),
        };
    });

    saveHabitRecords(nextHabits);
    refreshStreakFromToday();
    return nextHabits;
}

export function toggleHabitComplete(id: string, date = getDateKey()): HabitRecord[] {
    const habit = getHabitRecords().find((entry) => entry.id === id);
    if (!habit) {
        return getHabitRecords();
    }

    return setHabitCompleted(id, !habit.completedDates.includes(date), date);
}

export function getCompletedHabitIdsForDate(date = getDateKey()): string[] {
    return getHabitRecords()
        .filter((habit) => habit.completedDates.includes(date))
        .map((habit) => habit.id);
}

export function getHabitCompletionPercent(date = getDateKey()): number {
    const habits = getHabitRecords();
    if (!habits.length) {
        return 0;
    }

    const completedToday = habits.filter((habit) => habit.completedDates.includes(date)).length;
    return Math.round((completedToday / habits.length) * 100);
}

export function getRequiredDailyActivityCount(): number {
    const habits = getHabitRecords();
    if (!habits.length) {
        return 0;
    }

    return Math.max(1, Math.ceil(habits.length / 2));
}

export type StreakState = {
    current: number;
    lastCompletedDate: string | null;
};

export function getStreakState(): StreakState {
    const state = readStorageJson<StreakState>(STREAK_STORAGE_KEY, { current: 0, lastCompletedDate: null });
    return state;
}

function saveStreakState(state: StreakState): StreakState {
    return writeStorageJson(STREAK_STORAGE_KEY, state);
}

export function computeStreakState(
    habits: HabitRecord[] = getHabitRecords(),
    existing: StreakState = getStreakState(),
    date = getDateKey(),
): StreakState {
    const required = habits.length ? Math.max(1, Math.ceil(habits.length / 2)) : 0;
    const todaysCompletion = habits.filter((habit) => habit.completedDates.includes(date)).length;

    if (required === 0) {
        return { current: 0, lastCompletedDate: null };
    }

    if (!existing.lastCompletedDate) {
        return todaysCompletion >= required
            ? { current: 1, lastCompletedDate: date }
            : { current: 0, lastCompletedDate: null };
    }

    if (existing.lastCompletedDate === date) {
        return todaysCompletion >= required
            ? { current: Math.max(existing.current || 1, 1), lastCompletedDate: date }
            : { current: 0, lastCompletedDate: null };
    }

    const dayDifference = Math.max(0, Math.round((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${existing.lastCompletedDate}T00:00:00Z`).getTime()) / 86400000));

    if (dayDifference > 1) {
        return { current: 0, lastCompletedDate: null };
    }

    if (todaysCompletion >= required) {
        const previousDate = new Date(`${date}T00:00:00Z`);
        previousDate.setUTCDate(previousDate.getUTCDate() - 1);
        const previousKey = getDateKey(previousDate);

        return {
            current: existing.lastCompletedDate === previousKey ? Math.max(1, (existing.current || 1) + 1) : 1,
            lastCompletedDate: date,
        };
    }

    return { current: 0, lastCompletedDate: null };
}

export function refreshStreakFromToday(): StreakState {
    const nextState = computeStreakState();
    return saveStreakState(nextState);
}

export function getCurrentStreak(): number {
    return computeStreakState().current;
}

export function markDailyActivityComplete(): StreakState {
    const today = getDateKey();
    const required = getRequiredDailyActivityCount();
    const currentState = getStreakState();

    if (required === 0 || getCompletedHabitIdsForDate(today).length < required) {
        return currentState;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const lastKey = currentState.lastCompletedDate;
    const streakCount = lastKey === getDateKey(yesterday) ? (currentState.current || 1) + 1 : 1;

    return saveStreakState({
        current: streakCount,
        lastCompletedDate: today,
    });
}
