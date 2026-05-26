'use client';

import { RestaurantCard, SectionHeader, VendorCardSkeleton } from '@foodmarket/ui';
import { t } from '@/i18n';
import type { Business } from '@/lib/api';
import { customerPath } from '@/lib/paths';

export function ShopSection({ shops, loading }: { shops: Business[]; loading?: boolean }) {
  if (loading) {
    return (
      <section className="px-4 mt-10 max-w-lg mx-auto pb-4">
        <SectionHeader title={t('home.popularShops')} />
        <div className="grid gap-4">
          <VendorCardSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mt-10 max-w-lg mx-auto pb-4">
      <SectionHeader
        title={t('home.popularShops')}
        actionLabel={t('common.seeAll')}
        actionHref={customerPath('/shops')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {shops.map((b) => (
          <RestaurantCard
            key={b.id}
            href={customerPath(`/shop/${b.slug}`)}
            name={b.name}
            imageUrl={b.coverImageUrl}
            rating={b.rating}
            tags={[b.type.replace('_', ' ')]}
          />
        ))}
      </div>
    </section>
  );
}
