'use client';

import { Sidebar } from '@foodmarket/ui';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/vendors', label: 'Vendors' },
];

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title="Admin Panel" items={nav} />
      <main className="p-8">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-gray-500 mt-2">Full order list via GET /api/v1/orders (admin JWT)</p>
        <div className="mt-6 bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Distance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t"><td className="p-4 text-gray-400" colSpan={4}>Connect API + authenticate to load orders</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
