export const SLA_DELIVERY_MINUTES = 45;
export const SLA_CONFIRM_MINUTES = 10;

const TERMINAL = new Set(['DELIVERED', 'CANCELLED', 'REFUNDED']);

export interface OrderSlaInfo {
  deadline: string;
  remainingMinutes: number;
  overdueMinutes: number;
  breached: boolean;
  percentElapsed: number;
  label: 'ok' | 'warning' | 'breached';
}

export function orderSla(
  createdAt: Date,
  estimatedDelivery: Date | null | undefined,
  status: string,
): OrderSlaInfo {
  const deadline =
    estimatedDelivery ?? new Date(createdAt.getTime() + SLA_DELIVERY_MINUTES * 60_000);
  const totalMs = deadline.getTime() - createdAt.getTime();
  const elapsedMs = Date.now() - createdAt.getTime();
  const remainingMs = deadline.getTime() - Date.now();
  const isTerminal = TERMINAL.has(status);
  const breached = !isTerminal && remainingMs < 0;
  const remainingMinutes = isTerminal ? 0 : Math.max(0, Math.ceil(remainingMs / 60_000));
  const overdueMinutes = breached ? Math.ceil(-remainingMs / 60_000) : 0;
  const percentElapsed = isTerminal
    ? 100
    : Math.min(100, Math.max(0, Math.round((elapsedMs / Math.max(totalMs, 1)) * 100)));

  let label: OrderSlaInfo['label'] = 'ok';
  if (breached) label = 'breached';
  else if (percentElapsed >= 75) label = 'warning';

  return {
    deadline: deadline.toISOString(),
    remainingMinutes,
    overdueMinutes,
    breached,
    percentElapsed,
    label,
  };
}

export function formatSlaCountdown(sla: OrderSlaInfo): string {
  if (sla.breached) return `+${sla.overdueMinutes}m`;
  return `${sla.remainingMinutes}m`;
}
