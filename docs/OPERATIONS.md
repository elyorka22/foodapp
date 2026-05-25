# Operations Runbook — FoodMarket UZ

Real-world delivery operations guide for operators, support, and on-call engineers.

## Operator console

**URL:** Admin app → `/ops`

| Tab | Purpose |
|-----|---------|
| Buyurtmalar | Kanban by status, urgency badges, manual courier assign |
| Restoranlar | Open/closed + backlog per venue |
| Navbatlar | BullMQ job counts (orders, notifications, telegram) |

### Keyboard shortcuts

- **R** — Refresh all panels
- **A** — Pre-fill top dispatch suggestion (still manual confirm)
- **Esc** — Deselect order

### Manual dispatch (required)

1. Select order on board (especially `READY_FOR_PICKUP` without courier).
2. Review **Tavsiya** scores (distance, load, zone).
3. Click suggestion or pick courier from list.
4. Press **Tayinlash** — never auto-assigned.

### Emergency actions

| Action | When |
|--------|------|
| Favqulodda bekor | Customer/restaurant cancel, fraud |
| Yetkazilmadi | Courier could not complete |
| Yetkazishni qayta boshlash | Failed delivery recovery → back to ready |

All actions write to `AuditLog` and may trigger Telegram `admin.alert`.

## API endpoints (ADMIN token)

| Endpoint | Description |
|----------|-------------|
| `GET /ops/hub` | Full snapshot |
| `GET /ops/live-board` | Orders + couriers + urgency |
| `GET /ops/orders/:id/dispatch-suggest` | Ranked courier suggestions |
| `POST /ops/orders/:id/assign-courier` | Manual assign |
| `GET /monitoring/observability` | HTTP, WS, Redis, queues, infra flags |
| `GET /analytics/operations` | SLA, cancellations, retention, peak forecast |

## Monitoring

### Health

- `GET /health` — DB + Redis + memory
- `GET /health/ready` — DB connectivity for load balancer

### Observability (`/monitoring/observability`)

- **slowQueries** — Prisma queries over `SLOW_QUERY_MS` (default 500)
- **websocket** — connections, GPS throttle/reject counts
- **queues** — BullMQ waiting/failed; alert if waiting > 50
- **infrastructure** — `DATABASE_READ_URL`, `REDIS_WS_ADAPTER_URL`, `CDN_BASE_URL`

### Sentry

Set `SENTRY_DSN` in API `.env` for production error grouping.

## Scaling path (1 city → multi-city)

No Kubernetes/Kafka required.

1. **Database** — Add `DATABASE_READ_URL` for reporting; use PgBouncer on primary.
2. **API** — Run 2+ API containers; set `REDIS_WS_ADAPTER_URL` for Socket.IO.
3. **Workers** — Scale worker container count; tune `WORKER_CONCURRENCY`.
4. **CDN** — `CDN_BASE_URL` for product images (DO Spaces).
5. **Frontends** — Nginx on frontend droplet; static `/_next/static/` cached.

## Uzbekistan mobile network notes

- Customer API retries GET on 5xx/timeout (2 attempts).
- Courier queues GPS when offline; flushes on WS reconnect.
- WS uses polling fallback transport after disconnect.
- GPS smoothing rejects jumps > 500m between points.

## Daily operator checklist

1. Open `/ops` — check **kritik** count.
2. Clear **unassigned ready** with dispatch suggestions.
3. Check `/ops` restaurants tab for closed venues with active orders.
4. Review queue tab if notifications backlog grows.
5. Weekly: `/analytics` for SLA % and cancellation rate.

## Incident center

**URL:** `/incidents`

- Auto-detects: SLA breaches, delayed orders, idle couriers, failed deliveries, slow restaurant confirmation
- Severity: LOW → CRITICAL
- Workflow: Open → In Progress → Resolved / Dismissed
- Timeline merges audit logs + operator order notes

**API:**

| Method | Path |
|--------|------|
| GET | `/ops/incidents/center` |
| GET | `/ops/incidents/:id` |
| POST | `/ops/incidents` |
| POST | `/ops/incidents/:id/resolve` |

After schema change: `npm run db:push --workspace=@foodmarket/database`

## Observability panel

**URL:** `/observability` — polls `GET /monitoring/observability`

Watch during rush: reconnect spike, queue waiting > 50, Redis down, slow queries.

## Pre-launch stress tests

```bash
# From repo root (socket.io-client via courier workspace)
cd apps/courier && node ../../scripts/stress/pre-launch-stress.mjs ws-flood
ADMIN_TOKEN=<jwt> node ../../scripts/stress/pre-launch-stress.mjs reconnect-storm
```

Modes: `ws-flood` | `reconnect-storm` | `queue-spike` | `orders`

## Backup

```bash
./scripts/db-backup.sh
# restore: ./scripts/db-restore.sh <file>
```
