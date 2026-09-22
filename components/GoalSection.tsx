type GoalItem = {
    id: string | number;
    title: string;
    progress?: number;
    completed?: boolean;
};

type GoalSectionProps = {
    title: string;
    goals: GoalItem[];
    isNew?: boolean;
    collapsible?: boolean;
    onClearNew?: () => void;
    onProgress?: (id: string | number, progress: number) => void;
    onComplete?: (id: string | number) => void;
};

export default function GoalSection({
    title,
    goals,
    isNew,
    collapsible = false,
    onClearNew,
    onProgress,
    onComplete,
}: GoalSectionProps) {
    return (
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{title}</h2>
                {isNew ? (
                    <button
                        type="button"
                        onClick={onClearNew}
                        className="rounded-full border border-emerald-500 px-2 py-1 text-xs text-emerald-300"
                    >
                        New
                    </button>
                ) : null}
            </div>

            <div className="space-y-4">
                {goals.map((goal) => {
                    const progress = Math.max(0, Math.min(100, goal.progress ?? 0));
                    const done = goal.completed || progress >= 100;

                    return (
                        <div key={goal.id} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="font-medium">{goal.title}</span>
                                <span className="text-sm text-slate-300">{progress}%</span>
                            </div>

                            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-700">
                                <div
                                    className={`h-full rounded-full ${done ? "bg-emerald-500" : "bg-violet-500"}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onProgress?.(goal.id, Math.min(100, progress + 10))}
                                    className="rounded-lg border border-violet-500 px-3 py-1 text-sm text-violet-200"
                                >
                                    +10%
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onComplete?.(goal.id)}
                                    className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white"
                                >
                                    {done ? "Complete" : "Mark done"}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {collapsible ? <div className="mt-3 text-xs text-slate-400">Expandable view</div> : null}
        </section>
    );
}
