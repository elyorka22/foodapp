# API Reference

Base URL: `http://localhost:4000/api/v1`  
Swagger UI: `http://localhost:4000/docs`

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Email/password registration |
| POST | `/auth/login` | — | Login |
| POST | `/auth/guest` | — | Guest session for checkout |
| POST | `/auth/refresh` | — | Refresh tokens |

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Profile |
| PATCH | `/users/me` | JWT | Update profile |
| POST | `/users/me/addresses` | JWT | Add address |

## Restaurants

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/restaurants` | — | List (city, featured, pagination) |
| GET | `/restaurants/slug/:slug` | — | Detail + menus |
| GET | `/restaurants/:id` | — | By ID |
| PATCH | `/restaurants/:id` | Owner/Admin | Update |

## Businesses

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/businesses` | — | List by type (GROCERY, FLOWER, etc.) |
| GET | `/businesses/slug/:slug` | — | Detail + categories |
| GET | `/businesses/:id/inventory` | Owner | Stock levels |
| PATCH | `/businesses/inventory/:productId` | Owner | Update quantity |

## Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products?restaurantId=` | — | List |
| GET | `/products/:id` | — | Detail |
| POST | `/products` | Owner | Create |
| PATCH | `/products/:id` | Owner | Update |
| DELETE | `/products/:id` | Owner | Soft-delete |

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/orders` | Optional JWT | Create (guest or user) |
| GET | `/orders` | JWT | List (filtered by role) |
| GET | `/orders/:id` | Optional | Detail + status history |
| PATCH | `/orders/:id/status` | Vendor/Courier/Admin | Status transition |
| PATCH | `/orders/:id/assign-courier` | Admin/Courier | Assign courier |

## Delivery

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/delivery/quote` | — | Fee by lat/lng (Haversine) |

## Couriers

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/couriers/available` | Admin | Available couriers |
| GET | `/couriers/me` | Courier | Profile |
| GET | `/couriers/me/orders` | Courier | Active deliveries |
| GET | `/couriers/:id` | — | Public profile |
| PATCH | `/couriers/:id/status` | Courier | ONLINE/OFFLINE/BUSY |

## Promos

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/promos/validate?code=&subtotal=` | — | Validate promo |
| GET | `/promos` | Admin | List |
| POST | `/promos` | Admin | Create |

## Reviews

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/reviews` | JWT | Submit after delivery |
| GET | `/reviews?restaurantId=` | — | List |

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | In-app notifications |
| PATCH | `/notifications/:id/read` | JWT | Mark read |
| POST | `/notifications/device` | JWT | Register FCM token |

## Analytics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/dashboard` | Admin/Vendor | KPIs |

## Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/payments/order/:orderId/confirm` | Admin | Mark paid |

## Uploads

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/uploads/image` | Vendor | Multipart image (CDN path) |

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | DB connectivity check |

## WebSocket (`/tracking`)

| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe:order` | Client→Server | `orderId` |
| `subscribe:courier` | Client→Server | `courierId` |
| `courier:location` | Client→Server | `{ courierId, latitude, longitude, orderId? }` |
| `location:update` | Server→Client | Location broadcast |
| `order:status` | Server→Client | Status change |
