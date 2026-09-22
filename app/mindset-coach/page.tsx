import MindsetChat from "@/components/MindsetChat";
import { PageHeader } from "@/components/ui/page-shell";

export default function MindsetCoachPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Coaching"
        title="Mindset Coach"
        description="Your AI partner for emotional regulation, habit alignment, and clearer execution under pressure."
      />

      <MindsetChat />
    </div>
  );
}
