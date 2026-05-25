export function StatCard({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-card">
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        {icon && <span className="text-brand-600">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {change && <p className="text-xs text-brand-600 mt-1 font-medium">{change}</p>}
    </div>
  );
}
