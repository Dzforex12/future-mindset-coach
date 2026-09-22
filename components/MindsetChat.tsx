"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildChatThread,
  createChatMessage,
  formatChatTimestamp,
  groupMessagesBySender,
} from "@/app/state/chatDomain";
import { useMemoryStore } from "@/app/state/memoryStore";
import { detectEmotionFromMessage } from "@/app/state/emotionEngine";

type MindsetChatProps = {
  onHabitComplete?: (habitId: number) => void;
};

export default function MindsetChat({ onHabitComplete }: MindsetChatProps) {
  const [messages, setMessages] = useState(() =>
    buildChatThread([{ sender: "coach", text: "DZ, I’m here. What’s on your mind tonight?" }]),
  );
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function sendMessage() {
    if (!input.trim()) return;

    const trimmedInput = input.trim();
    const userMessage = createChatMessage("user", trimmedInput);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    const detectedEmotion = detectEmotionFromMessage(trimmedInput);
    setCurrentEmotion(detectedEmotion.emotion);
    addEmotionHistoryEntry({
      date: new Date().toISOString(),
      ...detectedEmotion,
    });

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Coach request failed.");

      const aiReply = data.reply;
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

      setTyping(false);
      setMessages((prev) => [...prev, createChatMessage("coach", aiReply)]);
    } catch (error) {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        createChatMessage(
          "coach",
          error instanceof Error
            ? error.message
            : "Coach is unavailable right now. Check the server configuration.",
        ),
      ]);
    }
  }

  const groupedMessages = groupMessagesBySender(messages);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/20">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-violet-300">Coach</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Mindset assistant</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Online
        </div>
      </div>

      <div className="h-[360px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <div className="space-y-3">
          {groupedMessages.map((group, groupIndex) => (
            <div
              key={`${group.sender}-${groupIndex}`}
              className={`flex ${group.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] space-y-2 ${group.sender === "user" ? "items-end" : "items-start"}`}>
                {group.items.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl px-3.5 py-2.5 shadow-sm transition ${msg.sender === "coach"
                        ? "border border-violet-500/20 bg-gradient-to-br from-violet-600/25 to-slate-800 text-slate-100"
                        : "bg-gradient-to-br from-slate-200 to-slate-100 text-slate-900"
                      }`}
                  >
                    <p className="text-sm leading-6 whitespace-pre-wrap">{msg.text}</p>
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
          ))}

          {typing && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-600/10 px-3.5 py-2.5 text-slate-100 shadow-sm">
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

      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Share what’s happening in your head..."
          className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          aria-label="Message the mindset coach"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={!input.trim() || typing}
          className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:translate-y-[-1px] hover:shadow-violet-900/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {typing ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
