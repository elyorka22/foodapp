const KEY = 'foodmarket_favorites';

export function getFavoriteIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function setFavorite(id: string, liked: boolean) {
  const set = getFavoriteIds();
  if (liked) set.add(id);
  else set.delete(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function isFavorite(id: string): boolean {
  return getFavoriteIds().has(id);
}
