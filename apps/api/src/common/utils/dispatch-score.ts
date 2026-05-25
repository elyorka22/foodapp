import { haversineKm } from './distance';

export interface CourierCandidate {
  id: string;
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  rating: number;
  activeOrders: number;
  totalDeliveries: number;
  firstName?: string;
}

export interface DispatchContext {
  pickupLat: number;
  pickupLng: number;
  destLat: number;
  destLng: number;
  city?: string;
}

/** Score 0–100 — higher is better. Manual assignment always overrides. */
export function scoreCourier(candidate: CourierCandidate, ctx: DispatchContext): {
  score: number;
  distanceKm: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  if (candidate.status === 'AVAILABLE') {
    score += 35;
    reasons.push('available');
  } else if (candidate.status === 'ON_DELIVERY') {
    score += 10;
    reasons.push('on_delivery');
  } else {
    score -= 20;
    reasons.push('busy_or_offline');
  }

  const lat = candidate.currentLat;
  const lng = candidate.currentLng;
  let distanceKm = 99;
  if (lat != null && lng != null) {
    distanceKm = haversineKm(lat, lng, ctx.pickupLat, ctx.pickupLng);
    if (distanceKm <= 2) {
      score += 30;
      reasons.push('very_near');
    } else if (distanceKm <= 5) {
      score += 20;
      reasons.push('near');
    } else if (distanceKm <= 8) {
      score += 10;
      reasons.push('moderate_distance');
    } else {
      score -= 10;
      reasons.push('far');
    }
  } else {
    reasons.push('no_gps');
  }

  const load = candidate.activeOrders;
  if (load === 0) {
    score += 20;
    reasons.push('no_active_orders');
  } else if (load === 1) {
    score += 8;
    reasons.push('one_active_order');
  } else {
    score -= load * 8;
    reasons.push(`loaded_${load}`);
  }

  score += Math.min(10, candidate.rating * 2);
  if (candidate.totalDeliveries > 50) {
    score += 5;
    reasons.push('experienced');
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    distanceKm: Math.round(distanceKm * 100) / 100,
    reasons,
  };
}
