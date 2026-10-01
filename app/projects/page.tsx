"use client";

import { useEffect, useState } from "react";
import { getProjects, saveProjects, type Project } from "@/app/state/projectsEngine";

const emptyProjects: Project[] = [];

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>(emptyProjects);
    const [draft, setDraft] = useState({ title: "", description: "", category: "General", status: "Planning" as Project["status"], deadline: "" });
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [taskDrafts, setTaskDrafts] = useState<Record<string, { title: string; dueDate: string }>>({});

    useEffect(() => {
        const sync = () => setProjects(getProjects());
        sync();
        window.addEventListener("mindset-store-update", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("mindset-store-update", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    const updateProjects = (next: Project[]) => {
        setProjects(next);
        saveProjects(next);
    };

    const addProject = () => {
        if (!draft.title.trim()) return;
        updateProjects([
            ...projects,
            {
                id: crypto.randomUUID?.() ?? `project-${Date.now()}`,
                title: draft.title.trim(),
                description: draft.description.trim(),
                category: draft.category,
                status: draft.status,
                progress: 0,
                deadline: draft.deadline,
                tasks: [],
            },
        ]);
        setDraft({ title: "", description: "", category: "General", status: "Planning", deadline: "" });
    };

    const toggleTask = (projectId: string, taskId: string) => {
        updateProjects(projects.map((project) => {
            if (project.id !== projectId) return project;
            const tasks = project.tasks.map((task) => task.id === taskId ? { ...task, complete: !task.complete } : task);
            const progress = tasks.length ? Math.round((tasks.filter((task) => task.complete).length / tasks.length) * 100) : project.progress;
            return { ...project, tasks, progress };
        }));
    };

    const addTaskToProject = (projectId: string) => {
        const taskDraft = taskDrafts[projectId] || { title: "", dueDate: "" };
        const { title, dueDate } = taskDraft;
        const trimmed = title.trim();
        if (!trimmed) return;
        updateProjects(projects.map((project) => project.id === projectId ? {
            ...project,
            tasks: [...project.tasks, { id: crypto.randomUUID?.() ?? `task-${Date.now()}`, title: trimmed, complete: false, dueDate }],
        } : project));
        setTaskDrafts({ ...taskDrafts, [projectId]: { title: "", dueDate: "" } });
    };

    const updateProject = (projectId: string, updates: Partial<Project>) => {
        updateProjects(projects.map((project) => project.id === projectId ? { ...project, ...updates } : project));
    };

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-[#0a1524]/80 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">Portfolio</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Projects</h1>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_2fr]">
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <h2 className="text-xl font-semibold text-white">New project</h2>
                    <div className="mt-4 space-y-3">
                        <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Project title" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Description" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" rows={3} />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Category" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                            <input type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        </div>
                        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Project["status"] })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white">
                            <option>Planning</option>
                            <option>Active</option>
                            <option>Paused</option>
                            <option>Completed</option>
                        </select>
                        <button type="button" onClick={addProject} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-medium text-white">Create project</button>
                    </div>
                </div>

                <div className="space-y-4">
                    {projects.length ? projects.map((project) => (
                        <div key={project.id} className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                            {editingProject?.id === project.id ? (
                                <div className="mb-4 space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
                                    <input aria-label="Project title" value={editingProject.title} onChange={(event) => setEditingProject({ ...editingProject, title: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                    <textarea aria-label="Project description" value={editingProject.description} onChange={(event) => setEditingProject({ ...editingProject, description: event.target.value })} rows={2} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <input aria-label="Project category" value={editingProject.category} onChange={(event) => setEditingProject({ ...editingProject, category: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                        <input aria-label="Project deadline" type="date" value={editingProject.deadline} onChange={(event) => setEditingProject({ ...editingProject, deadline: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <select aria-label="Project status" value={editingProject.status} onChange={(event) => setEditingProject({ ...editingProject, status: event.target.value as Project["status"] })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"><option>Planning</option><option>Active</option><option>Paused</option><option>Completed</option></select>
                                        <label className="flex items-center gap-2 text-xs text-slate-400">Progress % <input aria-label="Project progress" type="number" min="0" max="100" value={editingProject.progress} onChange={(event) => setEditingProject({ ...editingProject, progress: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" /></label>
                                    </div>
                                    <div className="flex gap-2"><button type="button" onClick={() => { updateProject(project.id, editingProject); setEditingProject(null); }} className="rounded-xl bg-blue-600 px-3 py-2 text-xs text-white">Save project</button><button type="button" onClick={() => setEditingProject(null)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200">Cancel</button></div>
                                </div>
                            ) : null}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xl font-semibold text-white">{project.title}</p>
                                    <p className="text-sm text-slate-400">{project.category}</p>
                                </div>
                                <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-sky-300">{project.status}</span>
                            </div>

                            <p className="mt-3 text-sm text-slate-300">{project.description || "No description"}</p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Progress</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{project.progress}%</p>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Deadline</p>
                                    <p className="mt-2 text-sm font-medium text-white">{project.deadline || "—"}</p>
                                </div>
                                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2">
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Tasks</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{project.tasks.length}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {project.tasks.length ? project.tasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                                        <div className="flex items-center gap-3">
                                            <button type="button" aria-label={`${task.complete ? "Uncomplete" : "Complete"} ${task.title}`} onClick={() => toggleTask(project.id, task.id)} className={`flex h-5 w-5 items-center justify-center rounded-full ${task.complete ? "bg-emerald-500 text-white" : "border border-slate-500 bg-transparent"}`}>
                                                {task.complete ? "✓" : ""}
                                            </button>
                                            <span className={task.complete ? "text-slate-400 line-through" : "text-slate-200"}>{task.title}</span>
                                        </div>
                                        {task.dueDate ? <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{task.dueDate}</span> : null}
                                    </div>
                                )) : <p className="text-sm text-slate-400">No tasks yet.</p>}
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                                <input
                                    placeholder="Add task"
                                    value={taskDrafts[project.id]?.title || ""}
                                    onChange={(event) => setTaskDrafts({ ...taskDrafts, [project.id]: { ...taskDrafts[project.id], title: event.target.value, dueDate: taskDrafts[project.id]?.dueDate || "" } })}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            addTaskToProject(project.id);
                                        }
                                    }}
                                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
                                />
                                <input aria-label={`${project.title} task deadline`} type="date" value={taskDrafts[project.id]?.dueDate || ""} onChange={(event) => setTaskDrafts({ ...taskDrafts, [project.id]: { ...taskDrafts[project.id], title: taskDrafts[project.id]?.title || "", dueDate: event.target.value } })} className="min-w-0 rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                <button type="button" onClick={() => addTaskToProject(project.id)} className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white">Add</button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button type="button" onClick={() => setEditingProject({ ...project, tasks: [...project.tasks] })} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200">Edit project</button>
                                <button type="button" onClick={() => { if (window.confirm("Delete this project and its tasks?")) updateProjects(projects.filter((entry) => entry.id !== project.id)); }} className="rounded-xl border border-rose-500/40 px-3 py-2 text-xs text-rose-200">Delete project</button>
                            </div>
                        </div>
                    )) : <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-5 text-slate-400">No projects yet.</div>}
                </div>
            </div>
        </div>
    );
}
