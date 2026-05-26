'use client';

import { Sidebar } from '@foodmarket/ui';
import { getAdminNav } from '@/lib/admin-nav';
import { t } from '@/i18n';

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title={t('roles.admin')} items={getAdminNav()} />
      <main className="p-8">
        <h1 className="text-2xl font-bold">{t('admin.orders.title')}</h1>
        <p className="text-gray-500 mt-2">{t('admin.orders.hint')}</p>
        <div className="mt-6 bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">{t('admin.orders.colNumber')}</th>
                <th className="text-left p-4">{t('admin.orders.colStatus')}</th>
                <th className="text-left p-4">{t('admin.orders.colTotal')}</th>
                <th className="text-left p-4">{t('admin.orders.colDistance')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-4 text-gray-400" colSpan={4}>
                  {t('admin.orders.empty')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
