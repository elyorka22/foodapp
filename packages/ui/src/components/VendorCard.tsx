import Link from 'next/link';
import { Badge } from './Badge';

export function VendorCard({
  href,
  name,
  imageUrl,
  rating,
  deliveryTime,
  tags,
  featured,
}: {
  href: string;
  name: string;
  imageUrl?: string;
  rating: number;
  deliveryTime?: string;
  tags?: string[];
  featured?: boolean;
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100 transition group-hover:shadow-md">
        <div className="relative aspect-[16/10] bg-gradient-to-br from-brand-50 to-gray-100">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl">🍽️</div>
          )}
          {featured && (
            <div className="absolute top-3 left-3">
              <Badge variant="brand">Featured</Badge>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <span className="text-amber-500 font-medium">★ {rating.toFixed(1)}</span>
            {deliveryTime && <span>· {deliveryTime}</span>}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 2).map((t) => (
                <span key={t} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
