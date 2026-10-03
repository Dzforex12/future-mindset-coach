"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    ArrowRight,
    BrainCircuit,
    BriefcaseBusiness,
    CalendarClock,
    CheckCheck,
    CircleDashed,
    Crown,
    Flame,
    Goal,
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
    "Mindset Score": "Mindset Score",
    "Financial Goal": "Financial Goal",
};

function StatCard({ label, value, detail, icon, accent, glow, progress, className = "" }: { label: string; value: string; detail: string; icon: React.ReactNode; accent: string; glow: string; progress: number | null; className?: string }) {
    return (
        <div className={`relative isolate flex min-h-[64px] min-w-0 flex-col justify-between overflow-hidden rounded-[17px] border border-slate-700/70 bg-[linear-gradient(145deg,rgba(13,31,51,0.98),rgba(6,17,30,0.98))] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_8px_18px_rgba(1,8,19,0.2)] sm:min-h-[130px] sm:px-3.5 sm:py-3 ${className}`}>
            <div aria-hidden="true" className={`pointer-events-none absolute -right-5 -top-6 h-16 w-16 rounded-full opacity-20 blur-2xl ${glow}`} />
            <div className="relative flex min-w-0 items-center gap-2">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] border border-white/[0.07] sm:h-8 sm:w-8 ${accent}`}>{icon}</div>
                <p className="min-w-0 truncate text-[9px] font-semibold leading-tight tracking-[0.015em] text-slate-300 sm:text-[10px]">
                    <span className="sm:hidden">{mobileStatLabels[label] || label}</span>
                    <span className="hidden sm:inline">{label}</span>
                </p>
            </div>
            <div className="relative mt-1.5 flex min-w-0 items-end justify-between gap-1">
                <p className="min-w-0 truncate text-[15px] font-bold leading-5 text-white sm:text-[18px]">
                    <span className="sm:hidden">{value === "No data yet" ? "No data" : value}</span>
                    <span className="hidden sm:inline">{value}</span>
                </p>
                {detail ? <span className="hidden max-w-[45%] truncate text-right text-[9px] font-medium text-slate-400 sm:inline">{detail}</span> : null}
            </div>
            <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-slate-800/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] sm:mt-1.5 sm:h-[5px]">
                {progress !== null ? <div className={`h-full rounded-full ${glow}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /> : <div aria-hidden="true" className="h-full w-[14%] rounded-full bg-slate-700/65" />}
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
    const [mobileActivityTab, setMobileActivityTab] = useState<"focus" | "activity">("focus");
    const tradingChartData = useMemo(() => {
        const now = new Date();
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(now);
            date.setDate(now.getDate() - (6 - index));
            const key = getDateKey(date);
            const results = tradingEntries
                .filter((entry) => entry.date === key)
                .map((entry) => {
                    const result = entry.resultInR.trim() || entry.actualResult.trim();
                    const numericResult = Number.parseFloat(result.replace(/[^0-9.+-]/g, ""));
                    return Number.isFinite(numericResult) ? numericResult : null;
                })
                .filter((result): result is number => result !== null);

            return {
                date: date.toLocaleDateString("en-US", { weekday: "short" }),
                value: results.length ? results.reduce((sum, result) => sum + result, 0) : null,
            };
        });
        const values = days.flatMap((day) => day.value === null ? [] : [day.value]);
        const min = Math.min(0, ...values);
        const max = Math.max(0, ...values);
        const range = max - min || 1;

        return days.map((day, index) => ({
            ...day,
            x: 26 + index * 68,
            y: day.value === null ? null : 112 - ((day.value - min) / range) * 84,
        }));
    }, [tradingEntries]);

    return (
        <div className="dashboard-presentation space-y-1 pb-2 sm:space-y-3 xl:space-y-4">
            <section className="flex min-h-[40px] min-w-0 items-center justify-between gap-2 sm:min-h-[50px] xl:min-h-[60px]">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3"><div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/[0.08] text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.13)] sm:flex"><Crown size={20} /></div><div className="min-w-0"><h1 className="truncate text-[18px] font-bold leading-tight tracking-[-0.025em] text-white sm:text-[21px]">{greeting}, {displayName || "Edonis"}</h1><p className="mt-0.5 text-[11px] leading-4 text-slate-400 sm:text-xs">Focus today. Build your future.</p></div></div>
                <div className="w-[112px] shrink-0 text-right sm:w-auto"><p className="text-[9px] font-semibold leading-4 text-slate-300 sm:text-[11px]">{dateLabel}</p><p className="text-[8px] italic leading-3 text-slate-500 sm:text-[9px]">“Progress over perfection.”</p></div>
            </section>
            <section aria-label="Progress summary" className="grid grid-cols-6 gap-2 sm:grid-cols-3 xl:grid-cols-6 xl:gap-2.5">
                <StatCard label="Trading Discipline" value={tradingEntries.length ? `${tradingOverview.disciplineScore || 0}%` : "No data yet"} detail={tradingEntries.length ? "Discipline score" : ""} icon={<TrendingUp size={16} />} accent="bg-sky-500/10 text-sky-300" glow="bg-gradient-to-r from-blue-500 to-cyan-300" progress={tradingEntries.length ? tradingOverview.disciplineScore : null} className="order-1 col-span-2 sm:order-4 sm:col-span-1 xl:order-4" />
                <StatCard label="Habit Streak" value={habitRecords.length ? `${habitStreak} days` : "No data yet"} detail={habitRecords.length ? `${habitCompletion}% today` : ""} icon={<Flame size={16} />} accent="bg-amber-500/10 text-amber-300" glow="bg-gradient-to-r from-amber-400 to-emerald-400" progress={habitRecords.length ? habitCompletion : null} className="order-2 col-span-2 sm:order-2 sm:col-span-1 xl:order-2" />
                <StatCard label="Goals Progress" value={activeGoals.length ? `${goalProgress}%` : "No data yet"} detail={activeGoals.length ? `${activeGoals.length} active` : ""} icon={<Target size={16} />} accent="bg-violet-500/10 text-violet-300" glow="bg-violet-400" progress={activeGoals.length ? goalProgress : null} className="order-3 col-span-2 sm:order-1 sm:col-span-1 xl:order-1" />
                <StatCard label="Mindset Score" value={currentEmotion || alignment ? `${Math.max(0, Math.min(10, moodScore))}/10` : "No data yet"} detail={alignment ? `Focus ${alignment}` : ""} icon={<Sparkles size={16} />} accent="bg-emerald-500/10 text-emerald-300" glow="bg-gradient-to-r from-emerald-400 to-teal-300" progress={alignment > 0 ? alignment : null} className="order-4 col-span-3 sm:order-5 sm:col-span-1 xl:order-5" />
                <StatCard label="Financial Goal" value={financialProgress === null ? "No data yet" : `${financialProgress}%`} detail={financialProgress === null ? "" : `€${financeSaved.toLocaleString()} / €${financeTarget.toLocaleString()}`} icon={<Wallet size={16} />} accent="bg-amber-500/10 text-amber-200" glow="bg-gradient-to-r from-amber-300 to-orange-400" progress={financialProgress} className="order-5 col-span-3 sm:order-6 sm:col-span-1 xl:order-6" />
                <StatCard label="Business Progress" value={businessProgress === null ? "No data yet" : `${businessProgress}%`} detail={businessProgress === null ? "" : businessData.goals.length ? `${businessData.goals.length} goals` : `${businessData.tasks.length} tasks`} icon={<BriefcaseBusiness size={16} />} accent="bg-cyan-500/10 text-cyan-300" glow="bg-gradient-to-r from-cyan-400 to-emerald-400" progress={businessProgress} className="hidden sm:flex sm:order-3 sm:col-span-1 xl:order-3" />
            </section>
            <section aria-label="Analytics" className="grid grid-cols-2 gap-2 sm:gap-2.5 xl:grid-cols-[1.32fr_0.9fr_0.9fr_1fr]">
                <article className="col-span-2 min-w-0 rounded-[18px] border border-slate-700/75 bg-[radial-gradient(ellipse_at_top_left,rgba(14,116,218,0.13),transparent_60%),linear-gradient(145deg,#0d1d30,#07111e_80%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_10px_24px_rgba(1,8,19,0.18)] xl:col-span-1">
                    <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-sky-300"><TrendingUp size={16} /></span><div><h2 className="text-[11px] font-semibold text-white sm:text-xs">Trading Performance</h2><p className="text-[9px] text-slate-500">Last 7 days</p></div></div><span className="text-[10px] font-semibold text-sky-300">{tradingEntries.length ? `${tradingEntries.length} trades` : "No data"}</span></div>
                    <div className="relative h-[90px] overflow-hidden rounded-xl border border-slate-800/80 bg-[#050e1b]/75 px-2 pt-1 sm:h-[132px] xl:h-[128px]"><div aria-hidden="true" className="absolute inset-x-0 top-4 flex h-[78px] flex-col justify-between px-2"><span className="border-t border-slate-700/35" /><span className="border-t border-slate-700/30" /><span className="border-t border-slate-600/40" /></div>
                        {tradingChartData.some((point) => point.value !== null) ? <svg aria-label="Trading results over the last seven days" role="img" viewBox="0 0 470 138" preserveAspectRatio="none" className="relative h-full w-full"><defs><linearGradient id="trade-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#168bff" /><stop offset="100%" stopColor="#6458ff" /></linearGradient></defs>{tradingChartData.map((point, index) => point.y === null ? null : <g key={point.date}><title>{`${point.date}: ${point.value} result`}</title>{index > 0 && tradingChartData[index - 1].y !== null ? <line x1={tradingChartData[index - 1].x} y1={tradingChartData[index - 1].y!} x2={point.x} y2={point.y} stroke="url(#trade-line)" strokeWidth="3" /> : null}<circle cx={point.x} cy={point.y} r="3.5" fill="#a5d8ff" stroke="#386cff" strokeWidth="2" /><text x={point.x} y="133" textAnchor="middle" fill="#718198" fontSize="10">{point.date.slice(0, 1)}</text></g>)}</svg> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pt-2 text-[9px] text-slate-600"><span className="h-1 w-1 rounded-full bg-slate-600" />Log trades to see your results</div>}
                    </div>
                </article>
                <article className="hidden min-w-0 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#0e1d30,#07111e)] p-3 sm:block"><div className="mb-2 flex items-center justify-between"><h2 className="text-[11px] font-semibold text-white sm:text-xs">Business Overview</h2><BriefcaseBusiness size={15} className="text-emerald-300" /></div><div className="space-y-2">{[{ label: "Planning", value: businessData.goals.length ? businessGoalCounts.planning : 0, color: "bg-violet-500" }, { label: "In Progress", value: businessData.goals.length ? businessGoalCounts.active : businessTaskCounts.open, color: "bg-blue-500" }, { label: "Completed", value: businessData.goals.length ? businessGoalCounts.completed : businessTaskCounts.complete, color: "bg-emerald-500" }].map((item) => <div key={item.label} className="grid grid-cols-[1fr_auto] items-center gap-x-2 text-[9px] text-slate-400"><span>{item.label}</span><span className="font-semibold text-slate-200">{item.value}</span><span className="col-span-2 mt-0.5 h-[5px] overflow-hidden rounded-full bg-slate-800"><span className={`block h-full rounded-full ${item.color}`} style={{ width: `${businessData.goals.length ? Math.round((item.value / businessData.goals.length) * 100) : businessData.tasks.length ? Math.round((item.value / businessData.tasks.length) * 100) : 0}%` }} /></span></div>)}</div><p className="mt-2 truncate border-t border-slate-700/50 pt-1.5 text-[8px] text-slate-500">{businessData.monthlyTarget || businessData.revenue ? `€${businessData.revenue.toLocaleString()} revenue · €${businessData.monthlyTarget.toLocaleString()} target` : businessData.goals.length || businessData.tasks.length ? `${businessTaskCounts.open} open tasks` : "No business data yet"}</p></article>
                <article className="min-w-0 rounded-[18px] border border-emerald-900/45 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.09),transparent_62%),linear-gradient(145deg,#0b2023,#07111e)] p-2 sm:p-3"><div className="mb-1 flex items-center justify-between gap-1 sm:mb-2"><h2 className="truncate text-[10px] font-semibold text-white sm:text-xs">Habit Completion</h2><span className="text-[9px] font-semibold text-emerald-300">{habitRecords.length ? `${habitCompletion}%` : "—"}</span></div><div className="relative flex h-[52px] items-end gap-1 rounded-lg border border-slate-800/80 bg-[#050e1b]/65 px-1.5 pb-1 pt-1 sm:h-[90px] sm:gap-1.5 sm:px-2 sm:pt-2"><div aria-hidden="true" className="absolute inset-2 flex flex-col justify-between"><span className="border-t border-slate-700/25" /><span className="border-t border-slate-700/25" /><span className="border-t border-slate-600/35" /></div>{chartData.map((point) => <div key={point.date} className="relative z-[1] flex h-full min-w-0 flex-1 flex-col items-center justify-end"><div className={`w-full rounded-t-[4px] ${habitRecords.length ? "bg-gradient-to-t from-emerald-700 to-emerald-300" : "bg-slate-800/65"}`} style={{ height: `${habitRecords.length ? Math.max(5, point.value) : 8}%` }} /><span className="mt-1 text-[8px] text-slate-500">{point.date.slice(0, 1)}</span></div>)}</div></article>
                <article className="min-w-0 rounded-[18px] border border-slate-700/70 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.09),transparent_62%),linear-gradient(145deg,#0c1c2e,#07111e)] p-2 sm:p-3"><div className="mb-1 flex items-center justify-between gap-1 sm:mb-2"><h2 className="text-[10px] font-semibold text-white sm:text-xs">Goals Overview</h2><ArrowRight size={13} className="text-slate-500" /></div><div className="flex min-h-[56px] items-center justify-between gap-2 sm:min-h-[78px]"><div className="relative grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full p-[5px] sm:h-[82px] sm:w-[82px] sm:p-[7px]" style={{ background: dashboardGoals.length ? `conic-gradient(#10b981 0% ${completedGoalPercent}%, #168bff ${completedGoalPercent}% ${completedGoalPercent + inProgressGoalPercent}%, #26364b ${completedGoalPercent + inProgressGoalPercent}% 100%)` : "conic-gradient(#26364b 0% 100%)" }}><div className="grid h-full w-full place-items-center rounded-full bg-[#091522]"><span className="text-[11px] font-bold text-white sm:text-[13px]">{dashboardGoals.length ? `${completedGoalCount}/${dashboardGoals.length}` : "—"}</span></div></div><div className="min-w-0 flex-1 space-y-1 text-[8px] text-slate-400 sm:space-y-2 sm:text-[9px]"><p className="flex items-center gap-1 whitespace-nowrap"><i className="h-2 w-2 rounded-full bg-emerald-400" />Completed <b className="ml-auto text-slate-200">{completedGoalCount}</b></p><p className="flex items-center gap-1 whitespace-nowrap"><i className="h-2 w-2 rounded-full bg-blue-500" />In Progress <b className="ml-auto text-slate-200">{inProgressGoalCount}</b></p><p className="flex items-center gap-1 whitespace-nowrap"><i className="h-2 w-2 rounded-full bg-slate-600" />Not Started <b className="ml-auto text-slate-200">{notStartedGoalCount}</b></p></div></div></article>
            </section>
            <section aria-label="Focus and activity" className="space-y-2 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#0b1929,#07111e)] p-2.5 sm:p-3 lg:hidden"><div role="tablist" aria-label="Focus and activity" className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800/80 bg-[#050e19]/70 p-1"><button type="button" role="tab" aria-selected={mobileActivityTab === "focus"} onClick={() => setMobileActivityTab("focus")} className={`flex h-9 items-center justify-center gap-2 rounded-lg text-[11px] font-semibold ${mobileActivityTab === "focus" ? "border border-sky-400/60 bg-blue-500/15 text-sky-100" : "text-slate-400"}`}><Target size={15} />Today&apos;s Focus</button><button type="button" role="tab" aria-selected={mobileActivityTab === "activity"} onClick={() => setMobileActivityTab("activity")} className={`flex h-9 items-center justify-center gap-2 rounded-lg text-[11px] font-semibold ${mobileActivityTab === "activity" ? "border border-sky-400/60 bg-blue-500/15 text-sky-100" : "text-slate-400"}`}><Zap size={15} className="text-amber-300" />Recent Activity<ArrowRight size={13} /></button></div><div role="tabpanel" className="divide-y divide-slate-800/70">{mobileActivityTab === "focus" ? focusTasks.length ? focusTasks.map((task, index) => <div key={`${task.title}-${index}`} className="flex min-w-0 items-center gap-2 py-2"><span className={`grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full ${task.done ? "bg-sky-500 text-white" : "border-2 border-slate-600"}`}>{task.done ? <CheckCheck size={12} /> : null}</span><span className="min-w-0 flex-1 truncate text-[11px] text-slate-200">{task.title}</span><span className="shrink-0 text-[9px] text-slate-500">{task.time}</span></div>) : <p className="py-3 text-[11px] text-slate-500">No tasks yet. Add a focus or goal to see it here.</p> : activityItems.length ? activityItems.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2 py-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-300">{item.kind === "habit" ? <CheckCheck size={13} /> : item.kind === "goal" ? <Goal size={13} /> : <TrendingUp size={13} />}</span><span className="min-w-0 flex-1 truncate text-[11px] text-slate-200">{item.label}</span><span className="shrink-0 text-[9px] text-slate-500">{item.time}</span></div>) : <p className="py-3 text-[11px] text-slate-500">No recent activity yet.</p>}</div></section>
            <section aria-label="Today's focus, recent activity, and deadlines" className="hidden min-h-[176px] gap-2.5 lg:grid lg:grid-cols-2 xl:min-h-[190px] xl:grid-cols-[1.2fr_1fr_1fr]">
                <article className="min-w-0 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#0c1d31,#07111e)] p-3"><h2 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-white"><Target size={15} className="text-emerald-300" />Today&apos;s Focus</h2>{focusTasks.length ? focusTasks.map((task, index) => <div key={`${task.title}-${index}`} className="flex min-w-0 items-center gap-2 border-t border-slate-800/70 py-2"><span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full ${task.done ? "bg-sky-500 text-white" : "border border-slate-600"}`}>{task.done ? <CheckCheck size={11} /> : <CircleDashed size={11} />}</span><span className="min-w-0 flex-1 truncate text-[10px] text-slate-200">{task.title}</span><span className="text-[9px] text-slate-500">{task.time}</span></div>) : <p className="py-3 text-[10px] text-slate-500">No tasks yet.</p>}</article>
                <article className="min-w-0 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#151d2b,#07111e)] p-3"><h2 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-white"><Zap size={15} className="text-amber-300" />Recent Activity</h2>{activityItems.length ? activityItems.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2 border-t border-slate-800/70 py-2"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-300">{item.kind === "habit" ? <CheckCheck size={13} /> : item.kind === "goal" ? <Goal size={13} /> : <TrendingUp size={13} />}</span><span className="min-w-0 flex-1 truncate text-[10px] text-slate-200">{item.label}</span><span className="text-[9px] text-slate-500">{item.time}</span></div>) : <p className="py-3 text-[10px] text-slate-500">No recent activity yet.</p>}</article>
                <article className="min-w-0 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#201b2b,#07111e)] p-3"><h2 className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-white"><CalendarClock size={15} className="text-rose-300" />Upcoming Deadlines</h2>{upcomingDeadlines.length ? upcomingDeadlines.map((item) => <div key={item.id} className="flex min-w-0 items-center justify-between gap-2 border-t border-slate-800/70 py-2"><div className="min-w-0"><p className="truncate text-[10px] text-slate-200">{item.title}</p><p className="truncate text-[8px] text-slate-500">{item.category}</p></div><StatusPill label={item.status} tone={item.diff <= 0 ? "bg-red-500/10 text-red-300" : item.diff <= 3 ? "bg-amber-500/10 text-amber-300" : "bg-sky-500/10 text-sky-300"} /></div>) : <p className="py-3 text-[10px] text-slate-500">No upcoming deadlines.</p>}</article>
            </section>
            <section aria-label="AI Coach, quote, and quick actions" className="grid gap-2.5 lg:grid-cols-2 xl:grid-cols-[1.1fr_0.95fr_1fr]">
                <article className="relative min-w-0 overflow-hidden rounded-[18px] border border-sky-900/65 bg-[radial-gradient(ellipse_at_18%_68%,rgba(0,144,255,0.16),transparent_44%),linear-gradient(145deg,#0b2035,#06111f_78%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_12px_26px_rgba(3,22,50,0.25)]"><div aria-hidden="true" className="pointer-events-none absolute -left-8 bottom-0 h-40 w-44 rounded-full bg-blue-500/10 blur-3xl" /><div className="relative mb-1.5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-xs font-semibold text-white"><BrainCircuit size={16} className="text-sky-300" />AI Coach</h2><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/[0.08] px-2 py-1 text-[9px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Online</span></div>
                    <div className="relative flex min-h-[144px] items-center gap-2 overflow-hidden rounded-xl border border-sky-900/55 bg-[#040d19]/60 px-2 py-2 sm:gap-3"><div aria-hidden="true" className="relative h-[132px] w-[112px] shrink-0 sm:h-[142px] sm:w-[124px]"><div className="absolute inset-x-1 bottom-0 h-20 rounded-full bg-blue-500/15 blur-2xl" /><svg viewBox="0 0 150 165" className="relative h-full w-full drop-shadow-[0_0_12px_rgba(14,165,233,0.4)]" fill="none"><defs><linearGradient id="bot-shell" x1="75" y1="35" x2="75" y2="150" gradientUnits="userSpaceOnUse"><stop stopColor="#12395b" /><stop offset="1" stopColor="#061323" /></linearGradient><linearGradient id="bot-eye" x1="48" y1="79" x2="102" y2="93" gradientUnits="userSpaceOnUse"><stop stopColor="#22d3ee" /><stop offset="1" stopColor="#2563eb" /></linearGradient></defs><ellipse cx="75" cy="151" rx="58" ry="7" fill="#0284c7" fillOpacity=".16" /><path d="M16 133c5-28 19-42 40-49h38c21 7 35 21 40 49l-20 20H36l-20-20Z" fill="url(#bot-shell)" stroke="#168bff" strokeWidth="2" /><path d="M47 54c0-18 12-31 28-31s28 13 28 31v25c0 19-12 32-28 32S47 98 47 79V54Z" fill="url(#bot-shell)" stroke="#56d7ff" strokeWidth="2.3" /><path d="M38 59c-8 1-12 8-12 17s5 15 14 15h7V59h-9Zm74 0c8 1 12 8 12 17s-5 15-14 15h-7V59h9Z" fill="#0b2842" stroke="#38bdf8" strokeWidth="2" /><path d="M51 68c6-6 14-9 24-9s18 3 24 9v16c-6 7-14 10-24 10s-18-3-24-10V68Z" fill="#061626" stroke="#168bff" /><path d="m57 76 12 3m24-3-12 3" stroke="url(#bot-eye)" strokeLinecap="round" strokeWidth="4" /><path d="M69 99h12m-6 12v13m-16 1h32M75 16V9m-8 0h16" stroke="#38bdf8" strokeLinecap="round" strokeWidth="2" /><circle cx="75" cy="7" r="3" fill="#22d3ee" /><path d="M17 76h10m96 0h10" stroke="#67e8f9" strokeWidth="2" /><circle cx="15" cy="76" r="3" fill="#38bdf8" /><circle cx="135" cy="76" r="3" fill="#38bdf8" /></svg></div><div className="relative min-w-0 flex-1"><p className="text-[13px] font-semibold leading-tight text-white sm:text-sm">Need advice or a plan?</p><p className="mt-1 text-[10px] leading-[1.45] text-slate-400 sm:text-[11px]">Ask about your goals, trading, mindset, habits or life.</p><Link href="/mindset" className="mt-2.5 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-2 text-[10px] font-semibold text-white shadow-[0_5px_18px_rgba(37,99,235,0.35)] sm:text-[11px]">Chat with AI Coach <ArrowRight size={14} /></Link></div></div>
                </article>
                <article className="hidden min-w-0 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#0d1a2b,#07111e)] p-3 sm:block"><h2 className="mb-2 text-xs font-semibold text-white">“ Today&apos;s Quote</h2><blockquote className="flex min-h-[120px] items-center px-3 font-serif text-[16px] italic leading-6 text-slate-100 sm:text-[18px]">“{quote}”</blockquote></article>
                <article className="hidden min-w-0 rounded-[18px] border border-slate-700/70 bg-[linear-gradient(145deg,#0d1a2b,#07111e)] p-3 lg:block"><h2 className="mb-2 text-xs font-semibold text-white"><Zap size={15} className="mr-2 inline text-sky-300" />Quick Actions</h2><div className="grid grid-cols-2 gap-1.5"><Link href="/goals" className="rounded-lg bg-violet-500/15 px-2 py-2 text-[10px] text-violet-100">＋ Add Goal</Link><Link href="/trading" className="rounded-lg bg-blue-500/15 px-2 py-2 text-[10px] text-blue-100">＋ Trading Journal</Link><Link href="/habits" className="rounded-lg bg-cyan-500/15 px-2 py-2 text-[10px] text-cyan-100">＋ Add Habit</Link><Link href="/finances" className="rounded-lg bg-orange-500/15 px-2 py-2 text-[10px] text-orange-100">＋ Add Expense</Link><Link href="/projects" className="rounded-lg bg-emerald-500/15 px-2 py-2 text-[10px] text-emerald-100">＋ Add Project</Link><Link href="/trading#daily-check-in" className="rounded-lg bg-fuchsia-500/15 px-2 py-2 text-[10px] text-fuchsia-100">＋ Daily Check-in</Link></div></article>
            </section>
        </div>
    );
}