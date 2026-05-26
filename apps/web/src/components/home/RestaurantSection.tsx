'use client';

import { RestaurantCard, SectionHeader, VendorCardSkeleton } from '@foodmarket/ui';
import { t } from '@/i18n';
import { formatUzs, type Restaurant } from '@/lib/api';
import { setFavorite, isFavorite } from '@/lib/favorites';
import { customerPath } from '@/lib/paths';

export function RestaurantSection({
  restaurants,
  loading,
}: {
  restaurants: Restaurant[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="px-4 mt-8 max-w-lg mx-auto">
        <SectionHeader title={t('home.popularRestaurants')} />
        <div className="grid gap-4">
          <VendorCardSkeleton />
          <VendorCardSkeleton />
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mt-8 max-w-lg mx-auto">
      <SectionHeader
        title={t('home.popularRestaurants')}
        actionLabel={t('common.seeAll')}
        actionHref={customerPath('/restaurants')}
      />
      {restaurants.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-white border border-gray-100">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-gray-600 font-medium">{t('home.emptyRestaurants')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('home.emptyRestaurantsHint')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {restaurants.map((r) => (
            <RestaurantCard
              key={r.id}
              href={customerPath(`/restaurants/${r.slug}`)}
              name={r.name}
              imageUrl={r.coverImageUrl}
              rating={r.rating}
              deliveryTime={t('restaurant.deliveryTime', { min: r.avgPrepMinutes })}
              deliveryFeeLabel={
                r.minOrderAmount > 0
                  ? t('restaurant.minOrder', { amount: formatUzs(r.minOrderAmount) })
                  : t('restaurant.freeDelivery')
              }
              tags={r.cuisineTags}
              featured={r.isFeatured}
              featuredLabel={t('restaurant.featured')}
              isFavorite={isFavorite(r.id)}
              onFavoriteToggle={(liked) => setFavorite(r.id, liked)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
