'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@foodmarket/shared-types';
import { apiClient, type AuthUser } from '@/lib/api';
import { AUTH_STORAGE_KEY } from '@/lib/auth/constants';
import { clearAuthCookies, readCookie, setAuthCookies } from '@/lib/auth/cookies';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/constants';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

function syncLegacyStorage(accessToken: string | null, refreshToken: string | null) {
  if (typeof window === 'undefined') return;
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  else localStorage.removeItem('accessToken');
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  else localStorage.removeItem('refreshToken');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      role: null,
      permissions: [],
      isAuthenticated: false,
      hydrated: false,

      login(accessToken, refreshToken, user) {
        setAuthCookies(accessToken, refreshToken);
        syncLegacyStorage(accessToken, refreshToken);
        const role = user.role.name as UserRole;
        const permissions = user.permissions ?? [];
        set({
          accessToken,
          refreshToken,
          user,
          role,
          permissions,
          isAuthenticated: true,
        });
      },

      async logout() {
        const { accessToken, refreshToken } = get();
        try {
          if (accessToken) {
            await apiClient.logout(accessToken, refreshToken ?? undefined);
          }
        } catch {
          /* ignore */
        }
        clearAuthCookies();
        syncLegacyStorage(null, null);
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          role: null,
          permissions: [],
          isAuthenticated: false,
        });
      },

      async refresh() {
        const token = get().refreshToken ?? readCookie(REFRESH_COOKIE);
        if (!token) return false;
        try {
          const res = await apiClient.refresh(token);
          get().login(res.accessToken, res.refreshToken, res.user);
          return true;
        } catch {
          await get().logout();
          return false;
        }
      },

      async hydrate() {
        if (get().hydrated) return;
        let accessToken = get().accessToken ?? readCookie(ACCESS_COOKIE);
        let refreshToken = get().refreshToken ?? readCookie(REFRESH_COOKIE);
        if (!accessToken && typeof window !== 'undefined') {
          accessToken = localStorage.getItem('accessToken');
          refreshToken = refreshToken ?? localStorage.getItem('refreshToken');
        }
        if (!accessToken) {
          set({ hydrated: true, isAuthenticated: false });
          return;
        }
        try {
          const me = await apiClient.me(accessToken);
          const user: AuthUser = {
            id: me.id,
            email: me.email,
            firstName: me.firstName,
            lastName: me.lastName,
            isGuest: me.isGuest,
            role: { name: me.role },
            permissions: me.permissions,
          };
          if (refreshToken) setAuthCookies(accessToken, refreshToken);
          syncLegacyStorage(accessToken, refreshToken);
          set({
            accessToken,
            refreshToken,
            user,
            role: me.role as UserRole,
            permissions: me.permissions ?? [],
            isAuthenticated: true,
            hydrated: true,
          });
          return;
        } catch {
          const ok = refreshToken ? await get().refresh() : false;
          if (!ok) {
            clearAuthCookies();
            syncLegacyStorage(null, null);
            set({
              accessToken: null,
              refreshToken: null,
              user: null,
              role: null,
              permissions: [],
              isAuthenticated: false,
              hydrated: true,
            });
          } else {
            set({ hydrated: true });
          }
        }
      },

      setUser(user) {
        set({
          user,
          role: user.role.name as UserRole,
          permissions: user.permissions ?? [],
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        role: s.role,
        permissions: s.permissions,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);

export function getAuthToken(): string | null {
  const fromStore = useAuthStore.getState().accessToken;
  if (fromStore) return fromStore;
  if (typeof window === 'undefined') return null;
  return readCookie(ACCESS_COOKIE) ?? localStorage.getItem('accessToken');
}
