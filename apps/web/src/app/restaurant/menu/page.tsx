'use client';

import { useEffect, useState } from 'react';
import { Sidebar, Button, Input } from '@foodmarket/ui';
import { getRestaurantNav } from '@/lib/restaurant-nav';
import { t } from '@/i18n';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Product {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [restaurantId, setRestaurantId] = useState('');

  const token = () => localStorage.getItem('accessToken');

  useEffect(() => {
    fetch(`${API}/restaurants?limit=1`)
      .then((r) => r.json())
      .then((d) => {
        const id = d.items?.[0]?.id;
        if (id) {
          setRestaurantId(id);
          return fetch(`${API}/products?restaurantId=${id}`).then((r) => r.json());
        }
      })
      .then((list) => setProducts(list ?? []))
      .catch(() => {});
  }, []);

  async function toggle(id: string, available: boolean) {
    await fetch(`${API}/products/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !available }),
    });
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, isAvailable: !available } : x)));
  }

  async function addProduct() {
    if (!name || !price || !restaurantId) return;
    await fetch(`${API}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: parseFloat(price), restaurantId, isAvailable: true }),
    });
    setName('');
    setPrice('');
    const list = await fetch(`${API}/products?restaurantId=${restaurantId}`).then((r) => r.json());
    setProducts(list);
  }

  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('restaurantPanel.nav.dashboard')} items={getRestaurantNav()} />
      <main className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold">{t('restaurantPanel.menuManage')}</h1>
        <div className="mt-6 bg-white rounded-2xl border p-4 space-y-3">
          <Input label={t('restaurantPanel.productName')} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t('restaurantPanel.productPrice')} value={price} onChange={(e) => setPrice(e.target.value)} />
          <Button onClick={addProduct}>{t('restaurantPanel.addProduct')}</Button>
        </div>
        <div className="mt-6 space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex justify-between items-center bg-white border rounded-xl p-3">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-brand-700">{Number(p.price).toLocaleString('uz-UZ')} so&apos;m</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(p.id, p.isAvailable)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold touch-auto min-h-0 ${
                  p.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {p.isAvailable ? t('restaurantPanel.available') : t('restaurantPanel.unavailable')}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
