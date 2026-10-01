"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  createChatMessage,
  formatChatTimestamp,
  groupMessagesBySender,
  loadChatMessages,
  saveChatMessages,
  CHAT_STORAGE_KEY,
} from "@/app/state/chatDomain";
import { getGoals } from "@/app/state/goalEngine";
import { getCurrentStreak, getHabitRecords } from "@/app/state/habitEngine";
import { getBusinessData } from "@/app/state/businessEngine";
import { getProjects } from "@/app/state/projectsEngine";
import { getFinanceState, getMonthlyFinanceSummary } from "@/app/state/financeEngine";
import { useMemoryStore } from "@/app/state/memoryStore";
import { getStorageValueFromSnapshot, SERVER_STORAGE_SNAPSHOT, useLocationSearchSnapshot, useStorageSnapshot } from "@/app/state/storageSubscription";
import { detectEmotionFromMessage } from "@/app/state/emotionEngine";
import { getDailyCheckIns, getTodayKey, getTradingJournalEntries, getTradingPatternInsights } from "@/app/state/tradingEngine";

type MindsetChatProps = {
  onHabitComplete?: (habitId: number) => void;
};

type ChatRecord = {
  id: string;
  sender: "coach" | "user";
  text: string;
  createdAt: string;
};

const WELCOME_MESSAGE: ChatRecord = {
  id: "coach-welcome",
  sender: "coach",
  text: "DZ, I’m here. What’s on your mind tonight?",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function isValidChatRecord(value: unknown): value is ChatRecord {
  if (!value || typeof value !== "object") return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    (record.sender === "coach" || record.sender === "user") &&
    typeof record.text === "string" &&
    typeof record.createdAt === "string"
  );
}

function normalizeMessages(value: unknown): ChatRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isValidChatRecord);
}

type MarkdownBlock =
  | { type: "heading"; content: string; level: number }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[][] };

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g).map((part, index) => {
    const boldMatch = part.match(/^(?:\*\*|__)(.+)(?:\*\*|__)$/);
    const italicMatch = part.match(/^(?:\*|_)(.+)(?:\*|_)$/);
    if (boldMatch) return <strong key={`${part}-${index}`}>{boldMatch[1]}</strong>;
    if (italicMatch) return <em key={`${part}-${index}`}>{italicMatch[1]}</em>;
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({ type: "heading", content: headingMatch[2], level: headingMatch[1].length });
      index += 1;
      continue;
    }

    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      index += 1;
      continue;
    }

    const listMatch = line.match(/^(\d+\.|[-*+•])\s+(.+)$/);
    if (listMatch) {
      const ordered = listMatch[1].endsWith(".");
      const items: string[][] = [];

      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const itemMatch = itemLine.match(/^(\d+\.|[-*+•])\s+(.+)$/);
        if (!itemMatch || itemMatch[1].endsWith(".") !== ordered) break;

        const itemLines = [itemMatch[2]];
        index += 1;
        while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^(\d+\.|[-*+•])\s+/.test(lines[index].trim())) {
          itemLines.push(lines[index].trim());
          index += 1;
        }
        items.push(itemLines);

        while (index < lines.length && !lines[index].trim()) index += 1;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^(\d+\.|[-*+•])\s+/.test(lines[index].trim())) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraphLines });
  }

  return blocks;
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-[13px] leading-6 text-slate-200">
      {parseMarkdownBlocks(text).map((block, blockIndex) => {
        if (block.type === "heading") {
          const headingClass = block.level === 1 ? "text-lg" : "text-[15px]";
          return <h3 key={`heading-${blockIndex}`} className={`${headingClass} font-semibold leading-6 text-white`}>{renderInlineMarkdown(block.content)}</h3>;
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag key={`list-${blockIndex}`} className={`space-y-2 ${block.ordered ? "list-decimal" : "list-disc"} pl-5 marker:text-violet-300`}>
              {block.items.map((item, itemIndex) => (
                <li key={`item-${itemIndex}`} className="pl-1">
                  {item.map((line, lineIndex) => (
                    <span key={`line-${lineIndex}`}>
                      {lineIndex > 0 ? <br /> : null}
                      {renderInlineMarkdown(line)}
                    </span>
                  ))}
                </li>
              ))}
            </ListTag>
          );
        }

        return (
          <p key={`paragraph-${blockIndex}`}>
            {block.lines.map((line, lineIndex) => (
              <span key={`line-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {renderInlineMarkdown(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default function MindsetChat({ onHabitComplete }: MindsetChatProps) {
  const chatSnapshot = useStorageSnapshot([CHAT_STORAGE_KEY]);
  const chatStorageValue = getStorageValueFromSnapshot(chatSnapshot, CHAT_STORAGE_KEY);
  const messages = useMemo(() => {
    if (chatSnapshot === SERVER_STORAGE_SNAPSHOT) return [];
    if (!chatStorageValue) return [WELCOME_MESSAGE];
    try {
      const storedMessages = normalizeMessages(JSON.parse(chatStorageValue) as unknown);
      return storedMessages.length ? storedMessages : [WELCOME_MESSAGE];
    } catch {
      return [WELCOME_MESSAGE];
    }
  }, [chatSnapshot, chatStorageValue]);
  const [input, setInput] = useState("");
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [typing, setTyping] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);
  const locationSearch = useLocationSearchSnapshot();
  const promptFromUrl = useMemo(() => new URLSearchParams(locationSearch).get("prompt"), [locationSearch]);
  const visibleInput = !isPromptDismissed && promptFromUrl ? promptFromUrl : input;
  const {
    displayName,
    mainLifeGoal,
    dailyFocus,
    preferredTradingRiskLimit,
    dailyTradingLimit,
    tradingMode,
    riskProfile,
    coachPersonality,
    disciplineStreak,
    dailyHabitsCompleted,
    habitHistory,
    monthlyGoals,
    quarterlyGoals,
    yearlyGoals,
    lifeRoadmap,
    futureSelf,
    alignment,
    shadowSelf,
    lightSelf,
    duality,
    identityFusion,
    metaCoach,
    adaptivePersonality,
    setDailyHabitsCompleted,
    setDisciplineStreak,
    setCurrentEmotion,
    addEmotionHistoryEntry,
  } = useMemoryStore();

  const quickPrompts = [
    "Review my day",
    "What should I focus on?",
    "Review my trading discipline",
    "Review my habits",
    "Review my goals",
    "Give me my weekly review",
  ];

  const buildCoachContext = () => {
    const todayKey = getTodayKey();
    const today = new Date(`${todayKey}T00:00:00`);
    const daysUntil = (date: string) => Math.ceil((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000);
    const allHabits = getHabitRecords();
    const allGoals = getGoals();
    const allTrades = getTradingJournalEntries();
    const business = getBusinessData();
    const projects = getProjects();
    const finances = getFinanceState();
    const monthlyFinances = getMonthlyFinanceSummary(finances);
    const checkIns = getDailyCheckIns();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const recentTrades = allTrades.slice(0, 5).map((entry) => ({
      date: entry.date,
      time: entry.time,
      instrument: entry.instrument,
      setup: entry.setupName,
      session: entry.session,
      direction: entry.side,
      outcome: entry.outcome || "Unresolved",
      riskPercent: entry.riskPercent,
      plannedRiskReward: entry.plannedRiskReward,
      planFollowed: entry.planFollowed,
      mistakes: entry.mistakes,
      lessonLearned: entry.lessonLearned,
      emotionBefore: entry.emotionBefore,
      emotionAfter: entry.emotionAfter,
    }));
    const weeklyTrades = allTrades.filter((entry) => new Date(`${entry.date}T00:00:00`) >= cutoff).map((entry) => ({
      date: entry.date,
      instrument: entry.instrument,
      setup: entry.setupName,
      outcome: entry.outcome || "Unresolved",
      riskPercent: entry.riskPercent,
      planFollowed: entry.planFollowed,
      mistakes: entry.mistakes,
      lessonLearned: entry.lessonLearned,
      emotionBefore: entry.emotionBefore,
      emotionAfter: entry.emotionAfter,
    }));
    const habitsById = new Map(allHabits.map((habit) => [habit.id, habit.title]));
    const activeGoals = allGoals.filter((goal) => !goal.completed);
    const completedToday = allHabits.filter((habit) => habit.completedDates.includes(todayKey));
    const incompleteToday = allHabits.filter((habit) => !habit.completedDates.includes(todayKey));
    const recentHabits = allHabits
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
      .map((habit) => ({
        id: habit.id,
        title: habit.title,
        completedToday: habit.completedDates.includes(todayKey),
        completedDates: habit.completedDates.slice(-7),
        completionsLast7Days: habit.completedDates.filter((date) => date >= todayKey || date >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)).length,
      }));

    return {
      dateContext: { today: todayKey },
      profile: {
        displayName: displayName || "unavailable",
        mainLifeGoal: mainLifeGoal || "unavailable",
        dailyFocus: dailyFocus || "unavailable",
        preferredTradingRiskLimit: preferredTradingRiskLimit || "unavailable",
        dailyTradingLimit: dailyTradingLimit || "unavailable",
      },
      habits: {
        total: allHabits.length,
        completedToday: completedToday.map((habit) => habit.title),
        incompleteToday: incompleteToday.map((habit) => habit.title),
        streak: getCurrentStreak(),
        recent: recentHabits,
      },
      goals: {
        active: activeGoals.map((goal) => ({
          id: goal.id,
          title: goal.title,
          progress: goal.progress,
          category: goal.category,
          targetDate: goal.targetDate || "unavailable",
          completed: goal.completed,
          linkedHabitIds: goal.linkedHabitIds,
          linkedHabitTitles: goal.linkedHabitIds.map((id) => habitsById.get(id)).filter(Boolean),
        })),
        recentlyCompleted: allGoals
          .filter((goal) => goal.completed)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map((goal) => ({ title: goal.title, completedAt: goal.updatedAt, targetDate: goal.targetDate || "unavailable" })),
      },
      mindset: {
        currentState: useMemoryStore.getState().currentEmotion || "not set",
        focusScore: alignment.dailyScore || 0,
        summary: useMemoryStore.getState().dailySummary || null,
        latestCheckIn: checkIns[0] || null,
        recentCheckIns: checkIns.slice(0, 7),
      },
      trading: {
        tradingMode,
        riskProfile,
        disciplineStreak,
        dailyHabitsCompleted: dailyHabitsCompleted.slice(-5),
        recentTrades,
        weeklyTrades,
        patternInsights: getTradingPatternInsights(allTrades),
      },
      recentProgress: {
        recentActivity: habitHistory.slice(-4).map((entry) => ({
          date: entry.date,
          count: Array.isArray(entry.habits) ? entry.habits.length : 0,
        })),
      },
      business: {
        hasData: Boolean(business.goals.length || business.tasks.length || business.leads.length || business.monthlyTarget || business.revenue),
        goalCount: business.goals.length,
        goalHighlights: business.goals.slice(0, 4).map((goal) => ({ title: goal.title, status: goal.status, progress: goal.progress, deadline: goal.deadline || null, daysUntil: goal.deadline ? daysUntil(goal.deadline) : null })),
        openTaskCount: business.tasks.filter((task) => !task.complete).length,
        overdueTasks: business.tasks.filter((task) => !task.complete && task.deadline && daysUntil(task.deadline) < 0).slice(0, 4).map((task) => ({ title: task.title, deadline: task.deadline, daysOverdue: Math.abs(daysUntil(task.deadline)) })),
        dueSoonTasks: business.tasks.filter((task) => !task.complete && task.deadline && daysUntil(task.deadline) >= 0 && daysUntil(task.deadline) <= 7).slice(0, 4).map((task) => ({ title: task.title, deadline: task.deadline, daysUntil: daysUntil(task.deadline) })),
        leadStatuses: business.leads.reduce<Record<string, number>>((counts, lead) => ({ ...counts, [lead.status]: (counts[lead.status] || 0) + 1 }), {}),
        monthlyRevenueTarget: business.monthlyTarget,
        currentRevenue: business.revenue,
      },
      projects: {
        hasData: projects.length > 0,
        activeCount: projects.filter((project) => project.status === "Active").length,
        active: projects.filter((project) => project.status !== "Completed").slice(0, 5).map((project) => ({
          title: project.title,
          status: project.status,
          progress: project.progress,
          deadline: project.deadline || null,
          daysUntilDeadline: project.deadline ? daysUntil(project.deadline) : null,
          incompleteTasks: project.tasks.filter((task) => !task.complete).slice(0, 4).map((task) => ({ title: task.title, dueDate: task.dueDate || null, daysUntil: task.dueDate ? daysUntil(task.dueDate) : null })),
          overdueTaskCount: project.tasks.filter((task) => !task.complete && task.dueDate && daysUntil(task.dueDate) < 0).length,
        })),
      },
      finances: {
        hasData: Boolean(monthlyFinances.transactionCount || monthlyFinances.savings || monthlyFinances.savingsTarget || monthlyFinances.goals.length),
        month: todayKey.slice(0, 7),
        income: monthlyFinances.transactionCount ? monthlyFinances.income : null,
        expenses: monthlyFinances.transactionCount ? monthlyFinances.expenses : null,
        monthlyNet: monthlyFinances.transactionCount ? monthlyFinances.net : null,
        savings: monthlyFinances.transactionCount || finances.savings ? monthlyFinances.savings : null,
        savingsTarget: monthlyFinances.savingsTarget || null,
        goals: monthlyFinances.goals.slice(0, 4).map((goal) => ({ title: goal.title, saved: goal.saved, target: goal.target, progress: goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : null })),
      },
    };
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage(providedMessage?: string) {
    const trimmedInput = (providedMessage ?? visibleInput).trim();
    if (!trimmedInput || typing || inFlightRef.current) return;

    inFlightRef.current = true;
    setErrorMessage(null);
    const userMessage = createChatMessage("user", trimmedInput);
    saveChatMessages([...messages, userMessage]);
    setInput("");
    setIsPromptDismissed(true);
    setTyping(true);

    const detectedEmotion = detectEmotionFromMessage(trimmedInput);
    setCurrentEmotion(detectedEmotion.emotion);
    addEmotionHistoryEntry({
      date: new Date().toISOString(),
      ...detectedEmotion,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          coachContext: buildCoachContext(),
          coachMode: trimmedInput.toLowerCase().includes("weekly review") ? "weekly-review" : "coaching",
          recentChatMessages: messages.slice(-6),
          tradingMode,
          riskProfile,
          coachPersonality,
          disciplineStreak,
          dailyHabitsCompleted,
          habitHistory: habitHistory.slice(-7),
          activeGoals: [...monthlyGoals, ...quarterlyGoals, ...yearlyGoals],
          lifeRoadmap,
          adaptivePersonality: adaptivePersonality.current,
          futureSelf,
          alignment,
          shadowSelf,
          lightSelf,
          duality,
          identityFusion,
          metaCoach,
          currentEmotion: detectedEmotion.emotion,
        }),
      });

      if (!res.ok) {
        let errorPayload: { error?: string; details?: string } | null = null;
        try {
          errorPayload = await res.json();
        } catch {
          errorPayload = null;
        }

        throw new Error(errorPayload?.details || errorPayload?.error || "AI Coach couldn't respond. Please try again.");
      }

      let data: { reply?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      const aiReply = data?.reply;
      if (!aiReply || typeof aiReply !== "string" || !aiReply.trim()) {
        throw new Error("AI Coach couldn't respond. Please try again.");
      }

      const updateMatch = aiReply.match(/^DISCIPLINE_UPDATE:\s*(\d+)/);
      const habitId = updateMatch ? Number(updateMatch[1]) : null;

      if (habitId && habitId >= 1 && habitId <= 4) {
        const nextHabitsCompleted = Array.from(new Set([...dailyHabitsCompleted, habitId]));
        setDailyHabitsCompleted(nextHabitsCompleted);

        if (nextHabitsCompleted.length === 4 && dailyHabitsCompleted.length < 4) {
          setDisciplineStreak(disciplineStreak + 1);
        }

        onHabitComplete?.(habitId);
      }

      if (aiReply.trim().startsWith("STREAK_ADD")) {
        setDisciplineStreak(disciplineStreak + 1);
      }

      if (aiReply.trim().startsWith("STREAK_RESET")) {
        setDisciplineStreak(0);
      }

      saveChatMessages([...normalizeMessages(loadChatMessages()), createChatMessage("coach", aiReply)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI Coach couldn't respond. Please try again.");
      saveChatMessages([...normalizeMessages(loadChatMessages()), createChatMessage("coach", "AI Coach couldn't respond. Please try again.")]);
    } finally {
      inFlightRef.current = false;
      setTyping(false);
    }
  }

  const groupedMessages = groupMessagesBySender(normalizeMessages(messages));

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-4 shadow-[0_12px_32px_rgba(2,6,23,0.16)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-violet-300">Coach</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Mindset assistant</h2>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/90 bg-slate-950/55 p-3">
        <div className="space-y-3">
          {groupedMessages.map((group, groupIndex) => {
            const safeItems = Array.isArray(group?.items)
              ? group.items.filter(isValidChatRecord)
              : [];

            return (
              <div
                key={`${group.sender}-${groupIndex}`}
                className={`flex ${group.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[min(100%,48rem)] space-y-2 ${group.sender === "user" ? "items-end" : "items-start"}`}>
                  {safeItems.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl px-4 py-3 shadow-sm transition ${msg.sender === "coach"
                        ? "border border-violet-400/20 bg-slate-800/65 text-slate-100"
                        : "border border-slate-200/70 bg-slate-100 text-slate-900"
                        }`}
                    >
                      {msg.sender === "coach" ? <MarkdownContent text={msg.text} /> : <p className="whitespace-pre-wrap text-sm leading-6">{msg.text}</p>}
                      <span
                        className={`mt-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] ${msg.sender === "coach" ? "text-violet-200/80" : "text-slate-500"
                          }`}
                      >
                        {formatChatTimestamp(msg.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-xl border border-violet-500/20 bg-violet-600/10 px-4 py-3 text-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-300" />
                  <span className="text-sm text-violet-100">Coach is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {errorMessage ? <p role="alert" className="mt-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{errorMessage}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => {
              setInput(prompt);
              void sendMessage(prompt);
            }}
            disabled={typing}
            className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:border-violet-400 hover:bg-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={visibleInput}
          onChange={(event) => { setIsPromptDismissed(true); setInput(event.target.value); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendMessage();
            }
          }}
          placeholder="Share what’s happening in your head..."
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          aria-label="Message the mindset coach"
        />
        <button
          type="button"
          onClick={() => void sendMessage()}
          disabled={!input.trim() || typing}
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-900/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {typing ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
