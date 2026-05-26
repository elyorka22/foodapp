# Deployment — 2× DigitalOcean Droplets (Uzbekistan MVP)

## Architecture

| Droplet | Services | Compose file |
|---------|----------|--------------|
| **Backend** | NestJS API :4000, PostgreSQL, Redis, BullMQ workers | `docker-compose.backend.yml` |
| **Frontend** | Single Next.js app (`@foodmarket/web`) + Nginx | `docker-compose.frontend.yml` |

Point `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` on the frontend droplet to the backend public IP/domain.

## Backend droplet

```bash
cp .env.example .env
# Edit: POSTGRES_*, JWT_*, TELEGRAM_*, DO_SPACES_*, delivery fees (UZS)

docker compose -f docker-compose.backend.yml up -d --build
docker exec foodmarket-api npx prisma migrate deploy
docker exec foodmarket-api npx tsx packages/database/prisma/seed.ts
```

Open firewall: `4000` (API), optionally restrict Postgres/Redis to private network only.

## Frontend droplet

```bash
# .env — critical:
NEXT_PUBLIC_API_URL=https://api.foodmarket.uz/api/v1
NEXT_PUBLIC_WS_URL=wss://api.foodmarket.uz

docker compose -f docker-compose.frontend.yml up -d --build
```

Frontend build on the VPS (if building outside Docker):

```bash
npm run build -w @foodmarket/web
```

Routes: `/customer` (storefront), `/admin`, `/restaurant`, `/business`, `/courier`.

DNS (example):

- `foodmarket.uz` → frontend (`/customer` storefront; `/` redirects)
- `admin.foodmarket.uz` → frontend
- `api.foodmarket.uz` → **backend** (or proxy API through frontend nginx)

## Telegram operations

1. Create bot via @BotFather
2. Set `TELEGRAM_BOT_TOKEN`
3. Add bot to ops chats; set `TELEGRAM_CHAT_ORDERS`, `TELEGRAM_CHAT_ADMIN`, etc.
4. Workers process `telegram` queue with retries

## DigitalOcean Spaces

Configure `DO_SPACES_*` and `CDN_BASE_URL` for product images (WebP + thumbnails via API upload).

## Health checks

- API: `GET /api/v1/health`
- Compose services use `restart: always` and healthchecks on postgres/redis/api

## Local development

```bash
docker compose up -d
npm run db:generate && npm run db:push && npm run db:seed
npm run dev:api
npm run dev -w foodmarket-workers
npm run dev:customer
```
