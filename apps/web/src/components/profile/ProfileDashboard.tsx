'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@foodmarket/ui';
import { MobileShell } from '@/components/MobileShell';
import { t, orderStatus } from '@/i18n';
import { apiClient, formatUzs, type Address, type OrderDetail } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { panelHrefForRole } from '@/lib/auth/rbac';
import { customerPath } from '@/lib/paths';
import type { UserRole } from '@foodmarket/shared-types';

type Tab = 'info' | 'orders' | 'addresses' | 'settings';

export function ProfileDashboard() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  const [tab, setTab] = useState<Tab>('info');
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const panelHref = role ? panelHrefForRole(role as UserRole) : null;

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      apiClient.orders(accessToken).catch(() => ({ items: [] as OrderDetail[] })),
      apiClient.myAddresses(accessToken).catch(() => [] as Address[]),
    ])
      .then(([orderRes, addrRes]) => {
        setOrders(orderRes.items.slice(0, 10));
        setAddresses(addrRes);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'info', label: t('profile.tabs.info') },
    { id: 'orders', label: t('profile.tabs.orders') },
    { id: 'addresses', label: t('profile.tabs.addresses') },
    { id: 'settings', label: t('profile.tabs.settings') },
  ];

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-32 max-w-lg mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('profile.subtitle')}</p>
          </div>
          {panelHref && (
            <Link href={panelHref}>
              <Button size="sm" variant="secondary">
                {t('profile.openPanel')}
              </Button>
            </Link>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                tab === item.id ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-3">
            <p className="text-sm text-gray-500">{t('profile.role')}</p>
            <p className="font-semibold text-gray-900">{role ?? user?.role.name}</p>
            <p className="text-sm text-gray-500 pt-2">{t('auth.email')}</p>
            <p className="font-medium">{user?.email ?? '—'}</p>
            <p className="text-sm text-gray-500 pt-2">{t('auth.name')}</p>
            <p className="font-medium">
              {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—'}
            </p>
          </section>
        )}

        {tab === 'orders' && (
          <section className="space-y-3">
            {loading && <p className="text-sm text-gray-500">{t('common.loading')}</p>}
            {!loading && orders.length === 0 && (
              <div className="bg-white rounded-2xl border p-5 text-center text-gray-500">
                {t('profile.noOrders')}{' '}
                <Link href={customerPath('/')} className="text-brand-600 font-semibold">
                  {t('profile.browse')}
                </Link>
              </div>
            )}
            {orders.map((order) => (
              <Link
                key={order.id}
                href={customerPath(`/orders/${order.id}`)}
                className="block bg-white rounded-2xl border border-gray-100 p-4 shadow-card"
              >
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">#{order.orderNumber}</span>
                  <span className="text-brand-600">{orderStatus(order.status)}</span>
                </div>
                <p className="text-gray-900 font-bold mt-2">{formatUzs(order.total)}</p>
              </Link>
            ))}
            <Link href={customerPath('/orders')} className="text-sm text-brand-600 font-semibold">
              {t('profile.allOrders')}
            </Link>
          </section>
        )}

        {tab === 'addresses' && (
          <section className="space-y-3">
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">{t('profile.noAddresses')}</p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-2xl border p-4 shadow-card">
                  <p className="font-semibold">{addr.label}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {addr.street}, {addr.city}
                  </p>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'settings' && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card space-y-4">
            <p className="text-sm text-gray-600">{t('profile.settingsHint')}</p>
            <Button variant="danger" fullWidth onClick={() => void logout()}>
              {t('profile.logout')}
            </Button>
          </section>
        )}
      </div>
    </MobileShell>
  );
}
