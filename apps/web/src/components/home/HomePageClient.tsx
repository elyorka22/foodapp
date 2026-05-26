'use client';

import { useEffect, useState } from 'react';
import { apiClient, type Business, type Restaurant } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';
import { HomeTopBar } from './HomeTopBar';
import { HomeSearchBar } from './HomeSearchBar';
import { PromoCarousel } from './PromoCarousel';
import { CategoryScroller } from './CategoryScroller';
import { FreeDeliveryBanner } from './FreeDeliveryBanner';
import { RestaurantSection } from './RestaurantSection';
import { ShopSection } from './ShopSection';

export function HomePageClient({
  initialRestaurants,
  initialShops,
}: {
  initialRestaurants: Restaurant[];
  initialShops: Business[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [shops, setShops] = useState(initialShops);
  const [loading, setLoading] = useState(!initialRestaurants.length && !initialShops.length);

  useEffect(() => {
    if (initialRestaurants.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const [r, b] = await Promise.all([
          apiClient.restaurants('featured=true&limit=6'),
          apiClient.businesses('limit=4'),
        ]);
        if (!cancelled) {
          setRestaurants(r.items);
          setShops(b.items);
        }
      } catch {
        /* offline */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialRestaurants.length]);

  return (
    <MobileShell>
      <HomeTopBar />
      <HomeSearchBar />
      <main className="pb-32">
        <PromoCarousel />
        <CategoryScroller />
        <FreeDeliveryBanner />
        <RestaurantSection restaurants={restaurants} loading={loading} />
        <ShopSection shops={shops} loading={loading} />
      </main>
    </MobileShell>
  );
}
