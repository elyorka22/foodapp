import Link from 'next/link';

export function SectionHeader({
  title,
  actionLabel,
  actionHref,
  className = '',
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 mb-4 ${className}`}>
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="text-sm font-semibold text-brand-600 active:opacity-70 shrink-0">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
