"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Brain, Settings, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", icon: Home, href: "/dashboard" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Mindset Coach", icon: Brain, href: "/mindset-coach" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/80 lg:flex">
      <div className="border-b border-slate-800 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-violet-300">Coach OS</p>
        <div className="mt-3 text-xl font-bold tracking-wide text-white">Future Mindset</div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 border-t border-slate-800 p-4 text-sm text-slate-400">
        <Quote size={16} className="text-violet-300" />
        <span>“Your mind shapes your reality.”</span>
      </div>
    </aside>
  );
}
