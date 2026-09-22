import type { Goal } from "@/app/state/memoryStore";
import { cn } from "cn";

type GoalAlignmentSectionProps = {
    goals: Goal[];
};

export function GoalAlignmentSection({ goals }: GoalAlignmentSectionProps) {
    const visibleGoals = goals.slice(0, 4);
    const averageProgress = visibleGoals.length
        ? Math.round(
            visibleGoals.reduce((total, goal) => total + Math.max(0, Math.min(100, goal.progress ?? 0)), 0) /
            visibleGoals.length,
        )
        : 0;

    return (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition duration-300 hover:border-violet-500/20 hover:shadow-violet-900/10 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300">Goal alignment</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Execution quality</h2>
                </div>
                <div className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200">
                    {averageProgress}% avg
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {visibleGoals.length ? (
                    visibleGoals.map((goal) => (
                        <div
                            key={goal.id}
                            className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-500/30"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{goal.title}</p>
                                    <p className="mt-1 text-xs text-slate-400">{goal.description}</p>
                                </div>
                                <span className="text-sm font-semibold text-violet-300">{goal.progress ?? 0}%</span>
                            </div>

                            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        goal.progress >= 75
                                            ? "bg-gradient-to-r from-emerald-500 to-green-400"
                                            : goal.progress >= 45
                                                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                                : "bg-gradient-to-r from-amber-500 to-orange-400",
                                    )}
                                    style={{ width: `${Math.max(0, Math.min(100, goal.progress ?? 0))}%` }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-sm text-slate-400">
                        No active goals yet. Add a few priorities to begin tracking alignment.
                    </div>
                )}
            </div>
        </section>
    );
}
