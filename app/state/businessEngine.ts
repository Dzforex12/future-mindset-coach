import { readStorageJson, writeStorageJson } from "./persistence";

export type BusinessGoal = {
    id: string;
    title: string;
    description: string;
    target: string;
    deadline: string;
    progress: number;
    status: "New" | "Active" | "Reached" | "Paused";
};

export type BusinessTask = {
    id: string;
    title: string;
    description: string;
    priority: "Low" | "Medium" | "High";
    deadline: string;
    complete: boolean;
};

export type BusinessLead = {
    id: string;
    name: string;
    business: string;
    note: string;
    status: "New" | "Contacted" | "Interested" | "Client" | "Lost";
};

export type BusinessData = {
    goals: BusinessGoal[];
    tasks: BusinessTask[];
    leads: BusinessLead[];
    monthlyTarget: number;
    revenue: number;
};

const STORAGE_KEY = "future-mindset-business";
const EMPTY_BUSINESS: BusinessData = { goals: [], tasks: [], leads: [], monthlyTarget: 0, revenue: 0 };

export function getBusinessData(): BusinessData {
    const value = readStorageJson<Partial<BusinessData>>(STORAGE_KEY, EMPTY_BUSINESS);
    return {
        goals: Array.isArray(value.goals) ? value.goals : [],
        tasks: Array.isArray(value.tasks) ? value.tasks : [],
        leads: Array.isArray(value.leads) ? value.leads : [],
        monthlyTarget: Number.isFinite(value.monthlyTarget) ? Number(value.monthlyTarget) : 0,
        revenue: Number.isFinite(value.revenue) ? Number(value.revenue) : 0,
    };
}

export function saveBusinessData(value: BusinessData): BusinessData {
    return writeStorageJson(STORAGE_KEY, value);
}

export function getBusinessProgress(value = getBusinessData()): number | null {
    if (value.goals.length) {
        return Math.round(value.goals.reduce((total, goal) => total + Math.max(0, Math.min(100, goal.progress || 0)), 0) / value.goals.length);
    }

    if (value.tasks.length) {
        return Math.round((value.tasks.filter((task) => task.complete).length / value.tasks.length) * 100);
    }

    return null;
}