import { readStorageJson, writeStorageJson } from "./persistence";

export type TradeSide = "BUY" | "SELL";
export type TradeOutcome = "Win" | "Loss" | "Break Even";
export type TradingSession = "London" | "New York" | "Tokyo" | "Asia" | "Overnight" | "Any";
export type TradingDecision = "READY" | "WAIT" | "NO TRADE";

export type TradingRule = {
    id: string;
    text: string;
    enabled: boolean;
    order: number;
};

export type ChecklistItem = {
    id: string;
    label: string;
    checked: boolean;
    critical: boolean;
};

export type DailyCheckIn = {
    id: string;
    date: string;
    mood: string;
    energy: number;
    discipline: number;
    tradingToday: "Yes" | "No" | "Maybe";
    mainPriority: string;
    distraction: string;
    updatedAt: string;
};

export type TradingJournalEntry = {
    id: string;
    date: string;
    time: string;
    instrument: string;
    side: TradeSide;
    session: TradingSession;
    setupName: string;
    entryPrice: string;
    stopLoss: string;
    takeProfit: string;
    riskPercent: string;
    plannedRiskReward: string;
    actualResult: string;
    resultInR: string;
    outcome: TradeOutcome | "";
    reasonForEntry: string;
    emotionBefore: string;
    emotionAfter: string;
    planFollowed: boolean;
    mistakes: string;
    lessonLearned: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
};

const JOURNAL_STORAGE_KEY = "future-mindset-trading-journal";
const RULES_STORAGE_KEY = "future-mindset-trading-rules";
const CHECKLIST_STORAGE_KEY = "future-mindset-pretrade-checklist";
const CHECKIN_STORAGE_KEY = "future-mindset-daily-checkin";

export function createId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `trade-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getTodayKey(date = new Date()): string {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function getDefaultChecklist(): ChecklistItem[] {
    return [
        { id: "setup", label: "This matches my setup", checked: false, critical: true },
        { id: "structure", label: "Market structure is clear", checked: false, critical: false },
        { id: "entry", label: "Entry confirmation exists", checked: false, critical: true },
        { id: "sl", label: "Stop Loss is defined", checked: false, critical: true },
        { id: "tp", label: "Take Profit is defined", checked: false, critical: false },
        { id: "risk", label: "Risk is within my limit", checked: false, critical: true },
        { id: "rr", label: "Risk:Reward is acceptable", checked: false, critical: false },
        { id: "revenge", label: "I am not revenge trading", checked: false, critical: true },
        { id: "fomo", label: "I am not entering because of FOMO", checked: false, critical: true },
        { id: "calm", label: "I feel calm enough to make a rational decision", checked: false, critical: true },
    ];
}

export function getDefaultRules(): TradingRule[] {
    return [
        { id: "default-risk-limit", text: "Maximum risk per trade: 1%", enabled: true, order: 0 },
        { id: "default-no-revenge-trading", text: "Never trade immediately after a revenge-trading impulse.", enabled: true, order: 1 },
        { id: "default-wait-confirmation", text: "Wait for confirmation before entry.", enabled: true, order: 2 },
        { id: "default-protect-the-stop", text: "Protect the stop and respect the plan.", enabled: true, order: 3 },
    ];
}

export function getTradingJournalEntries(): TradingJournalEntry[] {
    return readStorageJson<TradingJournalEntry[]>(JOURNAL_STORAGE_KEY, []);
}

export function saveTradingJournalEntries(entries: TradingJournalEntry[]): TradingJournalEntry[] {
    return writeStorageJson(JOURNAL_STORAGE_KEY, entries);
}

export function addTradingJournalEntry(entry: Omit<TradingJournalEntry, "id" | "createdAt" | "updatedAt">): TradingJournalEntry {
    const nextEntry: TradingJournalEntry = {
        ...entry,
        id: createId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const entries = getTradingJournalEntries();
    saveTradingJournalEntries([nextEntry, ...entries]);
    return nextEntry;
}

export function updateTradingJournalEntry(id: string, updates: Partial<TradingJournalEntry>): TradingJournalEntry[] {
    const entries = getTradingJournalEntries();
    const nextEntries = entries.map((entry) => (
        entry.id === id
            ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
            : entry
    ));

    saveTradingJournalEntries(nextEntries);
    return nextEntries;
}

export function deleteTradingJournalEntry(id: string): TradingJournalEntry[] {
    const nextEntries = getTradingJournalEntries().filter((entry) => entry.id !== id);
    saveTradingJournalEntries(nextEntries);
    return nextEntries;
}

export function getTradingRules(): TradingRule[] {
    return readStorageJson<TradingRule[]>(RULES_STORAGE_KEY, getDefaultRules());
}

export function saveTradingRules(rules: TradingRule[]): TradingRule[] {
    return writeStorageJson(RULES_STORAGE_KEY, rules);
}

export function addTradingRule(text: string): TradingRule {
    const rules = getTradingRules();
    const nextRule: TradingRule = {
        id: createId(),
        text: text.trim() || "New trading rule",
        enabled: true,
        order: rules.length,
    };

    saveTradingRules([...rules, nextRule]);
    return nextRule;
}

export function updateTradingRule(id: string, changes: Partial<Pick<TradingRule, "text" | "enabled" | "order">>): TradingRule[] {
    const rules = getTradingRules();
    const nextRules = rules.map((rule) => (rule.id === id ? { ...rule, ...changes } : rule));
    saveTradingRules(nextRules.sort((a, b) => a.order - b.order));
    return nextRules;
}

export function deleteTradingRule(id: string): TradingRule[] {
    const rules = getTradingRules().filter((rule) => rule.id !== id);
    saveTradingRules(rules.map((rule, index) => ({ ...rule, order: index })));
    return rules;
}

export function getPreTradeChecklist(): ChecklistItem[] {
    const stored = readStorageJson<ChecklistItem[]>(CHECKLIST_STORAGE_KEY, getDefaultChecklist());
    const defaults = getDefaultChecklist();
    const map = new Map(defaults.map((item) => [item.id, item]));

    return defaults.map((item) => {
        const match = stored.find((entry) => entry.id === item.id);
        return { ...item, ...match, critical: item.critical };
    });
}

export function savePreTradeChecklist(checklist: ChecklistItem[]): ChecklistItem[] {
    return writeStorageJson(CHECKLIST_STORAGE_KEY, checklist);
}

export function setChecklistItem(id: string, checked: boolean): ChecklistItem[] {
    const checklist = getPreTradeChecklist();
    const nextChecklist = checklist.map((item) => (item.id === id ? { ...item, checked } : item));
    savePreTradeChecklist(nextChecklist);
    return nextChecklist;
}

export function evaluateChecklistResult(checklist: ChecklistItem[] = getPreTradeChecklist()): TradingDecision {
    const criticalIds = new Set(checklist.filter((item) => item.critical).map((item) => item.id));
    const failedCritical = checklist.some((item) => criticalIds.has(item.id) && !item.checked);

    if (failedCritical) {
        return "NO TRADE";
    }

    const allChecked = checklist.every((item) => item.checked);
    if (allChecked) {
        return "READY";
    }

    return "WAIT";
}

export function getDailyCheckIn(date = getTodayKey()): DailyCheckIn | null {
    const entries = readStorageJson<DailyCheckIn[]>(CHECKIN_STORAGE_KEY, []);
    return entries.find((entry) => entry.date === date) ?? null;
}

export function getDailyCheckIns(): DailyCheckIn[] {
    return readStorageJson<DailyCheckIn[]>(CHECKIN_STORAGE_KEY, [])
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function saveDailyCheckIn(input: Omit<DailyCheckIn, "id" | "updatedAt">): DailyCheckIn {
    const entries = readStorageJson<DailyCheckIn[]>(CHECKIN_STORAGE_KEY, []);
    const existingIndex = entries.findIndex((entry) => entry.date === input.date);
    const nextEntry: DailyCheckIn = {
        id: existingIndex >= 0 ? entries[existingIndex].id : createId(),
        ...input,
        updatedAt: new Date().toISOString(),
    };

    const nextEntries = existingIndex >= 0
        ? entries.map((entry) => (entry.date === input.date ? nextEntry : entry))
        : [nextEntry, ...entries];

    writeStorageJson(CHECKIN_STORAGE_KEY, nextEntries);
    return nextEntry;
}

export function getLatestCheckIn(): DailyCheckIn | null {
    const entries = readStorageJson<DailyCheckIn[]>(CHECKIN_STORAGE_KEY, []);
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null;
}

export function parseNumber(value: string): number | null {
    if (!value || value.trim() === "") {
        return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

export function getDisciplineScore(): number {
    const entries = getTradingJournalEntries();
    if (!entries.length) {
        return 0;
    }

    const scorePerTrade = entries.map((entry) => {
        let score = 50;

        if (entry.planFollowed) {
            score += 25;
        } else {
            score -= 20;
        }

        const risk = parseNumber(entry.riskPercent);
        if (risk !== null) {
            if (risk <= 1) {
                score += 15;
            } else {
                score -= 10;
            }
        }

        if (entry.stopLoss && entry.takeProfit) {
            score += 10;
        }

        if (entry.mistakes.trim()) {
            score -= 15;
        }

        if (entry.lessonLearned.trim()) {
            score += 5;
        }

        if (entry.outcome === "Win" && entry.planFollowed) {
            score += 10;
        }

        if (entry.outcome === "Loss" && entry.planFollowed) {
            score += 5;
        }

        if (entry.outcome === "Loss" && !entry.planFollowed) {
            score -= 20;
        }

        if (entry.outcome === "Win" && !entry.planFollowed) {
            score -= 25;
        }

        return Math.max(0, Math.min(100, score));
    });

    const average = scorePerTrade.reduce((sum, score) => sum + score, 0) / scorePerTrade.length;
    return Math.round(average);
}

export function getTradingOverviewStatsForEntries(entries: TradingJournalEntry[]) {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const thisWeek = entries.filter((entry) => new Date(`${entry.date}T00:00:00`) >= weekAgo);
    const followed = entries.filter((entry) => entry.planFollowed).length;
    const avgRisk = entries.length
        ? entries.reduce((sum, entry) => sum + (parseNumber(entry.riskPercent) ?? 0), 0) / entries.length
        : 0;

    const disciplineScore = entries.length
        ? Math.round(entries.reduce((sum, entry) => {
            let score = 50;

            if (entry.planFollowed) {
                score += 25;
            } else {
                score -= 20;
            }

            const risk = parseNumber(entry.riskPercent);
            if (risk !== null) {
                if (risk <= 1) {
                    score += 15;
                } else {
                    score -= 10;
                }
            }

            if (entry.stopLoss && entry.takeProfit) {
                score += 10;
            }

            if (entry.mistakes.trim()) {
                score -= 15;
            }

            if (entry.lessonLearned.trim()) {
                score += 5;
            }

            if (entry.outcome === "Win" && entry.planFollowed) {
                score += 10;
            }

            if (entry.outcome === "Loss" && entry.planFollowed) {
                score += 5;
            }

            if (entry.outcome === "Loss" && !entry.planFollowed) {
                score -= 20;
            }

            if (entry.outcome === "Win" && !entry.planFollowed) {
                score -= 25;
            }

            return sum + Math.max(0, Math.min(100, score));
        }, 0) / entries.length)
        : 0;

    return {
        disciplineScore,
        tradesThisWeek: thisWeek.length,
        planFollowed: entries.length ? Math.round((followed / entries.length) * 100) : 0,
        averageRisk: Number(avgRisk.toFixed(2)),
    };
}

export function getTradingOverviewStats() {
    return getTradingOverviewStatsForEntries(getTradingJournalEntries());
}

export function getTradingPatternInsights(entries: TradingJournalEntry[] = getTradingJournalEntries()) {
    if (!entries.length) {
        return {
            hasData: false,
            insights: [
                { label: "Pattern insights", value: "Not enough trading history yet." },
            ],
        };
    }

    if (entries.length < 3) {
        return {
            hasData: false,
            insights: [
                { label: "Pattern insights", value: "Not enough trading history yet." },
            ],
        };
    }

    const normalizedEntries = entries.filter((entry) => entry && typeof entry === "object");
    const planFollowedRate = Math.round((normalizedEntries.filter((entry) => entry.planFollowed).length / normalizedEntries.length) * 100);
    const winsWhenFollowed = normalizedEntries.filter((entry) => entry.planFollowed && entry.outcome === "Win");
    const winsWhenBroken = normalizedEntries.filter((entry) => !entry.planFollowed && entry.outcome === "Win");
    const followedWinRate = normalizedEntries.filter((entry) => entry.planFollowed).length
        ? Math.round((winsWhenFollowed.length / normalizedEntries.filter((entry) => entry.planFollowed).length) * 100)
        : 0;
    const brokenWinRate = normalizedEntries.filter((entry) => !entry.planFollowed).length
        ? Math.round((winsWhenBroken.length / normalizedEntries.filter((entry) => !entry.planFollowed).length) * 100)
        : 0;
    const mistakes = normalizedEntries
        .map((entry) => entry.mistakes.trim())
        .filter(Boolean)
        .reduce<Record<string, number>>((acc, mistake) => {
            const normalized = mistake.toLowerCase();
            acc[normalized] = (acc[normalized] ?? 0) + 1;
            return acc;
        }, {});
    const highestMistake = Object.entries(mistakes).sort((a, b) => b[1] - a[1])[0];
    const emotionMap = normalizedEntries
        .filter((entry) => !entry.planFollowed)
        .map((entry) => (entry.emotionAfter.trim() || entry.emotionBefore.trim()).toLowerCase())
        .filter(Boolean)
        .reduce<Record<string, number>>((acc, emotion) => {
            acc[emotion] = (acc[emotion] ?? 0) + 1;
            return acc;
        }, {});
    const mostCommonEmotion = Object.entries(emotionMap).sort((a, b) => b[1] - a[1])[0];
    const avgRisk = normalizedEntries.reduce((sum, entry) => sum + (parseNumber(entry.riskPercent) ?? 0), 0) / normalizedEntries.length;
    const avgRr = normalizedEntries
        .map((entry) => {
            const value = entry.plannedRiskReward?.trim() ?? "";
            const ratio = value.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);
            if (ratio) {
                return Number(ratio[2]) / Number(ratio[1]);
            }

            return parseNumber(value);
        })
        .filter((value): value is number => value !== null && Number.isFinite(value))
        .reduce((sum, value) => sum + value, 0) / Math.max(normalizedEntries.filter((entry) => entry.plannedRiskReward).length, 1);
    const losses = normalizedEntries.filter((entry) => entry.outcome === "Loss");
    const avgLossRisk = losses.length
        ? losses.reduce((sum, entry) => sum + (parseNumber(entry.riskPercent) ?? 0), 0) / losses.length
        : null;
    const bySession = normalizedEntries.reduce<Record<string, { total: number; followed: number }>>((acc, entry) => {
        const key = entry.session || "Any";
        if (!acc[key]) {
            acc[key] = { total: 0, followed: 0 };
        }
        acc[key].total += 1;
        if (entry.planFollowed) {
            acc[key].followed += 1;
        }
        return acc;
    }, {});
    const mostCommonSession = Object.entries(bySession)
        .map(([session, value]) => ({ session, count: value.total }))
        .sort((a, b) => b.count - a.count || a.session.localeCompare(b.session))[0];
    const fomoMentions = normalizedEntries.filter((entry) => /fomo|fear of missing out/i.test(entry.mistakes || "")).length;
    const earlyEntryMentions = normalizedEntries.filter((entry) => /early entry|entered too early|premature/i.test(entry.mistakes || "")).length;
    const insights = [
        { label: "Plan-followed rate", value: `${planFollowedRate}%` },
        { label: "Win rate when plan was followed", value: `${followedWinRate}%` },
        { label: "Win rate when plan was broken", value: `${brokenWinRate}%` },
        { label: "Average risk", value: `${avgRisk.toFixed(2)}%` },
        { label: "Average R:R", value: avgRr ? `${avgRr.toFixed(2)}:1` : "Not enough R:R data" },
        { label: "Most common mistake", value: highestMistake ? `${highestMistake[0]} (${highestMistake[1]})` : "No recorded mistakes" },
        { label: "Most common session", value: mostCommonSession ? `${mostCommonSession.session} (${mostCommonSession.count})` : "Not enough data" },
    ];

    if (fomoMentions) {
        insights.push({ label: "FOMO pattern", value: `${fomoMentions} trade${fomoMentions > 1 ? "s" : ""} mention FOMO` });
    }

    if (earlyEntryMentions) {
        insights.push({ label: "Early-entry pattern", value: `${earlyEntryMentions} trade${earlyEntryMentions > 1 ? "s" : ""} mention early entries` });
    }

    if (mostCommonEmotion) {
        insights.push({ label: "Common emotion on plan breaks", value: `${mostCommonEmotion[0]} (${mostCommonEmotion[1]})` });
    }

    if (avgLossRisk !== null) {
        insights.push({ label: "Average risk after loss", value: `${avgLossRisk.toFixed(2)}%` });
    }

    return {
        hasData: true,
        insights,
    };
}
