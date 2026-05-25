# Post-MVP Stabilization Guide

Production hardening for Uzbekistan operations — modular monolith unchanged.

## Health & uptime

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/health` | Full check (DB + Redis + memory) |
| `GET /api/v1/health/live` | Liveness (process up) |
| `GET /api/v1/health/ready` | Readiness (DB connected) |
| `GET /api/v1/monitoring/metrics` | Latency, memory, route stats (public) |
| `GET /api/v1/monitoring/queues` | BullMQ job counts (admin JWT) |

Configure uptime monitors on `/health/live` (frontend) and `/health` (backend).

## Sentry

```bash
SENTRY_DSN=https://...@sentry.io/...
APP_VERSION=1.2.0
```

Install is included in API package. Errors 5xx are logged with stack traces locally even without Sentry.

## Operator workflows (`/api/v1/ops` — ADMIN only)

| Action | Endpoint |
|--------|----------|
| Live order board | `GET /ops/live-board` |
| Assign courier | `POST /ops/orders/:id/assign-courier` |
| Reassign courier | `POST /ops/orders/:id/reassign-courier` |
| Emergency cancel | `POST /ops/orders/:id/emergency-cancel` |
| Failed delivery | `POST /ops/orders/:id/mark-failed` |
| Operator note | `POST /ops/orders/:id/note` |
| Customer support flag | `POST /ops/orders/:id/support` |
| Incident log | `GET /ops/incidents` |

Admin UI: http://localhost:3001/ops

## Database backups

```bash
chmod +x scripts/db-backup.sh scripts/db-restore.sh
export POSTGRES_USER=foodmarket POSTGRES_PASSWORD=... POSTGRES_DB=foodmarket
./scripts/db-backup.sh
# Restore: ./scripts/db-restore.sh backups/foodmarket_YYYYMMDD.sql.gz
```

Cron example (daily 3am):

```cron
0 3 * * * cd /opt/foodmarket && ./scripts/db-backup.sh >> /var/log/fm-backup.log 2>&1
```

## Rate limits

- Default: 100 req/min per IP
- Login: 10/min
- Uploads: 20/min
- Health/metrics: exempt

## Courier GPS

- 4s throttle between updates
- GPS jump filter (cell tower errors)
- EMA smoothing on coordinates
- Offline queue in courier app localStorage
- WebSocket fallback: polling → websocket on reconnect

## Mobile UX

- `OfflineBanner` on customer app
- `PullToRefresh` component in `@foodmarket/ui`
- 44px minimum touch targets
- Lazy images with blur placeholder

## Security audit trail

Failed logins and all ops actions write to `audit_logs`. Review via `/ops/incidents`.

## Docker production tuning

- API memory limit 512M, worker 256M
- Healthchecks with `start_period`
- Graceful shutdown on SIGTERM/SIGINT
- Env validation fails fast on boot if `DATABASE_URL` or `JWT_SECRET` missing

## Nginx

- Gzip for text/JS/CSS
- `/_next/static/` cached 7 days
- Increase `worker_connections` for peak lunch hours

## Rolling restart (zero-downtime prep)

```bash
docker compose -f docker-compose.backend.yml up -d --no-deps --build api
# Wait for health, then worker
docker compose -f docker-compose.backend.yml up -d --no-deps --build worker
```

Frontend: rebuild one app at a time behind nginx.
