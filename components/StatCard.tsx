import { cn } from "cn";

export type TrendIndicator = {
    value: string;
    label: string;
    positive?: boolean;
};

export type StatCardProps = {
    label: string;
    value: string | number;
    tone?: "primary" | "success" | "warning" | "neutral";
    helper?: string;
    className?: string;
    icon?: React.ReactNode;
    trend?: TrendIndicator;
    progress?: number;
};

const toneStyles = {
    primary: "border-blue-500/20 bg-blue-500/5 text-blue-100",
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-100",
    warning: "border-violet-500/20 bg-violet-500/5 text-violet-100",
    neutral: "border-slate-800 bg-slate-900/75 text-slate-100",
};

export function StatCard({
    label,
    value,
    tone = "neutral",
    helper,
    className,
    icon,
    trend,
    progress,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "group rounded-2xl border p-4 shadow-[0_10px_30px_rgba(2,6,23,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-[0_14px_28px_rgba(59,130,246,0.12)]",
                toneStyles[tone],
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
                </div>
                {icon ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/50 text-sm font-semibold text-blue-200">
                        {icon}
                    </div>
                ) : null}
            </div>

            {helper ? <p className="mt-2 text-sm text-slate-300">{helper}</p> : null}

            {typeof progress === "number" ? (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800/80">
                    <div
                        className={cn(
                            "h-full rounded-full",
                            tone === "success" ? "bg-emerald-500" : tone === "warning" ? "bg-violet-500" : "bg-blue-500",
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            ) : null}

            {trend ? (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <span
                        className={cn(
                            "rounded-full px-2 py-1 font-medium",
                            trend.positive
                                ? "bg-emerald-500/10 text-emerald-300"
                                : "bg-amber-500/10 text-amber-300",
                        )}
                    >
                        {trend.value}
                    </span>
                    <span className="text-slate-400">{trend.label}</span>
                </div>
            ) : null}
        </div>
    );
}
