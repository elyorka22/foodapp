'use client';

import { Sidebar, StatCard, Badge } from '@foodmarket/ui';

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/products', label: 'Products' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/orders', label: 'Orders' },
  { href: '/hours', label: 'Hours' },
];

export default function BusinessPanel() {
  return (
    <div className="min-h-screen md:pl-64">
      <Sidebar title="Shop / Grocery" items={nav} accent="Business" />
      <main className="p-8">
        <h1 className="text-2xl font-bold">Fresh Mart Grocery</h1>
        <div className="mt-2"><Badge variant="brand">GROCERY</Badge></div>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          <StatCard label="SKUs" value={48} />
          <StatCard label="Low stock" value={3} change="Needs restock" />
          <StatCard label="Orders today" value={8} />
        </div>
        <section className="mt-8 bg-white rounded-2xl border p-6">
          <h2 className="font-semibold">Inventory management</h2>
          <p className="text-sm text-gray-500 mt-2">GET /businesses/:id/inventory · PATCH inventory/:productId</p>
          <table className="w-full mt-4 text-sm">
            <thead><tr className="text-left text-gray-500"><th className="pb-2">Product</th><th>Qty</th><th>Status</th></tr></thead>
            <tbody>
              <tr className="border-t"><td className="py-3">Organic Avocados</td><td>50</td><td><Badge variant="success">OK</Badge></td></tr>
              <tr className="border-t"><td className="py-3">Farm Eggs</td><td>8</td><td><Badge variant="warning">Low</Badge></td></tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
