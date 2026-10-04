"use client";

import { useState } from "react";
import { Check, Target } from "lucide-react";
import type { BusinessData } from "@/app/state/businessEngine";
import type { GoalRecord } from "@/app/state/goalEngine";
import type { Project } from "@/app/state/projectsEngine";

export function GoalActionCard({
    goals,
    action,
    onSave,
    onComplete,
}: {
    goals: GoalRecord[];
    action: { goalId: string; action: string; completed: boolean } | null;
    onSave: (goalId: string, action: string) => void;
    onComplete: (completed: boolean) => void;
}) {
    const [goalId, setGoalId] = useState(action?.goalId ?? "");
    const [nextAction, setNextAction] = useState(action?.action ?? "");

    return <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5">
        <div className="flex items-center gap-2"><Target size={17} className="text-violet-300" /><h2 className="text-base font-semibold text-white">Move One Goal Forward</h2></div>
        {goals.length ? <>
            <select value={goalId} onChange={(event) => setGoalId(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                <option value="">Choose an active goal</option>
                {goals.filter((goal) => !goal.completed && !goal.archived).map((goal) => <option key={goal.id} value={goal.id}>{goal.title} · {goal.progress}%</option>)}
            </select>
            {goalId ? <div className="mt-3 space-y-2">
                <label className="block text-xs text-slate-400" htmlFor="goal-next-action">Today&apos;s next action</label>
                <textarea id="goal-next-action" value={nextAction} onChange={(event) => setNextAction(event.target.value)} maxLength={300} rows={2} className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500" />
                <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={!nextAction.trim()} onClick={() => onSave(goalId, nextAction)} className="min-h-10 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Save action</button>
                    {action?.goalId === goalId && action.action ? <button type="button" onClick={() => onComplete(!action.completed)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${action.completed ? "border-emerald-500/40 text-emerald-300" : "border-slate-700 text-slate-200"}`}><Check size={15} />{action.completed ? "Action complete" : "Mark complete"}</button> : null}
                </div>
                <p className="text-[11px] text-slate-500">Completing this action does not change goal progress.</p>
            </div> : null}
        </> : <p className="mt-3 text-sm text-slate-500">No active goals to move forward yet.</p>}
    </section>;
}

export function ProjectFocusCard({
    projects,
    focus,
    onSelect,
    onComplete,
}: {
    projects: Project[];
    focus: { projectId: string; taskId: string } | null;
    onSelect: (projectId: string, taskId: string) => void;
    onComplete: () => void;
}) {
    const projectList = projects.filter((project) => project.status === "Active" && project.tasks.some((task) => !task.complete));
    const selection = focus ? `${focus.projectId}:${focus.taskId}` : "";
    if (!projectList.length) return null;
    const selected = projectList.flatMap((project) => project.tasks.filter((task) => !task.complete).map((task) => ({ project, task }))).find(({ project, task }) => `${project.id}:${task.id}` === selection);

    return <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
        <h2 className="text-sm font-semibold text-white">Project focus</h2>
        <select value={selection} onChange={(event) => { const [projectId, taskId] = event.target.value.split(":"); onSelect(projectId ?? "", taskId ?? ""); }} className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
            <option value="">Choose an open project task</option>
            {projectList.flatMap((project) => project.tasks.filter((task) => !task.complete).map((task) => <option key={`${project.id}:${task.id}`} value={`${project.id}:${task.id}`}>{project.title}: {task.title}</option>))}
        </select>
        {selected ? <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300"><span className="min-w-0 truncate">{selected.task.title}</span><button type="button" onClick={onComplete} className="min-h-10 shrink-0 rounded-lg border border-emerald-500/30 px-3 text-xs text-emerald-200">Complete task</button></div> : null}
    </section>;
}

export function BusinessFocusCard({
    business,
    focusTaskId,
    onSelect,
    onComplete,
}: {
    business: BusinessData;
    focusTaskId: string;
    onSelect: (taskId: string) => void;
    onComplete: () => void;
}) {
    const tasks = business.tasks.filter((task) => !task.complete);
    const selectedTask = tasks.find((task) => task.id === focusTaskId);
    if (!tasks.length) return null;
    return <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
        <h2 className="text-sm font-semibold text-white">Business focus</h2>
        <select value={focusTaskId} onChange={(event) => onSelect(event.target.value)} className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
            <option value="">Choose an open business task</option>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
        {selectedTask ? <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-300"><span className="min-w-0 truncate">{selectedTask.title}</span><button type="button" onClick={onComplete} className="min-h-10 shrink-0 rounded-lg border border-emerald-500/30 px-3 text-xs text-emerald-200">Complete task</button></div> : null}
    </section>;
}
