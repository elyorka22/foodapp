'use client';

export function PromoBanner({
  badge,
  title,
  subtitle,
  code,
  gradient = 'from-brand-600 to-emerald-600',
  onClick,
}: {
  badge?: string;
  title: string;
  subtitle?: string;
  code?: string;
  gradient?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg shadow-brand-600/15 active:scale-[0.99] transition-transform`}
    >
      {badge && (
        <span className="inline-block text-xs font-bold uppercase tracking-wide bg-white/20 px-2.5 py-1 rounded-full">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-bold mt-2 leading-snug">{title}</h3>
      {subtitle && <p className="text-sm text-white/90 mt-1">{subtitle}</p>}
      {code && <p className="text-xs font-semibold mt-3 bg-white/15 inline-block px-3 py-1 rounded-lg">{code}</p>}
    </button>
  );
}
