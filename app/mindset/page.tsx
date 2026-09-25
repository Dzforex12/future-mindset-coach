"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Sparkles, Target, TrendingUp } from "lucide-react";
import MindsetChat from "@/components/MindsetChat";
import { useMemoryStore } from "@/app/state/memoryStore";
import { getDailySummarySnapshot } from "@/app/state/summaryEngine";
import { getGoals } from "@/app/state/goalEngine";
import { getHabitRecords } from "@/app/state/habitEngine";
import { getTradingJournalEntries } from "@/app/state/tradingEngine";
import { PageHeader } from "@/components/ui/page-shell";

const defaultSummary = {
    habitCompletion: 0,
    goalProgress: 0,
    activity: 0,
    summary: "Start small today and keep momentum steady.",
};

export default function MindsetPage() {
    const [summary, setSummary] = useState(defaultSummary);
    const [emotion, setEmotion] = useState("Balanced");
    const [coachOverview, setCoachOverview] = useState({ habitsComplete: 0, habitsTotal: 0, activeGoals: 0, recentTrades: 0 });
    const [isHydrated, setIsHydrated] = useState(false);
    const dailyFocus = useMemoryStore((state) => state.dailyFocus);

    useEffect(() => {
        const sync = () => {
            setSummary(getDailySummarySnapshot());
            setEmotion(useMemoryStore.getState().currentEmotion || "Balanced");
            const habits = getHabitRecords();
            setCoachOverview({
                habitsComplete: habits.filter((habit) => habit.completedDates.includes(new Date().toISOString().slice(0, 10))).length,
                habitsTotal: habits.length,
                activeGoals: getGoals().filter((goal) => !goal.completed).length,
                recentTrades: getTradingJournalEntries().slice(0, 5).length,
            });
            setIsHydrated(true);
        };

        sync();
        window.addEventListener("mindset-store-update", sync);
        return () => window.removeEventListener("mindset-store-update", sync);
    }, []);

    const alignment = useMemoryStore((state) => state.alignment.dailyScore || summary.habitCompletion);

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Mindset" title="Your mental operating system" description="Review emotional posture, discipline signals, and the next best move." />

            <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                            <BrainCircuit size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Current state</p>
                            <p className="mt-1 text-lg font-semibold text-white">{emotion}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                            <Target size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Focus score</p>
                            <p className="mt-1 text-lg font-semibold text-white">{alignment}/100</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Coach note</p>
                            <p className="mt-1 text-lg font-semibold text-white">{summary.summary}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Coach Context</p>
                        <h2 className="mt-1 text-lg font-semibold text-white">What the coach currently knows</h2>
                    </div>
                    <span className="text-xs text-slate-500">Persisted app data</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-xs text-slate-500">Today</p><p className="mt-1 text-sm font-semibold text-white">{isHydrated ? `${coachOverview.habitsComplete} / ${coachOverview.habitsTotal} habits` : "Not loaded"}</p></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-xs text-slate-500">Goals</p><p className="mt-1 text-sm font-semibold text-white">{isHydrated ? `${coachOverview.activeGoals} active` : "Not loaded"}</p></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-xs text-slate-500">Trading</p><p className="mt-1 text-sm font-semibold text-white">{isHydrated ? `${coachOverview.recentTrades} recent trades` : "Not loaded"}</p></div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-xs text-slate-500">Focus</p><p className="mt-1 truncate text-sm font-semibold text-white">{isHydrated ? dailyFocus || "Unavailable" : "Not loaded"}</p></div>
                </div>
            </section>

            <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">AI Coach</p>
                        <h2 className="text-lg font-semibold text-white">Ask anything about your discipline</h2>
                    </div>
                </div>
                <MindsetChat />
            </div>
        </div>
    );
}
