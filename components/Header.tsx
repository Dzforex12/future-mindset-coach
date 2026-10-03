"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown, ClipboardCheck, Crown, FolderKanban, ListChecks, Search, ShieldAlert, Target } from "lucide-react";
import { getHabitRecords, getDateKey } from "@/app/state/habitEngine";
import { getGoals } from "@/app/state/goalEngine";
import { getDailyCheckIn, getTradingJournalEntries, parseNumber } from "@/app/state/tradingEngine";
import { getBusinessData } from "@/app/state/businessEngine";
import { getProjects } from "@/app/state/projectsEngine";
import { useMemoryStore } from "@/app/state/memoryStore";
import { SERVER_STORAGE_SNAPSHOT, useBrowserDateKey, useStorageSnapshot } from "@/app/state/storageSubscription";

type NotificationIcon = "habits" | "check-in" | "goal" | "trading" | "business" | "project";

type AppNotification = {
  id: string;
  title: string;
  description?: string;
  href: string;
  icon: NotificationIcon;
};

const NOTIFICATION_READ_KEY = "future-mindset-notification-read";
const NOTIFICATION_STORAGE_KEYS = [
  "future-mindset-habits",
  "future-mindset-goals",
  "future-mindset-daily-checkin",
  "future-mindset-trading-journal",
  "future-mindset-trading-rules",
  "future-mindset-business",
  "future-mindset-projects",
  NOTIFICATION_READ_KEY,
];

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

function getNotifications(preferredTradingRiskLimit: string): AppNotification[] {
  const today = getDateKey();
  const notifications: AppNotification[] = [];
  const habits = getHabitRecords().filter((habit) => !habit.paused && !habit.archived);
  const incompleteHabitIds = habits.filter((habit) => !habit.completedDates.includes(today)).map((habit) => habit.id).sort();

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

  getBusinessData().tasks
    .filter((task) => !task.complete && task.deadline)
    .forEach((task) => {
      const daysUntil = getDaysUntil(task.deadline, today);
      if (daysUntil === null || daysUntil > 7) return;
      const overdue = daysUntil < 0;
      notifications.push({
        id: `business-task-${task.id}-${task.deadline}`,
        title: overdue ? `Overdue business task: ${task.title}` : `Business task due ${daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}: ${task.title}`,
        href: "/business",
        icon: "business",
      });
    });

  getProjects().forEach((project) => {
    if (project.status !== "Completed" && project.deadline) {
      const daysUntil = getDaysUntil(project.deadline, today);
      if (daysUntil !== null && daysUntil <= 7) {
        const overdue = daysUntil < 0;
        notifications.push({
          id: `project-deadline-${project.id}-${project.deadline}`,
          title: overdue ? `Overdue project: ${project.title}` : `Project deadline ${daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}: ${project.title}`,
          href: "/projects",
          icon: "project",
        });
      }
    }

    project.tasks.filter((task) => !task.complete && task.dueDate).forEach((task) => {
      const daysUntil = getDaysUntil(task.dueDate!, today);
      if (daysUntil === null || daysUntil > 7) return;
      const overdue = daysUntil < 0;
      notifications.push({
        id: `project-task-${project.id}-${task.id}-${task.dueDate}`,
        title: overdue ? `Overdue project task: ${task.title}` : `Project task due ${daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}: ${task.title}`,
        href: "/projects",
        icon: "project",
      });
    });
  });

  const latestTrade = getTradingJournalEntries()[0];
  if (latestTrade?.planFollowed === false) {
    notifications.push({
      id: `trade-plan-${latestTrade.id}`,
      title: "Your latest trade broke your plan. Review it.",
      href: "/trading",
      icon: "trading",
    });
  }

  const preferredRiskLimit = parseRiskLimit(preferredTradingRiskLimit);
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

function getReadNotificationIds(): string[] {
  try {
    const stored = window.localStorage.getItem(NOTIFICATION_READ_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function getNotificationIcon(icon: NotificationIcon) {
  const props = { size: 16, strokeWidth: 1.8 };
  if (icon === "habits") return <ListChecks {...props} />;
  if (icon === "check-in") return <ClipboardCheck {...props} />;
  if (icon === "goal") return <Target {...props} />;
  if (icon === "business") return <BriefcaseBusiness {...props} />;
  if (icon === "project") return <FolderKanban {...props} />;
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
  "/business": "Business",
  "/projects": "Projects",
  "/finances": "Finances",
  "/more": "More",
};

export function Header() {
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";
  const displayName = useMemoryStore((state) => state.displayName);
  const preferredTradingRiskLimit = useMemoryStore((state) => state.preferredTradingRiskLimit);
  const storageSnapshot = useStorageSnapshot(NOTIFICATION_STORAGE_KEYS);
  const snapshotReady = storageSnapshot !== SERVER_STORAGE_SNAPSHOT;
  const browserDate = useBrowserDateKey();
  const todayLabel = browserDate
    ? new Date(`${browserDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Today";
  const notifications = snapshotReady ? getNotifications(preferredTradingRiskLimit) : [];
  const [readIdsFallback, setReadIdsFallback] = useState<string[] | null>(null);
  const readNotificationIds = readIdsFallback ?? (snapshotReady ? getReadNotificationIds() : []);
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const title = pageTitles[pathname] ?? "Dashboard";

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !readNotificationIds.includes(notification.id)).length;

  const markAllAsRead = () => {
    const nextReadIds = Array.from(new Set([...readNotificationIds, ...notifications.map((notification) => notification.id)]));
    try {
      window.localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(nextReadIds));
      setReadIdsFallback(null);
      window.dispatchEvent(new Event("mindset-store-update"));
    } catch {
      setReadIdsFallback(nextReadIds);
    }
  };

  return (
    <header className="app-header sticky top-0 z-20 flex h-[54px] items-center border-b border-slate-800/75 bg-[#07111d]/95 px-3 backdrop-blur-md sm:px-5">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Crown size={20} strokeWidth={1.9} className="mobile-brand-mark text-sky-300" />
          <div className="leading-tight">
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-200">Future Mindset</p>
            <p className="text-[8px] font-medium uppercase tracking-[0.16em] text-sky-300">Coach</p>
          </div>
        </div>

        <div className={`hidden min-w-0 flex-1 ${isDashboard ? "lg:hidden" : "lg:block"}`}>
          <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">Overview</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h1>
        </div>

        <div className="ml-auto hidden flex-1 items-center justify-center lg:flex">
          <div className="flex w-full max-w-[420px] items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-slate-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Search size={15} className="text-slate-400" />
            <input
              aria-label="Search"
              placeholder="Search anything..."
              className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-300 sm:flex ${isDashboard ? "lg:hidden" : ""}`}>
            <CalendarDays size={14} className="text-blue-300" />
            <span>{todayLabel || "Today"}</span>
          </div>

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((open) => !open)}
              className="mobile-notification-button relative rounded-full border border-slate-700/80 bg-slate-900/80 p-2 text-slate-300 transition hover:border-blue-500/50 hover:text-white sm:p-2.5"
            >
              <Bell size={17} />
              {unreadCount > 0 ? <span aria-label={`${unreadCount} unread notifications`} className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-[#07111d] bg-violet-500 px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
            </button>

            {isOpen ? (
              <div role="dialog" aria-label="Notifications" className="mobile-notification-dialog fixed left-2 right-2 top-20 z-50 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-slate-950/50 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[min(22rem,calc(100vw-2rem))]">
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

          <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/60 px-2 py-1.5 pr-3 shadow-[0_0_18px_rgba(59,130,246,0.08)]">
            <div className="mobile-avatar flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-[13px] font-semibold text-white shadow-[0_0_18px_rgba(59,130,246,0.4)] sm:h-8 sm:w-8 sm:text-sm">
              {displayName?.charAt(0)?.toUpperCase() || "E"}
            </div>
            <span className="hidden text-sm font-medium text-slate-100 sm:inline">{displayName || "Edonis"}</span>
            <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
          </div>
        </div>
      </div>
    </header>
  );
}
