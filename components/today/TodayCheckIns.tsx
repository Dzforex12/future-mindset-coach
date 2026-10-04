"use client";

import { useState } from "react";
import { SectionCard } from "@/components/ui/page-shell";

const emotions = ["Focused", "Calm", "Motivated", "Tired", "Stressed", "Uncertain"] as const;

export function MorningCheckIn({
    currentMood,
    mainPriority,
    onSave,
}: {
    currentMood: string;
    mainPriority: string;
    onSave: (mood: string, successCondition: string) => void;
}) {
    const [mood, setMood] = useState(currentMood);
    const [successCondition, setSuccessCondition] = useState(mainPriority);

    return <SectionCard title="Morning Check-In" subtitle="Set your emotional starting point and define a successful day.">
        <p className="text-sm text-slate-300">How are you feeling?</p>
        <div className="mt-2 flex flex-wrap gap-2">
            {emotions.map((emotion) => <button key={emotion} type="button" aria-pressed={mood === emotion} onClick={() => setMood(emotion)} className={`min-h-10 rounded-full border px-3 text-xs transition ${mood === emotion ? "border-sky-400/50 bg-sky-500/15 text-sky-100" : "border-slate-700 text-slate-400 hover:text-white"}`}>{emotion}</button>)}
        </div>
        <label className="mt-4 block text-sm text-slate-300" htmlFor="morning-success">What must happen today for today to feel successful?</label>
        <textarea id="morning-success" value={successCondition} onChange={(event) => setSuccessCondition(event.target.value)} rows={2} maxLength={300} className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
        <button type="button" disabled={!mood} onClick={() => onSave(mood, successCondition)} className="mt-3 min-h-10 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50">Save check-in</button>
    </SectionCard>;
}

export function EveningReview({
    review,
    onSave,
}: {
    review: { completed: string; avoided: string; wentWell: string; improveTomorrow: string; score?: number } | null;
    onSave: (review: { completed: string; avoided: string; wentWell: string; improveTomorrow: string; score?: number }) => void;
}) {
    const [draft, setDraft] = useState({
        completed: review?.completed ?? "",
        avoided: review?.avoided ?? "",
        wentWell: review?.wentWell ?? "",
        improveTomorrow: review?.improveTomorrow ?? "",
        score: review?.score ? String(review.score) : "",
    });
    const fields = [
        ["completed", "What did you complete today?"],
        ["avoided", "What did you avoid?"],
        ["wentWell", "What went well?"],
        ["improveTomorrow", "What needs to improve tomorrow?"],
    ] as const;

    return <SectionCard title="End of Day Review" subtitle="Capture today without overwriting earlier reviews.">
        <div className="grid gap-3 sm:grid-cols-2">
            {fields.map(([key, label]) => <label key={key} className="text-xs text-slate-400">{label}<textarea value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} rows={2} maxLength={500} className="mt-1.5 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500" /></label>)}
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs text-slate-400">Optional score (1–10)
                <select value={draft.score} onChange={(event) => setDraft({ ...draft, score: event.target.value })} className="mt-1.5 block min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                    <option value="">Not scored</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => <option key={score} value={score}>{score}</option>)}
                </select>
            </label>
            <button type="button" onClick={() => onSave({
                completed: draft.completed,
                avoided: draft.avoided,
                wentWell: draft.wentWell,
                improveTomorrow: draft.improveTomorrow,
                ...(draft.score ? { score: Number(draft.score) } : {}),
            })} disabled={fields.some(([key]) => !draft[key].trim())} className="min-h-10 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">Save review</button>
            {review ? <span className="text-xs text-emerald-300">Today&apos;s review saved</span> : null}
        </div>
    </SectionCard>;
}
