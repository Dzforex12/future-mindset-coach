import { StatCard } from "@/components/StatCard";

type OverviewSectionProps = {
    consistencyScore: number;
    goalAlignmentScore: number;
    activeGoalCount: number;
};

export function OverviewSection({ consistencyScore, goalAlignmentScore, activeGoalCount }: OverviewSectionProps) {
    return (
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/50 p-6 shadow-2xl shadow-slate-950/20 transition duration-300 hover:border-violet-500/30 hover:shadow-violet-900/10 animate-[fadeIn_0.35s_ease-out]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-violet-300">Overview</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Performance snapshot</h2>
                </div>
                <div className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-300">
                    {activeGoalCount} active goals
                </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
                <StatCard
                    label="Consistency score"
                    value={`${Math.min(100, consistencyScore)} / 100`}
                    tone="primary"
                    helper="Recent habit completion across the last seven days."
                    icon={<span aria-hidden>◎</span>}
                    trend={{ value: "+8%", label: "vs last week", positive: true }}
                />
                <StatCard
                    label="Goal alignment"
                    value={`${Math.min(100, goalAlignmentScore)} / 100`}
                    tone="success"
                    helper="How closely habits match active objectives."
                    icon={<span aria-hidden>✓</span>}
                    trend={{ value: "+5%", label: "execution", positive: true }}
                />
            </div>
        </section>
    );
}
