import { apiClient } from '@/lib/api';
import { HomePageClient } from '@/components/home/HomePageClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let restaurants: Awaited<ReturnType<typeof apiClient.restaurants>>['items'] = [];
  let businesses: Awaited<ReturnType<typeof apiClient.businesses>>['items'] = [];
  try {
    const [r, b] = await Promise.all([
      apiClient.restaurants('featured=true&limit=6'),
      apiClient.businesses('limit=4'),
    ]);
    restaurants = r.items;
    businesses = b.items;
  } catch {
    /* API offline — client will retry */
  }

  return <HomePageClient initialRestaurants={restaurants} initialShops={businesses} />;
}
