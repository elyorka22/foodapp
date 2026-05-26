'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Badge, ProductModal, ProductRowSkeleton, useToast } from '@foodmarket/ui';
import type { ProductModalProduct } from '@foodmarket/ui';
import { apiClient, formatUzs, type RestaurantDetail, type Product } from '@/lib/api';
import { useCart } from '@/store/cart';
import { MobileShell } from '@/components/MobileShell';
import { customerPath } from '@/lib/paths';
import { t } from '@/i18n';

export default function RestaurantPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const addItem = useCart((s) => s.addItem);
  const bump = useCart((s) => s.bump);

  useEffect(() => {
    setLoading(true);
    apiClient
      .restaurant(slug)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <MobileShell>
        <div className="px-4 py-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </div>
      </MobileShell>
    );
  }

  if (error || !data) {
    return (
      <MobileShell>
        <div className="p-8 text-center">
          <p className="text-gray-500">{error ?? t('restaurant.notFound')}</p>
          <Link href={customerPath('/')} className="text-brand-600 mt-4 inline-block font-semibold">
            {t('restaurant.backHome')}
          </Link>
        </div>
      </MobileShell>
    );
  }

  const products = data.menus?.flatMap((m) => m.products) ?? [];
  const closed = data.isOpen === false;

  return (
    <MobileShell cartBump={bump}>
      <div className="relative aspect-[2/1] bg-gradient-to-br from-brand-100 to-brand-50">
        <Link href={customerPath('/')} className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow text-lg">
          ←
        </Link>
        {closed && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold">{t('restaurant.closed')}</span>
          </div>
        )}
      </div>
      <div className="px-4 -mt-6 relative pb-28">
        <div className="bg-white rounded-2xl p-4 shadow-card border">
          <h1 className="text-xl font-bold">{data.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{data.description}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="success">★ {data.rating}</Badge>
            <Badge>{t('restaurant.deliveryTime', { min: data.avgPrepMinutes })}</Badge>
            <Badge>{t('restaurant.minOrder', { amount: formatUzs(data.minOrderAmount) })}</Badge>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="font-bold text-lg mb-3">{t('restaurant.menu')}</h2>
          {products.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('restaurant.noProducts')}</p>
          ) : (
            <div className="space-y-3">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={closed}
                  onClick={() => setModalProduct(p)}
                  className="w-full flex gap-4 bg-white rounded-2xl p-3 border text-left active:scale-[0.99] transition"
                >
                  <div className="w-20 h-20 rounded-xl bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{p.description}</p>
                    <p className="font-bold text-brand-700 mt-1">{formatUzs(p.price)}</p>
                  </div>
                  <span className="self-center w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold">+</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalProduct && (
        <ProductModal
          product={modalProduct as ProductModalProduct}
          onClose={() => setModalProduct(null)}
          onAdd={(qty, optionIds, unitPrice) => {
            addItem(
              {
                productId: modalProduct.id,
                name: modalProduct.name,
                price: unitPrice,
                quantity: qty,
                optionIds,
              },
              {
                id: data.id,
                type: 'restaurant',
                name: data.name,
                lat: (data as RestaurantDetail & { latitude?: number }).latitude ?? 41.3111,
                lng: (data as RestaurantDetail & { longitude?: number }).longitude ?? 69.2797,
                minOrderAmount: data.minOrderAmount,
              },
            );
            toast(t('restaurant.addedToCart'), 'success');
          }}
        />
      )}
    </MobileShell>
  );
}
