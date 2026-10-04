import { getBusinessData } from "./businessEngine";
import { getDailyCommandCenter } from "./dailyCommandCenter";
import { getFinanceState, getMonthlyFinanceSummary } from "./financeEngine";
import { getGoals } from "./goalEngine";
import { getCurrentStreak, getHabitRecords } from "./habitEngine";
import { getLocalDateKey, getLocalDateKeysForWeek, getLocalMonthKey, getLocalWeekKey } from "./localDate";
import { useMemoryStore } from "./memoryStore";
import { getProjects } from "./projectsEngine";
import {
    getDailyCheckIn,
    getDailyCheckIns,
    getPreTradeChecklist,
    getTradingJournalEntries,
    getTradingPatternInsights,
} from "./tradingEngine";

function daysUntil(date: string, today: string): number | null {
    if (!date) return null;
    const [year, month, day] = today.split("-").map(Number);
    const [targetYear, targetMonth, targetDay] = date.split("-").map(Number);
    const start = Date.UTC(year, month - 1, day);
    const target = Date.UTC(targetYear, targetMonth - 1, targetDay);
    return Number.isFinite(target) ? Math.round((target - start) / 86400000) : null;
}

export function buildCoachContext() {
    const today = getLocalDateKey();
    const weekDates = getLocalDateKeysForWeek(getLocalWeekKey());
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 6);
    const cutoffKey = getLocalDateKey(cutoff);
    const memory = useMemoryStore.getState();
    const commandCenter = getDailyCommandCenter();
    const allHabits = getHabitRecords();
    const activeHabits = allHabits.filter((habit) => !habit.paused && !habit.archived);
    const allGoals = getGoals();
    const activeGoals = allGoals.filter((goal) => !goal.completed && !goal.archived);
    const allTrades = getTradingJournalEntries();
    const business = getBusinessData();
    const projects = getProjects();
    const finances = getFinanceState();
    const monthlyFinances = getMonthlyFinanceSummary(finances, getLocalMonthKey());
    const checklist = getPreTradeChecklist();
    const recentCheckIns = getDailyCheckIns().slice(0, 3);
    const latestReview = Object.entries(commandCenter.eveningReviewsByDate)
        .sort(([left], [right]) => right.localeCompare(left))[0] ?? null;
    const priorities = commandCenter.prioritiesByDate[today] ?? [];

    return {
        dateContext: { today, weekday: new Date().toLocaleDateString("en", { weekday: "long" }) },
        profile: {
            displayName: memory.displayName || "unavailable",
            mainLifeGoal: memory.mainLifeGoal || "unavailable",
            dailyFocus: memory.dailyFocus || "unavailable",
            preferredTradingRiskLimit: memory.preferredTradingRiskLimit || "unavailable",
            dailyTradingLimit: memory.dailyTradingLimit || "unavailable",
        },
        habits: {
            hasData: activeHabits.length > 0,
            total: activeHabits.length,
            completedTodayCount: activeHabits.filter((habit) => habit.completedDates.includes(today)).length,
            incompleteTodayCount: activeHabits.filter((habit) => !habit.completedDates.includes(today)).length,
            completedToday: activeHabits.filter((habit) => habit.completedDates.includes(today)).slice(0, 12).map((habit) => habit.title),
            incompleteToday: activeHabits.filter((habit) => !habit.completedDates.includes(today)).slice(0, 12).map((habit) => habit.title),
            streak: getCurrentStreak(),
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
            currentState: memory.currentEmotion || "not set",
            focusScore: memory.alignment.dailyScore || 0,
            latestCheckIn: getDailyCheckIn(today),
            recentCheckIns,
        },
        trading: {
            hasData: allTrades.length > 0,
            tradingMode: memory.tradingMode,
            riskProfile: memory.riskProfile,
            preferredRiskLimit: memory.preferredTradingRiskLimit || "unavailable",
            dailyTradingLimit: memory.dailyTradingLimit || "unavailable",
            todayJournalCount: allTrades.filter((entry) => entry.date === today).length,
            checklistStatus: {
                checked: checklist.filter((item) => item.checked).length,
                total: checklist.length,
                criticalChecksComplete: checklist.filter((item) => item.critical).every((item) => item.checked),
                allChecksComplete: checklist.every((item) => item.checked),
            },
            recentTrades: allTrades.slice(0, 3).map((entry) => ({
                date: entry.date,
                instrument: entry.instrument,
                outcome: entry.outcome || "Unresolved",
                riskPercent: entry.riskPercent,
                planFollowed: entry.planFollowed,
            })),
            weeklyTrades: allTrades.filter((entry) => entry.date >= cutoffKey && entry.date <= today).slice(0, 8).map((entry) => ({
                date: entry.date,
                instrument: entry.instrument,
                outcome: entry.outcome || "Unresolved",
                riskPercent: entry.riskPercent,
                planFollowed: entry.planFollowed,
            })),
            patternInsights: getTradingPatternInsights(allTrades),
        },
        recentProgress: { recentActivity: [] },
        business: {
            hasData: Boolean(business.goals.length || business.tasks.length || business.leads.length || business.monthlyTarget || business.revenue),
            goalCount: business.goals.length,
            goalHighlights: business.goals.slice(0, 4).map((goal) => ({
                title: goal.title,
                status: goal.status,
                progress: goal.progress,
                deadline: goal.deadline || null,
                daysUntil: daysUntil(goal.deadline, today),
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
                id: project.id,
                title: project.title,
                status: project.status,
                progress: project.progress,
                deadline: project.deadline || null,
                daysUntilDeadline: daysUntil(project.deadline, today),
                incompleteTasks: project.tasks.filter((task) => !task.complete).slice(0, 4).map((task) => ({
                    id: task.id,
                    title: task.title,
                    dueDate: task.dueDate || null,
                    daysUntil: daysUntil(task.dueDate || "", today),
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

export function buildDailyPlanMessage(): string {
    return "Build a practical plan for my day using only the saved context provided. Mark missing module data as unavailable and do not invent tasks or statistics.";
}
