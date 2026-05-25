const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const WS = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export function formatUzs(n: number) {
  return `${Math.round(n).toLocaleString('uz-UZ')} so'm`;
}

export { WS };
