# FoodApp MVP — 2 droplet deployment

## Connection flow

```
Browser (https://foodapp.uz)
  → nginx (foodapp-nginx :80/:443)
  → Next.js (foodapp-web :3000)
  → HTTPS API calls to https://api.foodapp.uz/api/v1
  → NestJS (foodapp-api :4000)
  → PostgreSQL (foodapp-postgres, private Docker network)
```

Panels on **one domain** (paths only):

| Panel | URL |
|-------|-----|
| Storefront | https://foodapp.uz/customer |
| Admin | https://foodapp.uz/admin |
| Restaurant | https://foodapp.uz/restaurant |
| Courier | https://foodapp.uz/courier |

## DNS

| Record | Points to |
|--------|-----------|
| `foodapp.uz` | Frontend droplet IP |
| `www.foodapp.uz` | Frontend droplet IP (optional) |
| `api.foodapp.uz` | Backend droplet IP |

## Compose files (only these two)

| File | Droplet | Containers |
|------|---------|------------|
| `docker-compose.frontend.yml` | Frontend | `foodapp-web`, `foodapp-nginx` |
| `docker-compose.backend.yml` | Backend | `foodapp-api`, `foodapp-postgres` |

Removed: `docker-compose.yml`, `docker-compose.prod.yml`, workers, Redis, BullMQ.

## Frontend droplet

**Files needed:** repo root, `docker-compose.frontend.yml`, `.env`, `infrastructure/docker/Dockerfile.web`, `infrastructure/nginx/*`

```bash
git pull
cp .env.frontend.example .env
# NEXT_PUBLIC_API_URL=https://api.foodapp.uz/api/v1
# JWT_SECRET=<same as backend>

docker compose -f docker-compose.frontend.yml build --no-cache web
docker compose -f docker-compose.frontend.yml up -d
```

**Public ports:** 80, 443  
**Private:** 3000 (web, internal only)

`NEXT_PUBLIC_API_URL` is baked at **build time**. After changing it, rebuild with `--no-cache`.

## Backend droplet

**Files needed:** full monorepo (API build), `docker-compose.backend.yml`, `.env`

```bash
git pull
cp .env.backend.example .env
# Set POSTGRES_PASSWORD, JWT_SECRET, CORS_ORIGINS=https://foodapp.uz

docker compose -f docker-compose.backend.yml up -d --build
docker exec foodapp-api npx prisma migrate deploy
```

**Public ports:** 4000 (API)  
**Private:** 5432 (postgres, do not expose publicly)

## Environment variables

### Frontend `.env`

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | Build time | `https://api.foodapp.uz/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Build time | `https://foodapp.uz` |
| `JWT_SECRET` | Runtime | same as backend |

### Backend `.env`

| Variable | Required | Example |
|----------|----------|---------|
| `POSTGRES_PASSWORD` | Yes | strong password |
| `JWT_SECRET` | Yes | long random |
| `CORS_ORIGINS` | Yes | `https://foodapp.uz` |
| `DATABASE_URL` | Auto in compose | uses postgres service |

## Migration from old setup

1. Stop old stacks on both droplets: `docker compose down` (any old compose file).
2. Frontend: remove postgres/redis/api containers if present.
3. Backend: remove web/nginx containers if present.
4. Pull this repo version.
5. Copy new `.env` examples.
6. Rebuild frontend with `--no-cache` (fixes localhost API URL).
7. Run backend migrations on `foodapp-api`.
8. Verify login in browser DevTools → Network → `https://api.foodapp.uz/api/v1/auth/login`.

## Health checks

- API live: `GET https://api.foodapp.uz/api/v1/health/live`
- API ready: `GET https://api.foodapp.uz/api/v1/health/ready`
