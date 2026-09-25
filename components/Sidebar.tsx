"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BrainCircuit,
  Compass,
  Gauge,
  Home,
  Settings,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const mainNavItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Mindset Coach", mobileName: "Coach", icon: BrainCircuit, href: "/mindset" },
  { name: "Trading", icon: TrendingUp, href: "/trading" },
  { name: "Goals", icon: Target, href: "/goals" },
  { name: "Habits", icon: Activity, href: "/habits" },
  { name: "Summary", icon: Gauge, href: "/summary" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-slate-800/80 bg-[#07111d]/95 lg:flex">
      <div className="border-b border-slate-800/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.22)]">
            <Compass size={18} />
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-blue-300/80">Coach OS</p>
            <div className="mt-1 text-lg font-semibold tracking-tight text-white">Future Mindset</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 px-4 py-5">
        <div className="space-y-1.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-600/15 text-white shadow-[inset_0_0_0_1px_rgba(96,165,250,0.2),0_0_18px_rgba(59,130,246,0.12)]"
                    : "text-slate-300 hover:bg-slate-800/75 hover:text-white",
                )}
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-colors", isActive ? "border-blue-500/40 bg-blue-500/10 text-blue-200" : "border-slate-700 bg-slate-900/80 text-slate-400")}>
                  <Icon size={16} />
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

      </nav>

      <div className="mt-auto border-t border-slate-800/80 p-4">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            pathname === "/settings" ? "bg-slate-800/90 text-white ring-1 ring-slate-700" : "text-slate-300 hover:bg-slate-800/75 hover:text-white",
          )}
        >
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-colors", pathname === "/settings" ? "border-slate-600 bg-slate-800 text-slate-200" : "border-slate-700 bg-slate-900/80 text-slate-400")}>
            <Settings size={16} />
          </span>
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-slate-800/90 bg-[#07111d]/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-12px_30px_rgba(2,6,23,0.35)] backdrop-blur-lg lg:hidden" aria-label="Primary navigation">
      {mainNavItems.map((item) => {
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
            <span className="truncate">{item.mobileName ?? item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
