import type { ReactNode } from "react";
import { cn } from "cn";

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
    className,
}: {
    eyebrow: string;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <header
            className={cn(
                "rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40 p-5 shadow-xl shadow-slate-950/20 transition duration-300 hover:border-violet-500/25 hover:shadow-violet-900/10 sm:p-6",
                className,
            )}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-violet-300 sm:text-[11px]">
                        {eyebrow}
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        {title}
                    </h1>
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            {description ? (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
                    {description}
                </p>
            ) : null}
        </header>
    );
}

export function SectionCard({
    title,
    subtitle,
    children,
    action,
    className,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={cn(
                "rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/25 hover:shadow-violet-900/10 sm:p-5",
                className,
            )}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-white sm:text-xl">{title}</h2>
                    {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            {children}
        </section>
    );
}
