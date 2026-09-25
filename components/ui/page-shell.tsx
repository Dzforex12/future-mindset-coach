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
                "rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 shadow-[0_12px_32px_rgba(2,6,23,0.18)] sm:p-6",
                className,
            )}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-violet-300 sm:text-[11px]">
                        {eyebrow}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
                        {title}
                    </h1>
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            {description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
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
                "rounded-2xl border border-slate-800/90 bg-slate-900/65 p-4 shadow-[0_10px_28px_rgba(2,6,23,0.14)] sm:p-5",
                className,
            )}
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
                    {subtitle ? <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">{subtitle}</p> : null}
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            {children}
        </section>
    );
}
