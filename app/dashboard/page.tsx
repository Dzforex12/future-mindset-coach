"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
    ArrowRight,
    BrainCircuit,
    BriefcaseBusiness,
    CalendarClock,
    CheckCheck,
    CircleDashed,
    Flame,
    Goal,
    Plus,
    Receipt,
    Sparkles,
    Target,
    TrendingUp,
    Wallet,
    Zap,
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

const mobileStatLabels: Record<string, string> = {
    "Goals Progress": "Goals",
    "Habit Streak": "Habits",
    "Business Progress": "Business",
    "Trading Discipline": "Trading",
    "Mindset Score": "Mindset",
    "Financial Goal": "Finance",
};

function StatCard({ label, value, detail, icon, accent, glow, progress, className = "" }: { label: string; value: string; detail: string; icon: React.ReactNode; accent: string; glow: string; progress: number | null; className?: string }) {
    return (
        <div className={`relative isolate flex min-h-[98px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#122239] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_8px_18px_rgba(1,8,19,0.22)] lg:min-h-[96px] ${className}`}>
            <div aria-hidden="true" className={`pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full opacity-20 blur-2xl ${glow}`} />
            <div className="relative flex min-w-0 items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] ${accent}`}>{icon}</div>
                <p className="min-w-0 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400 sm:text-[10px]">
                    <span className="sm:hidden">{mobileStatLabels[label] || label}</span>
                    <span className="hidden sm:inline">{label}</span>
                </p>
            </div>
            <div className="relative mt-2 flex min-w-0 items-end justify-between gap-1">
                <p className="min-w-0 truncate text-[15px] font-bold leading-5 text-white sm:text-xl">
                    <span className="sm:hidden">{value === "No data yet" ? "No data" : value}</span>
                    <span className="hidden sm:inline">{value}</span>
                </p>
                {detail ? <span className="hidden max-w-[46%] truncate text-right text-[9px] font-medium text-slate-400 sm:inline sm:text-[10px]">{detail}</span> : null}
            </div>
            <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-slate-800/90">
                {progress !== null ? <div className={`h-full rounded-full ${glow}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /> : null}
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
    const dashboardGoals = goals.filter((goal) => !goal.archived);
    const completedGoalCount = dashboardGoals.filter((goal) => goal.completed || goal.progress >= 100).length;
    const inProgressGoalCount = dashboardGoals.filter((goal) => !goal.completed && goal.progress > 0 && goal.progress < 100).length;
    const notStartedGoalCount = dashboardGoals.length - completedGoalCount - inProgressGoalCount;
    const completedGoalPercent = dashboardGoals.length ? (completedGoalCount / dashboardGoals.length) * 100 : 0;
    const inProgressGoalPercent = dashboardGoals.length ? (inProgressGoalCount / dashboardGoals.length) * 100 : 0;

    const quote = [
        "Discipline is choosing what you want most over what you want now.",
        "Consistency compounds faster than motivation ever will.",
        "Small daily wins build an extraordinary future.",
    ][new Date().getDate() % 3];

    return (
        <div className="space-y-3">
            <section className="flex min-w-0 flex-row items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300 sm:flex">
                        <CalendarClock size={20} />
                    </div>
                    <div className="min-w-0">
                        <h1 className="truncate text-[18px] font-bold leading-tight text-white sm:text-[25px] sm:leading-7">
                            {greeting}, {displayName || "Edonis"}
                        </h1>
                        <p className="mt-1 text-xs text-slate-400 sm:text-sm">Focus today. Build your future.</p>
                    </div>
                </div>

                <div className="flex w-[104px] shrink-0 items-center justify-end sm:w-auto">
                    <div className="text-right">
                        <p className="text-[9px] font-semibold leading-4 text-slate-300 sm:text-xs">{dateLabel}</p>
                        <p className="mt-0.5 text-[8px] italic leading-3 text-slate-500 sm:text-[10px] sm:leading-normal">“Progress over perfection.”</p>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-6 gap-2 sm:grid-cols-3 xl:gap-3 xl:grid-cols-6">
                <StatCard label="Goals Progress" value={activeGoals.length ? `${goalProgress}%` : "No data yet"} detail={activeGoals.length ? `${activeGoals.length} active` : ""} icon={<Target size={15} />} accent="bg-violet-500/10 text-violet-300" glow="bg-violet-400" progress={activeGoals.length ? goalProgress : null} className="order-3 col-span-2 sm:order-none sm:col-span-1" />
                <StatCard label="Habit Streak" value={habitRecords.length ? `${habitStreak} days` : "No data yet"} detail={habitRecords.length ? `${habitCompletion}% today` : ""} icon={<Flame size={15} />} accent="bg-amber-500/10 text-amber-300" glow="bg-gradient-to-r from-amber-400 to-emerald-400" progress={habitRecords.length ? habitCompletion : null} className="order-2 col-span-2 sm:order-none sm:col-span-1" />
                <StatCard label="Business Progress" value={businessProgress === null ? "No data yet" : `${businessProgress}%`} detail={businessProgress === null ? "" : businessData.goals.length ? `${businessData.goals.length} goals` : `${businessData.tasks.length} tasks`} icon={<BriefcaseBusiness size={15} />} accent="bg-cyan-500/10 text-cyan-300" glow="bg-gradient-to-r from-cyan-400 to-emerald-400" progress={businessProgress} className="hidden sm:flex sm:order-none sm:col-span-1" />
                <StatCard label="Trading Discipline" value={tradingEntries.length ? `${tradingOverview.disciplineScore || 0}%` : "No data yet"} detail={tradingEntries.length ? "Score" : ""} icon={<TrendingUp size={15} />} accent="bg-sky-500/10 text-sky-300" glow="bg-gradient-to-r from-blue-500 to-cyan-300" progress={tradingEntries.length ? tradingOverview.disciplineScore : null} className="order-1 col-span-2 sm:order-none sm:col-span-1" />
                <StatCard label="Mindset Score" value={currentEmotion || alignment ? `${Math.max(0, Math.min(10, moodScore))}/10` : "No data yet"} detail={alignment ? `Focus ${alignment}` : ""} icon={<Sparkles size={15} />} accent="bg-emerald-500/10 text-emerald-300" glow="bg-gradient-to-r from-emerald-400 to-teal-300" progress={alignment > 0 ? alignment : null} className="order-4 col-span-3 sm:order-none sm:col-span-1" />
                <StatCard label="Financial Goal" value={financialProgress === null ? "No data yet" : `${financialProgress}%`} detail={financialProgress === null ? "" : `€${financeSaved.toLocaleString()} / €${financeTarget.toLocaleString()}`} icon={<Wallet size={15} />} accent="bg-amber-500/10 text-amber-200" glow="bg-gradient-to-r from-amber-300 to-orange-400" progress={financialProgress} className="order-5 col-span-3 sm:order-none sm:col-span-1" />
            </section>

            <section className="grid grid-cols-2 gap-2 lg:gap-3 xl:grid-cols-[1.45fr_1fr_1fr_1.25fr]">
                <div className="col-span-2 rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#102038] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_8px_18px_rgba(1,8,19,0.18)] xl:col-span-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">Trading Performance</p>
                            <h2 className="mt-0.5 text-xs text-slate-500">Last 7 Days</h2>
                        </div>
                        <span className="text-sm font-bold text-emerald-300">{tradingEntries.length ? `${tradingOverview.planFollowed || 0}%` : "No data"}</span>
                    </div>

                    <div className="relative flex h-[100px] items-end gap-2 overflow-hidden rounded-xl border border-slate-800/80 bg-[#07111e]/70 px-3 pb-1 pt-2 sm:h-[112px]">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between py-3">
                            <span className="border-t border-slate-700/35" />
                            <span className="border-t border-slate-700/35" />
                            <span className="border-t border-slate-600/45" />
                        </div>
                        {tradingEntries.length ? chartData.map((point) => (
                            <div key={point.date} className="relative z-[1] flex h-full flex-1 flex-col items-center justify-end">
                                <div className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-300 shadow-[0_0_12px_rgba(37,99,235,0.2)]" style={{ height: `${Math.max(10, point.value)}%` }} />
                                <span className="mt-1 text-[9px] text-slate-500">{point.date.slice(0, 3)}</span>
                            </div>
                        )) : (
                            <div className="relative z-[1] mb-4 flex w-full items-center justify-center gap-2 text-[10px] text-slate-500">
                                <span className="h-1 w-1 rounded-full bg-slate-600" />
                                No trading activity recorded
                            </div>
                        )}
                    </div>
                </div>

                <div className="hidden rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#102237] via-[#0b1727] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:block">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold text-white">Business Overview</h2>
                        <BriefcaseBusiness size={14} className="text-emerald-300" />
                    </div>
                    <div className="space-y-2.5">
                        {[
                            { label: "Planning", value: businessData.goals.length ? businessGoalCounts.planning : 0, color: "bg-violet-500" },
                            { label: "In Progress", value: businessData.goals.length ? businessGoalCounts.active : businessTaskCounts.open, color: "bg-blue-500" },
                            { label: "Completed", value: businessData.goals.length ? businessGoalCounts.completed : businessTaskCounts.complete, color: "bg-emerald-500" },
                        ].map((item) => (
                            <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-x-2 text-[10px] text-slate-400">
                                <span>{item.label}</span>
                                <span className="font-semibold text-slate-200">{item.value}</span>
                                <span className="col-span-2 mt-1 h-1 overflow-hidden rounded-full bg-slate-800/90"><span className={`block h-full rounded-full ${item.color}`} style={{ width: `${businessData.goals.length ? Math.round((item.value / businessData.goals.length) * 100) : businessData.tasks.length ? Math.round((item.value / businessData.tasks.length) * 100) : 0}%` }} /></span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 truncate border-t border-slate-700/50 pt-2 text-[9px] text-slate-500">{businessData.monthlyTarget || businessData.revenue ? `€${businessData.revenue.toLocaleString()} revenue · €${businessData.monthlyTarget.toLocaleString()} target` : businessData.goals.length || businessData.tasks.length ? `${businessTaskCounts.open} open tasks` : "No business data yet"}</p>
                </div>

                <div className="rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#0e2227] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold text-white">Habit Completion</h2>
                        <span className="text-[10px] font-semibold text-emerald-300">{habitRecords.length ? `${habitCompletion}%` : "—"}</span>
                    </div>
                    <div className="relative flex h-[92px] items-end gap-2 rounded-xl border border-slate-800/70 bg-[#07111e]/55 px-2 pb-1 pt-2">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between py-3">
                            <span className="border-t border-slate-700/30" />
                            <span className="border-t border-slate-700/30" />
                            <span className="border-t border-slate-600/40" />
                        </div>
                        {Array.from({ length: 7 }, (_, index) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (6 - index));
                            const value = habitRecords.length ? Math.round((habitRecords.filter((habit) => habit.completedDates.includes(getDateKey(date))).length / Math.max(1, habitRecords.length)) * 100) : 0;
                            return (
                                <div key={index} className="relative z-[1] flex h-full flex-1 flex-col items-center justify-end">
                                    {value > 0 ? <div className="w-full rounded-t-sm bg-gradient-to-t from-emerald-600 to-teal-300" style={{ height: `${value}%` }} /> : <div className="w-full rounded-t-sm bg-slate-700/55" style={{ height: "4%" }} />}
                                    <span className="mt-1 text-[9px] text-slate-500">{date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#10202e] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <h2 className="text-xs font-semibold text-white">Goals Overview</h2>
                        <ArrowRight size={14} className="text-slate-500" />
                    </div>
                    <div className="flex items-center justify-center gap-3 sm:justify-between">
                        <div className="relative grid h-[66px] w-[66px] shrink-0 place-items-center rounded-full p-[7px] sm:h-[76px] sm:w-[76px]" style={{ background: dashboardGoals.length ? `conic-gradient(#10b981 0% ${completedGoalPercent}%, #3b82f6 ${completedGoalPercent}% ${completedGoalPercent + inProgressGoalPercent}%, #26364b ${completedGoalPercent + inProgressGoalPercent}% 100%)` : "conic-gradient(#26364b 0% 100%)" }}>
                            <div className="grid h-full w-full place-items-center rounded-full bg-[#0b1728] text-center">
                                <span className="text-xs font-bold text-white">{dashboardGoals.length ? `${completedGoalCount}/${dashboardGoals.length}` : "—"}</span>
                            </div>
                        </div>
                        <div className="min-w-0 space-y-2 text-[8px] text-slate-400 sm:text-[9px]">
                            <p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Completed <b className="ml-auto text-slate-200">{completedGoalCount}</b></p>
                            <p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-400" />In Progress <b className="ml-auto text-slate-200">{inProgressGoalCount}</b></p>
                            <p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-600" />Not Started <b className="ml-auto text-slate-200">{notStartedGoalCount}</b></p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-2 lg:gap-3 xl:grid-cols-[1.2fr_1fr_1fr]">
                <div className="col-span-2 rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#102038] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] xl:col-span-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300"><Target size={15} /></div>
                            <h2 className="text-sm font-semibold text-white">Today&apos;s Focus</h2>
                        </div>
                        <button type="button" className="rounded-lg border border-blue-400/15 bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-sky-200">View all <ArrowRight size={11} className="ml-1 inline" /></button>
                    </div>

                    <div className="divide-y divide-slate-800/70">
                        {focusTasks.length ? focusTasks.map((task, index) => (
                            <div key={`${task.title}-${index}`} className="flex min-w-0 items-center gap-2.5 py-2 first:pt-1 last:pb-1">
                                <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${task.done ? "bg-emerald-500/15 text-emerald-300" : "border border-slate-600 text-slate-500"}`}>
                                    {task.done ? <CheckCheck size={11} /> : <CircleDashed size={11} />}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{task.title}</span>
                                <span className="shrink-0 text-[9px] text-slate-500">{task.time}</span>
                            </div>
                        )) : <p className="text-sm text-slate-400">No tasks yet.</p>}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#151d2a] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300"><Zap size={14} /></div>
                            <h2 className="text-sm font-semibold text-white">Recent Activity</h2>
                        </div>
                        <ArrowRight size={13} className="text-slate-500" />
                    </div>

                    <div className="divide-y divide-slate-800/70">
                        {activityItems.length ? activityItems.map((item) => (
                            <div key={item.id} className="flex min-w-0 items-center gap-2 py-2 first:pt-1 last:pb-1">
                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.kind === "habit" ? "bg-emerald-500/10 text-emerald-300" : item.kind === "goal" ? "bg-violet-500/10 text-violet-300" : "bg-sky-500/10 text-sky-300"}`}>
                                    {item.kind === "habit" ? <CheckCheck size={14} /> : item.kind === "goal" ? <Goal size={14} /> : <TrendingUp size={14} />}
                                </div>
                                <p className="min-w-0 flex-1 truncate text-[10px] text-slate-200">{item.label}</p>
                                <span className="shrink-0 text-[9px] text-slate-500">{item.time}</span>
                            </div>
                        )) : <p className="text-sm text-slate-400">No activity yet.</p>}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#201c2a] via-[#0b1728] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300"><CalendarClock size={14} /></div>
                            <h2 className="text-sm font-semibold text-white">Upcoming Deadlines</h2>
                        </div>
                        <ArrowRight size={13} className="text-slate-500" />
                    </div>

                    <div className="divide-y divide-slate-800/70">
                        {upcomingDeadlines.length ? upcomingDeadlines.map((item) => (
                            <div key={item.id} className="flex min-w-0 items-center justify-between gap-2 py-2 first:pt-1 last:pb-1">
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-medium text-slate-200">{item.title}</p>
                                    <p className="mt-0.5 truncate text-[9px] text-slate-500">{item.category}</p>
                                </div>
                                <StatusPill label={item.status} tone={item.diff <= 0 ? "bg-red-500/10 text-red-300" : item.diff <= 3 ? "bg-amber-500/10 text-amber-300" : "bg-sky-500/10 text-sky-300"} />
                            </div>
                        )) : <p className="text-sm text-slate-400">No deadlines yet.</p>}
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-2 lg:grid-cols-[1.1fr_1fr_1.1fr] lg:gap-3">
                <div className="col-span-2 rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#0d2034] via-[#0a1728] to-[#07111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(2,6,23,0.18)] lg:col-span-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-300"><BrainCircuit size={15} /></div>
                            <h2 className="text-sm font-semibold text-white">AI Coach</h2>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> Online
                        </span>
                    </div>

                    <div className="flex min-h-[128px] items-center gap-2 rounded-xl border border-slate-800/80 bg-[#07111e]/65 p-2 sm:gap-4 sm:p-3">
                        <div aria-hidden="true" className="relative grid h-[84px] w-[78px] shrink-0 place-items-center overflow-hidden sm:h-[104px] sm:w-[96px]">
                            <div className="absolute bottom-1 h-12 w-16 rounded-t-[50%] border border-sky-400/30 bg-gradient-to-b from-blue-500/15 to-[#07111e] shadow-[0_0_25px_rgba(14,165,233,0.13)] sm:h-14 sm:w-[76px]" />
                            <svg viewBox="0 0 96 112" className="relative z-[1] h-full w-full drop-shadow-[0_0_9px_rgba(14,165,233,0.35)]" fill="none">
                                <path d="M25 52V43C25 25 35 14 48 14s23 11 23 29v9" stroke="#38bdf8" strokeWidth="2" />
                                <path d="M26 44c-5 1-8 5-8 11v12c0 6 4 10 10 10h3V48h-5Zm44 0c5 1 8 5 8 11v12c0 6-4 10-10 10h-3V48h5Z" fill="#0b2942" stroke="#38bdf8" strokeWidth="1.5" />
                                <path d="M31 48c0-15 7-24 17-24s17 9 17 24v16c0 14-7 24-17 24S31 78 31 64V48Z" fill="#081728" stroke="#67e8f9" strokeWidth="1.7" />
                                <path d="M36 52c3-4 7-6 12-6s9 2 12 6v8c-3 4-7 6-12 6s-9-2-12-6v-8Z" fill="#0c2b46" stroke="#38bdf8" strokeWidth="1" />
                                <path d="M39 56h5m8 0h5" stroke="#67e8f9" strokeWidth="2.7" strokeLinecap="round" />
                                <path d="M43 72h10" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M42 87v7m12-7v7M28 110c2-11 9-17 20-17s18 6 20 17" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M19 60h-5m68 0h-5" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="14" cy="60" r="2" fill="#38bdf8" />
                                <circle cx="82" cy="60" r="2" fill="#38bdf8" />
                            </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white sm:text-base">Need advice or a plan?</p>
                            <p className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs sm:leading-5">Ask about your goals, business, trading, mindset, habits or life.</p>
                            <Link href="/mindset" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.2)] transition hover:brightness-110 sm:w-auto sm:px-4">Chat with AI Coach <ArrowRight size={14} /></Link>
                        </div>
                    </div>
                </div>

                <div className="hidden rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#101a2b] via-[#0a1626] to-[#080f1b] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:block">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold leading-none text-sky-300">“</span>
                            <h2 className="text-sm font-semibold text-white">Today&apos;s Quote</h2>
                        </div>
                        <button type="button" className="rounded-md border border-sky-400/20 bg-sky-500/5 px-2 py-1 text-[9px] text-sky-200">New Quote</button>
                    </div>

                    <blockquote className="px-2 py-2 font-serif text-[15px] italic leading-6 text-slate-100 sm:text-base">“{quote}”</blockquote>
                </div>

                <div className="col-span-2 rounded-2xl border border-slate-700/55 bg-gradient-to-br from-[#101d2e] via-[#0b1727] to-[#08111e] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] lg:col-span-1">
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300"><Zap size={14} /></div>
                            <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        <Link href="/goals" className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-violet-300/10 bg-violet-500/15 px-2 py-2 text-[10px] font-semibold text-violet-100 transition hover:bg-violet-500/25 sm:text-xs"><Plus size={13} className="shrink-0 text-violet-300" /><span className="truncate">Add Goal</span></Link>
                        <Link href="/trading" className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-blue-300/10 bg-blue-500/15 px-2 py-2 text-[10px] font-semibold text-blue-100 transition hover:bg-blue-500/25 sm:text-xs"><Plus size={13} className="shrink-0 text-blue-300" /><span className="truncate">Trading Journal</span></Link>
                        <Link href="/habits" className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-cyan-300/10 bg-cyan-500/15 px-2 py-2 text-[10px] font-semibold text-cyan-100 transition hover:bg-cyan-500/25 sm:text-xs"><Plus size={13} className="shrink-0 text-cyan-300" /><span className="truncate">Add Habit</span></Link>
                        <Link href="/finances" className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-orange-300/10 bg-orange-500/15 px-2 py-2 text-[10px] font-semibold text-orange-100 transition hover:bg-orange-500/25 sm:text-xs"><Receipt size={13} className="shrink-0 text-orange-300" /><span className="truncate">Add Expense</span></Link>
                        <Link href="/projects" className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-emerald-300/10 bg-emerald-500/15 px-2 py-2 text-[10px] font-semibold text-emerald-100 transition hover:bg-emerald-500/25 sm:text-xs"><Plus size={13} className="shrink-0 text-emerald-300" /><span className="truncate">Add Project</span></Link>
                        <Link href="/trading#daily-check-in" className="flex min-h-9 min-w-0 items-center gap-1.5 rounded-lg border border-fuchsia-300/10 bg-violet-500/15 px-2 py-2 text-[10px] font-semibold text-violet-100 transition hover:bg-violet-500/25 sm:text-xs"><Plus size={13} className="shrink-0 text-violet-300" /><span className="truncate">Daily Check-in</span></Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
