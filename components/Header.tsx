"use client";

import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/mindset-coach": "Mindset Coach",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="flex h-20 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Overview</p>
        <h1 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:border-violet-500 hover:text-white"
        >
          <Bell size={18} />
        </button>
        <button
          type="button"
          aria-label="Profile"
          className="rounded-full border border-slate-700 bg-slate-900 p-2 text-slate-300 transition hover:border-violet-500 hover:text-white"
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
