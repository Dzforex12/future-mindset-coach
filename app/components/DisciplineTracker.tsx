"use client";

import { useEffect } from "react";
import { useMemoryStore, type DynamicHabit } from "@/app/state/memoryStore";

type Habit = {
  id: number | string;
  label: string;
};

const habits: Habit[] = [
  { id: 1, label: "Completed my morning routine" },
  { id: 2, label: "Followed my trading plan" },
  { id: 3, label: "Avoided impulsive decisions" },
  { id: 4, label: "Reviewed my progress" },
];

type DisciplineTrackerProps = {
  externalComplete?: number | null;
};

export default function DisciplineTracker({
  externalComplete,
}: DisciplineTrackerProps) {
  const {
    dailyHabitsCompleted,
    disciplineStreak,
    dynamicHabits,
    setDailyHabitsCompleted,
    setDisciplineStreak,
  } = useMemoryStore();
  const allHabits: Habit[] = [
    ...habits,
    ...dynamicHabits.map((habit: DynamicHabit) => ({
      id: habit.id,
      label: habit.title,
    })),
  ];
  const completed = dailyHabitsCompleted;

  useEffect(() => {
    if (!externalComplete || externalComplete < 1 || externalComplete > 4) return;

    const habitId = externalComplete;
    const timer = window.setTimeout(() => {
      if (dailyHabitsCompleted.includes(habitId)) return;

      const nextCompleted = [...dailyHabitsCompleted, habitId];
      setDailyHabitsCompleted(nextCompleted);

      if (nextCompleted.length === allHabits.length) {
        setDisciplineStreak(disciplineStreak + 1);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    dailyHabitsCompleted,
    disciplineStreak,
    externalComplete,
    allHabits.length,
    setDailyHabitsCompleted,
    setDisciplineStreak,
  ]);

  const toggleHabit = (habitId: number | string) => {
    const isComplete = dailyHabitsCompleted.includes(habitId);
    const nextCompleted = isComplete
      ? dailyHabitsCompleted.filter((id) => id !== habitId)
      : [...dailyHabitsCompleted, habitId];

    setDailyHabitsCompleted(nextCompleted);

    if (isComplete) {
      setDisciplineStreak(0);
    } else if (nextCompleted.length === allHabits.length) {
      setDisciplineStreak(disciplineStreak + 1);
    }
  };

  const progress = allHabits.length
    ? Math.round((completed.length / allHabits.length) * 100)
    : 0;

  return (
    <section className="rounded-xl border border-purple-700 bg-[#0f0f1a] p-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-400">Discipline Tracker</h2>
          <p className="mt-1 text-sm text-gray-400">Track the actions that build consistency.</p>
        </div>
        <span className="text-lg font-bold text-white">{progress}%</span>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#1a1a2e]">
        <div
          className="h-full bg-purple-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-3">
        {allHabits.map((habit) => {
          const isComplete = completed.includes(habit.id);

          return (
            <label
              key={habit.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg bg-[#1a1a2e] p-3 text-white"
            >
              <input
                type="checkbox"
                checked={isComplete}
                onChange={() => toggleHabit(habit.id)}
                className="h-4 w-4 accent-purple-600"
              />
              <span className={isComplete ? "text-gray-500 line-through" : ""}>
                {habit.label}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
