'use client';

export function CategoryCard({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 flex flex-col items-center gap-2 min-w-[72px] transition active:scale-95 ${
        active ? '' : ''
      }`}
    >
      <span
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-card border transition ${
          active
            ? 'bg-brand-600 border-brand-600 text-white shadow-brand-600/20'
            : 'bg-white border-gray-100 text-gray-800'
        }`}
      >
        {emoji}
      </span>
      <span className={`text-xs font-medium text-center leading-tight max-w-[72px] ${active ? 'text-brand-700' : 'text-gray-600'}`}>
        {label}
      </span>
    </button>
  );
}
