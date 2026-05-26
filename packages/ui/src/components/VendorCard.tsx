import { RestaurantCard } from './RestaurantCard';

/** @deprecated Use RestaurantCard — kept for backward compatibility */
export function VendorCard({
  href,
  name,
  imageUrl,
  rating,
  deliveryTime,
  tags,
  featured,
  deliveryFeeLabel,
}: {
  href: string;
  name: string;
  imageUrl?: string;
  rating: number;
  deliveryTime?: string;
  tags?: string[];
  featured?: boolean;
  deliveryFeeLabel?: string;
}) {
  return (
    <RestaurantCard
      href={href}
      name={name}
      imageUrl={imageUrl}
      rating={rating}
      deliveryTime={deliveryTime}
      tags={tags}
      featured={featured}
      deliveryFeeLabel={deliveryFeeLabel}
    />
  );
}
