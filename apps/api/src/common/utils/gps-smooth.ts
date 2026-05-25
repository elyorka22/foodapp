/** Exponential moving average for GPS jitter reduction */
export function smoothGps(
  prev: { lat: number; lng: number } | null,
  next: { lat: number; lng: number },
  alpha = 0.35,
): { lat: number; lng: number } {
  if (!prev) return next;
  return {
    lat: prev.lat + alpha * (next.lat - prev.lat),
    lng: prev.lng + alpha * (next.lng - prev.lng),
  };
}

/** Ignore GPS jumps > maxJumpMeters (bad cell fix) */
export function shouldAcceptGpsPoint(
  prev: { lat: number; lng: number } | null,
  next: { lat: number; lng: number },
  maxJumpKm = 0.5,
): boolean {
  if (!prev) return true;
  const R = 6371;
  const dLat = ((next.lat - prev.lat) * Math.PI) / 180;
  const dLng = ((next.lng - prev.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((prev.lat * Math.PI) / 180) *
      Math.cos((next.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km <= maxJumpKm;
}
