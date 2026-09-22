import { cn } from "cn";
import type { ReactNode } from "react";

export type ChartSectionTone = "default" | "trend" | "breakdown";

type ChartShellProps = {
    title: string;
    description?: string;
    children: ReactNode;
    tone?: ChartSectionTone;
    className?: string;
    legend?: Array<{ label: string; color: string }>;
    loading?: boolean;
};

const toneStyles = {
    default: "border-slate-800 bg-slate-900/80",
    trend: "border-violet-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/30",
    breakdown: "border-emerald-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20",
};

export function ChartShell({
    title,
    description,
    children,
    tone = "default",
    className,
    legend,
    loading = false,
}: ChartShellProps) {
    return (
        <section
            className={cn(
                "rounded-3xl border p-5 shadow-xl shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/25 hover:shadow-violet-900/10 animate-[fadeIn_0.4s_ease-out]",
                toneStyles[tone],
                className,
            )}
        >
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-300">Analytics</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
                </div>

                {description ? <p className="max-w-xl text-sm text-slate-300">{description}</p> : null}
            </div>

            {legend && legend.length ? (
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    {legend.map((item) => (
                        <div key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.label}
                        </div>
                    ))}
                </div>
            ) : null}

            {loading ? (
                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-52 animate-pulse rounded-2xl bg-slate-800/80" />
                    ))}
                </div>
            ) : (
                children
            )}
        </section>
    );
}

export function ChartSection(props: ChartShellProps) {
    return <ChartShell {...props} tone="default" />;
}

export function TrendSection(props: ChartShellProps) {
    return <ChartShell {...props} tone="trend" />;
}

export function BreakdownSection(props: ChartShellProps) {
    return <ChartShell {...props} tone="breakdown" />;
}
