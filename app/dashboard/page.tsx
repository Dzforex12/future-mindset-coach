"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    CalendarClock,
    CheckCheck,
    CircleDollarSign,
    CircleDashed,
    Flame,
    Goal,
    MessageSquareQuote,
    Sparkles,
    Target,
    TrendingUp,
    Wallet,
} from "lucide-react";
import { getGoals } from "@/app/state/goalEngine";
import { getDateKey, getCurrentStreak, getHabitRecords } from "@/app/state/habitEngine";
import { getTradingJournalEntries, getTradingOverviewStats } from "@/app/state/tradingEngine";
import { getBusinessData, getBusinessProgress } from "@/app/state/businessEngine";
import { getProjects } from "@/app/state/projectsEngine";
import { getFinanceState } from "@/app/state/financeEngine";
import { useMemoryStore } from "@/app/state/memoryStore";
import { SERVER_STORAGE_SNAPSHOT, useStorageSnapshot } from "@/app/state/storageSubscription";

const DASHBOARD_STORAGE_KEYS = [
    "future-mindset-goals",
    "future-mindset-habits",
    "future-mindset-streak",
    "future-mindset-trading-journal",
    "future-mindset-business",
    "future-mindset-projects",
    "future-mindset-finances",
];

function StatCard({ label, value, detail, icon, accent }: { label: string; value: string; detail: string; icon: React.ReactNode; accent: string }) {
    return (
        <div className="rounded-[22px] border border-slate-800/80 bg-[#0a1524]/80 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.15)]">
            <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>{icon}</div>
                <div className="h-2 w-2 rounded-full bg-slate-600" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
            <div className="mt-3 flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-white">{value}</p>
                {detail ? <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{detail}</span> : null}
            </div>
        </div>
    );
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
    return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>{label}</span>;
}

export default function DashboardPage() {
    const storageSnapshot = useStorageSnapshot(DASHBOARD_STORAGE_KEYS);
    const habitRecords = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getHabitRecords() : [], [storageSnapshot]);
    const goals = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getGoals() : [], [storageSnapshot]);
    const tradingEntries = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getTradingJournalEntries() : [], [storageSnapshot]);
    const tradingOverview = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getTradingOverviewStats() : { disciplineScore: 0, planFollowed: 0, averageRisk: 0, tradesThisWeek: 0 }, [storageSnapshot]);
    const businessData = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getBusinessData() : { goals: [], tasks: [], leads: [], monthlyTarget: 0, revenue: 0 }, [storageSnapshot]);
    const projects = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getProjects() : [], [storageSnapshot]);
    const financeState = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getFinanceState() : { income: 0, expenses: 0, savings: 0, savingsTarget: 0, goals: [], transactions: [] }, [storageSnapshot]);
    const displayName = useMemoryStore((state) => state.displayName);
    const dailyFocus = useMemoryStore((state) => state.dailyFocus);
    const currentEmotion = useMemoryStore((state) => state.currentEmotion);
    const alignment = useMemoryStore((state) => state.alignment.dailyScore);

    const todayKey = getDateKey();
    const activeGoals = goals.filter((goal) => !goal.completed && !goal.archived);
    const goalProgress = activeGoals.length ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length) : 0;
    const habitCompletion = habitRecords.length ? Math.round((habitRecords.filter((habit) => habit.completedDates.includes(todayKey)).length / habitRecords.length) * 100) : 0;
    const habitStreak = getCurrentStreak();
    const businessProgress = getBusinessProgress(businessData);
    const financialGoal = financeState.goals[0];
    const financeTarget = financialGoal?.target || financeState.savingsTarget;
    const financeSaved = financialGoal ? financialGoal.saved : financeState.savings;
    const hasFinancialGoal = financeTarget > 0;
    const financialProgress = hasFinancialGoal ? Math.min(100, Math.round((financeSaved / financeTarget) * 100)) : null;
    const moodScore = typeof alignment === "number" && alignment > 0 ? Math.min(10, Math.max(0, Math.round(alignment / 10))) : 0;
    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening";
    const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" });

    const chartData = useMemo(() => {
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dateKey = getDateKey(date);
            const completed = habitRecords.filter((habit) => habit.completedDates.includes(dateKey)).length;
            return {
                date: date.toLocaleDateString("en-US", { weekday: "short" }),
                value: habitRecords.length ? Math.round((completed / habitRecords.length) * 100) : 0,
            };
        });
    }, [habitRecords]);

    const activityItems = useMemo(() => {
        const items: Array<{ id: string; label: string; time: string; kind: "habit" | "goal" | "trade" }> = [];

        habitRecords.slice(0, 3).forEach((habit) => {
            items.push({
                id: `habit-${habit.id}`,
                label: `Updated habit: ${habit.title}`,
                time: habit.updatedAt ? new Date(habit.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
                kind: "habit",
            });
        });

        goals.slice(0, 2).forEach((goal) => {
            items.push({
                id: `goal-${goal.id}`,
                label: `Goal updated: ${goal.title}`,
                time: goal.updatedAt ? new Date(goal.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
                kind: "goal",
            });
        });

        tradingEntries.slice(0, 2).forEach((trade) => {
            items.push({
                id: `trade-${trade.id}`,
                label: `Trade logged: ${trade.instrument || "Market"}`,
                time: trade.createdAt ? new Date(trade.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : trade.time || "Now",
                kind: "trade",
            });
        });

        return items.slice(0, 4);
    }, [habitRecords, goals, tradingEntries]);

    const upcomingDeadlines = useMemo(() => {
        const deadlines: Array<{ id: string; title: string; date: string; category: string }> = [
            ...goals.filter((goal) => goal.targetDate && !goal.completed && !goal.archived).map((goal) => ({ id: `goal-${goal.id}`, title: goal.title, date: goal.targetDate!, category: goal.category || "Goal" })),
            ...businessData.tasks.filter((task) => task.deadline && !task.complete).map((task) => ({ id: `business-task-${task.id}`, title: task.title, date: task.deadline, category: "Business task" })),
            ...businessData.goals.filter((goal) => goal.deadline && goal.status !== "Reached" && goal.status !== "Paused").map((goal) => ({ id: `business-goal-${goal.id}`, title: goal.title, date: goal.deadline, category: "Business goal" })),
            ...projects.filter((project) => project.deadline && project.status !== "Completed").map((project) => ({ id: `project-${project.id}`, title: project.title, date: project.deadline, category: "Project" })),
            ...projects.flatMap((project) => project.tasks.filter((task) => task.dueDate && !task.complete).map((task) => ({ id: `project-task-${project.id}-${task.id}`, title: task.title, date: task.dueDate!, category: `${project.title} task` }))),
        ];

        return deadlines
            .filter((item) => Number.isFinite(new Date(`${item.date}T00:00:00`).getTime()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 4)
            .map((item) => {
                const target = new Date(`${item.date}T00:00:00`);
                const todayStart = new Date(`${todayKey}T00:00:00`).getTime();
                const diff = Math.round((target.getTime() - todayStart) / 86400000);
                let label = "Due soon";
                if (diff <= 0) label = "Overdue";
                else if (diff === 1) label = "Tomorrow";
                else if (diff <= 3) label = `${diff} days`;
                return { ...item, diff, status: label };
            });
    }, [goals, businessData, projects, todayKey]);

    const focusTasks = useMemo(() => {
        const tasks: Array<{ title: string; done: boolean; time: string }> = [];

        if (dailyFocus) {
            tasks.push({ title: dailyFocus, done: false, time: "Today" });
        }

        habitRecords.filter((habit) => !habit.completedDates.includes(todayKey)).slice(0, 2).forEach((habit) => {
            tasks.push({ title: habit.title, done: false, time: "Habit" });
        });

        activeGoals.slice(0, 2).forEach((goal) => {
            tasks.push({ title: goal.title, done: goal.progress >= 100, time: goal.targetDate ? new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Goal" });
        });

        businessData.tasks.filter((task) => !task.complete).slice(0, 2).forEach((task) => {
            tasks.push({ title: task.title, done: false, time: task.deadline ? new Date(`${task.deadline}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Business" });
        });

        projects.filter((project) => project.status !== "Completed").flatMap((project) => project.tasks.filter((task) => !task.complete).map((task) => ({ project, task }))).slice(0, 2).forEach(({ project, task }) => {
            tasks.push({ title: task.title, done: false, time: task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : project.title });
        });

        return tasks.slice(0, 4);
    }, [dailyFocus, habitRecords, activeGoals, businessData, projects, todayKey]);

    const businessGoalCounts = {
        planning: businessData.goals.filter((goal) => goal.status === "New" || goal.status === "Paused").length,
        active: businessData.goals.filter((goal) => goal.status === "Active").length,
        completed: businessData.goals.filter((goal) => goal.status === "Reached").length,
    };
    const businessTaskCounts = {
        open: businessData.tasks.filter((task) => !task.complete).length,
        complete: businessData.tasks.filter((task) => task.complete).length,
    };

    const quote = [
        "Discipline is choosing what you want most over what you want now.",
        "Consistency compounds faster than motivation ever will.",
        "Small daily wins build an extraordinary future.",
    ][new Date().getDate() % 3];

    return (
        <div className="space-y-5">
            <section className="rounded-[30px] border border-slate-800/90 bg-[#0a1524]/80 p-5 shadow-[0_18px_36px_rgba(2,6,23,0.25)] sm:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-blue-300/80">{greeting}</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-[2.5rem]">
                            {displayName ? `${greeting}, ${displayName}` : `${greeting}, Edonis`}
                        </h1>
                        <p className="mt-2 max-w-xl text-base text-slate-400">Focus today. Build your future.</p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                        <CalendarClock size={14} className="text-blue-300" />
                        <span>{dateLabel}</span>
                    </div>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard label="Goals Progress" value={activeGoals.length ? `${goalProgress}%` : "No data yet"} detail={activeGoals.length ? `${activeGoals.length} active` : ""} icon={<Target size={15} className="text-violet-300" />} accent="bg-violet-500/8 text-violet-300" />
                <StatCard label="Habit Streak" value={habitRecords.length ? `${habitStreak} days` : "No data yet"} detail={habitRecords.length ? "Current" : ""} icon={<Flame size={15} className="text-amber-300" />} accent="bg-amber-500/8 text-amber-300" />
                <StatCard label="Business Progress" value={businessProgress === null ? "No data yet" : `${businessProgress}%`} detail={businessProgress === null ? "" : businessData.goals.length ? `${businessData.goals.length} goals` : `${businessData.tasks.length} tasks`} icon={<BriefcaseBusiness size={15} className="text-cyan-300" />} accent="bg-cyan-500/8 text-cyan-300" />
                <StatCard label="Trading Discipline" value={tradingEntries.length ? `${tradingOverview.disciplineScore || 0}%` : "No data yet"} detail={tradingEntries.length ? "Score" : ""} icon={<TrendingUp size={15} className="text-sky-300" />} accent="bg-sky-500/8 text-sky-300" />
                <StatCard label="Mindset Score" value={currentEmotion || alignment ? `${Math.max(0, Math.min(10, moodScore))}/10` : "No data yet"} detail={alignment ? `Focus ${alignment}` : ""} icon={<Sparkles size={15} className="text-emerald-300" />} accent="bg-emerald-500/8 text-emerald-300" />
                <StatCard label="Financial Goal" value={financialProgress === null ? "No data yet" : `${financialProgress}%`} detail={financialProgress === null ? "" : `€${financeSaved.toLocaleString()} / €${financeTarget.toLocaleString()}`} icon={<Wallet size={15} className="text-yellow-300" />} accent="bg-yellow-500/8 text-yellow-300" />
            </section>

            <section className="grid gap-5 xl:grid-cols-4">
                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4 xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">Trading Performance</p>
                            <h2 className="mt-1 text-lg font-semibold text-white">Last 7 Days</h2>
                        </div>
                        <span className="text-lg font-semibold text-sky-300">{tradingEntries.length ? `+${tradingOverview.planFollowed || 0}%` : "No data"}</span>
                    </div>

                    <div className="flex h-36 items-end gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 pb-2 pt-4">
                        {chartData.map((point) => (
                            <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                                <div className="w-full rounded-t-xl bg-gradient-to-t from-blue-500 via-blue-400 to-cyan-300" style={{ height: `${Math.max(14, point.value)}%` }} />
                                <span className="text-[10px] text-slate-400">{point.date.slice(0, 3)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Business Overview</h2>
                        <ArrowRight size={16} className="text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: "Planning", value: businessData.goals.length ? businessGoalCounts.planning : 0, color: "bg-violet-500" },
                            { label: "In Progress", value: businessData.goals.length ? businessGoalCounts.active : businessTaskCounts.open, color: "bg-blue-500" },
                            { label: "Completed", value: businessData.goals.length ? businessGoalCounts.completed : businessTaskCounts.complete, color: "bg-emerald-500" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3 text-sm text-slate-300">
                                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                                <span className="flex-1">{item.label}</span>
                                <span>{item.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-5 text-sm text-slate-400">{businessData.monthlyTarget || businessData.revenue ? `€${businessData.revenue.toLocaleString()} revenue / €${businessData.monthlyTarget.toLocaleString()} target` : businessData.goals.length || businessData.tasks.length ? `${businessTaskCounts.open} open tasks` : "No data yet"}</div>
                </div>

                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">Habit Completion</h2>
                        <span className="text-sm text-emerald-300">{habitRecords.length ? `${habitCompletion}%` : "0%"}</span>
                    </div>
                    <div className="flex h-28 items-end gap-2">
                        {Array.from({ length: 7 }, (_, index) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - index));
                            const value = habitRecords.length ? Math.max(12, Math.round((habitRecords.filter((habit) => habit.completedDates.includes(getDateKey(date))).length / Math.max(1, habitRecords.length)) * 100)) : 0;
                            return (
                                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                                    <div className="w-full rounded-t-xl bg-gradient-to-t from-emerald-500 to-cyan-400" style={{ height: `${value}%` }} />
                                    <span className="text-[10px] text-slate-400">{date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><Target size={16} /></div>
                            <h2 className="text-lg font-semibold text-white">Today&apos;s Focus</h2>
                        </div>
                        <button type="button" className="text-sm text-sky-300">View all →</button>
                    </div>

                    <div className="space-y-3">
                        {focusTasks.length ? focusTasks.map((task, index) => (
                            <div key={`${task.title}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${task.done ? "bg-emerald-500/15 text-emerald-300" : "border border-slate-500 bg-transparent text-slate-500"}`}>
                                    {task.done ? <CheckCheck size={12} /> : <CircleDashed size={12} />}
                                </span>
                                <span className="flex-1 text-sm text-slate-200">{task.title}</span>
                                <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{task.time}</span>
                            </div>
                        )) : <p className="text-sm text-slate-400">No tasks yet.</p>}
                    </div>
                </div>

                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><TrendingUp size={16} /></div>
                            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                        </div>
                        <button type="button" className="text-sm text-sky-300">View all →</button>
                    </div>

                    <div className="space-y-3">
                        {activityItems.length ? activityItems.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                                <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${item.kind === "habit" ? "bg-emerald-500/10 text-emerald-300" : item.kind === "goal" ? "bg-violet-500/10 text-violet-300" : "bg-sky-500/10 text-sky-300"}`}>
                                    {item.kind === "habit" ? <CheckCheck size={14} /> : item.kind === "goal" ? <Goal size={14} /> : <TrendingUp size={14} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-slate-200">{item.label}</p>
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{item.time}</span>
                            </div>
                        )) : <p className="text-sm text-slate-400">No activity yet.</p>}
                    </div>
                </div>

                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-300"><CalendarClock size={16} /></div>
                            <h2 className="text-lg font-semibold text-white">Upcoming Deadlines</h2>
                        </div>
                        <button type="button" className="text-sm text-sky-300">View all →</button>
                    </div>

                    <div className="space-y-3">
                        {upcomingDeadlines.length ? upcomingDeadlines.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2.5">
                                <div>
                                    <p className="text-sm font-medium text-slate-200">{item.title}</p>
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{item.category}</p>
                                </div>
                                <StatusPill label={item.status} tone={item.diff <= 0 ? "bg-red-500/10 text-red-300" : item.diff <= 3 ? "bg-amber-500/10 text-amber-300" : "bg-sky-500/10 text-sky-300"} />
                            </div>
                        )) : <p className="text-sm text-slate-400">No deadlines yet.</p>}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_1fr_1.1fr]">
                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300"><MessageSquareQuote size={16} /></div>
                            <h2 className="text-lg font-semibold text-white">AI Coach</h2>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
                        </span>
                    </div>

                    <div className="rounded-[22px] border border-slate-800 bg-slate-950/40 p-4 text-center">
                        <p className="text-lg font-medium text-slate-200">Need advice or a plan?</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">Ask anything about your goals, business, trading, mindset, habits or life.</p>
                        <Link href="/mindset" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(79,70,229,0.35)]">Open AI Coach <ArrowRight size={16} /></Link>
                    </div>
                </div>

                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><MessageSquareQuote size={16} /></div>
                            <h2 className="text-lg font-semibold text-white">Today&apos;s Quote</h2>
                        </div>
                        <button type="button" className="rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-200">New Quote</button>
                    </div>

                    <blockquote className="mt-6 text-xl font-medium leading-relaxed text-slate-100 italic">“{quote}”</blockquote>
                </div>

                <div className="rounded-[26px] border border-slate-800/80 bg-[#0b1626]/80 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300"><CircleDollarSign size={16} /></div>
                            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                        </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <Link href="/goals" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm font-medium text-slate-200">+ Add Goal</Link>
                        <Link href="/habits" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm font-medium text-slate-200">+ Add Habit</Link>
                        <Link href="/projects" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm font-medium text-slate-200">+ Add Project</Link>
                        <Link href="/business" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm font-medium text-slate-200">+ Business Task</Link>
                        <Link href="/trading" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm font-medium text-slate-200">+ Trading Journal</Link>
                        <Link href="/trading#daily-check-in" className="rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-3 text-sm font-medium text-slate-200">+ Daily Check-in</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
