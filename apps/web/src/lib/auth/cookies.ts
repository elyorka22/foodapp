import { ACCESS_COOKIE, REFRESH_COOKIE } from './constants';

const MAX_AGE_ACCESS = 60 * 60 * 24 * 7;
const MAX_AGE_REFRESH = 60 * 60 * 24 * 30;

function cookieAttrs(maxAge: number) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  return `path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

export function setAuthCookies(accessToken: string, refreshToken: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_COOKIE}=${encodeURIComponent(accessToken)}; ${cookieAttrs(MAX_AGE_ACCESS)}`;
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; ${cookieAttrs(MAX_AGE_REFRESH)}`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`;
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}
