function resolveApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return 'https://api.foodapp.uz/api/v1';
}

export const API_URL = resolveApiUrl();

export function formatUzs(amount: number) {
  return `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;
}

const ACCESS_COOKIE = 'fm_access';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${ACCESS_COOKIE}=([^;]*)`));
  if (match) return decodeURIComponent(match[1]);
  return localStorage.getItem('accessToken');
}

const RETRY_METHODS = new Set(['GET', 'HEAD']);
const MAX_RETRIES = 2;

function isRetryable(status: number, err: unknown) {
  if (err instanceof TypeError) return true;
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

export async function api<T>(
  path: string,
  options?: RequestInit & { token?: string; retries?: number },
): Promise<T> {
  const { token, retries = MAX_RETRIES, ...init } = options ?? {};
  const auth = token ?? getToken();
  const method = (init.method ?? 'GET').toUpperCase();
  const canRetry = RETRY_METHODS.has(method);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= (canRetry ? retries : 0); attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
          ...init.headers,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const message = (err as { message?: string }).message || `Xatolik ${res.status}`;
        if (canRetry && attempt < retries && isRetryable(res.status, null)) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
          continue;
        }
        throw new Error(message);
      }
      return res.json();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error('Tarmoq xatosi');
      if (canRetry && attempt < retries && isRetryable(0, e)) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError ?? new Error('Xatolik');
}

export interface ProductOption {
  id: string;
  name: string;
  priceDelta: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelect: number;
  options: ProductOption[];
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isFeatured?: boolean;
  optionGroups?: ProductOptionGroup[];
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  cuisineTags: string[];
  rating: number;
  avgPrepMinutes: number;
  minOrderAmount: number;
  isFeatured: boolean;
  isOpen?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface RestaurantDetail extends Restaurant {
  menus: { id: string; name: string; products: Product[] }[];
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  type: string;
  rating: number;
  minOrderAmount?: number;
  coverImageUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface BusinessDetail extends Business {
  categories: { id: string; name: string; products: Product[] }[];
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  district?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface DeliveryQuote {
  distanceKm: number;
  deliveryFee: number;
  estimatedMinutes: number;
  minOrderAmount: number;
}

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isGuest?: boolean;
  role: { name: string };
  permissions?: string[];
}

export interface MeResponse {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  role: string;
  permissions: string[];
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  isGuest: boolean;
  role: { id: string; name: string };
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  distanceKm?: number;
  notes?: string;
  estimatedDelivery?: string;
  items: { id: string; name: string; quantity: number; price: number; productId: string }[];
  deliveryAddress?: Address;
  restaurant?: { name: string };
  business?: { name: string };
  courier?: { id: string; currentLat?: number; currentLng?: number };
}

export const apiClient = {
  restaurants: (params?: string) => api<{ items: Restaurant[] }>(`/restaurants?${params ?? ''}`),
  restaurant: (slug: string) => api<RestaurantDetail>(`/restaurants/slug/${slug}`),
  businesses: (params?: string) => api<{ items: Business[] }>(`/businesses?${params ?? ''}`),
  business: (slug: string) => api<BusinessDetail>(`/businesses/slug/${slug}`),
  deliveryQuote: (q: Record<string, number>) =>
    api<DeliveryQuote>(
      `/delivery/quote?${new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)]))}`,
    ),
  guestAuth: () => api<{ accessToken: string }>('/auth/guest', { method: 'POST' }),
  login: (email: string, password: string) =>
    api<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (body: {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName?: string;
  }) =>
    api<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...body, role: 'CUSTOMER' }),
    }),
  me: (token: string) => api<MeResponse>('/auth/me', { token }),
  refresh: (refreshToken: string) =>
    api<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  logout: (token: string, refreshToken?: string) =>
    api<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      token,
    }),
  adminUsers: (token: string, page = 1) =>
    api<{ items: AdminUserRow[]; total: number }>(`/admin/users?page=${page}&limit=20`, { token }),
  createStaff: (
    token: string,
    body: { email: string; password: string; role: string; firstName?: string; lastName?: string },
  ) =>
    api<{ user: AdminUserRow; temporaryPassword: string }>('/admin/users/staff', {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    }),
  assignUserRole: (token: string, userId: string, role: string) =>
    api(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
      token,
    }),
  deactivateUser: (token: string, userId: string) =>
    api(`/admin/users/${userId}/deactivate`, { method: 'PATCH', token }),
  createAddress: (body: Partial<Address>, token?: string) =>
    api<Address>('/addresses', { method: 'POST', body: JSON.stringify(body), token }),
  myAddresses: (token: string) => api<Address[]>('/addresses/me', { token }),
  createOrder: (body: unknown, token?: string) =>
    api<OrderDetail>('/orders', { method: 'POST', body: JSON.stringify(body), token }),
  orders: (token: string, page = 1) =>
    api<{ items: OrderDetail[]; total: number }>(`/orders?page=${page}&limit=20`, { token }),
  order: (id: string) => api<OrderDetail>(`/orders/${id}`),
  reorder: (id: string, token?: string) =>
    api<OrderDetail>(`/orders/${id}/reorder`, { method: 'POST', token }),
  cancelOrder: (id: string, reason: string, token?: string) =>
    api<OrderDetail>(`/orders/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
      token,
    }),
  validatePromo: (code: string, subtotal: number) =>
    api<{ discount: number; freeDelivery?: boolean }>(
      `/promos/validate?code=${encodeURIComponent(code)}&subtotal=${subtotal}`,
    ),
};
