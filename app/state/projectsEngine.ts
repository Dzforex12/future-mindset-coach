import { readStorageJson, writeStorageJson } from "./persistence";

export type ProjectTask = { id: string; title: string; complete: boolean; dueDate?: string };
export type Project = {
    id: string;
    title: string;
    description: string;
    category: string;
    status: "Planning" | "Active" | "Paused" | "Completed";
    progress: number;
    deadline: string;
    tasks: ProjectTask[];
};

const STORAGE_KEY = "future-mindset-projects";

export function getProjects(): Project[] {
    const value = readStorageJson<unknown>(STORAGE_KEY, []);
    return Array.isArray(value) ? value as Project[] : [];
}

export function saveProjects(projects: Project[]): Project[] {
    return writeStorageJson(STORAGE_KEY, projects);
}