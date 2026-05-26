import { RestaurantCard } from '@foodmarket/ui';
import { apiClient } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

export default async function ShopsPage() {
  let items: Awaited<ReturnType<typeof apiClient.businesses>>['items'] = [];
  try {
    items = (await apiClient.businesses('limit=20')).items;
  } catch {
    /* offline */
  }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">{t('shops.title')}</h1>
        <div className="grid gap-4 mt-6">
          {items.map((b) => (
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
      </div>
    </MobileShell>
  );
}
