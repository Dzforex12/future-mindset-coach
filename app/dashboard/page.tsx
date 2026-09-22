import DisciplineTracker from "@/components/DisciplineTracker";
import { DashboardCard } from "@/components/DashboardCard";
import RiskCalculator from "@/components/RiskCalculator";
import { PageHeader, SectionCard } from "@/components/ui/page-shell";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Keep your focus on discipline, consistency, and steady progress."
      />

      <section className="grid gap-6 md:grid-cols-2">
        <DashboardCard
          title="Mindset Progress"
          description="Keep your focus on discipline, consistency, and steady progress."
        />
        <DashboardCard
          title="Trading Discipline"
          description="Review your habits and stay accountable to your plan."
        />
      </section>

      <section className="space-y-6">
        <SectionCard title="Risk & discipline" subtitle="Core performance signals">
          <RiskCalculator />
        </SectionCard>
        <SectionCard title="Daily execution" subtitle="Habit and streak tracking">
          <DisciplineTracker />
        </SectionCard>
      </section>
    </div>
  );
}
