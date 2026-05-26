'use client';

import { t } from '@/i18n';

export function HomeSearchBar() {
  return (
    <div className="px-4 -mt-1">
      <div className="relative max-w-lg mx-auto">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder={t('home.searchPlaceholder')}
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm text-gray-900 placeholder:text-gray-400 shadow-card focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
        />
      </div>
    </div>
  );
}
