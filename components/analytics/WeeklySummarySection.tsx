import type { HabitHistoryEntryLike } from "@/app/state/analyticsDomain";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type WeeklySummarySectionProps = {
    weeklyHistory: HabitHistoryEntryLike[];
};

export function WeeklySummarySection({ weeklyHistory }: WeeklySummarySectionProps) {
    const summaryItems = weeklyHistory.slice(-7).map((entry, index) => ({
        day: days[index] ?? `Day ${index + 1}`,
        score: Array.isArray(entry.habits) ? entry.habits.length : 0,
    }));

    const average = Math.round(
        summaryItems.reduce((total, item) => total + item.score, 0) / Math.max(summaryItems.length, 1),
    );

    return (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20 transition duration-300 hover:border-violet-500/20 hover:shadow-violet-900/10 animate-[fadeIn_0.45s_ease-out]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300">Weekly</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Summary</h2>
                </div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Avg {average}/day
                </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-7">
                {summaryItems.map((item) => (
                    <div
                        key={item.day}
                        className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3 text-center transition duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-slate-950"
                    >
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.day}</p>
                        <p className="mt-3 text-2xl font-bold text-white">{item.score}</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                style={{ width: `${Math.min(100, item.score * 14)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
