"use client";

import { Check } from "lucide-react";
import type { HabitRecord } from "@/app/state/habitEngine";

export function TodayHabits({ habits, date, onToggle }: { habits: HabitRecord[]; date: string; onToggle: (id: string, complete: boolean) => void }) {
    const todayHabits = habits.filter((habit) => !habit.paused && !habit.archived);
    const completed = todayHabits.filter((habit) => habit.completedDates.includes(date)).length;

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Today&apos;s Habits</h2>
                <span className="text-xs text-slate-400">{completed} / {todayHabits.length} completed</span>
            </div>
            {todayHabits.length ? (
                <ul className="mt-3 space-y-2">
                    {todayHabits.map((habit) => {
                        const isComplete = habit.completedDates.includes(date);
                        return <li key={habit.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/55 px-3 py-2.5">
                            <button type="button" aria-label={`${isComplete ? "Undo" : "Complete"} ${habit.title}`} aria-pressed={isComplete} onClick={() => onToggle(habit.id, !isComplete)} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${isComplete ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" : "border-slate-600 text-transparent hover:border-emerald-400"}`}><Check size={15} /></button>
                            <span className={`text-sm ${isComplete ? "text-slate-500 line-through" : "text-slate-200"}`}>{habit.title}</span>
                        </li>;
                    })}
                </ul>
            ) : <p className="mt-3 text-sm text-slate-500">No habits scheduled yet.</p>}
        </section>
    );
}
