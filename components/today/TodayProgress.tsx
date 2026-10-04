export function TodayProgress({
    prioritiesComplete,
    prioritiesTotal,
    habitsComplete,
    habitsTotal,
    reviewComplete,
}: {
    prioritiesComplete: number;
    prioritiesTotal: number;
    habitsComplete: number;
    habitsTotal: number;
    reviewComplete: boolean;
}) {
    const completed = prioritiesComplete + habitsComplete + Number(reviewComplete);
    const total = prioritiesTotal + habitsTotal + 1;
    const percent = total ? Math.round((completed / total) * 100) : 0;

    return (
        <section aria-label="Today's progress" className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">Today&apos;s Progress</h2>
                <p className="text-xs text-slate-400">
                    Priorities {prioritiesComplete} / {prioritiesTotal}
                    <span className="px-2 text-slate-600">·</span>
                    Habits {habitsComplete} / {habitsTotal}
                    <span className="px-2 text-slate-600">·</span>
                    Review {reviewComplete ? "Complete" : "Not complete"}
                </p>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${percent}%` }} />
            </div>
        </section>
    );
}
