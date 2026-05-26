const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function panelApi<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
