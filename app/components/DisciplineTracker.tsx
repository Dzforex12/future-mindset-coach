"use client";

import { useEffect, useState } from "react";
import {
  createHabit,
  deleteHabit,
  getCurrentStreak,
  getHabitCompletionPercent,
  getHabitRecords,
  toggleHabitComplete,
  updateHabit,
  type HabitRecord,
} from "@/app/state/habitEngine";

type DisciplineTrackerProps = {
  externalComplete?: number | null;
};

export default function DisciplineTracker({ externalComplete }: DisciplineTrackerProps) {
  const [habits, setHabits] = useState<HabitRecord[]>(() => getHabitRecords());
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const syncHabits = () => setHabits(getHabitRecords());

  useEffect(() => {
    syncHabits();
    const onStorageUpdate = () => syncHabits();
    window.addEventListener("mindset-store-update", onStorageUpdate);
    window.addEventListener("storage", onStorageUpdate);

    return () => {
      window.removeEventListener("mindset-store-update", onStorageUpdate);
      window.removeEventListener("storage", onStorageUpdate);
    };
  }, []);

  useEffect(() => {
    if (!externalComplete || externalComplete < 1) return;

    const timer = window.setTimeout(() => {
      const records = getHabitRecords();
      const selected = records[Math.min(records.length - 1, externalComplete - 1)];
      if (selected && !selected.completedDates.includes(new Date().toISOString().slice(0, 10))) {
        toggleHabitComplete(selected.id);
        syncHabits();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [externalComplete]);

  const progress = habits.length ? getHabitCompletionPercent() : 0;
  const streak = getCurrentStreak();

  const handleCreateHabit = () => {
    const title = draft.trim();
    if (!title) return;
    createHabit({ title, description: "Local habit" });
    setDraft("");
    syncHabits();
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
    syncHabits();
  };

  const handleToggleComplete = (habitId: string) => {
    toggleHabitComplete(habitId);
    syncHabits();
  };

  const handleSaveEdit = (habitId: string) => {
    const nextTitle = editingTitle.trim();
    if (!nextTitle) return;
    updateHabit(habitId, { title: nextTitle });
    setEditingId(null);
    setEditingTitle("");
    syncHabits();
  };

  return (
    <section className="rounded-xl border border-purple-700 bg-[#0f0f1a] p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Discipline Tracker</h2>
          <p className="mt-1 text-sm text-gray-400">Track the actions that build consistency.</p>
        </div>
        <span className="text-lg font-bold text-white">{progress}%</span>
      </div>

      <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#1a1a2e] p-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current streak</p>
          <p className="mt-1 text-lg font-bold text-white">{streak} days</p>
        </div>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add habit"
            className="w-36 rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-white placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={handleCreateHabit}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Add
          </button>
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#1a1a2e]">
        <div className="h-full bg-purple-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="space-y-3">
        {habits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-[#1a1a2e] p-4 text-sm text-slate-300">
            No habits yet. Add one to start tracking your routine.
          </div>
        ) : null}

        {habits.map((habit) => {
          const today = new Date().toISOString().slice(0, 10);
          const isComplete = habit.completedDates.includes(today);
          const isEditing = editingId === habit.id;

          return (
            <div key={habit.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#1a1a2e] p-3 text-white">
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isComplete}
                  onChange={() => handleToggleComplete(habit.id)}
                  className="h-4 w-4 accent-purple-600"
                />

                {isEditing ? (
                  <input
                    value={editingTitle}
                    onChange={(event) => setEditingTitle(event.target.value)}
                    onBlur={() => handleSaveEdit(habit.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleSaveEdit(habit.id);
                      if (event.key === "Escape") {
                        setEditingId(null);
                        setEditingTitle("");
                      }
                    }}
                    autoFocus
                    className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-white"
                  />
                ) : (
                  <span className={isComplete ? "text-gray-500 line-through" : ""}>{habit.title}</span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(habit.id);
                    setEditingTitle(habit.title);
                  }}
                  className="text-xs text-slate-300 hover:text-purple-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="text-xs text-slate-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
