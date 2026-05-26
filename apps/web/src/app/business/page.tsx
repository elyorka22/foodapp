'use client';

import { Sidebar, StatCard, Badge } from '@foodmarket/ui';
import { getBusinessNav } from '@/lib/business-nav';
import { t } from '@/i18n';

export default function BusinessPanel() {
  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('roles.shop')} items={getBusinessNav()} accent={t('business.typeGrocery')} />
      <main className="p-8">
        <h1 className="text-2xl font-bold">{t('business.title')}</h1>
        <div className="mt-2">
          <Badge variant="brand">{t('business.typeGrocery')}</Badge>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StatCard label={t('business.skus')} value={48} />
          <StatCard label={t('business.lowStock')} value={3} change={t('business.lowStockHint')} />
          <StatCard label={t('business.ordersToday')} value={8} />
        </div>
        <section className="mt-8 bg-white rounded-2xl border p-6">
          <h2 className="font-semibold">{t('business.inventoryTitle')}</h2>
          <p className="text-sm text-gray-500 mt-2">{t('business.inventoryHint')}</p>
          <table className="w-full mt-4 text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="pb-2">{t('business.colProduct')}</th>
                <th>{t('business.colQty')}</th>
                <th>{t('business.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-3">Organic Avocados</td>
                <td>50</td>
                <td>
                  <Badge variant="success">{t('business.statusOk')}</Badge>
                </td>
              </tr>
              <tr className="border-t">
                <td className="py-3">Farm Eggs</td>
                <td>8</td>
                <td>
                  <Badge variant="warning">{t('business.statusLow')}</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
