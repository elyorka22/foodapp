const KEY = 'fm-courier-location-queue-v2';
const MAX_ITEMS = 80;

export interface QueuedLocation {
  id: string;
  courierId: string;
  latitude: number;
  longitude: number;
  orderId?: string;
  ts: number;
}

function fingerprint(lat: number, lng: number, courierId: string): string {
  const bucket = Math.floor(Date.now() / 60_000);
  return `${courierId}:${lat.toFixed(4)}:${lng.toFixed(4)}:${bucket}`;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function queueLocation(payload: Omit<QueuedLocation, 'ts' | 'id'>) {
  if (typeof window === 'undefined') return;
  const q = getQueue();
  const fp = fingerprint(payload.latitude, payload.longitude, payload.courierId);
  const last = q[q.length - 1];
  if (last && fingerprint(last.latitude, last.longitude, last.courierId) === fp) return;

  q.push({ ...payload, id: makeId(), ts: Date.now() });
  if (q.length > MAX_ITEMS) q.splice(0, q.length - MAX_ITEMS);
  persist(q);
}

function persist(q: QueuedLocation[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q));
  } catch {
    /* storage full — drop oldest half */
    const trimmed = q.slice(Math.floor(q.length / 2));
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      /* ignore */
    }
  }
}

export function getQueue(): QueuedLocation[] {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem('fm-courier-location-queue');
    const parsed = JSON.parse(raw || '[]') as QueuedLocation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(KEY);
  localStorage.removeItem('fm-courier-location-queue');
}

export async function flushQueue(
  emit: (p: QueuedLocation) => void | Promise<void>,
  options?: { delayMs?: number },
) {
  const q = getQueue();
  const delay = options?.delayMs ?? 120;
  for (const item of q) {
    await emit(item);
    await new Promise((r) => setTimeout(r, delay));
  }
  clearQueue();
}

export function queueSize(): number {
  return getQueue().length;
}
