'use client';

import { t } from '@/i18n';

export function FreeDeliveryBanner() {
  return (
    <div className="px-4 mt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 rounded-2xl bg-white border border-brand-100 p-4 shadow-card">
        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-2xl shrink-0">
          🚚
        </div>
        <div>
          <p className="font-bold text-gray-900">{t('home.freeDeliveryTitle')}</p>
          <p className="text-sm text-gray-500 mt-0.5">{t('home.freeDeliverySubtitle')}</p>
        </div>
      </div>
    </div>
  );
}
