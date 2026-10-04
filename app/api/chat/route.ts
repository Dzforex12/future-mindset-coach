import { NextResponse } from "next/server";

const MODEL = "openai/gpt-oss-120b";

const DAILY_PLAN_SECTIONS = [
    "TODAY'S FOCUS",
    "MORNING",
    "AFTER WORK / AFTERNOON",
    "EVENING",
    "WATCH OUT FOR",
    "ONE THING TO REMEMBER",
] as const;

function toText(value: unknown): string {
    if (typeof value === "string") {
        return value.trim();
    }

    if (Array.isArray(value)) {
        return value.map((item) => toText(item)).filter(Boolean).join(", ");
    }

    if (value && typeof value === "object") {
        return Object.entries(value as Record<string, unknown>)
            .map(([key, entry]) => `${key}: ${toText(entry)}`)
            .join("; ");
    }

    return String(value ?? "");
}

function toRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

function formatDailyPlanReply(reply: string): string {
    const sectionPattern = /^\s{0,3}(?:#{1,3}\s*)?(?:\*\*)?(TODAY'S FOCUS|MORNING|AFTER WORK\s*\/\s*AFTERNOON|EVENING|WATCH OUT FOR|ONE THING TO REMEMBER)(?:\*\*)?\s*:?\s*$/gim;
    const matches = Array.from(reply.matchAll(sectionPattern));
    const sections = new Map<string, string>();

    matches.forEach((match, index) => {
        const heading = match[1].toUpperCase().replace(/\s*\/\s*/, " / ");
        const start = (match.index ?? 0) + match[0].length;
        const end = matches[index + 1]?.index ?? reply.length;
        const content = reply.slice(start, end).trim();
        if (content) sections.set(heading, [sections.get(heading), content].filter(Boolean).join("\n\n"));
    });

    if (!matches.length && reply.trim()) sections.set(DAILY_PLAN_SECTIONS[0], reply.trim());
    else if (matches[0]?.index) {
        const leadingContent = reply.slice(0, matches[0].index).trim();
        if (leadingContent) {
            const heading = matches[0][1].toUpperCase().replace(/\s*\/\s*/, " / ");
            sections.set(heading, [leadingContent, sections.get(heading)].filter(Boolean).join("\n\n"));
        }
    }

    return DAILY_PLAN_SECTIONS
        .map((heading) => `${heading}\n${sections.get(heading) ?? "No additional saved information is available for this section."}`)
        .join("\n\n");
}

function buildCoachContextRecord(body: Record<string, unknown>): Record<string, unknown> {
    const rawContext = body.coachContext && typeof body.coachContext === "object" ? body.coachContext as Record<string, unknown> : {};
    const profile = rawContext.profile && typeof rawContext.profile === "object" ? rawContext.profile as Record<string, unknown> : {};
    const habits = rawContext.habits && typeof rawContext.habits === "object" ? rawContext.habits as Record<string, unknown> : {};
    const goals = rawContext.goals && typeof rawContext.goals === "object" ? rawContext.goals as Record<string, unknown> : {};
    const mindset = rawContext.mindset && typeof rawContext.mindset === "object" ? rawContext.mindset as Record<string, unknown> : {};
    const trading = rawContext.trading && typeof rawContext.trading === "object" ? rawContext.trading as Record<string, unknown> : {};
    const recentProgress = rawContext.recentProgress && typeof rawContext.recentProgress === "object" ? rawContext.recentProgress as Record<string, unknown> : {};
    const business = rawContext.business && typeof rawContext.business === "object" ? rawContext.business as Record<string, unknown> : {};
    const projects = rawContext.projects && typeof rawContext.projects === "object" ? rawContext.projects as Record<string, unknown> : {};
    const finances = rawContext.finances && typeof rawContext.finances === "object" ? rawContext.finances as Record<string, unknown> : {};
    const dateContext = rawContext.dateContext && typeof rawContext.dateContext === "object" ? rawContext.dateContext as Record<string, unknown> : {};
    const recentTrades = Array.isArray(trading.recentTrades) ? trading.recentTrades : [];
    const dailyPriorities = Array.isArray(rawContext.dailyPriorities) ? rawContext.dailyPriorities.flatMap((entry) => {
        const item = toRecord(entry);
        if (!item || typeof item.title !== "string") return [];
        return [{ title: item.title.slice(0, 120), sourceType: toText(item.sourceType).slice(0, 30), completed: item.completed === true }];
    }) : [];
    const goalAction = toRecord(rawContext.goalAction);
    const latestReview = toRecord(rawContext.latestReview);

    return {
        dateContext: { today: typeof dateContext.today === "string" ? dateContext.today : "unavailable" },
        habits: {
            hasData: habits.hasData === true,
            total: habits.total ?? 0,
            completedTodayCount: typeof habits.completedTodayCount === "number" && Number.isFinite(habits.completedTodayCount) ? habits.completedTodayCount : Array.isArray(habits.completedToday) ? habits.completedToday.length : 0,
            incompleteTodayCount: typeof habits.incompleteTodayCount === "number" && Number.isFinite(habits.incompleteTodayCount) ? habits.incompleteTodayCount : Array.isArray(habits.incompleteToday) ? habits.incompleteToday.length : 0,
            completedToday: Array.isArray(habits.completedToday) ? habits.completedToday : [],
            incompleteToday: Array.isArray(habits.incompleteToday) ? habits.incompleteToday : [],
            streak: habits.streak ?? body.disciplineStreak ?? 0,
            recent: Array.isArray(habits.recent) ? habits.recent : [],
        },
        goals: {
            hasData: goals.hasData === true,
            activeCount: typeof goals.activeCount === "number" && Number.isFinite(goals.activeCount) ? goals.activeCount : Array.isArray(goals.active) ? goals.active.length : 0,
            active: Array.isArray(goals.active) ? goals.active : [],
            completed: Array.isArray(goals.completed) ? goals.completed : [],
            recentlyCompleted: Array.isArray(goals.recentlyCompleted) ? goals.recentlyCompleted : [],
        },
        mindset: {
            currentState: mindset.currentState ?? body.currentEmotion ?? "not set",
            focusScore: mindset.focusScore ?? 0,
            summary: mindset.summary ?? null,
            latestCheckIn: mindset.latestCheckIn ?? null,
            recentCheckIns: Array.isArray(mindset.recentCheckIns) ? mindset.recentCheckIns : [],
        },
        trading: {
            tradingMode: trading.tradingMode ?? body.tradingMode ?? "Forex",
            riskProfile: trading.riskProfile ?? body.riskProfile ?? "Moderate",
            hasData: trading.hasData === true,
            preferredRiskLimit: trading.preferredRiskLimit ?? "unavailable",
            dailyTradingLimit: trading.dailyTradingLimit ?? "unavailable",
            todayJournalCount: typeof trading.todayJournalCount === "number" && Number.isFinite(trading.todayJournalCount) ? trading.todayJournalCount : 0,
            checklistStatus: trading.checklistStatus && typeof trading.checklistStatus === "object" ? trading.checklistStatus : null,
            disciplineStreak: trading.disciplineStreak ?? body.disciplineStreak ?? 0,
            dailyHabitsCompleted: Array.isArray(trading.dailyHabitsCompleted) ? trading.dailyHabitsCompleted : [],
            recentTrades,
            weeklyTrades: Array.isArray(trading.weeklyTrades) ? trading.weeklyTrades : [],
            patternInsights: trading.patternInsights && typeof trading.patternInsights === "object" ? trading.patternInsights : { hasData: false, insights: [] },
        },
        profile: {
            displayName: profile.displayName ?? "unavailable",
            mainLifeGoal: profile.mainLifeGoal ?? "unavailable",
            dailyFocus: profile.dailyFocus ?? "unavailable",
            preferredTradingRiskLimit: profile.preferredTradingRiskLimit ?? "unavailable",
            dailyTradingLimit: profile.dailyTradingLimit ?? "unavailable",
        },
        recentProgress: {
            recentActivity: Array.isArray(recentProgress.recentActivity) ? recentProgress.recentActivity : [],
        },
        business: {
            hasData: business.hasData === true,
            goalCount: typeof business.goalCount === "number" && Number.isFinite(business.goalCount) ? business.goalCount : 0,
            goalHighlights: Array.isArray(business.goalHighlights) ? business.goalHighlights.slice(0, 4).map((entry) => {
                const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
                return { title: toText(item.title).slice(0, 120), status: toText(item.status).slice(0, 40), progress: typeof item.progress === "number" && Number.isFinite(item.progress) ? item.progress : null, deadline: typeof item.deadline === "string" ? item.deadline : null, daysUntil: typeof item.daysUntil === "number" && Number.isFinite(item.daysUntil) ? item.daysUntil : null };
            }) : [],
            openTaskCount: typeof business.openTaskCount === "number" && Number.isFinite(business.openTaskCount) ? business.openTaskCount : 0,
            openTasks: Array.isArray(business.openTasks) ? business.openTasks.slice(0, 5).flatMap((entry) => {
                const item = toRecord(entry);
                return item && typeof item.title === "string" ? [{ title: item.title.slice(0, 120), priority: toText(item.priority).slice(0, 20), deadline: typeof item.deadline === "string" ? item.deadline : null }] : [];
            }) : [],
            overdueTasks: Array.isArray(business.overdueTasks) ? business.overdueTasks.slice(0, 4).map((entry) => {
                const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
                return { title: toText(item.title).slice(0, 120), deadline: typeof item.deadline === "string" ? item.deadline : null, daysOverdue: typeof item.daysOverdue === "number" && Number.isFinite(item.daysOverdue) ? item.daysOverdue : null };
            }) : [],
            dueSoonTasks: Array.isArray(business.dueSoonTasks) ? business.dueSoonTasks.slice(0, 4).map((entry) => {
                const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
                return { title: toText(item.title).slice(0, 120), deadline: typeof item.deadline === "string" ? item.deadline : null, daysUntil: typeof item.daysUntil === "number" && Number.isFinite(item.daysUntil) ? item.daysUntil : null };
            }) : [],
            leadStatuses: business.leadStatuses && typeof business.leadStatuses === "object" ? business.leadStatuses : {},
            monthlyRevenueTarget: typeof business.monthlyRevenueTarget === "number" && Number.isFinite(business.monthlyRevenueTarget) ? business.monthlyRevenueTarget : null,
            currentRevenue: typeof business.currentRevenue === "number" && Number.isFinite(business.currentRevenue) ? business.currentRevenue : null,
        },
        projects: {
            hasData: projects.hasData === true,
            activeCount: typeof projects.activeCount === "number" && Number.isFinite(projects.activeCount) ? projects.activeCount : 0,
            active: Array.isArray(projects.active) ? projects.active.slice(0, 5).map((entry) => {
                const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
                return {
                    title: toText(item.title).slice(0, 120),
                    status: toText(item.status).slice(0, 40),
                    progress: typeof item.progress === "number" && Number.isFinite(item.progress) ? item.progress : null,
                    deadline: typeof item.deadline === "string" ? item.deadline : null,
                    daysUntilDeadline: typeof item.daysUntilDeadline === "number" && Number.isFinite(item.daysUntilDeadline) ? item.daysUntilDeadline : null,
                    incompleteTasks: Array.isArray(item.incompleteTasks) ? item.incompleteTasks.slice(0, 4).map((task) => {
                        const taskItem = task && typeof task === "object" ? task as Record<string, unknown> : {};
                        return { title: toText(taskItem.title).slice(0, 120), dueDate: typeof taskItem.dueDate === "string" ? taskItem.dueDate : null, daysUntil: typeof taskItem.daysUntil === "number" && Number.isFinite(taskItem.daysUntil) ? taskItem.daysUntil : null };
                    }) : [],
                    overdueTaskCount: typeof item.overdueTaskCount === "number" && Number.isFinite(item.overdueTaskCount) ? item.overdueTaskCount : 0,
                };
            }) : [],
        },
        finances: {
            hasData: finances.hasData === true,
            month: typeof finances.month === "string" ? finances.month : null,
            income: typeof finances.income === "number" && Number.isFinite(finances.income) ? finances.income : null,
            expenses: typeof finances.expenses === "number" && Number.isFinite(finances.expenses) ? finances.expenses : null,
            monthlyNet: typeof finances.monthlyNet === "number" && Number.isFinite(finances.monthlyNet) ? finances.monthlyNet : null,
            savings: typeof finances.savings === "number" && Number.isFinite(finances.savings) ? finances.savings : null,
            savingsTarget: typeof finances.savingsTarget === "number" && Number.isFinite(finances.savingsTarget) ? finances.savingsTarget : null,
            goals: Array.isArray(finances.goals) ? finances.goals.slice(0, 4).map((entry) => {
                const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
                return { title: toText(item.title).slice(0, 120), saved: typeof item.saved === "number" && Number.isFinite(item.saved) ? item.saved : null, target: typeof item.target === "number" && Number.isFinite(item.target) ? item.target : null, progress: typeof item.progress === "number" && Number.isFinite(item.progress) ? item.progress : null };
            }) : [],
        },
        dailyPriorities,
        goalAction: goalAction && typeof goalAction.goalId === "string" && typeof goalAction.action === "string"
            ? { goalId: goalAction.goalId, action: goalAction.action.slice(0, 300), completed: goalAction.completed === true }
            : null,
        latestReview: latestReview && typeof latestReview.date === "string"
            ? {
                date: latestReview.date,
                completed: toText(latestReview.completed).slice(0, 300),
                avoided: toText(latestReview.avoided).slice(0, 300),
                wentWell: toText(latestReview.wentWell).slice(0, 300),
                improveTomorrow: toText(latestReview.improveTomorrow).slice(0, 300),
                score: typeof latestReview.score === "number" && Number.isFinite(latestReview.score) ? latestReview.score : null,
            }
            : null,
    };
}

function buildContextSummary(body: Record<string, unknown>) {
    const habits = Array.isArray(body.habitHistory) ? body.habitHistory.slice(-7) : [];
    const alignment = (body.alignment ?? {}) as Record<string, unknown>;
    const lifeRoadmap = (body.lifeRoadmap ?? {}) as Record<string, unknown>;
    const sixMonthRoadmap = (lifeRoadmap.sixMonth ?? {}) as Record<string, unknown>;
    const oneYearRoadmap = (lifeRoadmap.oneYear ?? {}) as Record<string, unknown>;
    const fiveYearRoadmap = (lifeRoadmap.fiveYear ?? {}) as Record<string, unknown>;
    const futureSelf = (body.futureSelf ?? {}) as Record<string, unknown>;
    const futureOneYear = (futureSelf.oneYear ?? {}) as Record<string, unknown>;
    const coachContext = buildCoachContextRecord(body);
    const normalizedGoals = coachContext.goals as Record<string, unknown>;
    const goals = Array.isArray(body.activeGoals)
        ? body.activeGoals
        : Array.isArray(normalizedGoals.active) ? normalizedGoals.active : [];
    const habitContext = coachContext.habits as Record<string, unknown>;
    const goalContext = coachContext.goals as Record<string, unknown>;
    const mindsetContext = coachContext.mindset as Record<string, unknown>;
    const tradingContext = coachContext.trading as Record<string, unknown>;
    const profileContext = coachContext.profile as Record<string, unknown>;
    const recentContext = coachContext.recentProgress as Record<string, unknown>;
    const businessContext = coachContext.business as Record<string, unknown>;
    const projectsContext = coachContext.projects as Record<string, unknown>;
    const financeContext = coachContext.finances as Record<string, unknown>;
    const dailyPriorities = Array.isArray(coachContext.dailyPriorities) ? coachContext.dailyPriorities as Array<Record<string, unknown>> : [];
    const goalAction = coachContext.goalAction && typeof coachContext.goalAction === "object" ? coachContext.goalAction as Record<string, unknown> : null;
    const latestReview = coachContext.latestReview && typeof coachContext.latestReview === "object" ? coachContext.latestReview as Record<string, unknown> : null;
    const question = typeof body.message === "string" ? body.message.toLowerCase() : "";
    const asksBusiness = /business|revenue|lead|customer/.test(question);
    const asksProject = /project/.test(question);
    const asksFinance = /financ|budget|money|saving/.test(question);
    const isModuleSpecific = asksBusiness || asksProject || asksFinance;
    const includeBusiness = !isModuleSpecific || asksBusiness;
    const includeProjects = !isModuleSpecific || asksProject;
    const includeFinances = !isModuleSpecific || asksFinance;
    const formatOffset = (value: unknown) => typeof value === "number" ? String(value) : "unknown";
    const recentTradeText = Array.isArray(tradingContext.recentTrades)
        ? tradingContext.recentTrades.map((entry) => {
            const item = entry as Record<string, unknown>;
            const instrument = toText(item.instrument) || "trade";
            const setup = toText(item.setup) || toText(item.setupName) || "setup not named";
            const session = toText(item.session) || "not logged";
            const direction = toText(item.direction) || toText(item.side) || "not logged";
            const outcome = toText(item.outcome) || "unresolved";
            const planFollowed = toText(item.planFollowed) === "true" ? "plan followed" : "plan broken";
            const risk = toText(item.riskPercent) || "n/a";
            const rr = toText(item.plannedRiskReward) || "n/a";
            const mistakes = toText(item.mistakes) || "none recorded";
            const lesson = toText(item.lessonLearned) || "none recorded";
            const emotionBefore = toText(item.emotionBefore) || "not logged";
            const emotionAfter = toText(item.emotionAfter) || "not logged";
            const date = toText(item.date) || "date not logged";
            return `${instrument} (${setup}, ${session}, ${direction}) on ${date}: ${outcome}; ${planFollowed}; risk ${risk}; RR ${rr}; mistakes: ${mistakes}; lesson: ${lesson}; emotion ${emotionBefore} -> ${emotionAfter}`;
        }).join(" | ")
        : "none";
    const weeklyTradeText = Array.isArray(tradingContext.weeklyTrades)
        ? tradingContext.weeklyTrades.map((entry) => {
            const item = entry as Record<string, unknown>;
            return `${toText(item.date)} ${toText(item.instrument)}: ${toText(item.outcome) || "unresolved"}; ${toText(item.planFollowed) === "true" ? "plan followed" : "plan broken"}; risk ${toText(item.riskPercent) || "unavailable"}; mistake ${toText(item.mistakes) || "none recorded"}; lesson ${toText(item.lessonLearned) || "none recorded"}`;
        }).join(" | ") || "none"
        : "none";
    const patternInsightText = tradingContext.patternInsights && typeof tradingContext.patternInsights === "object"
        ? toText((tradingContext.patternInsights as Record<string, unknown>).insights) || "insufficient data"
        : "insufficient data";
    const latestCheckIn = mindsetContext.latestCheckIn && typeof mindsetContext.latestCheckIn === "object"
        ? toText(mindsetContext.latestCheckIn)
        : "unavailable";
    const recentCheckIns = Array.isArray(mindsetContext.recentCheckIns)
        ? mindsetContext.recentCheckIns.slice(0, 7).map((entry) => toText(entry)).join(" | ") || "none"
        : "none";

    const recentHabitActivity = habits.map((entry) => {
        if (!entry || typeof entry !== "object") {
            return "";
        }

        const value = entry as Record<string, unknown>;
        return `date=${toText(value.date)}; completed=${toText(value.habits)}`;
    }).filter(Boolean).join(" | ");

    const goalSummary = goals.map((goal) => {
        if (!goal || typeof goal !== "object") {
            return "";
        }

        const item = goal as Record<string, unknown>;
        return `${toText(item.title)} (${toText(item.progress)}%${toText(item.completed) === "true" ? ", completed" : ""})`;
    }).filter(Boolean).join("; ");

    const roadmap = `${toText(sixMonthRoadmap.summary)} | ${toText(oneYearRoadmap.summary)} | ${toText(fiveYearRoadmap.summary)}`;
    const recentActivityText = Array.isArray(recentContext.recentActivity)
        ? recentContext.recentActivity.map((entry) => {
            const item = entry as Record<string, unknown>;
            return `${toText(item.date)}: ${toText(item.count)} completions`;
        }).join(" | ")
        : "none";
    const businessText = businessContext.hasData !== true
        ? "insufficient data"
        : `goals ${toText(businessContext.goalCount) || "0"}; open task count ${toText(businessContext.openTaskCount) || "0"} (open means incomplete, not a workflow status); overdue tasks ${Array.isArray(businessContext.overdueTasks) ? businessContext.overdueTasks.map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)} (deadline ${toText(item.deadline) || "unknown"}; ${formatOffset(item.daysOverdue)} days overdue)`; }).join("; ") || "none" : "none"}; non-overdue tasks due within 7 days ${Array.isArray(businessContext.dueSoonTasks) ? businessContext.dueSoonTasks.map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)} (deadline ${toText(item.deadline) || "unknown"}; days until due ${formatOffset(item.daysUntil)})`; }).join("; ") || "none" : "none"}; lead/customer status counts ${toText(businessContext.leadStatuses) || "none recorded"}; monthly revenue target ${toText(businessContext.monthlyRevenueTarget) || "not set"}; current revenue ${toText(businessContext.currentRevenue) || "not recorded"}; goal highlights ${Array.isArray(businessContext.goalHighlights) ? businessContext.goalHighlights.map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)} (${toText(item.status)}, ${toText(item.progress)}% progress, deadline ${toText(item.deadline) || "not set"}, days until due ${formatOffset(item.daysUntil)})`; }).join("; ") || "none" : "none"}`;
    const projectsText = projectsContext.hasData !== true
        ? "insufficient data"
        : `active projects ${toText(projectsContext.activeCount) || "0"}; ${Array.isArray(projectsContext.active) ? projectsContext.active.map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)} (${toText(item.status)}, ${toText(item.progress)}% progress, deadline ${toText(item.deadline) || "not set"}, days until deadline ${formatOffset(item.daysUntilDeadline)}; incomplete tasks ${Array.isArray(item.incompleteTasks) ? item.incompleteTasks.map((task) => { const taskItem = task as Record<string, unknown>; return `${toText(taskItem.title)} (due ${toText(taskItem.dueDate) || "no due date"}${taskItem.daysUntil === null ? "" : `; days until due ${formatOffset(taskItem.daysUntil)}`})`; }).join("; ") || "none" : "none"}; overdue task count ${toText(item.overdueTaskCount) || "0"})`; }).join(" | ") || "no project details" : "no project details"}`;
    const financesText = financeContext.hasData !== true
        ? "insufficient data"
        : `currency EUR (€); month ${toText(financeContext.month) || "unavailable"}; monthly income ${financeContext.income === null ? "not recorded" : `€${toText(financeContext.income)}`}; monthly expenses ${financeContext.expenses === null ? "not recorded" : `€${toText(financeContext.expenses)}`}; monthly net ${financeContext.monthlyNet === null ? "not recorded" : `€${toText(financeContext.monthlyNet)}`}; persisted savings value ${financeContext.savings === null ? "not recorded" : `€${toText(financeContext.savings)}`}; overall savings target ${financeContext.savingsTarget === null ? "not set" : `€${toText(financeContext.savingsTarget)}`}; separate financial goal tracker records ${Array.isArray(financeContext.goals) ? financeContext.goals.map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)} (tracker saved €${toText(item.saved)}, tracker target €${toText(item.target)}, tracker progress ${item.progress === null ? "not available" : `${toText(item.progress)}%`})`; }).join("; ") || "none" : "none"}`;

    return [
        `Coach context. Current local date: ${toText((coachContext.dateContext as Record<string, unknown>).today) || "unavailable"}. Day offsets below are computed from this date.`,
        `- Personal settings: name ${toText(profileContext.displayName) || "unavailable"}; main life goal ${toText(profileContext.mainLifeGoal) || "unavailable"}; daily focus ${toText(profileContext.dailyFocus) || "unavailable"}; preferred trading risk ${toText(profileContext.preferredTradingRiskLimit) || "unavailable"}; daily trading limit ${toText(profileContext.dailyTradingLimit) || "unavailable"}`,
        `- Habits: ${toText(habitContext.total) || "0"} total; completed today: ${toText(habitContext.completedTodayCount) || "0"}; incomplete today: ${toText(habitContext.incompleteTodayCount) || "0"}; streak: ${toText(habitContext.streak) || "0"}; recent: ${Array.isArray(habitContext.recent) ? habitContext.recent.slice(0, 3).map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)}:${toText(item.completedToday) === "true" ? "done" : "pending"}`; }).join(", ") || "none" : "none"}`,
        `- Goals: ${toText(goalContext.activeCount) || "0"} active; ${Array.isArray(goalContext.recentlyCompleted) ? goalContext.recentlyCompleted.length : 0} recently completed; details: ${Array.isArray(goalContext.active) ? goalContext.active.slice(0, 5).map((goal) => { const item = goal as Record<string, unknown>; return `${toText(item.title)}:${toText(item.progress)}%; deadline ${toText(item.targetDate) || "unavailable"}; linked habits ${toText(item.linkedHabitTitles) || "none"}`; }).join(", ") || "none" : "none"}`,
        `- Mindset/check-ins: current state ${toText(mindsetContext.currentState) || "not set"}; focus score ${toText(mindsetContext.focusScore) || "0"}; summary ${toText(mindsetContext.summary) || "not available"}; latest check-in ${latestCheckIn}; recent check-ins ${recentCheckIns}`,
        `- Trading: ${tradingContext.hasData === true ? "journal data saved" : "no journal entries saved"}; mode ${toText(tradingContext.tradingMode) || "Forex"}; risk profile ${toText(tradingContext.riskProfile) || "Moderate"}; preferred risk ${toText(tradingContext.preferredRiskLimit) || "unavailable"}; daily limit ${toText(tradingContext.dailyTradingLimit) || "unavailable"}; today's journal entries ${toText(tradingContext.todayJournalCount) || "0"}; checklist ${toText(tradingContext.checklistStatus) || "not available"}; recent trades: ${recentTradeText || "none"}; last 7 days: ${weeklyTradeText}; deterministic patterns: ${patternInsightText}`,
        `- Saved module availability: habits ${habitContext.hasData === true ? "available" : "no active habits"}; active goals ${goalContext.hasData === true ? "available" : "none"}; business ${businessContext.hasData === true ? "available" : "no saved data"}; projects ${projectsContext.hasData === true ? "available" : "no saved data"}; finances ${financeContext.hasData === true ? "available" : "no saved data"}.`,
        `- Today's saved priorities: ${dailyPriorities.length ? dailyPriorities.map((item) => `${toText(item.title)} [${toText(item.sourceType) || "Personal"}; ${item.completed === true ? "complete" : "incomplete"}]`).join("; ") : "none saved"}`,
        `- Today's goal action: ${goalAction ? `${toText(goalAction.action)} (${goalAction.completed === true ? "complete" : "incomplete"})` : "none saved"}`,
        `- Most recent evening review: ${latestReview ? `${toText(latestReview.date)}; completed ${toText(latestReview.completed) || "not recorded"}; avoided ${toText(latestReview.avoided) || "not recorded"}; went well ${toText(latestReview.wentWell) || "not recorded"}; improve ${toText(latestReview.improveTomorrow) || "not recorded"}` : "none saved"}`,
        `- Recent progress: ${recentActivityText}`,
        ...(includeBusiness ? [`- Business: ${businessText}`] : []),
        ...(includeProjects ? [`- Projects: ${projectsText}`] : []),
        ...(includeFinances ? [`- Finances: ${financesText}`] : []),
        `Trading mode: ${toText(body.tradingMode) || "Forex"}`,
        `Risk profile: ${toText(body.riskProfile) || "Moderate"}`,
        `Coach personality: ${toText(body.coachPersonality) || "Neutral"}`,
        `Discipline streak: ${toText(body.disciplineStreak) || "0"}`,
        `Current emotion: ${toText(body.currentEmotion) || "unknown"}`,
        `Recent habit activity: ${recentHabitActivity || "none"}`,
        `Goals: ${goalSummary || "none"}`,
        `Roadmap: ${roadmap || "not set"}`,
        `Alignment: ${toText(alignment.dailyScore) || "0"} daily / ${toText(alignment.weeklyScore) || "0"} weekly`,
        `Adaptive personality: ${toText(body.adaptivePersonality) || "Neutral"}`,
        `Future self: ${toText(futureOneYear.identity) || "not set"}`,
    ].join("\n");
}

function formatEuro(value: unknown): string {
    return typeof value === "number" && Number.isFinite(value) ? `€${value.toLocaleString("en-IE")}` : "not recorded";
}

function formatDeadline(date: unknown, offset: unknown): string {
    if (typeof date !== "string" || !date) return "no deadline recorded";
    if (typeof offset !== "number" || !Number.isFinite(offset)) return `deadline ${date}`;
    if (offset < 0) return `deadline ${date}, ${Math.abs(offset)} day${Math.abs(offset) === 1 ? "" : "s"} overdue`;
    if (offset === 0) return `due today (${date})`;
    return `deadline ${date}, due in ${offset} day${offset === 1 ? "" : "s"}`;
}

function buildGroundedModuleReply(message: string, body: Record<string, unknown>): string | null {
    const question = message.toLowerCase();
    const context = buildCoachContextRecord(body);
    const business = context.business as Record<string, unknown>;
    const projects = context.projects as Record<string, unknown>;
    const finances = context.finances as Record<string, unknown>;
    const habits = context.habits as Record<string, unknown>;
    const goals = context.goals as Record<string, unknown>;
    const profile = context.profile as Record<string, unknown>;
    const trading = context.trading as Record<string, unknown>;
    const mindset = context.mindset as Record<string, unknown>;
    const dailyPriorities = Array.isArray(context.dailyPriorities) ? context.dailyPriorities as Array<Record<string, unknown>> : [];
    const today = toText((context.dateContext as Record<string, unknown>).today) || "unavailable";
    const businessGoals = Array.isArray(business.goalHighlights) ? business.goalHighlights as Array<Record<string, unknown>> : [];
    const businessOverdue = Array.isArray(business.overdueTasks) ? business.overdueTasks as Array<Record<string, unknown>> : [];
    const businessDueSoon = Array.isArray(business.dueSoonTasks) ? business.dueSoonTasks as Array<Record<string, unknown>> : [];
    const projectItems = Array.isArray(projects.active) ? projects.active as Array<Record<string, unknown>> : [];
    const financeGoals = Array.isArray(finances.goals) ? finances.goals as Array<Record<string, unknown>> : [];
    const activeGoals = Array.isArray(goals.active) ? goals.active as Array<Record<string, unknown>> : [];
    const completedHabits = Array.isArray(habits.completedToday) ? habits.completedToday : [];
    const incompleteHabits = Array.isArray(habits.incompleteToday) ? habits.incompleteToday : [];
    const reviewQuestions = /\bwhat (?:are|were) my goals\b|\blist my goals\b|\bwhat goals do i have\b/i;
    const habitQuestions = /\bwhat (?:are )?my habits\b|\bwhat habits do i have\b|\blist my habits\b|\bmy habits today\b/i;
    const journalQuestions = /\btrading journal\b|\bjournal count\b|\btrades today\b/i;

    if (reviewQuestions.test(message)) {
        if (!activeGoals.length) return "You have no active saved goals.";
        const activeCount = typeof goals.activeCount === "number" ? goals.activeCount : activeGoals.length;
        const listing = activeGoals.map((goal) => `${toText(goal.title)} — ${toText(goal.progress)}% complete${toText(goal.targetDate) && toText(goal.targetDate) !== "unavailable" ? `; target ${toText(goal.targetDate)}` : ""}`);
        return `Your active saved goals (${activeCount})${activeCount > listing.length ? `; showing ${listing.length}` : ""}:\n- ${listing.join("\n- ")}`;
    }

    if (habitQuestions.test(message)) {
        if (!Number(habits.total)) return "You have no active saved habits.";
        const listedHabits = incompleteHabits.map(toText).map((title) => `${title} — incomplete today`).concat(completedHabits.map(toText).map((title) => `${title} — complete today`));
        const count = typeof habits.total === "number" ? habits.total : Number(habits.total) || 0;
        const completedCount = typeof habits.completedTodayCount === "number" ? habits.completedTodayCount : completedHabits.length;
        const incompleteCount = typeof habits.incompleteTodayCount === "number" ? habits.incompleteTodayCount : incompleteHabits.length;
        return `Your active saved habits (${count}): ${completedCount} complete and ${incompleteCount} incomplete today${count > listedHabits.length ? `; showing ${listedHabits.length}` : ""}.\n- ${listedHabits.join("\n- ")}`;
    }

    if (journalQuestions.test(message)) {
        return `Your saved trading journal has ${toText(trading.todayJournalCount) || "0"} entries dated ${today}. The pre-trade checklist status is ${toText(trading.checklistStatus) || "not available"}.`;
    }

    if (/\b(focus|work on|tonight|today)\b/.test(question)) {
        const priorities: string[] = [];
        dailyPriorities.forEach((priority) => priorities.push(
            `Saved priority (${toText(priority.completed) === "true" ? "complete" : "incomplete"}): ${toText(priority.title)}${toText(priority.sourceType) ? ` · ${toText(priority.sourceType)}` : ""}.`,
        ));
        businessOverdue.slice(0, 3).forEach((task) => priorities.push(`Overdue business task: ${toText(task.title)} (${formatDeadline(task.deadline, typeof task.daysOverdue === "number" ? -task.daysOverdue : null)}).`));
        projectItems.forEach((project) => {
            const tasks = Array.isArray(project.incompleteTasks) ? project.incompleteTasks as Array<Record<string, unknown>> : [];
            tasks.filter((task) => typeof task.daysUntil === "number" && task.daysUntil <= 7).slice(0, 2).forEach((task) => priorities.push(`Project task for ${toText(project.title)}: ${toText(task.title)} (${formatDeadline(task.dueDate, task.daysUntil)}).`));
            if (typeof project.daysUntilDeadline === "number" && project.daysUntilDeadline <= 7) priorities.push(`Project ${toText(project.title)} is ${toText(project.status)} at ${toText(project.progress)}% (${formatDeadline(project.deadline, project.daysUntilDeadline)}).`);
        });
        businessDueSoon.slice(0, 3).forEach((task) => priorities.push(`Business task: ${toText(task.title)} (${formatDeadline(task.deadline, task.daysUntil)}).`));
        businessGoals.filter((goal) => typeof goal.daysUntil === "number" && goal.daysUntil <= 7).slice(0, 2).forEach((goal) => priorities.push(`Business goal: ${toText(goal.title)}, ${toText(goal.progress)}% progress (${formatDeadline(goal.deadline, goal.daysUntil)}).`));
        const incompleteHabits = Array.isArray(habits.incompleteToday) ? habits.incompleteToday : [];
        if (incompleteHabits.length) priorities.push(`Incomplete habits today: ${incompleteHabits.slice(0, 3).map(toText).join(", ")}.`);
        if (toText(profile.dailyFocus) && toText(profile.dailyFocus) !== "unavailable") priorities.push(`Saved daily focus: ${toText(profile.dailyFocus)}.`);
        if (!priorities.length) return `I don't have overdue or due-soon business or project work in the saved context for ${today}. There isn't enough saved task detail to recommend a specific next action.`;
        return `Based on your saved context for ${today}, prioritize:\n- ${priorities.slice(0, 8).join("\n- ")}`;
    }

    if (/\b(business|revenue|leads?|customers?)\b/.test(question)) {
        if (business.hasData !== true) return "There isn't enough saved business data to assess progress yet.";
        const lines = [
            `Monthly revenue: ${formatEuro(business.currentRevenue)} recorded; target ${formatEuro(business.monthlyRevenueTarget)}.`,
            `Business goals: ${toText(business.goalCount) || "0"} saved; open tasks: ${toText(business.openTaskCount) || "0"}.`,
            `Lead/customer status counts: ${toText(business.leadStatuses) || "none recorded"}.`,
            ...businessOverdue.map((task) => `Overdue task: ${toText(task.title)} (${formatDeadline(task.deadline, typeof task.daysOverdue === "number" ? -task.daysOverdue : null)}).`),
            ...businessDueSoon.map((task) => `Due-soon task: ${toText(task.title)} (${formatDeadline(task.deadline, task.daysUntil)}).`),
            ...businessGoals.slice(0, 4).map((goal) => `Goal: ${toText(goal.title)}; status ${toText(goal.status)}; progress ${toText(goal.progress)}%; ${formatDeadline(goal.deadline, goal.daysUntil)}.`),
        ];
        return `Business snapshot from saved data:\n- ${lines.join("\n- ")}`;
    }

    if (/\bproject\b/.test(question)) {
        if (projects.hasData !== true) return "There isn't enough saved project data to identify a project needing attention.";
        if (!projectItems.length) return "No incomplete projects are saved. There isn't a project needing attention in the current data.";
        const lines = projectItems.map((project) => {
            const tasks = Array.isArray(project.incompleteTasks) ? project.incompleteTasks as Array<Record<string, unknown>> : [];
            const taskLines = tasks.slice(0, 4).map((task) => `${toText(task.title)} (${formatDeadline(task.dueDate, task.daysUntil)})`);
            return `${toText(project.title)}: status ${toText(project.status)}, progress ${toText(project.progress)}%, ${formatDeadline(project.deadline, project.daysUntilDeadline)}; incomplete tasks: ${taskLines.join(", ") || "none recorded"}; overdue task count ${toText(project.overdueTaskCount) || "0"}.`;
        });
        return `Project attention from saved data:\n- ${lines.join("\n- ")}`;
    }

    if (/\b(finance|finances|financial|budget|money|saving|savings)\b/.test(question)) {
        if (finances.hasData !== true) return "There isn't enough saved financial data to assess your finances yet.";
        const lines = [
            `Month ${toText(finances.month) || "unavailable"}: income ${formatEuro(finances.income)}, expenses ${formatEuro(finances.expenses)}, net ${formatEuro(finances.monthlyNet)}.`,
            `Persisted savings value: ${formatEuro(finances.savings)}; overall savings target: ${formatEuro(finances.savingsTarget)}.`,
            ...financeGoals.map((goal) => `Financial goal tracker ${toText(goal.title)}: saved ${formatEuro(goal.saved)}, target ${formatEuro(goal.target)}, progress ${goal.progress === null ? "not available" : `${toText(goal.progress)}%`}.`),
        ];
        return `Finance snapshot from saved data (EUR):\n- ${lines.join("\n- ")}`;
    }

    if (/\boverall\b.*\bprogress|\bprogress\b.*\boverall/.test(question)) {
        return `Overall snapshot from saved data:\n- Profile focus: ${toText(profile.mainLifeGoal) || "not set"}; today's focus: ${toText(profile.dailyFocus) || "not set"}.\n- Habits: ${toText(habits.completedToday) || "0"} completed today out of ${toText(habits.total) || "0"}; streak ${toText(habits.streak) || "0"}.\n- Goals: ${Array.isArray(goals.active) ? goals.active.length : 0} active; ${Array.isArray(goals.recentlyCompleted) ? goals.recentlyCompleted.length : 0} recently completed.\n- Trading journal: ${Array.isArray(trading.recentTrades) ? trading.recentTrades.length : 0} recent records; mindset state ${toText(mindset.currentState) || "not set"}.\n- Business ${business.hasData === true ? "has saved records" : "has insufficient data"}; projects ${projects.hasData === true ? "have saved records" : "have insufficient data"}; finances ${finances.hasData === true ? "have saved records" : "have insufficient data"}.`;
    }

    return null;
}

export async function POST(req: Request) {
    const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";

    let incomingText = "";
    let incomingBody: unknown = null;

    try {
        incomingText = await req.text();
        incomingBody = incomingText ? JSON.parse(incomingText) : {};
    } catch (error) {
        const name = error instanceof Error ? error.name : "UnknownError";
        console.error("AI Coach received invalid request JSON", { name });
        return NextResponse.json({ error: "Invalid request JSON." }, { status: 400 });
    }

    try {
        const body = incomingBody as Record<string, unknown>;

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json(
                { error: "GROQ_API_KEY is not configured on the server." },
                { status: 500 },
            );
        }

        const message = typeof body?.message === "string" ? body.message.trim() : "";
        if (!message) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        const isDailyPlan = body.coachMode === "daily-plan";
        const groundedReply = isDailyPlan ? null : buildGroundedModuleReply(message, body);
        if (groundedReply) {
            return NextResponse.json({ reply: groundedReply });
        }

        const systemPrompt = `You are Future Mindset Coach, the central intelligence for a private personal operating system covering discipline, mindset, goals, habits, business, projects, finances, and trading psychology. Use only the persisted user context provided below. Treat missing, empty, or unavailable values as unknown; never invent trades, habits, goals, tasks, check-ins, deadlines, revenue, finance amounts, statistics, streaks, or patterns. Choose only the context relevant to the user’s question instead of repeating the entire dataset. For focus questions, prioritize overdue and near-term tasks, then incomplete work that matches the user's saved daily focus. Incomplete/open tasks are not necessarily active or in progress. The context supplies the current local date and calculated day offsets: quote saved deadlines exactly, use those supplied offsets, and never recalculate or describe a different relative duration. Do not invent recommended amounts, percentages, quantities, or time durations; keep action suggestions qualitative. Business questions must not introduce project details unless the user asks for cross-module priorities. Financial values are in EUR: use € and never infer another currency. Copy supplied finance amounts and progress exactly; do not calculate new percentages, combine separate values, imply money was transferred, or treat a financial-goal tracker value as account savings. Keep the persisted savings value separate from financial goal tracker values and do not sum them. For business, project, or finance questions with insufficient context, state that plainly and do not infer performance or amounts.

    For trading, coach process, risk management, planning, psychology, journal patterns, and education. You are not a signal seller, execution bot, or fortune-teller. Never promise profit, guarantee a winning trade, encourage FOMO, revenge trading, gambling, excessive leverage, or unsafe risk. If a setup is unclear, explain the uncertainty and recommend waiting or NO TRADE.

    Keep responses calm, direct, and concise with short paragraphs or compact sections. Reference real names, goals, habits, check-ins, and journal details naturally when relevant. If there is insufficient data, say so explicitly rather than manufacturing a pattern. For a weekly review request, organize the response as: 1) What went well, 2) What needs improvement, 3) Biggest pattern noticed, 4) Top 3 priorities for next week. Base that review on the available last-seven-day context and explicitly identify areas with insufficient data.${isDailyPlan ? "\n\nFor Build My Day, respond with these exact sections: TODAY'S FOCUS (up to 3 saved or clearly data-backed items; state when fewer than 3 are available), MORNING, AFTER WORK / AFTERNOON, EVENING, WATCH OUT FOR, ONE THING TO REMEMBER. Use only named records in context for factual claims. Use explicit no-data markers when a module has none; never fabricate a schedule or tasks. Suggest only practical qualitative next actions. This is coaching only and must not claim that any app data was changed." : ""}`;

        const controller = new AbortController();
        const timeoutMs = 18000;
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);

        let response: Response;
        let data: Record<string, unknown> | null = null;

        try {
            response = await fetch(groqEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        {
                            role: "system",
                            content: `${systemPrompt}\n\nUser context:\n${buildContextSummary(body || {})}`,
                        },
                        {
                            role: "user",
                            content: message,
                        },
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                }),
            });

            const contentType = response.headers.get("content-type") ?? "";
            const rawText = await response.text();

            if (rawText.trim() && (contentType.includes("application/json") || rawText.trim().startsWith("{") || rawText.trim().startsWith("["))) {
                try {
                    data = toRecord(JSON.parse(rawText) as unknown);
                } catch (error) {
                    const parseName = error instanceof Error ? error.name : "UnknownParseError";
                    console.error("AI Coach provider returned invalid JSON", {
                        name: parseName,
                        status: response.status,
                        model: MODEL,
                    });
                    data = null;
                }
            } else {
                data = null;
            }

            if (!response.ok) {
                const errorRecord = toRecord(data?.error);
                const providerMessage = typeof errorRecord?.message === "string"
                    ? errorRecord.message
                    : typeof data?.error === "string"
                        ? data.error
                        : "AI provider request failed";

                console.error("AI Coach Groq request failed", {
                    status: response.status,
                    model: MODEL,
                    errorType: typeof errorRecord?.type === "string" ? errorRecord.type : undefined,
                    errorCode: typeof errorRecord?.code === "string" ? errorRecord.code : undefined,
                });

                return NextResponse.json(
                    {
                        error: "AI provider request failed",
                        details: providerMessage,
                    },
                    { status: response.status >= 500 ? 502 : 400 },
                );
            }

            const choices = Array.isArray(data?.choices) ? data.choices : [];
            const firstChoice = toRecord(choices[0]);
            const reply = toRecord(firstChoice?.message)?.content;
            if (!reply || typeof reply !== "string") {
                console.error("AI Coach Groq returned an empty reply", {
                    status: response.status,
                    model: MODEL,
                });
                return NextResponse.json(
                    {
                        error: "AI provider request failed",
                        details: "Groq returned an empty reply.",
                    },
                    { status: 502 },
                );
            }

            return NextResponse.json({ reply: isDailyPlan ? formatDailyPlanReply(reply) : reply });
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === "AbortError") {
                console.error("NETWORK_ERROR:", {
                    name: error.name,
                    message: error.message,
                    model: MODEL,
                    endpoint: groqEndpoint,
                });
                return NextResponse.json(
                    {
                        error: "AI provider request failed",
                        details: "Groq request timed out.",
                    },
                    { status: 504 },
                );
            }

            const message = error instanceof Error ? error.message : "Unknown server error";
            const name = error instanceof Error ? error.name : "UnknownError";
            const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "none";
            console.error("NETWORK_ERROR:", {
                name,
                message,
                code,
                model: MODEL,
                endpoint: groqEndpoint,
            });
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown server error";
        const name = error instanceof Error ? error.name : "UnknownError";
        const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "none";
        console.error("AI Coach request crashed", { error: name, message, code, model: MODEL });
        return NextResponse.json(
            {
                error: "AI provider request failed",
                details: "Unexpected server error while contacting the AI provider.",
            },
            { status: 500 },
        );
    }
}
