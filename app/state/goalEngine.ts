import { readStorageJson, writeStorageJson } from "./persistence";

export type GoalCategory = "Monthly" | "Quarterly" | "Yearly" | "Long-term";

export type GoalRecord = {
    id: string;
    title: string;
    description: string;
    category: GoalCategory;
    progress: number;
    completed: boolean;
    targetDate?: string;
    linkedHabitIds: string[];
    archived?: boolean;
    createdAt: string;
    updatedAt: string;
};

export type GoalInput = {
    title: string;
    description?: string;
    category: GoalCategory;
    targetDate?: string;
    linkedHabitIds?: string[];
    progress?: number;
    archived?: boolean;
};

const STORAGE_KEY = "future-mindset-goals";

function clampProgress(value: number): number {
    return Math.max(0, Math.min(100, value));
}

function normalizeGoalLinkedHabitIds(linkedHabitIds: unknown): string[] {
    if (!Array.isArray(linkedHabitIds)) {
        return [];
    }

    return Array.from(
        new Set(
            linkedHabitIds
                .filter((id): id is string => typeof id === "string")
                .map((id) => id.trim())
                .filter(Boolean),
        ),
    );
}

function normalizeGoals(goals: GoalRecord[]): GoalRecord[] {
    return goals.map((goal) => ({
        ...goal,
        linkedHabitIds: normalizeGoalLinkedHabitIds(goal.linkedHabitIds),
        title: typeof goal.title === "string" ? goal.title : "New goal",
        description: typeof goal.description === "string" ? goal.description : "",
    }));
}

export function createId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getGoals(): GoalRecord[] {
    return normalizeGoals(readStorageJson<GoalRecord[]>(STORAGE_KEY, []));
}

export function saveGoals(goals: GoalRecord[]): GoalRecord[] {
    const nextGoals = normalizeGoals(goals);
    return writeStorageJson(STORAGE_KEY, nextGoals);
}

export function createGoal(input: GoalInput): GoalRecord {
    const goal: GoalRecord = {
        id: createId(),
        title: input.title.trim() || "New goal",
        description: input.description?.trim() || "",
        category: input.category,
        progress: typeof input.progress === "number" ? clampProgress(input.progress) : 0,
        completed: Boolean(input.progress && clampProgress(input.progress) >= 100),
        targetDate: input.targetDate || "",
        linkedHabitIds: normalizeGoalLinkedHabitIds(input.linkedHabitIds),
        archived: Boolean(input.archived),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const goals = getGoals();
    saveGoals([...goals, goal]);
    return goal;
}

export function updateGoal(id: string, updates: Partial<Pick<GoalRecord, "title" | "description" | "category" | "targetDate" | "linkedHabitIds" | "progress" | "completed" | "archived">>): GoalRecord[] {
    const goals = getGoals();
    const nextGoals = goals.map((goal) => {
        if (goal.id !== id) {
            return goal;
        }

        const nextProgress = updates.progress !== undefined ? clampProgress(updates.progress) : goal.progress;
        const nextCompleted = updates.completed !== undefined ? Boolean(updates.completed) : goal.completed;

        return {
            ...goal,
            title: updates.title?.trim() || goal.title,
            description: updates.description !== undefined ? updates.description.trim() : goal.description,
            category: updates.category || goal.category,
            targetDate: updates.targetDate !== undefined ? updates.targetDate : goal.targetDate,
            linkedHabitIds: Array.isArray(updates.linkedHabitIds)
                ? normalizeGoalLinkedHabitIds(updates.linkedHabitIds)
                : normalizeGoalLinkedHabitIds(goal.linkedHabitIds),
            progress: nextProgress,
            completed: nextCompleted || nextProgress >= 100,
            archived: updates.archived !== undefined ? Boolean(updates.archived) : Boolean(goal.archived),
            updatedAt: new Date().toISOString(),
        };
    });

    saveGoals(nextGoals);
    return nextGoals;
}

export function linkHabitToGoal(goalId: string, habitId: string): GoalRecord[] {
    const goals = getGoals();
    const nextGoals = goals.map((goal) => {
        if (goal.id !== goalId) {
            return goal;
        }

        const linkedHabitIds = new Set(goal.linkedHabitIds);
        linkedHabitIds.add(habitId);

        return {
            ...goal,
            linkedHabitIds: Array.from(linkedHabitIds),
            updatedAt: new Date().toISOString(),
        };
    });

    saveGoals(nextGoals);
    return nextGoals;
}

export function unlinkHabitFromGoal(goalId: string, habitId: string): GoalRecord[] {
    const goals = getGoals();
    const nextGoals = goals.map((goal) => {
        if (goal.id !== goalId) {
            return goal;
        }

        return {
            ...goal,
            linkedHabitIds: goal.linkedHabitIds.filter((id) => id !== habitId),
            updatedAt: new Date().toISOString(),
        };
    });

    saveGoals(nextGoals);
    return nextGoals;
}

export function removeHabitFromAllGoals(habitId: string): GoalRecord[] {
    const nextGoals = getGoals().map((goal) => ({
        ...goal,
        linkedHabitIds: normalizeGoalLinkedHabitIds(goal.linkedHabitIds).filter((id) => id !== habitId),
        updatedAt: new Date().toISOString(),
    }));

    saveGoals(nextGoals);
    return nextGoals;
}

export function deleteGoal(id: string): GoalRecord[] {
    const goals = getGoals().filter((goal) => goal.id !== id);
    saveGoals(goals);
    return goals;
}

export function setGoalProgress(goalId: string, progress: number, category?: GoalCategory): GoalRecord[] {
    const nextProgress = clampProgress(progress);
    const goals = getGoals();
    const nextGoals = goals.map((goal) => {
        if (goal.id !== goalId || (category && goal.category !== category)) {
            return goal;
        }

        const completed = nextProgress >= 100;
        return {
            ...goal,
            progress: nextProgress,
            completed,
            updatedAt: new Date().toISOString(),
        };
    });

    saveGoals(nextGoals);
    return nextGoals;
}

export function markGoalComplete(goalId: string, category?: GoalCategory): GoalRecord[] {
    return setGoalProgress(goalId, 100, category);
}

export function getGoalsByCategory(category: GoalCategory): GoalRecord[] {
    return getGoals().filter((goal) => goal.category === category);
}

export function getOverallGoalProgress(): number {
    const goals = getGoals();
    if (!goals.length) {
        return 0;
    }

    const totalProgress = goals.reduce((total, goal) => total + goal.progress, 0);
    return Math.round(totalProgress / goals.length);
}
