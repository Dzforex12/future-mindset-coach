"use client";

import { useState } from "react";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import RiskCalculator from "@/components/RiskCalculator";
import DisciplineTracker from "@/components/DisciplineTracker";
import MindsetChat from "@/components/MindsetChat";
import GoalSection from "@/components/GoalSection";
import RoadmapSection from "@/components/RoadmapSection";
import FutureSelfSection from "@/components/FutureSelfSection";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";
import type { HabitHistoryEntry } from "@/app/state/memoryStore";

type GoalItem = {
  id: string | number;
  title: string;
  progress?: number;
  completed?: boolean;
};

export default function Page() {
  const [dailySummary] = useState(
    "You are operating with strong intention. The biggest opportunity is to stabilize your emotional baseline before making higher-stakes decisions."
  );

  const [alignment] = useState({
    dailyScore: 82,
    weeklyScore: 76,
    weeklyReportIsNew: false,
    misalignmentReasons: [
      "You are over-indexing on urgency instead of clarity.",
      "Decision fatigue is a recurring theme in the last 7 days.",
      "Several habits are inconsistent when your energy dips.",
    ],
    weeklyReport:
      "Your weekly pattern shows solid momentum, but your decision quality is being affected by compressed recovery time. The best improvement this week is to create calmer transitions between work blocks and recovery periods.",
  });

  const [monthlyReport] = useState({
    summary:
      "Your monthly performance is trending upward. Consistency improved most in the middle of the month, while recovery and emotional regulation remain the main focus for the next cycle.",
    consistencyScore: 86,
    disciplineScore: 82,
    tradingMindsetScore: 79,
    bestDay: "Thursday",
    worstDay: "Monday",
    habitsCompleted: 12,
  });

  const [recommendedHabits] = useState([
    {
      id: 1,
      title: "Morning reset routine",
      description: "10 minutes of breathing, intention-setting, and journaling before opening email or messages.",
    },
    {
      id: 2,
      title: "Deep work block",
      description: "Two consecutive focus blocks before noon with no notifications.",
    },
    {
      id: 3,
      title: "End-of-day review",
      description: "Reflect on one win, one friction point, and one next action before sleep.",
    },
  ]);

  const [monthlyGoals] = useState<GoalItem[]>([
    { id: 1, title: "Build a consistent morning routine", progress: 65, completed: false },
    { id: 2, title: "Reduce reactive decision-making", progress: 40, completed: false },
    { id: 3, title: "Protect recovery time", progress: 58, completed: false },
  ]);

  const [quarterlyGoals] = useState<GoalItem[]>([
    { id: 4, title: "Improve emotional regulation", progress: 50, completed: false },
    { id: 5, title: "Strengthen strategic clarity", progress: 46, completed: false },
  ]);

  const [yearlyGoals] = useState<GoalItem[]>([
    { id: 6, title: "Create a resilient identity and long-term system", progress: 35, completed: false },
    { id: 7, title: "Build sustainable high-performance habits", progress: 41, completed: false },
  ]);

  const [lifeRoadmap] = useState({
    sixMonth: {
      title: "6-Month Roadmap",
      items: [
        "Create stable habits",
        "Increase focus and clarity",
        "Reduce emotional volatility",
      ],
    },
    oneYear: {
      title: "1-Year Roadmap",
      items: [
        "Build a grounded lifestyle",
        "Develop decision systems",
        "Strengthen identity and self-trust",
      ],
    },
    fiveYear: {
      title: "5-Year Roadmap",
      items: [
        "Design a meaningful life strategy",
        "Build a high-performing identity",
        "Create enduring impact",
      ],
    },
  });

  const [futureSelf] = useState({
    oneYear: {
      title: "1-Year Future Self",
      items: ["Calm under pressure", "Disciplined and deliberate", "Clear emotional boundaries"],
    },
    fiveYear: {
      title: "5-Year Future Self",
      items: ["High-trust leader", "Strong emotional resilience", "Aligned with long-term purpose"],
    },
    tenYear: {
      title: "10-Year Future Self",
      items: ["Legacy builder", "Deeply fulfilled", "Mentor and stabilizer"],
    },
  });

  const [weeklyHistory] = useState<HabitHistoryEntry[]>([
    { date: "Mon", habits: [62] },
    { date: "Tue", habits: [68] },
    { date: "Wed", habits: [73] },
    { date: "Thu", habits: [81] },
    { date: "Fri", habits: [76] },
    { date: "Sat", habits: [80] },
    { date: "Sun", habits: [78] },
  ]);

  const [disciplineStreak] = useState(12);
  const [streakStrength] = useState(82);
  const [coachMood] = useState("Focused");
  const [riskProfile] = useState("Balanced");
  const [tradingMode] = useState("Swing");
  const [coachPersonality] = useState("Adaptive");

  return (
    <main className="min-h-screen bg-[#070b17] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Future mindset coach"
          title="Daily alignment overview"
          description="A premium snapshot of your consistency, emotional regulation, and strategy health."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-200">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Streak {disciplineStreak} days
            </div>
          }
        />

        <section className="mt-8 grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40 p-6 shadow-2xl shadow-violet-900/10 transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/25">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
                  Today&apos;s summary
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Momentum check</h2>
              </div>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                {alignment.dailyScore}/100
              </span>
            </div>

            <p className="max-w-2xl text-base leading-7 text-slate-300">{dailySummary}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Weekly</p>
                <p className="mt-2 text-2xl font-semibold text-white">{alignment.weeklyScore}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Discipline</p>
                <p className="mt-2 text-2xl font-semibold text-white">{monthlyReport.disciplineScore}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coach mood</p>
                <p className="mt-2 text-2xl font-semibold text-white">{coachMood}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/40">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Reality check</h2>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                {riskProfile}
              </span>
            </div>

            <p className="text-3xl font-bold text-emerald-400">{alignment.dailyScore}/100</p>
            <p className="mt-2 text-sm text-slate-400">Weekly trend: {alignment.weeklyScore}/100</p>

            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              {alignment.misalignmentReasons.map((reason, index) => (
                <li key={`${reason}-${index}`} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-violet-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Weekly assessment</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{alignment.weeklyReport}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { label: "Consistency", value: monthlyReport.consistencyScore },
            { label: "Discipline", value: monthlyReport.disciplineScore },
            { label: "Trading mindset", value: monthlyReport.tradingMindsetScore },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/25">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{metric.label}</p>
              <p className="mt-3 text-3xl font-bold text-white">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="Recommended habits" subtitle={`${recommendedHabits.length} actions ready`}>
            <div className="space-y-3">
              {recommendedHabits.map((habit) => (
                <div
                  key={habit.id}
                  className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-500/40 hover:bg-slate-950"
                >
                  <h3 className="text-base font-semibold text-white">{habit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{habit.description}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Streak strength" subtitle="Current traction">
            <div className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold text-white">{streakStrength}%</p>
                  <p className="mt-1 text-sm text-slate-400">Momentum score</p>
                </div>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs font-medium text-violet-200">
                  +6.2%
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                  style={{ width: `${streakStrength}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mood</p>
                  <p className="mt-2 text-lg font-semibold text-white">{coachMood}</p>
                </div>
                <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trading</p>
                  <p className="mt-2 text-lg font-semibold text-white">{tradingMode}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coach personality</p>
                <p className="mt-2 text-lg font-semibold text-white">{coachPersonality}</p>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <GoalSection title="Monthly Goals" goals={monthlyGoals} isNew={false} onClearNew={() => { }} onProgress={() => { }} onComplete={() => { }} />
          <GoalSection title="Quarterly Goals" goals={quarterlyGoals} isNew={false} collapsible onClearNew={() => { }} onProgress={() => { }} onComplete={() => { }} />
          <GoalSection title="Yearly Goals" goals={yearlyGoals} isNew={false} collapsible onClearNew={() => { }} onProgress={() => { }} onComplete={() => { }} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <RoadmapSection title="Six-Month Roadmap" section={lifeRoadmap.sixMonth} isNew={false} onOpen={() => { }} />
          <RoadmapSection title="One-Year Roadmap" section={lifeRoadmap.oneYear} isNew={false} onOpen={() => { }} />
          <RoadmapSection title="Five-Year Roadmap" section={lifeRoadmap.fiveYear} isNew={false} onOpen={() => { }} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <FutureSelfSection title="1-Year Future Self" section={futureSelf.oneYear} isNew={false} onOpen={() => { }} />
          <FutureSelfSection title="5-Year Future Self" section={futureSelf.fiveYear} isNew={false} onOpen={() => { }} />
          <FutureSelfSection title="10-Year Future Self" section={futureSelf.tenYear} isNew={false} onOpen={() => { }} />
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Performance trend</h2>
            <span className="text-sm text-slate-400">Last 7 days</span>
          </div>
          <AnalyticsChart habitHistory={weeklyHistory} disciplineStreak={disciplineStreak} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-4 text-xl font-semibold text-white">Profile snapshot</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trading mode</p>
                <p className="mt-2 text-lg font-semibold text-white">{tradingMode}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk profile</p>
                <p className="mt-2 text-lg font-semibold text-white">{riskProfile}</p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Coach personality</p>
                <p className="mt-2 text-lg font-semibold text-white">{coachPersonality}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Monthly overview</h2>
              <span className="text-sm text-slate-400">{monthlyReport.habitsCompleted} habits</span>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-400">Best day:</span> {monthlyReport.bestDay}</p>
              <p><span className="text-slate-400">Worst day:</span> {monthlyReport.worstDay}</p>
              <p><span className="text-slate-400">Summary:</span> {monthlyReport.summary}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 space-y-6">
          <RiskCalculator />
          <DisciplineTracker />
          <MindsetChat />
        </div>
      </div>
    </main>
  );
}