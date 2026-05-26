# Unified frontend migration

## What changed

Five separate Next.js apps (`customer`, `admin`, `courier`, `business`, `restaurant`) were merged into **one** app: `@foodmarket/web`.

## Routes

| URL | Panel |
|-----|--------|
| `/` | Customer (home) |
| `/restaurants`, `/restaurants/[slug]`, `/shops`, `/cart`, … | Customer |
| `/admin` | Admin dashboard |
| `/admin/ops`, `/admin/incidents`, … | Admin tools |
| `/courier` | Courier |
| `/business` | Business |
| `/restaurant`, `/restaurant/orders`, `/restaurant/menu` | Restaurant |

## Subdomains (optional)

`middleware.ts` rewrites legacy hosts to path prefixes:

- `admin.foodmarket.uz` → `/admin/*`
- `courier.foodmarket.uz` → `/courier/*`
- etc.

## Docker

**Before:** 5 Next.js containers + nginx  
**After:** 1 `web` container + nginx

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

## Local dev

```bash
npm install
npm run dev:web   # http://localhost:3000
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
