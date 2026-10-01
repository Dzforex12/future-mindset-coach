import Link from "next/link";

const links = [
    { href: "/business", label: "Business" },
    { href: "/projects", label: "Projects" },
    { href: "/finances", label: "Finances" },
    { href: "/summary", label: "Summary" },
    { href: "/settings", label: "Settings" },
];

export default function MorePage() {
    return (
        <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-[#0a1524]/80 p-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">More</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">Quick access</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {links.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-[24px] border border-slate-800 bg-[#0b1626]/80 p-5 text-lg font-medium text-white transition hover:border-blue-500/50 hover:bg-slate-900/80">
                        {item.label}
                    </Link>
                ))}
            </div>
        </div>
    );
}
