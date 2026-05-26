import Link from 'next/link';
import { VendorCard } from '@foodmarket/ui';
import { apiClient } from '@/lib/api';
import { HomeHeader } from '@/components/HomeHeader';
import { CategoryPills } from '@/components/CategoryPills';
import { MobileShell } from '@/components/MobileShell';

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
    restaurants = [];
    businesses = [];
  }

  return (
    <MobileShell>
      <HomeHeader />
      <main className="px-4 pb-28">
        <section className="mt-4">
          <h2 className="text-lg font-bold text-gray-900">What are you craving?</h2>
          <CategoryPills />
        </section>

        <section className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Popular restaurants</h2>
            <Link href="/restaurants" className="text-sm font-medium text-brand-600">See all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {restaurants.length > 0 ? (
              restaurants.map((r) => (
                <VendorCard
                  key={r.id}
                  href={`/restaurants/${r.slug}`}
                  name={r.name}
                  imageUrl={r.coverImageUrl}
                  rating={r.rating}
                  deliveryTime={`${r.avgPrepMinutes} min`}
                  tags={r.cuisineTags}
                  featured={r.isFeatured}
                />
              ))
            ) : (
              <PlaceholderGrid count={2} type="restaurant" />
            )}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Shops & grocery</h2>
            <Link href="/shops" className="text-sm font-medium text-brand-600">See all</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {businesses.length > 0 ? (
              businesses.map((b) => (
                <VendorCard
                  key={b.id}
                  href={`/shop/${b.slug}`}
                  name={b.name}
                  imageUrl={b.coverImageUrl}
                  rating={b.rating}
                  tags={[b.type.replace('_', ' ')]}
                />
              ))
            ) : (
              <PlaceholderGrid count={2} type="shop" />
            )}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-6 text-white">
          <p className="text-sm font-medium opacity-90">Limited time</p>
          <h3 className="text-xl font-bold mt-1">20% off first order</h3>
          <p className="text-sm mt-2 opacity-90">Use code WELCOME20 at checkout</p>
        </section>
      </main>
    </MobileShell>
  );
}

function PlaceholderGrid({ count, type }: { count: number; type: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
          <div className="aspect-[16/10] bg-gradient-to-br from-brand-50 to-emerald-100 flex items-center justify-center text-5xl">
            {type === 'restaurant' ? '🥗' : '🛒'}
          </div>
          <div className="p-4">
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-50 rounded w-1/2 mt-2 animate-pulse" />
            <p className="text-xs text-gray-400 mt-2">Start API to load live data</p>
          </div>
        </div>
      ))}
    </>
  );
}
