# FoodMarket

Multi-vendor **food delivery and grocery marketplace** — production-ready monorepo with Next.js 15, NestJS, PostgreSQL/Prisma, Redis queues, WebSocket courier tracking, and Docker deployment for DigitalOcean VPS.

Inspired by Glovo, Wolt, and Uber Eats: clean white UI, green accents, mobile-first with bottom navigation and sticky cart.

## Stack

| Layer | Technology |
|-------|------------|
| Customer & panels | Next.js 15, Tailwind, TypeScript |
| API | NestJS (modular, microservice-ready) |
| Database | PostgreSQL + Prisma |
| Cache/queues | Redis + BullMQ |
| Realtime | Socket.IO `/tracking` |
| Deploy | Docker Compose + Nginx |

## Applications

1. **Customer** (`apps/customer`) — browse, cart, guest checkout, live tracking  
2. **Admin** (`apps/admin`) — platform analytics, vendors, promos  
3. **Restaurant** (`apps/restaurant`) — menu CRUD, order pipeline  
4. **Business** (`apps/business`) — grocery/flowers/shops, inventory  
5. **Courier** (`apps/courier`) — GPS tracking, delivery workflow  

## Quick start

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:generate && npm run db:migrate && npm run db:seed
```

Run services (separate terminals):

```bash
npm run dev:api
npm run dev -w foodmarket-workers
npm run dev:customer
npm run dev -w @foodmarket/admin
npm run dev -w @foodmarket/restaurant
npm run dev -w @foodmarket/business
npm run dev -w @foodmarket/courier
```

| Service | URL |
|---------|-----|
| Customer | http://localhost:3000 |
| Admin | http://localhost:3001 |
| Restaurant | http://localhost:3002 |
| Business | http://localhost:3003 |
| Courier | http://localhost:3004 |
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/docs |

### Demo logins (after seed — Uzbekistan)

| Email | Role | Password |
|-------|------|----------|
| admin@foodmarket.uz | Admin | Password123! |
| customer@foodmarket.uz | Customer | Password123! |
| restaurant@foodmarket.uz | Restaurant | Password123! |
| business@foodmarket.uz | Business | Password123! |
| courier@foodmarket.uz | Courier | Password123! |

Promo code: `SALOM20` · Currency: UZS · Timezone: Asia/Tashkent

### Two-droplet production deploy

```bash
# Backend droplet (API, Postgres, Redis, workers)
docker compose -f docker-compose.backend.yml up -d --build

# Frontend droplet (5 Next apps + Nginx)
# Set NEXT_PUBLIC_API_URL to backend public URL
docker compose -f docker-compose.frontend.yml up -d --build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Project structure

```
foodAPP/
├── apps/
│   ├── api/              # NestJS backend
│   ├── customer/         # Customer PWA-style app
│   ├── admin/
│   ├── restaurant/
│   ├── business/
│   └── courier/
├── packages/
│   ├── database/         # Prisma schema & client
│   ├── shared-types/
│   └── ui/               # Shared React components
├── workers/              # BullMQ background jobs
├── infrastructure/
│   ├── docker/
│   └── nginx/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DEPLOYMENT.md
└── docker-compose.yml
```

## Core features

- Multi-vendor (restaurants + grocery/flower/local shops)
- Guest checkout + optional JWT auth
- Role-based permissions (5 roles)
- Real-time courier tracking (WebSocket)
- Order lifecycle with validated status transitions
- Product/menu CRUD, inventory, opening hours
- Promo codes, reviews, delivery fee by distance (km)
- Push notification infrastructure (FCM-ready workers)
- Analytics dashboard
- Image uploads (CDN-ready)

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API routes](docs/API.md)
- [DigitalOcean deployment](docs/DEPLOYMENT.md)

## Production deploy

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for SSL, DNS, and scaling.

## License

Private — all rights reserved.
