# FoodApp MVP

Minimal local delivery marketplace with **2-droplet deployment**.

## Runtime architecture

- **Frontend droplet**: `foodapp-web` (Next.js) + `foodapp-nginx`
- **Backend droplet**: `foodapp-api` (NestJS) + `foodapp-postgres`
- Public web: `https://foodapp.uz`
- Public API: `https://api.foodapp.uz/api/v1`

Panels are route-based on one domain:

- `/admin`
- `/restaurant`
- `/courier`
- `/customer`

## What this MVP focuses on

- JWT login/register/refresh/logout
- Role-based panel access
- Product catalog and cart
- Checkout and order creation
- Restaurant/courier/admin order status updates

No workers, no BullMQ, no Redis queues, no realtime gateway.

## Compose files (only these)

- `docker-compose.frontend.yml`
- `docker-compose.backend.yml`

## Deployment

### Frontend droplet

```bash
git pull
docker compose -f docker-compose.frontend.yml build --no-cache web
docker compose -f docker-compose.frontend.yml up -d
```

### Backend droplet

```bash
git pull
docker compose -f docker-compose.backend.yml up -d --build
docker exec foodapp-api npx prisma migrate deploy
```

Full production details: `docs/MVP_DEPLOYMENT.md`.
