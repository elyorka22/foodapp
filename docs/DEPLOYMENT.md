# Deployment (MVP — 2 droplets)

See **[MVP_DEPLOYMENT.md](./MVP_DEPLOYMENT.md)** for the full guide.

## Quick commands

**Frontend droplet:**

```bash
docker compose -f docker-compose.frontend.yml build --no-cache web
docker compose -f docker-compose.frontend.yml up -d
```

**Backend droplet:**

```bash
docker compose -f docker-compose.backend.yml up -d --build
docker exec foodapp-api npx prisma migrate deploy
```
