import { readStorageJson, writeStorageJson } from "./persistence";

export type FinanceGoal = { id: string; title: string; target: number; saved: number };
export type FinanceTransaction = { id: string; type: "income" | "expense"; description: string; amount: number; category: string; date: string };
export type FinanceState = { income: number; expenses: number; savings: number; savingsTarget: number; goals: FinanceGoal[]; transactions: FinanceTransaction[] };
export type MonthlyFinanceSummary = { income: number; expenses: number; net: number; savings: number; savingsTarget: number; goals: FinanceGoal[]; transactionCount: number };

const STORAGE_KEY = "future-mindset-finances";
const EMPTY_FINANCES: FinanceState = { income: 0, expenses: 0, savings: 0, savingsTarget: 0, goals: [], transactions: [] };

export function getFinanceState(): FinanceState {
    const value = readStorageJson<Partial<FinanceState>>(STORAGE_KEY, EMPTY_FINANCES);
    return {
        income: Number.isFinite(value.income) ? Number(value.income) : 0,
        expenses: Number.isFinite(value.expenses) ? Number(value.expenses) : 0,
        savings: Number.isFinite(value.savings) ? Number(value.savings) : 0,
        savingsTarget: Number.isFinite(value.savingsTarget) ? Number(value.savingsTarget) : 0,
        goals: Array.isArray(value.goals) ? value.goals : [],
        transactions: Array.isArray(value.transactions) ? value.transactions : [],
    };
}

export function saveFinanceState(value: FinanceState): FinanceState {
    return writeStorageJson(STORAGE_KEY, value);
}

export function getMonthlyFinanceSummary(value = getFinanceState(), month = new Date().toISOString().slice(0, 7)): MonthlyFinanceSummary {
    const transactions = value.transactions.filter((transaction) => transaction.date?.slice(0, 7) === month);
    const income = transactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = transactions.filter((transaction) => transaction.type === "expense").reduce((total, transaction) => total + transaction.amount, 0);

    return {
        income,
        expenses,
        net: income - expenses,
        savings: value.savings,
        savingsTarget: value.savingsTarget,
        goals: value.goals,
        transactionCount: transactions.length,
    };
}