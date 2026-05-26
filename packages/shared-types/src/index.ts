export type UserRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'RESTAURANT_OWNER'
  | 'BUSINESS_OWNER'
  | 'COURIER';

export type PermissionSlug =
  | 'manage_users'
  | 'manage_roles'
  | 'manage_orders'
  | 'manage_products'
  | 'manage_dispatch'
  | 'manage_businesses'
  | 'manage_restaurants'
  | 'manage_settings';

export const ALL_PERMISSIONS: PermissionSlug[] = [
  'manage_users',
  'manage_roles',
  'manage_orders',
  'manage_products',
  'manage_dispatch',
  'manage_businesses',
  'manage_restaurants',
  'manage_settings',
];

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COURIER_ASSIGNED'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface JwtPayload {
  sub: string;
  email: string | null;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  options?: Record<string, string>;
}

export interface CourierLocationUpdate {
  courierId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  orderId?: string;
}

export interface DeliveryFeeQuote {
  distanceKm: number;
  deliveryFee: number;
  estimatedMinutes: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Buyurtma qabul qilindi',
  CONFIRMED: 'Tasdiqlandi',
  PREPARING: 'Tayyorlanmoqda',
  READY_FOR_PICKUP: 'Olib ketishga tayyor',
  COURIER_ASSIGNED: 'Kuryer tayinlandi',
  PICKED_UP: 'Olib ketildi',
  ON_THE_WAY: "Yo'lda",
  DELIVERED: 'Yetkazildi',
  CANCELLED: 'Bekor qilindi',
  REFUNDED: 'Qaytarildi',
};

export * from './rbac';
