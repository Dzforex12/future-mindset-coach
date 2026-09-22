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
};

const toneStyles = {
    primary: "border-violet-500/30 bg-violet-500/10 text-violet-100",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    neutral: "border-slate-700 bg-slate-900/80 text-slate-100",
};

export function StatCard({
    label,
    value,
    tone = "neutral",
    helper,
    className,
    icon,
    trend,
}: StatCardProps) {
    return (
        <div
            className={cn(
                "group rounded-2xl border p-4 shadow-lg shadow-slate-950/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-violet-900/10",
                toneStyles[tone],
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">{label}</p>
                    <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
                </div>
                {icon ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/40 text-sm font-semibold text-violet-200">
                        {icon}
                    </div>
                ) : null}
            </div>

            {helper ? <p className="mt-2 text-sm text-slate-300">{helper}</p> : null}

            {trend ? (
                <div className="mt-4 flex items-center gap-2 text-xs">
                    <span
                        className={cn(
                            "rounded-full px-2 py-1 font-medium",
                            trend.positive
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-amber-500/15 text-amber-300",
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
