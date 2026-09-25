"use client";

import { useEffect, useState } from "react";
import { useMemoryStore } from "@/app/state/memoryStore";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";

const personalityLabels = ["Soft", "Neutral", "Aggressive"] as const;
const themeOptions = [
  { value: "dark", label: "Dark" },
  { value: "ultra-dark", label: "Ultra Dark" },
] as const;
const riskOptions = ["Conservative", "Moderate", "Aggressive"] as const;
const marketOptions = ["Forex", "Crypto", "Stocks"] as const;

export default function SettingsPage() {
  const {
    displayName,
    mainLifeGoal,
    dailyFocus,
    preferredTradingRiskLimit,
    dailyTradingLimit,
    setDisplayName,
    setMainLifeGoal,
    setDailyFocus,
    setPreferredTradingRiskLimit,
    setDailyTradingLimit,
    theme,
    setTheme,
    coachPersonality,
    setCoachPersonality,
    dailyReminder,
    setDailyReminder,
    tradingMode,
    setTradingMode,
    riskProfile,
    setRiskProfile,
  } = useMemoryStore();
  const [draft, setDraft] = useState({
    displayName: "Edonis",
    mainLifeGoal: "",
    dailyFocus: "",
    preferredTradingRiskLimit: "1%",
    dailyTradingLimit: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setDraft({ displayName, mainLifeGoal, dailyFocus, preferredTradingRiskLimit, dailyTradingLimit });
  }, [displayName, mainLifeGoal, dailyFocus, preferredTradingRiskLimit, dailyTradingLimit]);

  const selectedPersonalityIndex = Math.max(
    0,
    personalityLabels.indexOf(coachPersonality as (typeof personalityLabels)[number]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Tune your coaching experience and system behavior."
      />

      <SectionCard title="Personal profile" subtitle="Keep your operating system grounded in your priorities." className="h-full">
        {feedback ? <p role="status" className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{feedback}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            Display name
            <input
              value={draft.displayName}
              onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none transition focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-slate-300">
            Main life goal
            <input
              value={draft.mainLifeGoal}
              onChange={(event) => setDraft({ ...draft, mainLifeGoal: event.target.value })}
              placeholder="What matters most right now?"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none transition focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-slate-300">
            Daily focus
            <input
              value={draft.dailyFocus}
              onChange={(event) => setDraft({ ...draft, dailyFocus: event.target.value })}
              placeholder="The one thing to protect today"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none transition focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-slate-300">
            Preferred trading risk limit
            <input
              value={draft.preferredTradingRiskLimit}
              onChange={(event) => setDraft({ ...draft, preferredTradingRiskLimit: event.target.value })}
              placeholder="1%"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none transition focus:border-violet-500"
            />
          </label>
          <label className="text-sm text-slate-300 sm:col-span-2">
            Daily trading limit
            <input
              value={draft.dailyTradingLimit}
              onChange={(event) => setDraft({ ...draft, dailyTradingLimit: event.target.value })}
              placeholder="Optional number of trades"
              inputMode="numeric"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none transition focus:border-violet-500"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDisplayName(draft.displayName.trim() || "Edonis");
              setMainLifeGoal(draft.mainLifeGoal.trim());
              setDailyFocus(draft.dailyFocus.trim());
              setPreferredTradingRiskLimit(draft.preferredTradingRiskLimit.trim() || "1%");
              setDailyTradingLimit(draft.dailyTradingLimit.trim());
              setFeedback("Profile saved");
            }}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Save profile
          </button>
          <button
            type="button"
            onClick={() => setDraft({ displayName, mainLifeGoal, dailyFocus, preferredTradingRiskLimit, dailyTradingLimit })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            Cancel
          </button>
        </div>
      </SectionCard>

      <div className="grid gap-6 md:grid-cols-2">
        <SectionCard title="Theme" subtitle="Choose the dashboard intensity." className="h-full">
          <h2 className="text-lg font-semibold text-white">Theme</h2>
          <p className="mt-2 text-sm text-slate-300">Choose the dashboard intensity.</p>

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value as "dark" | "ultra-dark")}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition duration-200 ${theme === option.value
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Coach personality" subtitle="Set how direct the coach should be." className="h-full">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-sm font-medium text-violet-200">
              {personalityLabels[selectedPersonalityIndex]}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="2"
            step="1"
            value={selectedPersonalityIndex}
            onChange={(event) => {
              const index = Number(event.target.value);
              setCoachPersonality(personalityLabels[index]);
            }}
            className="mt-5 w-full accent-violet-600"
            aria-label="Coach personality"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            {personalityLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Daily reminder" subtitle="Receive a daily accountability prompt." className="h-full">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={dailyReminder}
              aria-label="Toggle daily reminder"
              onClick={() => setDailyReminder(!dailyReminder)}
              className={`relative h-7 w-12 rounded-full transition duration-200 ${dailyReminder ? "bg-violet-600 shadow-lg shadow-violet-900/30" : "bg-slate-700"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200 ${dailyReminder ? "left-6" : "left-1"}`}
              />
            </button>
          </div>

          <p className="mt-4 text-sm font-medium text-violet-300">{dailyReminder ? "Enabled" : "Disabled"}</p>
        </SectionCard>

        <SectionCard title="Trading mode" subtitle="Choose the market you are focused on." className="h-full">
          <select
            value={tradingMode}
            onChange={(event) => setTradingMode(event.target.value as (typeof marketOptions)[number])}
            className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none transition duration-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          >
            {marketOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </SectionCard>

        <SectionCard title="Risk profile" subtitle="Set the risk framework for your coaching guidance." className="h-full md:col-span-2">
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {riskOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRiskProfile(option as "Conservative" | "Moderate" | "Aggressive")}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition duration-200 ${riskProfile === option
                  ? "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-900/20"
                  : "border-slate-700 bg-slate-950 text-slate-300 hover:text-white hover:border-violet-500/40"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
