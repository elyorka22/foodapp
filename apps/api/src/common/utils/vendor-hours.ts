/** Check if vendor is open now (Asia/Tashkent default) */
export function isVendorOpen(
  hours: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[],
  timezone = 'Asia/Tashkent',
): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[weekday] ?? now.getDay();
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const currentMinutes = hour * 60 + minute;

  const today = hours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!today || today.isClosed) return false;

  const [openH, openM] = today.openTime.split(':').map(Number);
  const [closeH, closeM] = today.closeTime.split(':').map(Number);
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;
  return currentMinutes >= openMin && currentMinutes <= closeMin;
}
