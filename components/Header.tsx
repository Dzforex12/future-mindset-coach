"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, CalendarClock, CalendarDays, CheckCircle2, ClipboardCheck, ListChecks, Settings, ShieldAlert, Target } from "lucide-react";
import { getHabitRecords, getDateKey } from "@/app/state/habitEngine";
import { getGoals } from "@/app/state/goalEngine";
import { getDailyCheckIn, getTradingJournalEntries, parseNumber } from "@/app/state/tradingEngine";
import { useMemoryStore } from "@/app/state/memoryStore";

type NotificationIcon = "habits" | "check-in" | "goal" | "trading";

type AppNotification = {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: NotificationIcon;
};

const NOTIFICATION_READ_KEY = "future-mindset-notification-read";

function parseRiskLimit(value: string): number | null {
  if (!/^\s*\d+(?:\.\d+)?\s*%?\s*$/.test(value)) {
    return null;
  }

  return parseNumber(value.replace("%", "").trim());
}

function getDaysUntil(date: string, today: string): number | null {
  const target = new Date(`${date}T00:00:00`);
  const current = new Date(`${today}T00:00:00`);
  if (!Number.isFinite(target.getTime()) || !Number.isFinite(current.getTime())) {
    return null;
  }

  return Math.ceil((target.getTime() - current.getTime()) / 86400000);
}

function getNotifications(): AppNotification[] {
  const today = getDateKey();
  const notifications: AppNotification[] = [];
  const habits = getHabitRecords().filter((habit) => !habit.paused && !habit.archived);
  const incompleteHabitIds = habits
    .filter((habit) => !habit.completedDates.includes(today))
    .map((habit) => habit.id)
    .sort();

  if (incompleteHabitIds.length > 0) {
    notifications.push({
      id: `habits-${today}-${incompleteHabitIds.join("-")}`,
      title: `${incompleteHabitIds.length} habit${incompleteHabitIds.length === 1 ? "" : "s"} still need${incompleteHabitIds.length === 1 ? "s" : ""} your attention today.`,
      href: "/habits",
      icon: "habits",
    });
  }

  if (!getDailyCheckIn(today)) {
    notifications.push({
      id: `check-in-${today}`,
      title: "Daily check-in is still waiting for you.",
      href: "/trading#daily-check-in",
      icon: "check-in",
    });
  }

  getGoals()
    .filter((goal) => !goal.completed && !goal.archived && typeof goal.targetDate === "string" && goal.targetDate.trim())
    .forEach((goal) => {
      const daysUntil = getDaysUntil(goal.targetDate!.trim(), today);
      if (daysUntil === null || daysUntil < 0 || daysUntil > 7) {
        return;
      }

      const remaining = daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
      notifications.push({
        id: `goal-${goal.id}-${goal.targetDate}`,
        title: `Goal deadline ${remaining}: ${goal.title}`,
        href: "/goals",
        icon: "goal",
      });
    });

  const latestTrade = getTradingJournalEntries()[0];
  if (latestTrade?.planFollowed === false) {
    notifications.push({
      id: `trade-plan-${latestTrade.id}`,
      title: "Your latest trade broke your trading plan. Review it.",
      href: "/trading",
      icon: "trading",
    });
  }

  const preferredRiskLimit = parseRiskLimit(useMemoryStore.getState().preferredTradingRiskLimit);
  const latestRisk = latestTrade ? parseNumber(latestTrade.riskPercent) : null;
  if (latestTrade && preferredRiskLimit !== null && latestRisk !== null && latestRisk > preferredRiskLimit) {
    notifications.push({
      id: `trade-risk-${latestTrade.id}-${latestRisk}-${preferredRiskLimit}`,
      title: "Your latest recorded risk was above your preferred risk limit.",
      href: "/trading",
      icon: "trading",
    });
  }

  return notifications;
}

function getNotificationIcon(icon: NotificationIcon) {
  const props = { size: 16, strokeWidth: 1.8 };
  if (icon === "habits") return <ListChecks {...props} />;
  if (icon === "check-in") return <ClipboardCheck {...props} />;
  if (icon === "goal") return <Target {...props} />;
  return <ShieldAlert {...props} />;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/mindset": "Mindset Coach",
  "/goals": "Goals",
  "/habits": "Habits",
  "/summary": "Summary",
  "/analytics": "Analytics",
  "/mindset-coach": "Mindset Coach",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const [todayLabel, setTodayLabel] = useState("");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const title = pageTitles[pathname] ?? "Dashboard";

  const syncNotifications = () => {
    setNotifications(getNotifications());
    try {
      const stored = window.localStorage.getItem(NOTIFICATION_READ_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setReadNotificationIds(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
    } catch {
      setReadNotificationIds([]);
    }
  };

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    );
  }, []);

  useEffect(() => {
    syncNotifications();
    const handleStorageUpdate = () => syncNotifications();
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mindset-store-update", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("mindset-store-update", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length;

  const markAllAsRead = () => {
    const nextReadIds = Array.from(new Set([...readNotificationIds, ...notifications.map((notification) => notification.id)]));
    setReadNotificationIds(nextReadIds);
    try {
      window.localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(nextReadIds));
    } catch {
      // Keep the in-memory read state if storage is unavailable.
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#07111d]/80 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">Overview</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-300 shadow-[0_0_0_1px_rgba(59,130,246,0.06)] sm:flex">
            <CalendarDays size={14} className="text-blue-300" />
            <span>{todayLabel || "Today"}</span>
          </div>
          <div ref={notificationRef} className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
              className="relative rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-blue-500/50 hover:text-white"
            >
              <Bell size={17} />
              {unreadCount > 0 ? <span aria-label={`${unreadCount} unread notifications`} className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#07111d] bg-violet-500 px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
            </button>

            {isOpen ? (
              <div role="dialog" aria-label="Notifications" className="fixed left-2 right-2 top-20 z-50 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/50 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[min(22rem,calc(100vw-2rem))]">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Signals from your saved progress</p>
                  </div>
                  <button type="button" onClick={markAllAsRead} disabled={unreadCount === 0} className="text-[11px] font-medium text-blue-300 transition hover:text-blue-200 disabled:cursor-not-allowed disabled:text-slate-600">Mark all as read</button>
                </div>

                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
                    <CheckCircle2 size={22} className="text-emerald-300" />
                    <p className="text-sm font-medium text-slate-200">You&apos;re all caught up.</p>
                  </div>
                ) : (
                  <div className="max-h-[min(60vh,24rem)] overflow-y-auto p-2">
                    {notifications.map((notification) => {
                      const isRead = readNotificationIds.includes(notification.id);
                      return (
                        <Link key={notification.id} href={notification.href} onClick={() => setIsOpen(false)} className={`flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-900 ${isRead ? "opacity-55" : "bg-slate-900/60"}`}>
                          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isRead ? "bg-slate-800 text-slate-500" : "bg-violet-500/10 text-violet-300"}`}>{getNotificationIcon(notification.icon)}</span>
                          <span className="min-w-0">
                            <span className="block text-xs font-medium leading-5 text-slate-100">{notification.title}</span>
                            {notification.description ? <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">{notification.description}</span> : null}
                            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Open</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-full border border-slate-700 bg-slate-900/80 p-2 text-slate-300 transition hover:border-blue-500/50 hover:text-white"
          >
            <Settings size={17} />
          </Link>
        </div>
      </div>
    </header>
  );
}
