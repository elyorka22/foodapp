'use client';

import { useCallback, useRef, useState } from 'react';

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    async (e: React.TouchEvent) => {
      const diff = e.changedTouches[0].clientY - startY.current;
      if (diff > 80 && window.scrollY === 0) {
        setPulling(true);
        try {
          await onRefresh();
        } finally {
          setPulling(false);
        }
      }
    },
    [onRefresh],
  );

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {pulling && (
        <div className="flex justify-center py-3">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {children}
    </div>
  );
}
