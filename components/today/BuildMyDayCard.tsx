"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { buildCoachContext, buildDailyPlanMessage } from "@/app/state/coachContext";

export function BuildMyDayCard() {
    const [plan, setPlan] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function buildPlan() {
        setError(null);
        setLoading(true);
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: buildDailyPlanMessage(), coachContext: buildCoachContext(), coachMode: "daily-plan" }),
            });
            const payload: unknown = await response.json();
            if (!response.ok || !payload || typeof payload !== "object" || !("reply" in payload) || typeof payload.reply !== "string") {
                const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
                    ? payload.error
                    : "The Coach could not build your day. Please try again.";
                throw new Error(message);
            }
            setPlan(payload.reply);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The Coach could not build your day. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.08] to-slate-900/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-base font-semibold text-white">Build My Day</h2><p className="mt-1 text-xs text-slate-400">A concise plan grounded in your saved priorities and current state.</p></div>
            <button type="button" disabled={loading} onClick={() => void buildPlan()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"><Sparkles size={16} />{loading ? "Building..." : "Build My Day"}</button>
        </div>
        {error ? <p role="alert" className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
        {plan ? <div className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-950/65 p-4 text-sm leading-6 text-slate-200">{plan}</div> : null}
    </section>;
}
