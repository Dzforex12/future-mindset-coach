"use client";

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
