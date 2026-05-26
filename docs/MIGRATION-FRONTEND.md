# Unified frontend migration

## What changed

Five separate Next.js apps (`customer`, `admin`, `courier`, `business`, `restaurant`) were merged into **one** app: `@foodmarket/web` in `apps/web`.

## Routes

| URL | Panel |
|-----|--------|
| `/` | Redirect → `/customer` |
| `/customer` | Customer home |
| `/customer/restaurants`, `/customer/cart`, `/customer/checkout`, … | Customer storefront |
| `/admin` | Admin dashboard |
| `/admin/ops`, `/admin/incidents`, … | Admin tools |
| `/courier` | Courier |
| `/business` | Business panel |
| `/restaurant` | Restaurant panel (menu & orders) |

Customer venue pages live under `/customer/restaurants/[slug]` and `/customer/shop/[slug]` so they do not clash with the `/restaurant` partner panel.

## Subdomains (optional)

`middleware.ts` rewrites legacy hosts to path prefixes:

- `www.foodmarket.uz` → `/customer/*`
- `admin.foodmarket.uz` → `/admin/*`
- `courier.foodmarket.uz` → `/courier/*`
- etc.

## Docker

**Before:** 5 Next.js containers + nginx  
**After:** 1 `web` container (`infrastructure/docker/Dockerfile.web`) + nginx

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

## Local dev

```bash
npm install
npm run dev:web   # http://localhost:3000/customer
```

## Build (production)

Only one frontend build command:

```bash
npm run build -w @foodmarket/web
```

## Environment

Single origin — only these are required:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Removed workspaces

- `@foodmarket/customer`
- `@foodmarket/admin`
- `@foodmarket/courier`
- `@foodmarket/business`
- `@foodmarket/restaurant`

Backend (`api`, `workers`, `database`) unchanged.
