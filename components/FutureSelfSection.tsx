type FutureSelfItem = {
    title: string;
    items: string[];
};

type FutureSelfSectionProps = {
    title: string;
    section: FutureSelfItem;
    isNew?: boolean;
    onOpen?: () => void;
};

export default function FutureSelfSection({ title, section, isNew, onOpen }: FutureSelfSectionProps) {
    return (
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{title}</h2>
                {isNew ? (
                    <button type="button" onClick={onOpen} className="rounded-full border border-fuchsia-500 px-2 py-1 text-xs text-fuchsia-300">
                        New
                    </button>
                ) : null}
            </div>

            <h3 className="mb-3 font-medium text-fuchsia-300">{section.title}</h3>

            <ul className="space-y-2 pl-5 text-sm text-slate-300">
                {section.items.map((item, index) => (
                    <li key={`${item}-${index}`} className="list-disc">
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    );
}
