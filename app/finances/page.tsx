"use client";

import { useMemo, useState } from "react";
import { getFinanceState, getMonthlyFinanceSummary, saveFinanceState, type FinanceState, type FinanceTransaction } from "@/app/state/financeEngine";
import { SERVER_STORAGE_SNAPSHOT, useBrowserDateKey, useStorageSnapshot } from "@/app/state/storageSubscription";

const emptyState: FinanceState = { income: 0, expenses: 0, savings: 0, savingsTarget: 0, goals: [], transactions: [] };
const FINANCE_STORAGE_KEYS = ["future-mindset-finances"];

export default function FinancesPage() {
    const storageSnapshot = useStorageSnapshot(FINANCE_STORAGE_KEYS);
    const browserDate = useBrowserDateKey();
    const state = useMemo(() => storageSnapshot !== SERVER_STORAGE_SNAPSHOT ? getFinanceState() : emptyState, [storageSnapshot]);
    const [transactionDraft, setTransactionDraft] = useState({ type: "income" as FinanceTransaction["type"], description: "", amount: "", category: "Salary", date: "" });
    const [goalDraft, setGoalDraft] = useState({ title: "", target: "", saved: "" });
    const currentMonth = browserDate.slice(0, 7);

    const updateState = (next: FinanceState) => {
        saveFinanceState(next);
    };

    const addTransaction = () => {
        const amount = Number(transactionDraft.amount);
        if (!transactionDraft.description.trim() || !Number.isFinite(amount) || amount <= 0) return;

        const next: FinanceState = {
            ...state,
            transactions: [
                ...state.transactions,
                {
                    id: crypto.randomUUID?.() ?? `tx-${Date.now()}`,
                    type: transactionDraft.type,
                    description: transactionDraft.description.trim(),
                    amount,
                    category: transactionDraft.category,
                    date: transactionDraft.date || browserDate,
                },
            ],
        };
        const income = next.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
        const expenses = next.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
        next.income = income;
        next.expenses = expenses;
        next.savings = income - expenses;
        updateState(next);
        setTransactionDraft({ type: "income", description: "", amount: "", category: "Salary", date: browserDate });
    };

    const addGoal = () => {
        if (!goalDraft.title.trim()) return;
        const target = Number(goalDraft.target) || 0;
        const saved = Number(goalDraft.saved) || 0;
        updateState({
            ...state,
            savingsTarget: state.savingsTarget || target,
            goals: [
                ...state.goals,
                {
                    id: crypto.randomUUID?.() ?? `goal-${Date.now()}`,
                    title: goalDraft.title.trim(),
                    target,
                    saved,
                },
            ],
        });
        setGoalDraft({ title: "", target: "", saved: "" });
    };

    const monthSummary = useMemo(() => getMonthlyFinanceSummary(state, currentMonth), [state, currentMonth]);
    const savingsProgress = state.savingsTarget > 0 ? Math.min(100, Math.round((state.savings / state.savingsTarget) * 100)) : 0;

    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-[#0a1524]/80 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">Personal economy</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Finances</h1>
            </div>

            <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Income this month</p>
                    <p className="mt-3 text-2xl font-semibold text-white">€{monthSummary.income.toLocaleString()}</p>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Expenses this month</p>
                    <p className="mt-3 text-2xl font-semibold text-white">€{monthSummary.expenses.toLocaleString()}</p>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Net</p>
                    <p className="mt-3 text-2xl font-semibold text-white">€{monthSummary.net.toLocaleString()}</p>
                </div>
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Savings progress</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{savingsProgress}%</p>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
                <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                    <h2 className="text-xl font-semibold text-white">Transactions</h2>
                    <div className="mt-4 space-y-3">
                        {state.transactions.length ? state.transactions.map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                                <div>
                                    <p className="font-medium text-white">{entry.description}</p>
                                    <p className="text-xs text-slate-400">{entry.category} · {entry.date}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold ${entry.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>{entry.type === "income" ? "+" : "-"}€{entry.amount.toLocaleString()}</p>
                                    <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{entry.type}</p>
                                    <button type="button" aria-label={`Delete transaction ${entry.description}`} onClick={() => {
                                        if (window.confirm("Delete this transaction?")) {
                                            const transactions = state.transactions.filter((transaction) => transaction.id !== entry.id);
                                            const income = transactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0);
                                            const expenses = transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
                                            updateState({ ...state, transactions, income, expenses, savings: income - expenses });
                                        }
                                    }} className="mt-1 text-[10px] text-rose-300 hover:text-rose-200">Delete</button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400">No transactions yet.</p>}
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                        <div className="grid gap-3 md:grid-cols-2">
                            <select value={transactionDraft.type} onChange={(event) => setTransactionDraft({ ...transactionDraft, type: event.target.value as FinanceTransaction["type"] })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white">
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                            </select>
                            <input value={transactionDraft.amount} onChange={(event) => setTransactionDraft({ ...transactionDraft, amount: event.target.value })} placeholder="Amount" type="number" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        </div>
                        <input value={transactionDraft.description} onChange={(event) => setTransactionDraft({ ...transactionDraft, description: event.target.value })} placeholder="Description" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        <div className="grid gap-3 md:grid-cols-2">
                            <input value={transactionDraft.category} onChange={(event) => setTransactionDraft({ ...transactionDraft, category: event.target.value })} placeholder="Category" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                            <input type="date" value={transactionDraft.date || browserDate} onChange={(event) => setTransactionDraft({ ...transactionDraft, date: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                        </div>
                        <button type="button" onClick={addTransaction} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-medium text-white">Add transaction</button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                        <h2 className="text-xl font-semibold text-white">Savings target</h2>
                        <input
                            aria-label="Savings target"
                            type="number"
                            value={state.savingsTarget}
                            onChange={(event) => updateState({ ...state, savingsTarget: Number(event.target.value) || 0 })}
                            className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-lg font-semibold text-white outline-none"
                        />
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${savingsProgress}%` }} /></div>
                    </div>

                    <div className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-4">
                        <h2 className="text-xl font-semibold text-white">Financial goals</h2>
                        <div className="mt-4 space-y-3">
                            {state.goals.length ? state.goals.map((goal) => (
                                <div key={goal.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium text-white">{goal.title}</p>
                                        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{Math.min(100, Math.round((goal.saved / Math.max(goal.target, 1)) * 100))}%</span>
                                    </div>
                                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${Math.min(100, Math.round((goal.saved / Math.max(goal.target, 1)) * 100))}%` }} /></div>
                                    <div className="mt-2 flex justify-between text-xs text-slate-400"><span>Saved €{goal.saved.toLocaleString()}</span><span>Target €{goal.target.toLocaleString()}</span></div>
                                </div>
                            )) : <p className="text-sm text-slate-400">No financial goals yet.</p>}
                        </div>

                        <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
                            <input value={goalDraft.title} onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })} placeholder="Goal title" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input value={goalDraft.target} onChange={(event) => setGoalDraft({ ...goalDraft, target: event.target.value })} type="number" placeholder="Target" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                                <input value={goalDraft.saved} onChange={(event) => setGoalDraft({ ...goalDraft, saved: event.target.value })} type="number" placeholder="Saved" className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" />
                            </div>
                            <button type="button" onClick={addGoal} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-2.5 text-sm font-medium text-white">Add goal</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
