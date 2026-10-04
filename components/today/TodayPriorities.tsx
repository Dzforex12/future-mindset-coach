"use client";

import { useState } from "react";
import { Check, PencilLine, Plus, Trash2, X } from "lucide-react";
import {
    PRIORITY_SOURCE_TYPES,
    type DailyPriority,
    type PrioritySourceType,
} from "@/app/state/dailyCommandCenter";

export type PrioritySourceOption = { id: string; label: string };

export function TodayPriorities({
    priorities,
    sources,
    onAdd,
    onUpdate,
    onToggle,
    onDelete,
}: {
    priorities: DailyPriority[];
    sources: Partial<Record<PrioritySourceType, PrioritySourceOption[]>>;
    onAdd: (input: { title: string; note: string; sourceType: PrioritySourceType; sourceId?: string }) => boolean;
    onUpdate: (id: string, input: { title: string; note: string; sourceType: PrioritySourceType; sourceId?: string }) => boolean;
    onToggle: (priority: DailyPriority) => void;
    onDelete: (id: string) => void;
}) {
    const [title, setTitle] = useState("");
    const [note, setNote] = useState("");
    const [sourceType, setSourceType] = useState<PrioritySourceType>("Personal");
    const [sourceId, setSourceId] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const activeCount = priorities.filter((priority) => !priority.completed).length;
    const sourceOptions = sources[sourceType] ?? [];

    function resetForm() {
        setTitle("");
        setNote("");
        setSourceType("Personal");
        setSourceId("");
        setEditingId(null);
    }

    function beginEdit(priority: DailyPriority) {
        setTitle(priority.title);
        setNote(priority.note ?? "");
        setSourceType(priority.sourceType);
        setSourceId(priority.sourceId ?? "");
        setEditingId(priority.id);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const input = { title, note, sourceType, ...(sourceId ? { sourceId } : {}) };
        const saved = editingId ? onUpdate(editingId, input) : onAdd(input);
        if (saved) resetForm();
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h2 className="text-base font-semibold text-white">Today&apos;s Top 3 Priorities</h2>
                    <p className="mt-1 text-xs text-slate-400">{activeCount} / 3 active</p>
                </div>
                {activeCount < 3 && !editingId ? <Plus size={18} className="text-sky-300" aria-hidden="true" /> : null}
            </div>
            <ul className="mt-4 space-y-2">
                {priorities.map((priority) => (
                    <li key={priority.id} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-3">
                        <button type="button" aria-label={priority.completed ? `Reopen ${priority.title}` : `Complete ${priority.title}`} onClick={() => onToggle(priority)} className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${priority.completed ? "border-emerald-500 bg-emerald-500/20 text-emerald-300" : "border-slate-600 text-transparent hover:border-emerald-400"}`}>
                            <Check size={14} />
                        </button>
                        <div className="min-w-0 flex-1">
                            <p className={`break-words text-sm font-medium ${priority.completed ? "text-slate-500 line-through" : "text-slate-100"}`}>{priority.title}</p>
                            <p className="mt-1 text-[11px] text-slate-500">
                                {priority.sourceType}
                                {priority.sourceId ? ` · ${sources[priority.sourceType]?.find((source) => source.id === priority.sourceId)?.label ?? "linked item"}` : ""}
                                {priority.note ? ` · ${priority.note}` : ""}
                            </p>
                        </div>
                        <button type="button" aria-label={`Edit ${priority.title}`} onClick={() => beginEdit(priority)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"><PencilLine size={15} /></button>
                        <button type="button" aria-label={`Delete ${priority.title}`} onClick={() => onDelete(priority.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 size={15} /></button>
                    </li>
                ))}
            </ul>
            {priorities.length === 0 ? <p className="mt-3 text-sm text-slate-500">Choose three meaningful actions, not a longer task list.</p> : null}
            {activeCount < 3 || editingId ? (
                <form onSubmit={submit} className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
                    <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Priority title" maxLength={120} required className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500" />
                    <select value={sourceType} onChange={(event) => { setSourceType(event.target.value as PrioritySourceType); setSourceId(""); }} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white">
                        {PRIORITY_SOURCE_TYPES.map((source) => <option key={source}>{source}</option>)}
                    </select>
                    {sourceOptions.length ? (
                        <select value={sourceId} onChange={(event) => setSourceId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white sm:col-span-2">
                            <option value="">Link to a {sourceType.toLowerCase()} (optional)</option>
                            {sourceOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                    ) : null}
                    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" maxLength={240} className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-500 sm:col-span-2" />
                    <div className="flex gap-2 sm:col-span-2">
                        <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"><Check size={15} />{editingId ? "Save priority" : "Add priority"}</button>
                        {editingId ? <button type="button" onClick={resetForm} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"><X size={15} />Cancel</button> : null}
                    </div>
                </form>
            ) : <p className="mt-3 text-xs text-slate-500">Complete or remove an active priority to add another.</p>}
        </section>
    );
}
