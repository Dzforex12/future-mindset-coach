"use client";

import { useEffect, useMemo, useState } from "react";
import { Gauge, Sparkles } from "lucide-react";
import { getGoals, type GoalRecord } from "@/app/state/goalEngine";
import { getHabitRecords, type HabitRecord } from "@/app/state/habitEngine";
import { getDailySummarySnapshot } from "@/app/state/summaryEngine";
import { getTradingJournalEntries, getTradingOverviewStats, getTradingPatternInsights } from "@/app/state/tradingEngine";
import { PageHeader } from "@/components/ui/page-shell";

const defaultSummary = {
    habitCompletion: 0,
    goalProgress: 0,
    activity: 0,
    summary: "Start small today and keep momentum steady.",
};

export default function SummaryPage() {
    const [summary, setSummary] = useState(defaultSummary);
    const [habits, setHabits] = useState<HabitRecord[]>([]);
    const [goals, setGoals] = useState<GoalRecord[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        const sync = () => {
            setSummary(getDailySummarySnapshot());
            setHabits(getHabitRecords());
            setGoals(getGoals());
            setIsHydrated(true);
        };

        sync();
        window.addEventListener("mindset-store-update", sync);
        return () => window.removeEventListener("mindset-store-update", sync);
    }, []);

    const tradingEntries = useMemo(() => (isHydrated ? getTradingJournalEntries() : []), [isHydrated, summary]);
    const tradingOverview = useMemo(() => (isHydrated ? getTradingOverviewStats() : { disciplineScore: 0, tradesThisWeek: 0, planFollowed: 0, averageRisk: 0 }), [isHydrated, summary]);
    const patternInsights = useMemo(() => (isHydrated ? getTradingPatternInsights(tradingEntries) : { hasData: false, insights: [{ label: "Pattern insights", value: "Not enough trading history yet." }] }), [isHydrated, tradingEntries]);
    const weeklyReview = useMemo(() => {
        if (!isHydrated) {
            return {
                discipline: "Not enough activity for a weekly review yet.",
                habits: "Not enough habit activity yet.",
                goals: "No goals are active yet.",
                trading: "Not enough trading history yet.",
                mindset: "No recent check-ins or mindset notes yet.",
            };
        }

        if (!habits.length && !goals.length && !tradingEntries.length) {
            return {
                discipline: "Not enough activity for a weekly review yet.",
                habits: "Not enough habit activity yet.",
                goals: "No goals are active yet.",
                trading: "Not enough trading history yet.",
                mindset: "No recent check-ins or mindset notes yet.",
            };
        }

        return {
            discipline: `Discipline score is ${tradingOverview.disciplineScore}/100 with ${tradingOverview.planFollowed}% of trades following the plan.`,
            habits: `${habits.length} habits are tracked; current daily completion is ${summary.habitCompletion}%.`,
            goals: `${goals.length} goals are in progress, with average progress at ${summary.goalProgress}%.`,
            trading: `${tradingEntries.length} trades have been logged. Average risk is ${tradingOverview.averageRisk}% and ${tradingOverview.tradesThisWeek} trades occurred this week.`,
            mindset: `Current recovery signal: ${summary.summary}`,
        };
    }, [isHydrated, habits.length, goals.length, tradingEntries.length, tradingOverview, summary]);

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Summary" title="Overall performance snapshot" description="Review your recent habits, goals, trading process, and mindset signals." />

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                            <Gauge size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Habits</p>
                            <p className="mt-1 text-lg font-semibold text-white">{summary.habitCompletion}%</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Goals</p>
                            <p className="mt-1 text-lg font-semibold text-white">{summary.goalProgress}%</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                            <Gauge size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Tracked</p>
                            <p className="mt-1 text-lg font-semibold text-white">{habits.length} habits</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Daily summary</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Coach readout</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{summary.summary}</p>
                <button
                    type="button"
                    onClick={() => window.location.href = "/mindset?prompt=Review my week"}
                    className="mt-4 rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100 hover:bg-violet-500/15"
                >
                    Ask Coach
                </button>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Weekly review</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Discipline • Habits • Goals • Trading Process • Mindset</h2>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Discipline</p><p className="mt-2 text-sm text-slate-200">{weeklyReview.discipline}</p></div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Habits</p><p className="mt-2 text-sm text-slate-200">{weeklyReview.habits}</p></div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Goals</p><p className="mt-2 text-sm text-slate-200">{weeklyReview.goals}</p></div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Trading process</p><p className="mt-2 text-sm text-slate-200">{weeklyReview.trading}</p></div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3 md:col-span-2"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Mindset</p><p className="mt-2 text-sm text-slate-200">{weeklyReview.mindset}</p></div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.2)]">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Pattern insights</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Trading rhythm</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {patternInsights.insights.map((insight) => (
                        <div key={insight.label} className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{insight.label}</p>
                            <p className="mt-2 text-sm text-slate-200">{insight.value}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Habits</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        {habits.length > 0 ? habits.slice(0, 5).map((habit) => <li key={habit.id}>• {habit.title}</li>) : <li>No habits yet.</li>}
                    </ul>
                </div>

                <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Goals</p>
                    <ul className="mt-4 space-y-2 text-sm text-slate-300">
                        {goals.length > 0 ? goals.slice(0, 5).map((goal) => <li key={goal.id}>• {goal.title}</li>) : <li>No goals yet.</li>}
                    </ul>
                </div>
            </section>
        </div>
    );
}
