export type UserRole =
  | 'CUSTOMER'
  | 'ADMIN'
  | 'RESTAURANT_OWNER'
  | 'BUSINESS_OWNER'
  | 'COURIER';

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
  PENDING: 'Order placed',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing your order',
  READY_FOR_PICKUP: 'Ready for pickup',
  COURIER_ASSIGNED: 'Courier assigned',
  PICKED_UP: 'Picked up',
  ON_THE_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};
