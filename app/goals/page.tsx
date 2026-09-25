"use client";

import { useEffect, useState } from "react";
import { PencilLine, Plus, Target, Trash2 } from "lucide-react";
import { createGoal, deleteGoal, getGoals, linkHabitToGoal, setGoalProgress, unlinkHabitFromGoal, updateGoal, type GoalRecord } from "@/app/state/goalEngine";
import { getDateKey, getHabitRecords } from "@/app/state/habitEngine";
import { PageHeader } from "@/components/ui/page-shell";

function parseDateOnly(value: string): [number, number, number] | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function formatGoalDate(value: string): string {
    const parsed = parseDateOnly(value);
    if (!parsed) return "";

    const [year, month, day] = parsed;
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getDeadlineLabel(targetDate?: string): string {
    if (!targetDate) return "";

    const target = parseDateOnly(targetDate);
    const today = parseDateOnly(getDateKey());
    if (!target || !today) return "";

    const targetUtc = Date.UTC(target[0], target[1] - 1, target[2]);
    const todayUtc = Date.UTC(today[0], today[1] - 1, today[2]);
    const daysUntil = Math.round((targetUtc - todayUtc) / 86400000);
    const dateLabel = formatGoalDate(targetDate);

    if (daysUntil < 0) return `Target: ${dateLabel} · Overdue`;
    if (daysUntil === 0) return `Target: ${dateLabel} · Due today`;
    if (daysUntil <= 7) return `Target: ${dateLabel} · Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    return `Target: ${dateLabel}`;
}

export default function GoalsPage() {
    const [goals, setGoals] = useState<GoalRecord[]>([]);
    const [habits, setHabits] = useState<ReturnType<typeof getHabitRecords>>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<"Monthly" | "Quarterly" | "Yearly" | "Long-term">("Monthly");
    const [targetDate, setTargetDate] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingDescription, setEditingDescription] = useState("");
    const [editingCategory, setEditingCategory] = useState<"Monthly" | "Quarterly" | "Yearly" | "Long-term">("Monthly");
    const [editingTargetDate, setEditingTargetDate] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);

    const sync = () => {
        setGoals(getGoals());
        setHabits(getHabitRecords());
    };

    useEffect(() => {
        sync();
        window.addEventListener("mindset-store-update", sync);
        return () => window.removeEventListener("mindset-store-update", sync);
    }, []);

    const handleCreate = () => {
        const value = title.trim();
        if (!value) return;
        createGoal({ title: value, description, category, targetDate });
        setTitle("");
        setDescription("");
        setCategory("Monthly");
        setTargetDate("");
        setFeedback("Goal saved");
        sync();
    };

    const handleSaveEdit = (goalId: string) => {
        if (!editingTitle.trim()) return;
        updateGoal(goalId, {
            title: editingTitle,
            description: editingDescription,
            category: editingCategory,
            targetDate: editingTargetDate,
        });
        setEditingId(null);
        setFeedback("Goal updated");
        sync();
    };

    const handleToggleHabitLink = (goalId: string, habitId: string) => {
        const goal = goals.find((entry) => entry.id === goalId);
        if (!goal) return;

        if (goal.linkedHabitIds.includes(habitId)) {
            unlinkHabitFromGoal(goalId, habitId);
        } else {
            linkHabitToGoal(goalId, habitId);
        }

        setFeedback("Habit link updated");
        sync();
    };

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Goals" title="Your progress engine" description="Turn long-term goals into measurable progress." />
            {feedback ? <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{feedback}</p> : null}

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                        <Plus size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Create</p>
                        <h2 className="text-lg font-semibold text-white">Add a goal</h2>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="e.g. Build a 30-minute daily routine"
                        className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                    />
                    <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value as "Monthly" | "Quarterly" | "Yearly" | "Long-term")}
                        className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none transition focus:border-blue-500"
                    >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Yearly">Yearly</option>
                        <option value="Long-term">Long-term</option>
                    </select>
                    <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        Target date
                        <input
                            aria-label="Target date"
                            type="date"
                            value={targetDate}
                            onChange={(event) => setTargetDate(event.target.value)}
                            className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm font-normal normal-case tracking-normal text-white outline-none transition focus:border-blue-500"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
                    >
                        Save
                    </button>
                </div>
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional note or target outcome"
                    rows={2}
                    className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                />
            </section>

            <section className="grid gap-4">
                {goals.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
                        No active goals yet. Add your first goal above to define what matters next.
                    </div>
                ) : (
                    goals.map((goal) => {
                        const isEditing = editingId === goal.id;
                        const linkedHabits = habits.filter((habit) => goal.linkedHabitIds.includes(habit.id));

                        return (
                            <div key={goal.id} className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-5">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                                            <Target size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{goal.title}</p>
                                            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{goal.category}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">{goal.progress}%</span>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input
                                            value={editingTitle}
                                            onChange={(event) => setEditingTitle(event.target.value)}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                                        />
                                        <textarea
                                            value={editingDescription}
                                            onChange={(event) => setEditingDescription(event.target.value)}
                                            rows={2}
                                            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                                        />
                                        <select
                                            value={editingCategory}
                                            onChange={(event) => setEditingCategory(event.target.value as "Monthly" | "Quarterly" | "Yearly" | "Long-term")}
                                            className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white"
                                        >
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Yearly">Yearly</option>
                                            <option value="Long-term">Long-term</option>
                                        </select>
                                        <label className="flex min-w-0 flex-col gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                                            Target date
                                            <input
                                                aria-label="Edit target date"
                                                type="date"
                                                value={editingTargetDate}
                                                onChange={(event) => setEditingTargetDate(event.target.value)}
                                                className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white"
                                            />
                                        </label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => handleSaveEdit(goal.id)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white">Save</button>
                                            <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-200">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {goal.description ? <p className="mb-3 text-sm text-slate-300">{goal.description}</p> : null}
                                        {goal.targetDate ? <p className="mb-3 text-xs font-medium text-slate-400">{getDeadlineLabel(goal.targetDate)}</p> : null}

                                        <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500"
                                                style={{ width: `${goal.progress}%` }}
                                            />
                                        </div>

                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {[25, 50, 75, 100].map((value) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => {
                                                        setGoalProgress(goal.id, value);
                                                        sync();
                                                    }}
                                                    className="rounded-xl border border-slate-700 bg-slate-950/40 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-blue-500/40 hover:text-white"
                                                >
                                                    {value}%
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mb-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-3">
                                            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">Linked habits</p>
                                            <div className="flex flex-wrap gap-2">
                                                {habits.length === 0 ? (
                                                    <span className="text-xs text-slate-500">No habits created yet.</span>
                                                ) : habits.map((habit) => {
                                                    const active = goal.linkedHabitIds.includes(habit.id);
                                                    return (
                                                        <button
                                                            key={habit.id}
                                                            type="button"
                                                            onClick={() => handleToggleHabitLink(goal.id, habit.id)}
                                                            className={`rounded-full border px-2.5 py-1 text-[11px] ${active ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900 text-slate-300"}`}
                                                        >
                                                            {habit.title}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {linkedHabits.length > 0 ? (
                                                <p className="mt-2 text-[11px] text-slate-400">Connected to: {linkedHabits.map((item) => item.title).join(", ")}</p>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(goal.id);
                                                    setEditingTitle(goal.title);
                                                    setEditingDescription(goal.description);
                                                    setEditingCategory(goal.category);
                                                    setEditingTargetDate(goal.targetDate || "");
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-200"
                                            >
                                                <PencilLine size={14} /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm("Delete this goal?")) {
                                                        deleteGoal(goal.id);
                                                        setFeedback("Goal deleted");
                                                        sync();
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
}
