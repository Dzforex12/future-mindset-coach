"use client";

import { useEffect, useMemo, useState } from "react";
import { addDailyPriority, deleteDailyPriority, EMPTY_DAILY_COMMAND_CENTER, getDailyCommandCenter, setBusinessFocus, setDailyPriorityCompleted, setEveningReview, setGoalAction, setProjectFocus, toggleGoalAction, updateDailyPriority, type DailyCommandCenterState, type DailyPriority, type PrioritySourceType } from "@/app/state/dailyCommandCenter";
import { getBusinessData, saveBusinessData, type BusinessData } from "@/app/state/businessEngine";
import { getFinanceState, getMonthlyFinanceSummary, type FinanceState, type MonthlyFinanceSummary } from "@/app/state/financeEngine";
import { getGoals, type GoalRecord } from "@/app/state/goalEngine";
import { getHabitRecords, setHabitCompleted, type HabitRecord } from "@/app/state/habitEngine";
import { getLocalMonthKey } from "@/app/state/localDate";
import { useMemoryStore } from "@/app/state/memoryStore";
import { getProjects, saveProjects, type Project } from "@/app/state/projectsEngine";
import { useBrowserDateKey } from "@/app/state/storageSubscription";
import { getDailyCheckIn, getPreTradeChecklist, getTradingJournalEntries, saveDailyCheckIn, type DailyCheckIn, type TradingJournalEntry, type ChecklistItem } from "@/app/state/tradingEngine";
import { BuildMyDayCard } from "@/components/today/BuildMyDayCard";
import { BusinessFocusCard, GoalActionCard, ProjectFocusCard } from "@/components/today/TodayActions";
import { EveningReview, MorningCheckIn } from "@/components/today/TodayCheckIns";
import { TodayHabits } from "@/components/today/TodayHabits";
import { TodayHeader } from "@/components/today/TodayHeader";
import { TodayPriorities } from "@/components/today/TodayPriorities";
import { TodayProgress } from "@/components/today/TodayProgress";
import { FinanceSnapshot, TradingDisciplineCard } from "@/components/today/TodaySnapshots";

const EMPTY_BUSINESS: BusinessData = { goals: [], tasks: [], leads: [], monthlyTarget: 0, revenue: 0 };
const EMPTY_FINANCE: FinanceState = { income: 0, expenses: 0, savings: 0, savingsTarget: 0, goals: [], transactions: [] };
const EMPTY_MONTHLY: MonthlyFinanceSummary = { income: 0, expenses: 0, net: 0, savings: 0, savingsTarget: 0, goals: [], transactionCount: 0 };

export default function TodayPage() {
    const date = useBrowserDateKey();
    const displayName = useMemoryStore((state) => state.displayName);
    const currentEmotion = useMemoryStore((state) => state.currentEmotion);
    const setCurrentEmotion = useMemoryStore((state) => state.setCurrentEmotion);
    const preferredTradingRiskLimit = useMemoryStore((state) => state.preferredTradingRiskLimit);
    const dailyTradingLimit = useMemoryStore((state) => state.dailyTradingLimit);
    const riskProfile = useMemoryStore((state) => state.riskProfile);
    const [greeting, setGreeting] = useState("Hello");
    const [priorities, setPriorities] = useState<DailyPriority[]>([]);
    const [commandCenter, setCommandCenter] = useState<DailyCommandCenterState>(EMPTY_DAILY_COMMAND_CENTER);
    const [goals, setGoals] = useState<GoalRecord[]>([]);
    const [habits, setHabits] = useState<HabitRecord[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [business, setBusiness] = useState<BusinessData>(EMPTY_BUSINESS);
    const [finance, setFinance] = useState<FinanceState>(EMPTY_FINANCE);
    const [monthly, setMonthly] = useState<MonthlyFinanceSummary>(EMPTY_MONTHLY);
    const [checkIn, setCheckIn] = useState<DailyCheckIn | null>(null);
    const [journal, setJournal] = useState<TradingJournalEntry[]>([]);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [hydratedDate, setHydratedDate] = useState("");

    useEffect(() => {
        const hour = new Date().getHours();
        const timer = window.setTimeout(() => {
            setGreeting(hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
        }, 0);
        return () => window.clearTimeout(timer);
    }, [date]);

    useEffect(() => {
        if (!date) return;
        const sync = () => {
            const state = getDailyCommandCenter();
            const nextFinance = getFinanceState();
            setCommandCenter(state);
            setPriorities(state.prioritiesByDate[date] ?? []);
            setGoals(getGoals());
            setHabits(getHabitRecords());
            setProjects(getProjects());
            setBusiness(getBusinessData());
            setFinance(nextFinance);
            setMonthly(getMonthlyFinanceSummary(nextFinance, getLocalMonthKey()));
            setCheckIn(getDailyCheckIn(date));
            setJournal(getTradingJournalEntries());
            setChecklist(getPreTradeChecklist());
            setHydratedDate(date);
        };
        const initialSync = window.setTimeout(sync, 0);
        window.addEventListener("mindset-store-update", sync);
        return () => {
            window.clearTimeout(initialSync);
            window.removeEventListener("mindset-store-update", sync);
        };
    }, [date]);

    const dateLabel = useMemo(() => date
        ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
        : "", [date]);
    const dayPriorities = hydratedDate === date ? priorities : [];
    const todayHabits = habits.filter((habit) => !habit.paused && !habit.archived);
    const completedHabits = todayHabits.filter((habit) => habit.completedDates.includes(date)).length;
    const todayReview = hydratedDate === date ? commandCenter.eveningReviewsByDate[date] ?? null : null;
    const profileReady = Boolean(date) && hydratedDate === date;
    const goalAction = hydratedDate === date ? commandCenter.goalActionsByDate[date] ?? null : null;
    const projectFocus = hydratedDate === date ? commandCenter.projectFocusByDate[date] ?? null : null;
    const businessFocus = hydratedDate === date ? commandCenter.businessFocusByDate[date]?.taskId ?? "" : "";
    const todayPrioritiesComplete = dayPriorities.filter((priority) => priority.completed).length;

    const sourceOptions = useMemo(() => ({
        Goal: goals.filter((goal) => !goal.completed && !goal.archived).map((goal) => ({ id: goal.id, label: goal.title })),
        Habit: habits.filter((habit) => !habit.paused && !habit.archived).map((habit) => ({ id: habit.id, label: habit.title })),
        Project: projects.filter((project) => project.status === "Active").map((project) => ({ id: project.id, label: project.title })),
        Business: business.tasks.filter((task) => !task.complete).map((task) => ({ id: task.id, label: task.title })),
        Finance: finance.goals.map((goal) => ({ id: goal.id, label: goal.title })),
    }), [goals, habits, projects, business.tasks, finance.goals]);

    function refreshCommandCenter() {
        const state = getDailyCommandCenter();
        setCommandCenter(state);
        setPriorities(state.prioritiesByDate[date] ?? []);
    }

    function addPriority(input: { title: string; note: string; sourceType: PrioritySourceType; sourceId?: string }): boolean {
        try {
            addDailyPriority(date, input);
            refreshCommandCenter();
            setFeedback(null);
            return true;
        } catch (cause) {
            setFeedback(cause instanceof Error ? cause.message : "Priority could not be saved.");
            return false;
        }
    }

    function updatePriority(id: string, input: { title: string; note: string; sourceType: PrioritySourceType; sourceId?: string }): boolean {
        try {
            updateDailyPriority(date, id, input);
            refreshCommandCenter();
            setFeedback(null);
            return true;
        } catch (cause) {
            setFeedback(cause instanceof Error ? cause.message : "Priority could not be updated.");
            return false;
        }
    }

    function saveMorningCheckIn(mood: string, successCondition: string) {
        const existing = getDailyCheckIn(date);
        saveDailyCheckIn({
            date,
            mood,
            energy: existing?.energy ?? 7,
            discipline: existing?.discipline ?? 7,
            tradingToday: existing?.tradingToday ?? "Maybe",
            mainPriority: successCondition,
            distraction: existing?.distraction ?? "",
        });
        setCurrentEmotion(mood);
        setFeedback("Morning check-in saved.");
    }

    function completeProjectTask() {
        if (!projectFocus) return;
        saveProjects(projects.map((project) => project.id !== projectFocus.projectId ? project : {
            ...project,
            tasks: project.tasks.map((task) => task.id === projectFocus.taskId ? { ...task, complete: true } : task),
        }));
        setProjectFocus(date, "", "");
    }

    function completeBusinessTask() {
        if (!businessFocus) return;
        saveBusinessData({
            ...business,
            tasks: business.tasks.map((task) => task.id === businessFocus ? { ...task, complete: true } : task),
        });
        setBusinessFocus(date, "");
    }

    return (
        <div className="space-y-4 sm:space-y-5">
            <TodayHeader greeting={greeting} displayName={profileReady ? displayName || "there" : "there"} dateLabel={dateLabel} />
            {feedback ? <p role="status" className="rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-sm text-sky-100">{feedback}</p> : null}

            <TodayProgress
                prioritiesComplete={todayPrioritiesComplete}
                prioritiesTotal={dayPriorities.length}
                habitsComplete={completedHabits}
                habitsTotal={todayHabits.length}
                reviewComplete={Boolean(todayReview)}
            />
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <TodayPriorities
                    priorities={dayPriorities}
                    sources={sourceOptions}
                    onAdd={addPriority}
                    onUpdate={updatePriority}
                    onToggle={(priority) => {
                        try {
                            setDailyPriorityCompleted(date, priority.id, !priority.completed);
                            refreshCommandCenter();
                        } catch (cause) {
                            setFeedback(cause instanceof Error ? cause.message : "Priority status could not be changed.");
                        }
                    }}
                    onDelete={(id) => { deleteDailyPriority(date, id); refreshCommandCenter(); }}
                />
                <TodayHabits
                    habits={habits}
                    date={date}
                    onToggle={(id, completed) => { setHabitCompleted(id, completed, date); }}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <GoalActionCard
                    key={`${date}:${goalAction?.updatedAt ?? ""}`}
                    goals={goals}
                    action={goalAction}
                    onSave={(goalId, action) => { setGoalAction(date, goalId, action); setFeedback("Goal action saved."); }}
                    onComplete={(completed) => { toggleGoalAction(date, completed); setFeedback(completed ? "Goal action completed." : "Goal action reopened."); }}
                />
                <div className="grid content-start gap-4">
                    <ProjectFocusCard
                        key={`${date}:${projectFocus?.projectId ?? ""}:${projectFocus?.taskId ?? ""}`}
                        projects={projects}
                        focus={projectFocus}
                        onSelect={(projectId, taskId) => setProjectFocus(date, projectId, taskId)}
                        onComplete={completeProjectTask}
                    />
                    <BusinessFocusCard
                        key={`${date}:${businessFocus}`}
                        business={business}
                        focusTaskId={businessFocus}
                        onSelect={(taskId) => setBusinessFocus(date, taskId)}
                        onComplete={completeBusinessTask}
                    />
                    {!projects.some((project) => project.status === "Active" && project.tasks.some((task) => !task.complete)) && !business.tasks.some((task) => !task.complete)
                        ? <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">No open project or business tasks to focus on.</div>
                        : null}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <TradingDisciplineCard
                    riskProfile={profileReady ? riskProfile : "Moderate"}
                    preferredRiskLimit={profileReady ? preferredTradingRiskLimit : "1%"}
                    dailyTradingLimit={profileReady ? dailyTradingLimit : ""}
                    checklist={checklist}
                    trades={journal}
                    date={date}
                />
                <FinanceSnapshot finance={finance} monthly={monthly} />
            </div>

            <MorningCheckIn
                key={`${date}:${checkIn?.updatedAt ?? ""}:${currentEmotion ?? ""}`}
                currentMood={checkIn?.mood ?? (profileReady ? currentEmotion : "") ?? ""}
                mainPriority={checkIn?.mainPriority ?? ""}
                onSave={saveMorningCheckIn}
            />
            <EveningReview
                key={`${date}:${todayReview?.updatedAt ?? ""}`}
                review={todayReview}
                onSave={(review) => { setEveningReview(date, review); refreshCommandCenter(); setFeedback("End of day review saved."); }}
            />
            <BuildMyDayCard />
        </div>
    );
}
