export function TodayHeader({ greeting, displayName, dateLabel }: { greeting: string; displayName: string; dateLabel: string }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-[#10243b]/95 via-slate-900/90 to-[#10152a]/90 p-4 shadow-[0_10px_28px_rgba(2,6,23,0.14)] sm:p-5">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-300">Discipline • Focus • Progress</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{greeting}, {displayName}</h1>
            <p className="mt-1 text-sm text-slate-300">{dateLabel}</p>
            <p className="mt-3 text-sm text-slate-400">Win today. Build your future.</p>
        </section>
    );
}
