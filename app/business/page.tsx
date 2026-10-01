"use client";

import { useEffect, useState } from "react";
import { getBusinessData, saveBusinessData, type BusinessData, type BusinessGoal, type BusinessLead as Lead, type BusinessTask } from "@/app/state/businessEngine";

const emptyBusinessData: BusinessData = { goals: [], tasks: [], leads: [], monthlyTarget: 0, revenue: 0 };

export default function BusinessPage() {
    const [data, setData] = useState<BusinessData>(emptyBusinessData);
    const [goalDraft, setGoalDraft] = useState({ title: "", description: "", target: "", deadline: "", status: "New" as BusinessGoal["status"] });
    const [taskDraft, setTaskDraft] = useState({ title: "", description: "", priority: "Medium" as BusinessTask["priority"], deadline: "" });
    const [leadDraft, setLeadDraft] = useState({ name: "", business: "", note: "", status: "New" as Lead["status"] });
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState({ title: "", description: "", priority: "Medium" as BusinessTask["priority"], deadline: "" });

    useEffect(() => {
        const sync = () => setData(getBusinessData());
        sync();
        window.addEventListener("mindset-store-update", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("mindset-store-update", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    const updateData = (next: BusinessData) => {
        setData(next);
        saveBusinessData(next);
    };

    const updateTask = (taskId: string, updates: Partial<BusinessTask>) => {
        updateData({ ...data, tasks: data.tasks.map((task) => task.id === taskId ? { ...task, ...updates } : task) });
    };

    const addGoal = () => {
        if (!goalDraft.title.trim()) return;
        const next: BusinessData = {
            ...data,
            goals: [
                ...data.goals,
                {
                    id: crypto.randomUUID?.() ?? `goal-${Date.now()}`,
                    title: goalDraft.title.trim(),
                    description: goalDraft.description.trim(),
                    target: goalDraft.target.trim(),
                    deadline: goalDraft.deadline,
                    progress: 0,
                    status: goalDraft.status,
                },
            ],
        };
        updateData(next);
        setGoalDraft({ title: "", description: "", target: "", deadline: "", status: "New" });
    };

    const addTask = () => {
        if (!taskDraft.title.trim()) return;
        const next: BusinessData = {
            ...data,
            tasks: [
                ...data.tasks,
                {
                    id: crypto.randomUUID?.() ?? `task-${Date.now()}`,
                    title: taskDraft.title.trim(),
                    description: taskDraft.description.trim(),
                    priority: taskDraft.priority,
                    deadline: taskDraft.deadline,
                    complete: false,
                },
            ],
        };
        updateData(next);
        setTaskDraft({ title: "", description: "", priority: "Medium", deadline: "" });
    };

    const addLead = () => {
        if (!leadDraft.name.trim()) return;
        const next: BusinessData = {
            ...data,
            leads: [
                ...data.leads,
                {
                    id: crypto.randomUUID?.() ?? `lead-${Date.now()}`,
                    name: leadDraft.name.trim(),
                    business: leadDraft.business.trim(),
                    note: leadDraft.note.trim(),
                    status: leadDraft.status,
                },
            ],
        };
        updateData(next);
        setLeadDraft({ name: "", business: "", note: "", status: "New" });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-[#0a1524]/80 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">Operating system</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Business</h1>
            </div>

            <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Monthly target</p>
                    <input
                        type="number"
                        value={data.monthlyTarget}
                        onChange={(event) => updateData({ ...data, monthlyTarget: Number(event.target.value) || 0 })}
                        className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-lg font-semibold text-white outline-none"
                    />
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Revenue tracked</p>
                    <input
                        type="number"
                        value={data.revenue}
                        onChange={(event) => updateData({ ...data, revenue: Number(event.target.value) || 0 })}
                        className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-lg font-semibold text-white outline-none"
                    />
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Goals</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{data.goals.length}</p>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Open tasks</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{data.tasks.filter((task) => !task.complete).length}</p>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <h2 className="text-xl font-semibold text-white">Business goals</h2>
                    <div className="mt-4 space-y-3">
                        {data.goals.length ? data.goals.map((goal) => (
                            <div key={goal.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium text-white">{goal.title}</p>
                                    <span className="rounded-full bg-sky-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-sky-300">{goal.status}</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-400">{goal.description || "No description"}</p>
                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-xs text-slate-400"><span>Target</span><span>{goal.target || "—"}</span></div>
                                    <div className="flex justify-between text-xs text-slate-400"><span>Deadline</span><span>{goal.deadline || "—"}</span></div>
                                    <label className="flex items-center justify-between text-xs text-slate-400"><span>Progress</span><input aria-label={`${goal.title} progress`} type="number" min="0" max="100" value={goal.progress} onChange={(event) => updateData({ ...data, goals: data.goals.map((entry) => entry.id === goal.id ? { ...entry, progress: Math.max(0, Math.min(100, Number(event.target.value) || 0)) } : entry) })} className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-right text-white" /></label>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" style={{ width: `${Math.min(goal.progress, 100)}%` }} /></div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400">No business goals yet.</p>}
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                        <input value={goalDraft.title} onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })} placeholder="Business goal title" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        <textarea value={goalDraft.description} onChange={(event) => setGoalDraft({ ...goalDraft, description: event.target.value })} placeholder="Description" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" rows={2} />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input value={goalDraft.target} onChange={(event) => setGoalDraft({ ...goalDraft, target: event.target.value })} placeholder="Target" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                            <input type="date" value={goalDraft.deadline} onChange={(event) => setGoalDraft({ ...goalDraft, deadline: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        </div>
                        <select value={goalDraft.status} onChange={(event) => setGoalDraft({ ...goalDraft, status: event.target.value as BusinessGoal["status"] })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white">
                            <option>New</option>
                            <option>Active</option>
                            <option>Reached</option>
                            <option>Paused</option>
                        </select>
                        <button type="button" onClick={addGoal} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-medium text-white">Add goal</button>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <h2 className="text-xl font-semibold text-white">Tasks</h2>
                    <div className="mt-4 space-y-3">
                        {data.tasks.length ? data.tasks.map((task) => (
                            <div key={task.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                                {editingTaskId === task.id ? (
                                    <div className="space-y-2">
                                        <input aria-label="Edit task title" value={editingTask.title} onChange={(event) => setEditingTask({ ...editingTask, title: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                        <textarea aria-label="Edit task description" value={editingTask.description} onChange={(event) => setEditingTask({ ...editingTask, description: event.target.value })} rows={2} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <select aria-label="Edit task priority" value={editingTask.priority} onChange={(event) => setEditingTask({ ...editingTask, priority: event.target.value as BusinessTask["priority"] })} className="rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"><option>Low</option><option>Medium</option><option>High</option></select>
                                            <input aria-label="Edit task deadline" type="date" value={editingTask.deadline} onChange={(event) => setEditingTask({ ...editingTask, deadline: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                        </div>
                                        <div className="flex gap-2"><button type="button" onClick={() => { updateTask(task.id, editingTask); setEditingTaskId(null); }} className="rounded-xl bg-blue-600 px-3 py-2 text-xs text-white">Save</button><button type="button" onClick={() => setEditingTaskId(null)} className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200">Cancel</button></div>
                                    </div>
                                ) : <>
                                    <div className="flex items-center justify-between gap-3">
                                        <p className={`font-medium text-white ${task.complete ? "line-through opacity-60" : ""}`}>{task.title}</p>
                                        <button type="button" onClick={() => updateTask(task.id, { complete: !task.complete })} className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${task.complete ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-700 text-slate-200"}`}>
                                            {task.complete ? "Done" : "Open"}
                                        </button>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">{task.description || "No description"}</p>
                                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400"><span>{task.priority}</span><span>{task.deadline || "No date"}</span></div>
                                    <div className="mt-3 flex gap-2"><button type="button" onClick={() => { setEditingTaskId(task.id); setEditingTask({ title: task.title, description: task.description, priority: task.priority, deadline: task.deadline }); }} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200">Edit</button><button type="button" onClick={() => { if (window.confirm("Delete this business task?")) updateData({ ...data, tasks: data.tasks.filter((entry) => entry.id !== task.id) }); }} className="rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-xs text-rose-200">Delete</button></div>
                                </>}
                            </div>
                        )) : <p className="text-sm text-slate-400">No tasks yet.</p>}
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                        <input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} placeholder="Task title" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        <textarea value={taskDraft.description} onChange={(event) => setTaskDraft({ ...taskDraft, description: event.target.value })} placeholder="Description" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" rows={2} />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <select value={taskDraft.priority} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value as BusinessTask["priority"] })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white">
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                            <input type="date" value={taskDraft.deadline} onChange={(event) => setTaskDraft({ ...taskDraft, deadline: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        </div>
                        <button type="button" onClick={addTask} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-medium text-white">Add task</button>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <h2 className="text-xl font-semibold text-white">Leads / customers</h2>
                    <div className="mt-4 space-y-3">
                        {data.leads.length ? data.leads.map((lead) => (
                            <div key={lead.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-medium text-white">{lead.name}</p>
                                    <select aria-label={`${lead.name} status`} value={lead.status} onChange={(event) => updateData({ ...data, leads: data.leads.map((entry) => entry.id === lead.id ? { ...entry, status: event.target.value as Lead["status"] } : entry) })} className="max-w-36 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-amber-300"><option>New</option><option>Contacted</option><option>Interested</option><option>Client</option><option>Lost</option></select>
                                </div>
                                <p className="mt-2 text-sm text-slate-400">{lead.business || "No business"}</p>
                                <p className="mt-2 text-sm text-slate-300">{lead.note || "No note"}</p>
                            </div>
                        )) : <p className="text-sm text-slate-400">No leads yet.</p>}
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                        <input value={leadDraft.name} onChange={(event) => setLeadDraft({ ...leadDraft, name: event.target.value })} placeholder="Client or lead name" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        <input value={leadDraft.business} onChange={(event) => setLeadDraft({ ...leadDraft, business: event.target.value })} placeholder="Business or project" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        <textarea value={leadDraft.note} onChange={(event) => setLeadDraft({ ...leadDraft, note: event.target.value })} placeholder="Note" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" rows={2} />
                        <select value={leadDraft.status} onChange={(event) => setLeadDraft({ ...leadDraft, status: event.target.value as Lead["status"] })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white">
                            <option>New</option>
                            <option>Contacted</option>
                            <option>Interested</option>
                            <option>Client</option>
                            <option>Lost</option>
                        </select>
                        <button type="button" onClick={addLead} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-medium text-white">Add lead</button>
                    </div>
                </div>
            </section>
        </div>
    );
}
