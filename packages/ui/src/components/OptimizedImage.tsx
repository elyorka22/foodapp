'use client';

import { useState } from 'react';

export function OptimizedImage({
  src,
  alt,
  className = '',
  sizes = '(max-width: 768px) 100vw, 400px',
}: {
  src?: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const thumb = src?.replace('-lg.webp', '-sm.webp').replace('.webp', '-sm.webp');

  if (!src) {
    return (
      <div className={`bg-gradient-to-br from-brand-50 to-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-3xl opacity-60">🍽️</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-200" />}
      <img
        src={thumb || src}
        srcSet={src ? `${thumb || src} 200w, ${src} 800w` : undefined}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
