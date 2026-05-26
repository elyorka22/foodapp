import { VendorCardSkeleton } from '@foodmarket/ui';
import { MobileShell } from '@/components/MobileShell';
import { HomeTopBar } from '@/components/home/HomeTopBar';
import { HomeSearchBar } from '@/components/home/HomeSearchBar';

export default function HomeLoading() {
  return (
    <MobileShell>
      <HomeTopBar />
      <HomeSearchBar />
      <main className="px-4 pb-32 mt-5 space-y-4 max-w-lg mx-auto">
        <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-14 h-14 rounded-2xl bg-gray-200 animate-pulse shrink-0" />
          ))}
        </div>
        <VendorCardSkeleton />
        <VendorCardSkeleton />
      </main>
    </MobileShell>
  );
}
