# FoodMarket Architecture

## Overview

FoodMarket is a **multi-vendor food delivery and grocery marketplace** built as a Turborepo monorepo with a modular NestJS API, five Next.js 15 frontends, PostgreSQL + Prisma, Redis + BullMQ workers, and WebSocket realtime tracking.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Nginx (API Gateway)                              │
│  foodmarket.local │ admin.* │ restaurant.* │ business.* │ courier.*   │
└────────────┬────────────────────────────────────────────────────────────┘
             │
    ┌────────┴────────┬──────────────┬──────────────┬──────────────┐
    ▼                 ▼              ▼              ▼              ▼
 Customer          Admin         Restaurant       Business        Courier
 :3000             :3001            :3002           :3003          :3004
    │                 │              │              │              │
    └─────────────────┴──────────────┴──────────────┴──────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │   NestJS API      │
                          │   /api/v1         │
                          │   :4000           │
                          └─────────┬─────────┘
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              PostgreSQL         Redis          WebSocket
              (Prisma)        (BullMQ queues)   /tracking
                    │
                    ▼
              Background Workers
              (notifications, analytics)
```

## Applications

| App | Port | Role | Users |
|-----|------|------|-------|
| `apps/customer` | 3000 | Browse, cart, guest checkout, tracking | Customers, guests |
| `apps/admin` | 3001 | Platform analytics, vendors, promos | ADMIN |
| `apps/restaurant` | 3002 | Menu, orders, hours | RESTAURANT_OWNER |
| `apps/business` | 3003 | Products, inventory, grocery orders | BUSINESS_OWNER |
| `apps/courier` | 3004 | Live GPS, delivery steps | COURIER |

## Backend Modules (Microservice-Ready)

Each NestJS module maps to a future service boundary:

- `auth` — JWT, refresh tokens, guest sessions
- `users` — profiles, addresses
- `restaurants` / `businesses` — multi-vendor catalog
- `products` — menu/product CRUD
- `orders` — lifecycle pipeline, status machine
- `delivery` — Haversine distance, fee calculation
- `couriers` + `TrackingGateway` — realtime location
- `payments` — payment records (provider-pluggable)
- `promos` — percentage, fixed, free delivery
- `reviews` — ratings aggregation
- `notifications` — in-app + FCM queue
- `analytics` — dashboard aggregates
- `uploads` — CDN-ready local storage

## Order Status Pipeline

```
PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP
  → COURIER_ASSIGNED → PICKED_UP → ON_THE_WAY → DELIVERED
```

Cancelled/refunded paths enforced in `OrdersService`.

## Database

PostgreSQL with optimized indexes on:
- Geo queries (`latitude`, `longitude`)
- Order filters (`status`, `customerId`, `vendorId`)
- Courier tracking (`courierId`, `createdAt`)

See `packages/database/prisma/schema.prisma`.

## Caching & Queues

- **Redis**: BullMQ `orders` and `notifications` queues
- **Workers**: `workers/` process async jobs (push, analytics)

## Realtime

Socket.IO namespace `/tracking`:
- `subscribe:order` — customer tracking UI
- `courier:location` — GPS updates from courier app
- `location:update` — broadcast to subscribers

## Security

- JWT access + refresh tokens
- Role-based guards (`RolesGuard`)
- Optional JWT for guest checkout
- CORS configured per environment

## Scaling Path

1. Extract modules to services behind Nginx/gRPC
2. Add read replicas for PostgreSQL
3. Redis Cluster for queues
4. Object storage (S3/Spaces) for uploads + CDN
5. Horizontal API replicas with sticky sessions for WebSocket (or Redis adapter)
