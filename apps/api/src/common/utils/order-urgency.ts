export type UrgencyLevel = 'normal' | 'warning' | 'critical';

export function orderUrgency(
  status: string,
  createdAt: Date,
  hasCourier: boolean,
): { level: UrgencyLevel; minutesWaiting: number; reason?: string } {
  const minutesWaiting = Math.floor((Date.now() - createdAt.getTime()) / 60000);

  if (status === 'PENDING' && minutesWaiting >= 10) {
    return { level: minutesWaiting >= 20 ? 'critical' : 'warning', minutesWaiting, reason: 'pending_confirmation' };
  }
  if (status === 'PREPARING' && minutesWaiting >= 45) {
    return { level: 'warning', minutesWaiting, reason: 'long_prep' };
  }
  if (status === 'READY_FOR_PICKUP' && !hasCourier) {
    if (minutesWaiting >= 15) return { level: 'critical', minutesWaiting, reason: 'no_courier' };
    if (minutesWaiting >= 8) return { level: 'warning', minutesWaiting, reason: 'awaiting_courier' };
  }
  if (status === 'ON_THE_WAY' && minutesWaiting >= 60) {
    return { level: 'warning', minutesWaiting, reason: 'long_delivery' };
  }

  return { level: 'normal', minutesWaiting };
}
