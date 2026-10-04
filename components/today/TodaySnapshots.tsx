import { ShieldCheck } from "lucide-react";
import type { FinanceState, MonthlyFinanceSummary } from "@/app/state/financeEngine";
import type { ChecklistItem, TradingJournalEntry } from "@/app/state/tradingEngine";

function euros(value: number): string {
    return `€${value.toLocaleString("en-IE")}`;
}

export function TradingDisciplineCard({
    riskProfile,
    preferredRiskLimit,
    dailyTradingLimit,
    checklist,
    trades,
    date,
}: {
    riskProfile: string;
    preferredRiskLimit: string;
    dailyTradingLimit: string;
    checklist: ChecklistItem[];
    trades: TradingJournalEntry[];
    date: string;
}) {
    const checked = checklist.filter((item) => item.checked).length;
    const criticalChecksComplete = checklist.filter((item) => item.critical).every((item) => item.checked);
    const allChecksComplete = checklist.every((item) => item.checked);
    const todayTrades = trades.filter((trade) => trade.date === date).length;
    return <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 sm:p-5">
        <div className="flex items-center gap-2"><ShieldCheck size={17} className="text-amber-300" /><h2 className="text-base font-semibold text-white">Trading Discipline</h2></div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-300">Risk profile<br /><strong className="mt-1 inline-block text-slate-100">{riskProfile}</strong></p>
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-300">Preferred risk<br /><strong className="mt-1 inline-block text-slate-100">{preferredRiskLimit || "Not set"}</strong></p>
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-300">Daily limit<br /><strong className="mt-1 inline-block text-slate-100">{dailyTradingLimit || "Not set"}</strong></p>
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-300">Checklist<br /><strong className="mt-1 inline-block text-slate-100">{checked} / {checklist.length} · {allChecksComplete ? "Complete" : criticalChecksComplete ? "In progress" : "Review critical checks"}</strong></p>
        </div>
        <p className="mt-3 text-xs text-slate-400">Today&apos;s journal activity: {todayTrades} {todayTrades === 1 ? "entry" : "entries"}</p>
        <p className="mt-3 text-sm font-medium text-amber-100">Follow the plan. Protect capital.</p>
    </section>;
}

export function FinanceSnapshot({ finance, monthly }: { finance: FinanceState; monthly: MonthlyFinanceSummary }) {
    const hasData = Boolean(finance.transactions.length || finance.savings || finance.savingsTarget || finance.goals.length);
    return <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4">
        <h2 className="text-sm font-semibold text-white">Money snapshot</h2>
        {hasData ? <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-400">Income this month<strong className="mt-1 block text-slate-100">{monthly.transactionCount ? euros(monthly.income) : "No transactions"}</strong></p>
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-400">Expenses this month<strong className="mt-1 block text-slate-100">{monthly.transactionCount ? euros(monthly.expenses) : "No transactions"}</strong></p>
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-400">Savings<strong className="mt-1 block text-slate-100">{euros(finance.savings)}</strong></p>
            <p className="rounded-lg bg-slate-950/60 p-2.5 text-slate-400">Savings target<strong className="mt-1 block text-slate-100">{finance.savingsTarget ? euros(finance.savingsTarget) : "Not set"}</strong></p>
        </div> : <p className="mt-3 text-sm text-slate-500">No financial data saved yet.</p>}
    </section>;
}
