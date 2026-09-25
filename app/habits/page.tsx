"use client";

import { useEffect, useState } from "react";
import { CheckCheck, Flame, PencilLine, Plus, Trash2 } from "lucide-react";
import { createHabit, deleteHabit, getCurrentStreak, getHabitCompletionPercent, getHabitRecords, toggleHabitComplete, updateHabit, type HabitRecord } from "@/app/state/habitEngine";
import { PageHeader } from "@/components/ui/page-shell";

export default function HabitsPage() {
    const [habits, setHabits] = useState<HabitRecord[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [streak, setStreak] = useState(0);
    const [completion, setCompletion] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingDescription, setEditingDescription] = useState("");
    const [feedback, setFeedback] = useState<string | null>(null);

    const sync = () => {
        setHabits(getHabitRecords());
        setStreak(getCurrentStreak());
        setCompletion(getHabitCompletionPercent());
        setIsHydrated(true);
    };

    useEffect(() => {
        sync();
        window.addEventListener("mindset-store-update", sync);
        return () => window.removeEventListener("mindset-store-update", sync);
    }, []);

    const handleCreate = () => {
        const value = title.trim();
        if (!value) return;
        createHabit({ title: value, description });
        setTitle("");
        setDescription("");
        setFeedback("Habit saved");
        sync();
    };

    const handleSaveEdit = (habitId: string) => {
        if (!editingTitle.trim()) return;
        updateHabit(habitId, {
            title: editingTitle,
            description: editingDescription,
        });
        setEditingId(null);
        setFeedback("Habit updated");
        sync();
    };

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Habits" title="Daily execution system" description="Build repeatable actions and track what you complete today." />
            {feedback ? <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{feedback}</p> : null}

            <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                            <CheckCheck size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Completion</p>
                            <p className="mt-1 text-lg font-semibold text-white">{completion}%</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                            <Flame size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Streak</p>
                            <p className="mt-1 text-lg font-semibold text-white">{streak} days</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                        <Plus size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Add habit</p>
                        <h2 className="text-lg font-semibold text-white">Create a new habit</h2>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="e.g. Study market structure"
                        className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                    />
                    <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Optional habit note"
                        rows={2}
                        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                    />
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
                    >
                        Save habit
                    </button>
                </div>
            </section>

            <section className="grid gap-4">
                {habits.length === 0 ? (
                    <div className="rounded-[28px] border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-slate-400">
                        No habits yet. Add your first habit above to start building consistency.
                    </div>
                ) : (
                    habits.map((habit) => {
                        const done = isHydrated && habit.completedDates.includes(new Date().toISOString().slice(0, 10));
                        const isEditing = editingId === habit.id;

                        return (
                            <div key={habit.id} className={`rounded-[28px] border p-4 sm:p-5 ${done ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-slate-800/80 bg-slate-900/75"} shadow-[0_20px_60px_rgba(15,23,42,0.2)]`}>
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
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => handleSaveEdit(habit.id)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white">Save</button>
                                            <button type="button" onClick={() => setEditingId(null)} className="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-200">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium text-white">{habit.title}</p>
                                                {habit.description ? <p className="mt-1 text-xs text-slate-400">{habit.description}</p> : null}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    toggleHabitComplete(habit.id);
                                                    sync();
                                                }}
                                                className={`rounded-full px-3 py-1.5 text-xs font-medium ${done ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-200"}`}
                                            >
                                                {done ? "Done" : "Mark done"}
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingId(habit.id);
                                                    setEditingTitle(habit.title);
                                                    setEditingDescription(habit.description);
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-200"
                                            >
                                                <PencilLine size={14} /> Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm("Delete this habit?")) {
                                                        deleteHabit(habit.id);
                                                        setFeedback("Habit deleted");
                                                        sync();
                                                    }
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
}
