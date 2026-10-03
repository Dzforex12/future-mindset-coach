"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  BrainCircuit,
  Compass,
  Crown,
  Gauge,
  Home,
  MoreHorizontal,
  PiggyBank,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const mainNavItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "AI Coach", icon: BrainCircuit, href: "/mindset" },
  { name: "Goals", icon: Target, href: "/goals" },
  { name: "Habits", icon: Activity, href: "/habits" },
  { name: "Business", icon: BriefcaseBusiness, href: "/business" },
  { name: "Trading", icon: TrendingUp, href: "/trading" },
  { name: "Finances", icon: PiggyBank, href: "/finances" },
  { name: "Projects", icon: Compass, href: "/projects" },
  { name: "Summary", icon: Gauge, href: "/summary" },
  { name: "More", icon: MoreHorizontal, href: "/more" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-slate-800/80 bg-[#06111c] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_32%)] lg:flex">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-[54px] w-[54px] items-center justify-center rounded-xl border border-sky-400/35 bg-gradient-to-br from-[#1d4ed8]/30 via-[#0f172a] to-[#0ea5e9]/15 text-sky-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_22px_rgba(59,130,246,0.26)]">
            <Crown size={30} strokeWidth={1.9} />
          </div>
          <div className="leading-none">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-100">FUTURE MINDSET</p>
            <div className="mt-1 text-[12px] font-medium uppercase tracking-[0.2em] text-sky-300">COACH</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-2.5 py-1">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-[#1d4ed8]/30 via-[#2563eb]/20 to-[#38bdf8]/10 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.22),0_0_18px_rgba(37,99,235,0.12)]"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-white",
              )}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-colors", isActive ? "border-blue-500/35 bg-blue-500/10 text-blue-200" : "border-slate-800 bg-slate-900/80 text-slate-400")}>
                <Icon size={19} strokeWidth={1.8} />
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 px-3.5 pb-4 pt-4">
        <div className="relative mb-4 h-[104px] overflow-hidden rounded-xl border border-slate-700/80 bg-gradient-to-b from-[#10223a] via-[#0b1b2e] to-[#07131e] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_8px_20px_rgba(1,8,19,0.2)]">
          <p className="relative z-10 text-[12px] font-medium leading-5 text-slate-200">
            Discipline today.
            <br />
            A better tomorrow.
          </p>
          <svg aria-hidden="true" viewBox="0 0 280 72" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[66px] w-full opacity-75">
            <path d="M0 57 34 36l24 15 41-36 32 31 23-16 37 29 25-19 31 16 33-26v42H0Z" fill="#0c2d53" fillOpacity=".55" />
            <path d="m30 72 54-39 34 27 24-18 46 30H30Z" fill="#0a3b60" fillOpacity=".48" />
            <path d="m122 72 47-32 32 21 24-15 55 30h-158Z" fill="#07506a" fillOpacity=".3" />
            <path d="M0 65c42-10 76 10 116 1s91-9 164 2v4H0Z" fill="#06111c" fillOpacity=".8" />
          </svg>
        </div>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[16px] font-medium transition-all",
            pathname === "/settings" ? "bg-slate-800/90 text-white ring-1 ring-slate-700" : "text-slate-300 hover:bg-slate-800/75 hover:text-white",
          )}
        >
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-colors", pathname === "/settings" ? "border-slate-600 bg-slate-800 text-slate-200" : "border-slate-700 bg-slate-900/80 text-slate-400")}>
            <Settings size={19} />
          </span>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Goals", icon: Target, href: "/goals" },
    { name: "Habits", icon: Activity, href: "/habits" },
    { name: "Trading", icon: TrendingUp, href: "/trading" },
    { name: "More", icon: MoreHorizontal, href: "/more" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-800/90 bg-[#07111d]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-12px_30px_rgba(2,6,23,0.35)] backdrop-blur-lg lg:hidden" aria-label="Primary navigation">
      {mobileItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
              isActive ? "bg-blue-500/15 text-blue-200" : "text-slate-400 hover:text-white",
            )}
          >
            <Icon size={16} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
