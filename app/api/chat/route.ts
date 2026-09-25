import { NextResponse } from "next/server";

const MODEL = "openai/gpt-oss-120b";

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

function buildCoachContextRecord(body: Record<string, unknown>): Record<string, unknown> {
    const rawContext = body.coachContext && typeof body.coachContext === "object" ? body.coachContext as Record<string, unknown> : {};
    const profile = rawContext.profile && typeof rawContext.profile === "object" ? rawContext.profile as Record<string, unknown> : {};
    const habits = rawContext.habits && typeof rawContext.habits === "object" ? rawContext.habits as Record<string, unknown> : {};
    const goals = rawContext.goals && typeof rawContext.goals === "object" ? rawContext.goals as Record<string, unknown> : {};
    const mindset = rawContext.mindset && typeof rawContext.mindset === "object" ? rawContext.mindset as Record<string, unknown> : {};
    const trading = rawContext.trading && typeof rawContext.trading === "object" ? rawContext.trading as Record<string, unknown> : {};
    const recentProgress = rawContext.recentProgress && typeof rawContext.recentProgress === "object" ? rawContext.recentProgress as Record<string, unknown> : {};
    const recentTrades = Array.isArray(trading.recentTrades) ? trading.recentTrades : [];

    return {
        habits: {
            total: habits.total ?? 0,
            completedToday: Array.isArray(habits.completedToday) ? habits.completedToday : [],
            incompleteToday: Array.isArray(habits.incompleteToday) ? habits.incompleteToday : [],
            streak: habits.streak ?? body.disciplineStreak ?? 0,
            recent: Array.isArray(habits.recent) ? habits.recent : [],
        },
        goals: {
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
    };
}

function buildContextSummary(body: Record<string, unknown>) {
    const goals = Array.isArray(body.activeGoals) ? body.activeGoals : [];
    const habits = Array.isArray(body.habitHistory) ? body.habitHistory.slice(-7) : [];
    const alignment = (body.alignment ?? {}) as Record<string, unknown>;
    const lifeRoadmap = (body.lifeRoadmap ?? {}) as Record<string, unknown>;
    const sixMonthRoadmap = (lifeRoadmap.sixMonth ?? {}) as Record<string, unknown>;
    const oneYearRoadmap = (lifeRoadmap.oneYear ?? {}) as Record<string, unknown>;
    const fiveYearRoadmap = (lifeRoadmap.fiveYear ?? {}) as Record<string, unknown>;
    const futureSelf = (body.futureSelf ?? {}) as Record<string, unknown>;
    const futureOneYear = (futureSelf.oneYear ?? {}) as Record<string, unknown>;
    const coachContext = buildCoachContextRecord(body);
    const habitContext = coachContext.habits as Record<string, unknown>;
    const goalContext = coachContext.goals as Record<string, unknown>;
    const mindsetContext = coachContext.mindset as Record<string, unknown>;
    const tradingContext = coachContext.trading as Record<string, unknown>;
    const profileContext = coachContext.profile as Record<string, unknown>;
    const recentContext = coachContext.recentProgress as Record<string, unknown>;
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

    return [
        `Coach context:`,
        `- Personal settings: name ${toText(profileContext.displayName) || "unavailable"}; main life goal ${toText(profileContext.mainLifeGoal) || "unavailable"}; daily focus ${toText(profileContext.dailyFocus) || "unavailable"}; preferred trading risk ${toText(profileContext.preferredTradingRiskLimit) || "unavailable"}; daily trading limit ${toText(profileContext.dailyTradingLimit) || "unavailable"}`,
        `- Habits: ${toText(habitContext.total) || "0"} total; completed today: ${Array.isArray(habitContext.completedToday) ? habitContext.completedToday.length : 0}; incomplete today: ${Array.isArray(habitContext.incompleteToday) ? habitContext.incompleteToday.length : 0}; streak: ${toText(habitContext.streak) || "0"}; recent: ${Array.isArray(habitContext.recent) ? habitContext.recent.slice(0, 3).map((entry) => { const item = entry as Record<string, unknown>; return `${toText(item.title)}:${toText(item.completedToday) === "true" ? "done" : "pending"}`; }).join(", ") || "none" : "none"}`,
        `- Goals: ${Array.isArray(goalContext.active) ? goalContext.active.length : 0} active; ${Array.isArray(goalContext.recentlyCompleted) ? goalContext.recentlyCompleted.length : 0} recently completed; details: ${Array.isArray(goalContext.active) ? goalContext.active.slice(0, 5).map((goal) => { const item = goal as Record<string, unknown>; return `${toText(item.title)}:${toText(item.progress)}%; deadline ${toText(item.targetDate) || "unavailable"}; linked habits ${toText(item.linkedHabitTitles) || "none"}`; }).join(", ") || "none" : "none"}`,
        `- Mindset/check-ins: current state ${toText(mindsetContext.currentState) || "not set"}; focus score ${toText(mindsetContext.focusScore) || "0"}; summary ${toText(mindsetContext.summary) || "not available"}; latest check-in ${latestCheckIn}; recent check-ins ${recentCheckIns}`,
        `- Trading: mode ${toText(tradingContext.tradingMode) || "Forex"}; risk profile ${toText(tradingContext.riskProfile) || "Moderate"}; discipline streak ${toText(tradingContext.disciplineStreak) || "0"}; recent trades: ${recentTradeText || "none"}; last 7 days: ${weeklyTradeText}; deterministic patterns: ${patternInsightText}`,
        `- Recent progress: ${recentActivityText}`,
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

export async function POST(req: Request) {
    const groqKeyPresent = Boolean(process.env.GROQ_API_KEY);
    const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
    console.log("GROQ_API_KEY_PRESENT:", groqKeyPresent ? "true" : "false");
    console.log("GROQ_ENDPOINT:", groqEndpoint);
    console.log("MODEL:", MODEL);

    let incomingText = "";
    let incomingBody: unknown = null;

    try {
        incomingText = await req.text();
        console.log("INCOMING_BODY_PARSE: START");
        console.log("INCOMING_BODY_PREVIEW:", incomingText.slice(0, 500));
        incomingBody = incomingText ? JSON.parse(incomingText) : {};
        console.log("INCOMING_BODY_PARSE: PASS");
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        const name = error instanceof Error ? error.name : "UnknownError";
        console.log("INCOMING_BODY_PARSE: FAIL");
        console.log("INCOMING_BODY_PARSE_ERROR_NAME:", name);
        console.log("INCOMING_BODY_PARSE_ERROR_MESSAGE:", message);
        return NextResponse.json({ error: "Invalid request JSON." }, { status: 400 });
    }

    try {
        const body = incomingBody as Record<string, unknown>;

        if (!process.env.GROQ_API_KEY) {
            console.log("GROQ_KEY_MISSING: true");
            return NextResponse.json(
                { error: "GROQ_API_KEY is not configured on the server." },
                { status: 500 },
            );
        }

        const message = typeof body?.message === "string" ? body.message.trim() : "";
        if (!message) {
            return NextResponse.json({ error: "Message is required." }, { status: 400 });
        }

        const systemPrompt = `You are Future Mindset Coach, the central intelligence for a private personal operating system covering discipline, mindset, goals, habits, and trading psychology. Use only the persisted user context provided below. Treat missing, empty, or unavailable values as unknown; never invent trades, habits, goals, check-ins, statistics, streaks, or patterns. Choose only the context relevant to the user’s question instead of repeating the entire dataset.

    For trading, coach process, risk management, planning, psychology, journal patterns, and education. You are not a signal seller, execution bot, or fortune-teller. Never promise profit, guarantee a winning trade, encourage FOMO, revenge trading, gambling, excessive leverage, or unsafe risk. If a setup is unclear, explain the uncertainty and recommend waiting or NO TRADE.

    Keep responses calm, direct, and concise with short paragraphs or compact sections. Reference real names, goals, habits, check-ins, and journal details naturally when relevant. If there is insufficient data, say so explicitly rather than manufacturing a pattern. For a weekly review request, organize the response as: 1) What went well, 2) What needs improvement, 3) Biggest pattern noticed, 4) Top 3 priorities for next week. Base that review on the available last-seven-day context and explicitly identify areas with insufficient data.`;

        const controller = new AbortController();
        const timeoutMs = 18000;
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log("TIMED_OUT: true");
        }, timeoutMs);

        let response: Response;
        let data: any = null;

        try {
            console.log("FETCH_ATTEMPT: starting Groq request");
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
            console.log("GROQ_FETCH_RETURNED_RESPONSE:", String(Boolean(response)));
            console.log("GROQ_HTTP_STATUS:", String(response.status));
            console.log("GROQ_STATUS_TEXT:", response.statusText || "");
            console.log("GROQ_CONTENT_TYPE:", contentType || "missing");

            const rawText = await response.text();
            const rawPreview = rawText.slice(0, 500).replace(/\s+/g, " ").trim();
            console.log("GROQ_RAW_BODY_PREVIEW:", rawPreview || "<empty>");

            if (rawText.trim() && (contentType.includes("application/json") || rawText.trim().startsWith("{") || rawText.trim().startsWith("["))) {
                try {
                    data = JSON.parse(rawText);
                    console.log("GROQ_PROVIDER_PARSE: PASS");
                } catch (error) {
                    const parseMessage = error instanceof Error ? error.message : "Unknown parse error";
                    const parseName = error instanceof Error ? error.name : "UnknownParseError";
                    console.log("GROQ_PROVIDER_PARSE: FAIL");
                    console.log("GROQ_PROVIDER_PARSE_ERROR_NAME:", parseName);
                    console.log("GROQ_PROVIDER_PARSE_ERROR_MESSAGE:", parseMessage);
                    data = null;
                }
            } else {
                console.log("GROQ_PROVIDER_PARSE: SKIPPED_NON_JSON");
                data = null;
            }

            const sanitizedBody = data && typeof data === "object"
                ? {
                    error: data.error
                        ? {
                            message: typeof data.error?.message === "string" ? data.error.message : String(data.error),
                            type: typeof data.error?.type === "string" ? data.error.type : undefined,
                            code: typeof data.error?.code === "string" ? data.error.code : undefined,
                        }
                        : undefined,
                    id: typeof data.id === "string" ? data.id : undefined,
                    choices: Array.isArray(data.choices) ? data.choices.slice(0, 1).map((choice: Record<string, unknown>) => {
                        const messageObj = choice && typeof choice === "object" && "message" in choice && choice.message && typeof choice.message === "object"
                            ? (choice.message as Record<string, unknown>)
                            : null;

                        return {
                            finish_reason: choice?.finish_reason,
                            message: messageObj
                                ? {
                                    role: typeof messageObj.role === "string" ? messageObj.role : undefined,
                                    content: typeof messageObj.content === "string" ? messageObj.content.slice(0, 200) : undefined,
                                }
                                : undefined,
                        };
                    }) : undefined,
                    usage: data.usage ? { prompt_tokens: data.usage.prompt_tokens, completion_tokens: data.usage.completion_tokens, total_tokens: data.usage.total_tokens } : undefined,
                }
                : data;

            console.log("PROVIDER_BODY:", sanitizedBody ? JSON.stringify(sanitizedBody).slice(0, 2000) : "null");

            if (!response.ok) {
                const providerMessage = typeof data?.error?.message === "string"
                    ? data.error.message
                    : typeof data?.error === "string"
                        ? data.error
                        : "AI provider request failed";

                console.log("PROVIDER_ERROR:", providerMessage);
                console.error("AI Coach Groq request failed", {
                    status: response.status,
                    model: MODEL,
                    error: providerMessage,
                });

                return NextResponse.json(
                    {
                        error: "AI provider request failed",
                        details: providerMessage,
                    },
                    { status: response.status >= 500 ? 502 : 400 },
                );
            }

            const reply = data?.choices?.[0]?.message?.content;
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

            return NextResponse.json({ reply });
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === "AbortError") {
                console.log("TIMED_OUT: true");
                console.log("NETWORK_ERROR:", error.name);
                console.log("ERROR_MESSAGE:", error.message);
                console.log("ERROR_CODE:", "ABORT_ERR");
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
            console.log("TIMED_OUT: false");
            console.log("NETWORK_ERROR:", name);
            console.log("ERROR_MESSAGE:", message);
            console.log("ERROR_CODE:", code);
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
        console.log("TIMED_OUT: false");
        console.log("NETWORK_ERROR:", name);
        console.log("ERROR_MESSAGE:", message);
        console.log("ERROR_CODE:", code);
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
