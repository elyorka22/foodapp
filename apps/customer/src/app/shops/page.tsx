import { VendorCard } from '@foodmarket/ui';
import { apiClient } from '@/lib/api';
import { MobileShell } from '@/components/MobileShell';

export default async function ShopsPage() {
  let items: Awaited<ReturnType<typeof apiClient.businesses>>['items'] = [];
  try {
    items = (await apiClient.businesses('limit=20')).items;
  } catch { /* offline */ }

  return (
    <MobileShell>
      <div className="px-4 py-6 pb-28">
        <h1 className="text-xl font-bold">Shops & Grocery</h1>
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          {items.map((b) => (
            <VendorCard key={b.id} href={`/shop/${b.slug}`} name={b.name} rating={b.rating} tags={[b.type]} />
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
