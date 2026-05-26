'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@foodmarket/ui';
import { apiClient, type BusinessDetail } from '@/lib/api';
import { useCart } from '@/store/cart';
import { MobileShell } from '@/components/MobileShell';

export default function ShopPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<BusinessDetail | null>(null);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    apiClient.business(slug).then(setData).catch(() => setData(null));
  }, [slug]);

  if (!data) {
    return (
      <MobileShell>
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </MobileShell>
    );
  }

  const products = data.categories?.flatMap((c) => c.products) ?? [];

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28">
        <Link href="/shops" className="text-brand-600 text-sm">← Shops</Link>
        <h1 className="text-xl font-bold mt-4">{data.name}</h1>
        <p className="text-sm text-gray-500">{data.type.replace('_', ' ')} · ★ {data.rating}</p>
        <div className="mt-6 space-y-3">
          {products.map((p) => (
            <div key={p.id} className="flex gap-4 bg-white rounded-2xl p-3 border">
              <div className="w-16 h-16 rounded-xl bg-brand-50 flex items-center justify-center">🛒</div>
              <div className="flex-1">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="font-bold text-brand-700">${p.price.toFixed(2)}</p>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  addItem(
                    { productId: p.id, name: p.name, price: p.price, quantity: 1 },
                    {
                      id: data.id,
                      type: 'business',
                      name: data.name,
                      lat: data.latitude ?? 41.2995,
                      lng: data.longitude ?? 69.2401,
                      minOrderAmount: data.minOrderAmount,
                    },
                  )
                }
              >
                +
              </Button>
            </div>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
