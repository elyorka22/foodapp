'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from './Badge';
import { OptimizedImage } from './OptimizedImage';

export function RestaurantCard({
  href,
  name,
  imageUrl,
  rating,
  deliveryTime,
  deliveryFeeLabel,
  tags,
  featured,
  featuredLabel = 'Tavsiya',
  isFavorite: initialFavorite,
  onFavoriteToggle,
}: {
  href: string;
  name: string;
  imageUrl?: string;
  rating: number;
  deliveryTime?: string;
  deliveryFeeLabel?: string;
  tags?: string[];
  featured?: boolean;
  featuredLabel?: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (liked: boolean) => void;
}) {
  const [liked, setLiked] = useState(initialFavorite ?? false);

  function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    onFavoriteToggle?.(next);
  }

  return (
    <Link href={href} className="block group active:scale-[0.98] transition-transform">
      <article className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100/80 group-hover:shadow-md transition-shadow">
        <div className="relative aspect-[4/3] overflow-hidden">
          <OptimizedImage src={imageUrl} alt={name} className="absolute inset-0 w-full h-full" />
          {featured && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="brand">{featuredLabel}</Badge>
            </div>
          )}
          <button
            type="button"
            aria-label="favorite"
            onClick={toggleFavorite}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-lg active:scale-90 transition-transform touch-auto min-h-0 min-w-0"
          >
            {liked ? '❤️' : '🤍'}
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate text-[15px]">{name}</h3>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-sm text-gray-500">
            <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
              ★ {rating.toFixed(1)}
            </span>
            {deliveryTime && (
              <>
                <span className="text-gray-300">·</span>
                <span>{deliveryTime}</span>
              </>
            )}
            {deliveryFeeLabel && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-brand-700 font-medium text-xs">{deliveryFeeLabel}</span>
              </>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[11px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
