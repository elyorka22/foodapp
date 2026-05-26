'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, ProductRowSkeleton } from '@foodmarket/ui';
import { apiClient, formatUzs, type BusinessDetail } from '@/lib/api';
import { useCart } from '@/store/cart';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<BusinessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    setLoading(true);
    apiClient.business(slug).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <MobileShell>
        <div className="px-4 py-6 space-y-3">
          <ProductRowSkeleton />
          <ProductRowSkeleton />
        </div>
      </MobileShell>
    );
  }

  if (!data) {
    return (
      <MobileShell>
        <div className="p-8 text-center text-gray-500">{t('common.error')}</div>
      </MobileShell>
    );
  }

  const products = data.categories?.flatMap((c) => c.products) ?? [];

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28 max-w-lg mx-auto">
        <Link href={customerPath('/shops')} className="text-brand-600 text-sm font-medium">
          ← {t('shops.back')}
        </Link>
        <h1 className="text-xl font-bold mt-4">{data.name}</h1>
        <p className="text-sm text-gray-500">
          {data.type.replace('_', ' ')} · ★ {data.rating}
        </p>
        <div className="mt-6 space-y-3">
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('restaurant.noProducts')}</p>
          ) : (
            products.map((p) => (
              <div key={p.id} className="flex gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-card">
                <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center text-2xl shrink-0">
                  🛒
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="font-bold text-brand-700 mt-0.5">{formatUzs(p.price)}</p>
                </div>
                <Button
                  size="sm"
                  className="self-center shrink-0 touch-auto min-h-0"
                  onClick={() =>
                    addItem(
                      { productId: p.id, name: p.name, price: p.price, quantity: 1 },
                      {
                        id: data.id,
                        type: 'business',
                        name: data.name,
                        lat: data.latitude ?? 41.2995,
                        lng: data.longitude ?? 69.2401,
                        minOrderAmount: data.minOrderAmount ?? 0,
                      },
                    )
                  }
                >
                  +
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
