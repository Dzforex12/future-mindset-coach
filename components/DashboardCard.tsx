export function DashboardCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-navy-dark p-6 rounded-xl border border-border">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="text-textSecondary mt-2">{description}</p>
    </div>
  );
}
