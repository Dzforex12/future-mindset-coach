import { getTradingPatternInsights } from "@/app/state/tradingEngine";
import { getLocalDateKey, getLocalDateKeysForWeek, getLocalMonthKey, getLocalWeekKey } from "@/app/state/localDate";
import { getMonthlyFinanceSummary } from "@/app/state/financeEngine";
import { EMPTY_DAILY_COMMAND_CENTER } from "@/app/state/dailyCommandCenter";
import type { CloudAppState } from "@/app/state/cloudState";

function daysUntil(date: string, today: string): number | null {
    if (!date) return null;
    const [year, month, day] = today.split("-").map(Number);
    const [targetYear, targetMonth, targetDay] = date.split("-").map(Number);
    const start = Date.UTC(year, month - 1, day);
    const target = Date.UTC(targetYear, targetMonth - 1, targetDay);
    return Number.isFinite(target) ? Math.round((target - start) / 86400000) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function buildServerCoachContext(state: CloudAppState) {
    const today = getLocalDateKey();
    const weekDates = getLocalDateKeysForWeek(getLocalWeekKey());
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = getLocalDateKey(cutoff);
    const memory = {
        ...state.profile,
        ...state.goals.memory,
        ...state.habits.memory,
        ...state.mindset,
    } as Record<string, unknown>;
    const allHabits = state.habits.records;
    const activeHabits = allHabits.filter((habit) => !habit.paused && !habit.archived);
    const allGoals = state.goals.records;
    const activeGoals = allGoals.filter((goal) => !goal.completed && !goal.archived);
    const allTrades = state.trading.journal;
    const business = state.business;
    const projects = state.projects;
    const finances = state.finances;
    const monthlyFinances = getMonthlyFinanceSummary(finances, getLocalMonthKey());
    const checklist = state.trading.pretradeChecklist;
    const recentCheckIns = state.dailyCheckin.slice().sort((left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime()).slice(0, 3);
    const commandCenter = state.dailyCommandCenter ?? EMPTY_DAILY_COMMAND_CENTER;
    const latestReview = Object.entries(commandCenter.eveningReviewsByDate)
        .sort(([left], [right]) => right.localeCompare(left))[0] ?? null;
    const priorities = commandCenter.prioritiesByDate[today] ?? [];
    const alignment = isRecord(memory.alignment) ? memory.alignment : {};

    return {
        dateContext: { today, weekday: new Date().toLocaleDateString("en", { weekday: "long" }) },
        profile: {
            displayName: typeof memory.displayName === "string" ? memory.displayName : "unavailable",
            mainLifeGoal: typeof memory.mainLifeGoal === "string" ? memory.mainLifeGoal : "unavailable",
            dailyFocus: typeof memory.dailyFocus === "string" ? memory.dailyFocus : "unavailable",
            preferredTradingRiskLimit: typeof memory.preferredTradingRiskLimit === "string" ? memory.preferredTradingRiskLimit : "unavailable",
            dailyTradingLimit: typeof memory.dailyTradingLimit === "string" ? memory.dailyTradingLimit : "unavailable",
        },
        habits: {
            hasData: activeHabits.length > 0,
            total: activeHabits.length,
            completedTodayCount: activeHabits.filter((habit) => habit.completedDates.includes(today)).length,
            incompleteTodayCount: activeHabits.filter((habit) => !habit.completedDates.includes(today)).length,
            completedToday: activeHabits.filter((habit) => habit.completedDates.includes(today)).slice(0, 12).map((habit) => habit.title),
            incompleteToday: activeHabits.filter((habit) => !habit.completedDates.includes(today)).slice(0, 12).map((habit) => habit.title),
            streak: state.habits.streak.current,
            recent: activeHabits.slice(0, 8).map((habit) => ({
                id: habit.id,
                title: habit.title,
                completedToday: habit.completedDates.includes(today),
                completionsLast7Days: habit.completedDates.filter((date) => date >= cutoffKey && date <= today).length,
            })),
        },
        goals: {
            hasData: activeGoals.length > 0,
            activeCount: activeGoals.length,
            active: activeGoals.slice(0, 8).map((goal) => ({
                id: goal.id,
                title: goal.title,
                progress: goal.progress,
                category: goal.category,
                targetDate: goal.targetDate || "unavailable",
                completed: goal.completed,
            })),
            recentlyCompleted: allGoals.filter((goal) => goal.completed).slice().sort((left, right) =>
                new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()).slice(0, 3).map((goal) => ({
                title: goal.title,
                completedAt: goal.updatedAt,
            })),
        },
        mindset: {
            currentState: typeof memory.currentEmotion === "string" ? memory.currentEmotion : "not set",
            focusScore: typeof alignment.dailyScore === "number" ? alignment.dailyScore : 0,
            latestCheckIn: state.dailyCheckin.find((entry) => entry.date === today) ?? null,
            recentCheckIns,
            summary: typeof memory.summary === "string" ? memory.summary : "not available",
        },
        trading: {
            hasData: allTrades.length > 0,
            tradingMode: memory.tradingMode,
            riskProfile: memory.riskProfile,
            preferredRiskLimit: typeof memory.preferredTradingRiskLimit === "string" ? memory.preferredTradingRiskLimit : "unavailable",
            dailyTradingLimit: typeof memory.dailyTradingLimit === "string" ? memory.dailyTradingLimit : "unavailable",
            todayJournalCount: allTrades.filter((entry) => entry.date === today).length,
            checklistStatus: {
                checked: checklist.filter((item) => item.checked).length,
                total: checklist.length,
                criticalChecksComplete: checklist.filter((item) => item.critical).every((item) => item.checked),
                allChecksComplete: checklist.every((item) => item.checked),
            },
            recentTrades: allTrades.slice(0, 3),
            weeklyTrades: allTrades.filter((entry) => entry.date >= cutoffKey && entry.date <= today).slice(0, 8),
            patternInsights: getTradingPatternInsights(allTrades),
        },
        recentProgress: { recentActivity: [] },
        business: {
            hasData: Boolean(business.goals.length || business.tasks.length || business.leads.length || business.monthlyTarget || business.revenue),
            goalCount: business.goals.length,
            goalHighlights: business.goals.slice(0, 4).map((goal) => ({
                title: goal.title, status: goal.status, progress: goal.progress,
                deadline: goal.deadline || null, daysUntil: daysUntil(goal.deadline, today),
            })),
            openTaskCount: business.tasks.filter((task) => !task.complete).length,
            overdueTasks: business.tasks.filter((task) => !task.complete && task.deadline && (daysUntil(task.deadline, today) ?? 0) < 0).slice(0, 4).map((task) => ({
                title: task.title, deadline: task.deadline, daysOverdue: Math.abs(daysUntil(task.deadline, today) ?? 0),
            })),
            dueSoonTasks: business.tasks.filter((task) => !task.complete && task.deadline && (daysUntil(task.deadline, today) ?? 8) >= 0 && (daysUntil(task.deadline, today) ?? 8) <= 7).slice(0, 4).map((task) => ({
                title: task.title, deadline: task.deadline, daysUntil: daysUntil(task.deadline, today),
            })),
            leadStatuses: business.leads.reduce<Record<string, number>>((counts, lead) => ({ ...counts, [lead.status]: (counts[lead.status] || 0) + 1 }), {}),
            monthlyRevenueTarget: business.monthlyTarget,
            currentRevenue: business.revenue,
            openTasks: business.tasks.filter((task) => !task.complete).slice(0, 5).map((task) => ({ id: task.id, title: task.title, priority: task.priority, deadline: task.deadline || null })),
        },
        projects: {
            hasData: projects.length > 0,
            activeCount: projects.filter((project) => project.status === "Active").length,
            active: projects.filter((project) => project.status !== "Completed").slice(0, 5).map((project) => ({
                id: project.id, title: project.title, status: project.status, progress: project.progress,
                deadline: project.deadline || null, daysUntilDeadline: daysUntil(project.deadline, today),
                incompleteTasks: project.tasks.filter((task) => !task.complete).slice(0, 4).map((task) => ({
                    id: task.id, title: task.title, dueDate: task.dueDate || null, daysUntil: daysUntil(task.dueDate || "", today),
                })),
            })),
        },
        finances: {
            hasData: Boolean(finances.transactions.length || finances.savings || finances.savingsTarget || finances.goals.length),
            month: getLocalMonthKey(),
            income: monthlyFinances.transactionCount ? monthlyFinances.income : null,
            expenses: monthlyFinances.transactionCount ? monthlyFinances.expenses : null,
            monthlyNet: monthlyFinances.transactionCount ? monthlyFinances.net : null,
            savings: finances.savings || null,
            savingsTarget: finances.savingsTarget || null,
            goals: finances.goals.slice(0, 4).map((goal) => ({ title: goal.title, saved: goal.saved, target: goal.target })),
        },
        dailyPriorities: priorities.map(({ id, title, sourceType, completed }) => ({ id, title, sourceType, completed })),
        goalAction: commandCenter.goalActionsByDate[today] ?? null,
        latestReview: latestReview ? { date: latestReview[0], ...latestReview[1] } : null,
        weeklyReview: {
            dates: weekDates,
            reviewsCompleted: weekDates.filter((date) => Boolean(commandCenter.eveningReviewsByDate[date])).length,
        },
    };
}

export function buildServerCoachRequestBody(message: string, state: CloudAppState) {
    const context = buildServerCoachContext(state);
    const memory = {
        ...state.profile,
        ...state.goals.memory,
        ...state.habits.memory,
        ...state.mindset,
    } as Record<string, unknown>;

    return {
        message,
        coachContext: context,
        activeGoals: context.goals.active,
        habitHistory: Array.isArray(memory.habitHistory) ? memory.habitHistory.slice(-7) : [],
        alignment: isRecord(memory.alignment) ? memory.alignment : {},
        lifeRoadmap: isRecord(memory.lifeRoadmap) ? memory.lifeRoadmap : {},
        futureSelf: isRecord(memory.futureSelf) ? memory.futureSelf : {},
        adaptivePersonality: isRecord(memory.adaptivePersonality) ? memory.adaptivePersonality : {},
        tradingMode: typeof memory.tradingMode === "string" ? memory.tradingMode : "Forex",
        riskProfile: typeof memory.riskProfile === "string" ? memory.riskProfile : "Moderate",
        coachPersonality: typeof memory.coachPersonality === "string" ? memory.coachPersonality : "Neutral",
        disciplineStreak: typeof memory.disciplineStreak === "number" ? memory.disciplineStreak : state.habits.streak.current,
        currentEmotion: typeof memory.currentEmotion === "string" ? memory.currentEmotion : null,
    };
}
