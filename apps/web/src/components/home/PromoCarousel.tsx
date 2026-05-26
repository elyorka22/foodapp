'use client';

import { PromoBanner } from '@foodmarket/ui';
import { t } from '@/i18n';

export function PromoCarousel() {
  const promos = [
    {
      badge: t('home.promoBadge'),
      title: t('home.heroPromo1Title'),
      code: t('home.heroPromo1Code'),
      gradient: 'from-brand-600 to-emerald-600',
    },
    {
      badge: t('home.promoBadge'),
      title: t('home.heroPromo2Title'),
      subtitle: t('home.heroPromo2Subtitle'),
      gradient: 'from-emerald-700 to-teal-600',
    },
  ];

  return (
    <div className="px-4 mt-5">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 max-w-lg mx-auto">
        {promos.map((p, i) => (
          <div key={i} className="min-w-[85%] sm:min-w-[320px] snap-center shrink-0">
            <PromoBanner
              badge={p.badge}
              title={p.title}
              subtitle={p.subtitle}
              code={p.code}
              gradient={p.gradient}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
