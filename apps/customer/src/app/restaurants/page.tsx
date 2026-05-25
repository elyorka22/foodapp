import Link from 'next/link';
import { VendorCard } from '@foodmarket/ui';
import { apiClient } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';

export default async function RestaurantsPage() {
  let items: Awaited<ReturnType<typeof apiClient.restaurants>>['items'] = [];
  try {
    items = (await apiClient.restaurants('limit=20')).items;
  } catch { /* offline */ }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28">
        <h1 className="text-xl font-bold">Restaurants</h1>
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          {items.map((r) => (
            <VendorCard key={r.id} href={`/restaurant/${r.slug}`} name={r.name} rating={r.rating} deliveryTime={`${r.avgPrepMinutes} min`} tags={r.cuisineTags} featured={r.isFeatured} />
          ))}
        </div>
        {items.length === 0 && <p className="text-gray-500 mt-8">No restaurants — start the API and seed the database.</p>}
      </div>
    </MobileShell>
  );
}
