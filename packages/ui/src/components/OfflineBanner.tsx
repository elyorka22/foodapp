'use client';

import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[90] bg-amber-500 text-amber-950 text-center text-sm py-2 px-4 font-medium safe-top">
      Internet yo&apos;q — ma&apos;lumotlar saqlanadi, ulanishda sinxronlanadi
    </div>
  );
}
