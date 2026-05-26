import { RestaurantCard } from '@foodmarket/ui';
import { apiClient, formatUzs } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

export default async function RestaurantsPage() {
  let items: Awaited<ReturnType<typeof apiClient.restaurants>>['items'] = [];
  try {
    items = (await apiClient.restaurants('limit=20')).items;
  } catch {
    /* offline */
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">{t('restaurants.title')}</h1>
        <div className="grid gap-4 mt-6">
          {items.map((r) => (
            <RestaurantCard
              key={r.id}
              href={customerPath(`/restaurants/${r.slug}`)}
              name={r.name}
              imageUrl={r.coverImageUrl}
              rating={r.rating}
              deliveryTime={t('restaurant.deliveryTime', { min: r.avgPrepMinutes })}
              deliveryFeeLabel={t('restaurant.minOrder', { amount: formatUzs(r.minOrderAmount) })}
              tags={r.cuisineTags}
              featured={r.isFeatured}
            />
          ))}
        </div>
        {items.length === 0 && (
          <p className="text-gray-500 mt-8 text-center">{t('restaurants.empty')}</p>
        )}
      </div>
    </MobileShell>
  );
}
