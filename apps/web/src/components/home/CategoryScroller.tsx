'use client';

import { useState } from 'react';
import { CategoryCard } from '@foodmarket/ui';
import { t } from '@/i18n';

const CATEGORY_KEYS = [
  { id: 'all', key: 'categories.all', emoji: '✨' },
  { id: 'pizza', key: 'categories.pizza', emoji: '🍕' },
  { id: 'burger', key: 'categories.burger', emoji: '🍔' },
  { id: 'sushi', key: 'categories.sushi', emoji: '🍣' },
  { id: 'healthy', key: 'categories.healthy', emoji: '🥗' },
  { id: 'national', key: 'categories.national', emoji: '🍲' },
  { id: 'grocery', key: 'categories.grocery', emoji: '🛒' },
  { id: 'coffee', key: 'categories.coffee', emoji: '☕' },
] as const;

export function CategoryScroller() {
  const [active, setActive] = useState('all');

  return (
    <section className="mt-6 px-4">
      <h2 className="text-base font-bold text-gray-900 max-w-lg mx-auto">{t('home.categoriesTitle')}</h2>
      <div className="flex gap-3 mt-3 overflow-x-auto scrollbar-hide pb-2 max-w-lg mx-auto">
        {CATEGORY_KEYS.map((c) => (
          <CategoryCard
            key={c.id}
            emoji={c.emoji}
            label={t(c.key)}
            active={active === c.id}
            onClick={() => setActive(c.id)}
          />
        ))}
      </div>
    </section>
  );
}
