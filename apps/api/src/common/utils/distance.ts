/** Haversine distance in kilometers */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function calculateDeliveryFee(
  distanceKm: number,
  baseFee: number,
  perKmFee: number,
): number {
  return Math.round((baseFee + distanceKm * perKmFee) * 100) / 100;
}

export function estimateDeliveryMinutes(distanceKm: number): number {
  const base = 15;
  const perKm = 3;
  return Math.ceil(base + distanceKm * perKm);
}
