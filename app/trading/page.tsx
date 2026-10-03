"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BookOpenText, BrainCircuit, CheckCheck, ClipboardCheck, NotebookPen, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import {
    addTradingJournalEntry,
    addTradingRule,
    deleteTradingJournalEntry,
    deleteTradingRule,
    evaluateChecklistResult,
    getDailyCheckIn,
    getDefaultChecklist,
    getPreTradeChecklist,
    getTradingJournalEntries,
    getTradingOverviewStatsForEntries,
    getTradingRules,
    parseNumber,
    saveDailyCheckIn,
    savePreTradeChecklist,
    saveTradingRules,
    setChecklistItem,
    updateTradingJournalEntry,
    updateTradingRule,
    type DailyCheckIn,
    type TradingJournalEntry,
    type TradingRule,
} from "@/app/state/tradingEngine";
import { PageHeader } from "@/components/ui/page-shell";

const emptyEntry: Omit<TradingJournalEntry, "id" | "createdAt" | "updatedAt"> = {
    date: new Date().toISOString().slice(0, 10),
    time: "09:00",
    instrument: "",
    side: "BUY",
    session: "London",
    setupName: "",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    riskPercent: "",
    plannedRiskReward: "",
    actualResult: "",
    resultInR: "",
    outcome: "",
    reasonForEntry: "",
    emotionBefore: "",
    emotionAfter: "",
    planFollowed: true,
    mistakes: "",
    lessonLearned: "",
    notes: "",
};

const defaultCheckIn: Omit<DailyCheckIn, "id" | "updatedAt"> = {
    date: new Date().toISOString().slice(0, 10),
    mood: "Focused",
    energy: 7,
    discipline: 7,
    tradingToday: "Maybe",
    mainPriority: "",
    distraction: "",
};

export default function TradingPage() {
    const [entries, setEntries] = useState<TradingJournalEntry[]>([]);
    const [rules, setRules] = useState<TradingRule[]>([]);
    const [checklist, setChecklist] = useState(getDefaultChecklist());
    const [checkIn, setCheckIn] = useState<Omit<DailyCheckIn, "id" | "updatedAt">>(defaultCheckIn);
    const [form, setForm] = useState(emptyEntry);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [ruleText, setRuleText] = useState("");
    const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
    const [showRuleDeleteId, setShowRuleDeleteId] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    const sync = () => {
        setEntries(getTradingJournalEntries());
        setRules(getTradingRules());
        setChecklist(getPreTradeChecklist());
        const savedCheckIn = getDailyCheckIn();
        if (savedCheckIn) {
            setCheckIn({
                date: savedCheckIn.date,
                mood: savedCheckIn.mood,
                energy: savedCheckIn.energy,
                discipline: savedCheckIn.discipline,
                tradingToday: savedCheckIn.tradingToday,
                mainPriority: savedCheckIn.mainPriority,
                distraction: savedCheckIn.distraction,
            });
        }
    };

    useEffect(() => {
        const initialSync = window.setTimeout(sync, 0);
        window.addEventListener("mindset-store-update", sync);
        return () => {
            window.clearTimeout(initialSync);
            window.removeEventListener("mindset-store-update", sync);
        };
    }, []);

    const overview = useMemo(() => {
        if (!entries.length) {
            return { disciplineScore: 0, tradesThisWeek: 0, planFollowed: 0, averageRisk: 0 };
        }

        return getTradingOverviewStatsForEntries(entries);
    }, [entries]);
    const checklistDecision = useMemo(() => evaluateChecklistResult(checklist), [checklist]);

    const handleCreateTrade = () => {
        if (!form.instrument.trim()) {
            return;
        }

        const wasEditing = Boolean(editingId);
        if (editingId) {
            updateTradingJournalEntry(editingId, form);
        } else {
            addTradingJournalEntry(form);
        }

        setForm(emptyEntry);
        setEditingId(null);
        setFeedback(wasEditing ? "Trade updated" : "Trade logged");
        sync();
    };

    const handleEditTrade = (entry: TradingJournalEntry) => {
        setEditingId(entry.id);
        setForm({
            date: entry.date,
            time: entry.time,
            instrument: entry.instrument,
            side: entry.side,
            session: entry.session,
            setupName: entry.setupName,
            entryPrice: entry.entryPrice,
            stopLoss: entry.stopLoss,
            takeProfit: entry.takeProfit,
            riskPercent: entry.riskPercent,
            plannedRiskReward: entry.plannedRiskReward,
            actualResult: entry.actualResult,
            resultInR: entry.resultInR,
            outcome: entry.outcome,
            reasonForEntry: entry.reasonForEntry,
            emotionBefore: entry.emotionBefore,
            emotionAfter: entry.emotionAfter,
            planFollowed: entry.planFollowed,
            mistakes: entry.mistakes,
            lessonLearned: entry.lessonLearned,
            notes: entry.notes,
        });
    };

    const handleSaveCheckIn = () => {
        saveDailyCheckIn({
            ...checkIn,
            date: checkIn.date || new Date().toISOString().slice(0, 10),
            mood: checkIn.mood.trim() || "Focused",
            mainPriority: checkIn.mainPriority.trim(),
            distraction: checkIn.distraction.trim(),
        });
        setFeedback("Check-in saved");
        sync();
    };

    const handleRuleCreate = () => {
        const text = ruleText.trim();
        if (!text) return;
        addTradingRule(text);
        setRuleText("");
        setFeedback("Rule added");
        sync();
    };

    const handleChecklistToggle = (id: string, checked: boolean) => {
        const next = setChecklistItem(id, checked);
        setChecklist(next);
        savePreTradeChecklist(next);
    };

    return (
        <div className="space-y-6">
            <PageHeader eyebrow="Trading" title="Journal + discipline center" description="Track execution, risk, discipline, and the lessons behind each trade." />
            {feedback ? <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{feedback}</p> : null}

            <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300"><ShieldCheck size={18} /></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Discipline</p>
                            <p className="mt-1 text-lg font-semibold text-white">{overview.disciplineScore}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300"><TrendingUp size={18} /></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">This week</p>
                            <p className="mt-1 text-lg font-semibold text-white">{overview.tradesThisWeek}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300"><CheckCheck size={18} /></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Plan followed</p>
                            <p className="mt-1 text-lg font-semibold text-white">{overview.planFollowed}%</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-slate-900/75 p-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300"><ClipboardCheck size={18} /></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Avg risk</p>
                            <p className="mt-1 text-lg font-semibold text-white">{overview.averageRisk}%</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300"><NotebookPen size={18} /></div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Journal</p>
                            <h2 className="text-lg font-semibold text-white">{editingId ? "Edit trade" : "New trade"}</h2>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <input aria-label="Trade date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Trade time" type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Instrument" placeholder="EUR/USD" value={form.instrument} onChange={(event) => setForm({ ...form, instrument: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <select aria-label="Trade direction" value={form.side} onChange={(event) => setForm({ ...form, side: event.target.value as "BUY" | "SELL" })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                        <select aria-label="Trading session" value={form.session} onChange={(event) => setForm({ ...form, session: event.target.value as TradingJournalEntry["session"] })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
                            <option value="London">London</option>
                            <option value="New York">New York</option>
                            <option value="Tokyo">Tokyo</option>
                            <option value="Asia">Asia</option>
                            <option value="Overnight">Overnight</option>
                            <option value="Any">Any</option>
                        </select>
                        <input aria-label="Setup name" placeholder="Setup name" value={form.setupName} onChange={(event) => setForm({ ...form, setupName: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Entry price" placeholder="Entry price" value={form.entryPrice} onChange={(event) => setForm({ ...form, entryPrice: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Stop loss" placeholder="Stop Loss" value={form.stopLoss} onChange={(event) => setForm({ ...form, stopLoss: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Take profit" placeholder="Take Profit" value={form.takeProfit} onChange={(event) => setForm({ ...form, takeProfit: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Risk percent" placeholder="Risk %" value={form.riskPercent} onChange={(event) => setForm({ ...form, riskPercent: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Planned risk reward" placeholder="Risk:Reward" value={form.plannedRiskReward} onChange={(event) => setForm({ ...form, plannedRiskReward: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Actual result" placeholder="Actual result" value={form.actualResult} onChange={(event) => setForm({ ...form, actualResult: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Result in R" placeholder="Result in R" value={form.resultInR} onChange={(event) => setForm({ ...form, resultInR: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <select aria-label="Trade outcome" value={form.outcome} onChange={(event) => setForm({ ...form, outcome: event.target.value as TradingJournalEntry["outcome"] })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
                            <option value="">Outcome</option>
                            <option value="Win">Win</option>
                            <option value="Loss">Loss</option>
                            <option value="Break Even">Break Even</option>
                        </select>
                        <input aria-label="Reason for entry" placeholder="Reason for entry" value={form.reasonForEntry} onChange={(event) => setForm({ ...form, reasonForEntry: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white md:col-span-2 xl:col-span-3" />
                        <input aria-label="Emotion before" placeholder="Emotion before" value={form.emotionBefore} onChange={(event) => setForm({ ...form, emotionBefore: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input aria-label="Emotion after" placeholder="Emotion after" value={form.emotionAfter} onChange={(event) => setForm({ ...form, emotionAfter: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <select aria-label="Plan followed" value={String(form.planFollowed)} onChange={(event) => setForm({ ...form, planFollowed: event.target.value === "true" })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
                            <option value="true">Plan followed</option>
                            <option value="false">Plan broken</option>
                        </select>
                        <input aria-label="Mistakes" placeholder="Mistakes" value={form.mistakes} onChange={(event) => setForm({ ...form, mistakes: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white md:col-span-2 xl:col-span-3" />
                        <input aria-label="Lesson learned" placeholder="Lesson learned" value={form.lessonLearned} onChange={(event) => setForm({ ...form, lessonLearned: event.target.value })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white md:col-span-2 xl:col-span-3" />
                        <textarea aria-label="Trade notes" placeholder="Notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} className="min-h-[80px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white md:col-span-2 xl:col-span-3" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={handleCreateTrade} className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500">{editingId ? "Save trade" : "Create trade"}</button>
                        <button type="button" onClick={() => { setForm(emptyEntry); setEditingId(null); }} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-200">Cancel</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div id="daily-check-in" className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300"><ClipboardCheck size={18} /></div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Checklist</p>
                                <h2 className="text-lg font-semibold text-white">Pre-trade result</h2>
                            </div>
                        </div>

                        <div className="mb-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200">
                            <span className="font-medium text-white">Process:</span> {checklistDecision}
                        </div>

                        <div className="space-y-2">
                            {checklist.map((item) => (
                                <label key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2">
                                    <span className="text-sm text-slate-200">{item.label}</span>
                                    <input type="checkbox" checked={item.checked} onChange={(event) => handleChecklistToggle(item.id, event.target.checked)} className="h-4 w-4 accent-violet-500" />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300"><BrainCircuit size={18} /></div>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Daily check-in</p>
                                <h2 className="text-lg font-semibold text-white">How are you feeling?</h2>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input value={checkIn.mood} onChange={(event) => setCheckIn({ ...checkIn, mood: event.target.value })} placeholder="Focused" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" min={1} max={10} value={checkIn.energy} onChange={(event) => setCheckIn({ ...checkIn, energy: Number(event.target.value) || 0 })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                                <input type="number" min={1} max={10} value={checkIn.discipline} onChange={(event) => setCheckIn({ ...checkIn, discipline: Number(event.target.value) || 0 })} className="rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                            </div>
                            <select value={checkIn.tradingToday} onChange={(event) => setCheckIn({ ...checkIn, tradingToday: event.target.value as DailyCheckIn["tradingToday"] })} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white">
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Maybe">Maybe</option>
                            </select>
                            <input value={checkIn.mainPriority} onChange={(event) => setCheckIn({ ...checkIn, mainPriority: event.target.value })} placeholder="Main priority" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                            <input value={checkIn.distraction} onChange={(event) => setCheckIn({ ...checkIn, distraction: event.target.value })} placeholder="What could distract you?" className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                            <button onClick={handleSaveCheckIn} className="w-full rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">Save check-in</button>
                            <button onClick={() => window.location.href = "/mindset?prompt=Review my recent trading discipline"} className="w-full rounded-2xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-100 hover:bg-violet-500/15">Ask Coach</button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300"><ShieldCheck size={18} /></div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Rules</p>
                        <h2 className="text-lg font-semibold text-white">Trading rules</h2>
                    </div>
                </div>

                <div className="mb-4 flex min-w-0 gap-2">
                    <input value={ruleText} onChange={(event) => setRuleText(event.target.value)} placeholder="Add a rule" className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                    <button onClick={handleRuleCreate} className="shrink-0 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500">Add</button>
                </div>

                <div className="space-y-2">
                    {rules.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">No trading rules yet.</div>
                    ) : (
                        rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2">
                                <label className="flex flex-1 items-center gap-3 text-sm text-slate-200">
                                    <input type="checkbox" checked={rule.enabled} onChange={(event) => {
                                        const next = updateTradingRule(rule.id, { enabled: event.target.checked });
                                        setRules(next);
                                    }} className="h-4 w-4 accent-violet-500" />
                                    <span>{rule.text}</span>
                                </label>
                                <button onClick={() => { const next = deleteTradingRule(rule.id); setRules(next); }} className="text-xs text-red-300">Delete</button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="rounded-[28px] border border-slate-800/80 bg-slate-900/75 p-5">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300"><BookOpenText size={18} /></div>
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">History</p>
                        <h2 className="text-lg font-semibold text-white">Recent trades</h2>
                    </div>
                </div>

                <div className="space-y-3">
                    {entries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-5 text-sm text-slate-400">No trades logged yet. Your first journal entry will appear here.</div>
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-white">
                                            <span className="font-semibold">{entry.instrument}</span>
                                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">{entry.side}</span>
                                            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">{entry.outcome || "Pending"}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-400">{entry.setupName || "Setup not named"} • {entry.session} • {entry.planFollowed ? "Plan followed" : "Plan broken"}</p>
                                    </div>
                                    <div className="flex gap-2 text-xs">
                                        <button onClick={() => handleEditTrade(entry)} className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-slate-200">Edit</button>
                                        <button onClick={() => setShowDeleteId(entry.id)} className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-red-200">Delete</button>
                                    </div>
                                </div>

                                {showDeleteId === entry.id && (
                                    <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-100">
                                        <p>Delete this trade?</p>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => { const next = deleteTradingJournalEntry(entry.id); setEntries(next); setShowDeleteId(null); }} className="rounded-xl bg-red-600 px-3 py-1.5 text-white">Delete</button>
                                            <button onClick={() => setShowDeleteId(null)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-slate-200">Cancel</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
