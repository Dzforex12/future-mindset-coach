"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BrainCircuit, CalendarRange, CheckCheck, CircleDashed, Plus, Sparkles, Target, TrendingUp } from "lucide-react";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { getGoals, type GoalRecord } from "@/app/state/goalEngine";
import { getDateKey, getHabitRecords, toggleHabitComplete, type HabitRecord } from "@/app/state/habitEngine";
import { getDailySummarySnapshot } from "@/app/state/summaryEngine";
import { getDailyCheckIn, getTradingJournalEntries, getTradingOverviewStats } from "@/app/state/tradingEngine";
import { useMemoryStore } from "@/app/state/memoryStore";

const defaultSummary = {
    habitCompletion: 0,
    goalProgress: 0,
    activity: 0,
    summary: "Start small today and keep momentum steady.",
};

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
    return (
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/65 p-4">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><span className="h-2 w-2 rounded-full bg-current" /></div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
    );
}

export default function DashboardPage() {
    const [habitRecords, setHabitRecords] = useState<HabitRecord[]>([]);
    const [goals, setGoals] = useState<GoalRecord[]>([]);
    const [summary, setSummary] = useState(defaultSummary);
    const [tradingEntries, setTradingEntries] = useState<ReturnType<typeof getTradingJournalEntries>>([]);
    const [tradingOverview, setTradingOverview] = useState({ disciplineScore: 0, tradesThisWeek: 0, planFollowed: 0, averageRisk: 0 });
    const [dailyCheckIn, setDailyCheckIn] = useState<ReturnType<typeof getDailyCheckIn>>(null);
    const [isHydrated, setIsHydrated] = useState(false);
    const [dateLabel, setDateLabel] = useState("Today");
    const [greeting, setGreeting] = useState("Good day");
    const displayName = useMemoryStore((state) => state.displayName);
    const mainLifeGoal = useMemoryStore((state) => state.mainLifeGoal);
    const dailyFocus = useMemoryStore((state) => state.dailyFocus);
    const currentEmotion = useMemoryStore((state) => state.currentEmotion);

    const sync = () => {
        const nextHabits = getHabitRecords();
        const nextGoals = getGoals();
        setHabitRecords(nextHabits);
        setGoals(nextGoals);
        setSummary(getDailySummarySnapshot());
        setTradingEntries(getTradingJournalEntries());
        setTradingOverview(getTradingOverviewStats());
        setDailyCheckIn(getDailyCheckIn());
        const now = new Date();
        setGreeting(now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening");
        setDateLabel(now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }));
        setIsHydrated(true);
    };

    useEffect(() => {
        sync();
        window.addEventListener("mindset-store-update", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("mindset-store-update", sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    const todayKey = isHydrated ? getDateKey() : "";
    const completedToday = habitRecords.filter((habit) => habit.completedDates.includes(todayKey));
    const remainingHabits = habitRecords.filter((habit) => !habit.completedDates.includes(todayKey));
    const activeGoals = goals.filter((goal) => !goal.completed);
    const priorityGoal = activeGoals.slice().sort((a, b) => a.progress - b.progress)[0];
    const chartHistory = useMemo(() => {
        if (!isHydrated || !habitRecords.length) return [];
        const today = new Date();
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(today);
            date.setDate(date.getDate() - (6 - index));
            const completed = habitRecords.filter((habit) => habit.completedDates.includes(getDateKey(date))).length;
            return { date: date.toLocaleDateString("en-US", { weekday: "short" }), habits: [Math.round((completed / habitRecords.length) * 100)] };
        });
    }, [habitRecords, isHydrated]);

    const recentResult = tradingEntries[0]?.outcome || "No trades logged";
    const hasTradingData = tradingEntries.length > 0;
    const habitMetric = habitRecords.length ? `${completedToday.length}/${habitRecords.length}` : "Not enough data yet";
    const goalMetric = goals.length ? `${activeGoals.length} active` : "Not enough data yet";
    const disciplineMetric = hasTradingData ? `${tradingOverview.disciplineScore}/100` : "Not enough data yet";
    const tradingDisciplineMetric = hasTradingData ? `${tradingOverview.planFollowed}%` : "Not enough data yet";

    return (
        <div className="space-y-5">
            <section className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.18)] sm:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-blue-300/80">{isHydrated ? greeting : "Good day"}</p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[28px]">{isHydrated ? displayName || "Edonis" : "Edonis"}</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{isHydrated && dailyFocus ? dailyFocus : "Discipline today. A better tomorrow."}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/45 px-3 py-2 text-xs text-slate-300"><CalendarRange size={14} className="text-blue-300" />{isHydrated ? dateLabel : "Today"}</div>
                </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Discipline score" value={disciplineMetric} detail={hasTradingData ? "From logged trading process" : "Log a trade to measure this"} tone="bg-blue-500/10 text-blue-300" />
                <MetricCard label="Today's habits" value={habitMetric} detail={habitRecords.length ? `${summary.habitCompletion}% complete` : "Create a habit to begin"} tone="bg-emerald-500/10 text-emerald-300" />
                <MetricCard label="Active goals" value={goalMetric} detail={goals.length ? `${summary.goalProgress}% average progress` : "Create a goal to begin"} tone="bg-violet-500/10 text-violet-300" />
                <MetricCard label="Trading discipline" value={tradingDisciplineMetric} detail={hasTradingData ? "Trades following the plan" : "Log a trade to measure this"} tone="bg-amber-500/10 text-amber-300" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
                <div className="min-w-0 rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.2)] sm:p-5">
                    <div className="mb-4 flex min-w-0 items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Progress</p><h2 className="mt-1 truncate text-lg font-semibold text-white">7-Day habit rhythm</h2></div><Link href="/summary" className="inline-flex shrink-0 items-center gap-1 text-sm text-blue-300 hover:text-blue-200">Summary <ArrowRight size={14} /></Link></div>
                    {chartHistory.length ? <div className="h-48"><AnalyticsChart habitHistory={chartHistory} disciplineStreak={0} /></div> : <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-400">Not enough data yet. Complete habits to build a 7-day view.</p>}
                </div>

                <div className="min-w-0 rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.2)] sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Today</p><h2 className="mt-1 text-lg font-semibold text-white">Today’s operating view</h2></div><span className="text-xs text-slate-400">{completedToday.length}/{habitRecords.length || 0} habits</span></div>
                    <div className="space-y-3">
                        {habitRecords.length ? habitRecords.slice(0, 4).map((habit) => {
                            const done = habit.completedDates.includes(todayKey);
                            return <button key={habit.id} type="button" onClick={() => { toggleHabitComplete(habit.id); sync(); }} className="flex w-full items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-left hover:border-blue-500/40"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{done ? <CheckCheck size={15} /> : <CircleDashed size={15} />}</span><span className={`min-w-0 flex-1 truncate text-sm ${done ? "text-slate-400 line-through" : "text-white"}`}>{habit.title}</span><span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{done ? "Done" : "Complete"}</span></button>;
                        }) : <p className="text-sm text-slate-400">No habits yet. Add one to make today actionable.</p>}
                        <div className="border-t border-slate-800 pt-3 text-sm text-slate-300"><span className="text-slate-500">Priority goal:</span> {isHydrated && mainLifeGoal ? mainLifeGoal : priorityGoal?.title || "No active goal yet"}</div>
                        <div className="text-sm text-slate-300"><span className="text-slate-500">Mindset:</span> {isHydrated && (currentEmotion || dailyCheckIn?.mood) ? currentEmotion || dailyCheckIn?.mood : "No check-in yet"}</div>
                        {remainingHabits.length > 4 ? <p className="text-xs text-slate-500">{remainingHabits.length - 4} more habits remain today.</p> : null}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
                <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:p-5"><div className="flex items-center gap-3"><TrendingUp size={18} className="text-amber-300" /><h2 className="text-lg font-semibold text-white">Trading snapshot</h2></div>{hasTradingData ? <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-slate-500">Trades logged</p><p className="mt-1 font-semibold text-white">{tradingEntries.length}</p></div><div><p className="text-slate-500">Plan followed</p><p className="mt-1 font-semibold text-white">{tradingOverview.planFollowed}%</p></div><div><p className="text-slate-500">Average risk</p><p className="mt-1 font-semibold text-white">{tradingOverview.averageRisk}%</p></div><div><p className="text-slate-500">Recent result</p><p className="mt-1 font-semibold text-white">{recentResult}</p></div></div> : <p className="mt-4 text-sm text-slate-400">Not enough data yet. Log a trade to see this snapshot.</p>}</div>
                <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:p-5"><div className="flex items-center gap-3"><BrainCircuit size={18} className="text-violet-300" /><h2 className="text-lg font-semibold text-white">AI Coach</h2></div><p className="mt-3 text-sm leading-6 text-slate-300">Ask me about your discipline, habits, goals or trading.</p><Link href="/mindset" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500">Ask Coach <Sparkles size={14} /></Link></div>
                <div className="rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:p-5"><div className="flex items-center gap-3"><Plus size={18} className="text-blue-300" /><h2 className="text-lg font-semibold text-white">Quick Actions</h2></div><div className="mt-4 grid grid-cols-2 gap-2"><Link href="/goals" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs text-slate-200 hover:border-blue-500/40">+ Add Goal</Link><Link href="/habits" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs text-slate-200 hover:border-blue-500/40">+ Add Habit</Link><Link href="/trading" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs text-slate-200 hover:border-blue-500/40">+ Log Trade</Link><Link href="/trading#daily-check-in" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2 text-center text-xs text-slate-200 hover:border-blue-500/40">+ Daily Check-in</Link></div></div>
            </section>

            <section className="rounded-[24px] border border-slate-800/80 bg-slate-900/75 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.18)] sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Coach readout</p><h2 className="mt-1 text-lg font-semibold text-white">{summary.summary}</h2></div><Link href="/mindset" className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200">Open coach <ArrowRight size={14} /></Link></div></section>
        </div>
    );
}