import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-gray-100 ${padding ? 'p-4' : ''} ${className}`}>
      {children}
    </div>
  );
}
