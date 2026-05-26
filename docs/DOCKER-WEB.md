# Docker: `@foodmarket/web` (Next.js standalone)

## How it runs

| Stage | What happens |
|-------|----------------|
| `deps` | `npm ci` for `@foodmarket/web`, `@foodmarket/ui`, `@foodmarket/shared-types` |
| `builder` | `npm run build -w @foodmarket/web` → `apps/web/.next/standalone` |
| `runner` | `node apps/web/server.js` (monorepo standalone layout) |

Static files are copied to `apps/web/.next/static` beside `server.js`.

## Common failures (fixed)

| Error | Cause |
|-------|--------|
| `Cannot find module '/app/server.js'` | Monorepo standalone puts server at `apps/web/server.js` |
| `ENOENT .../apps/web/.next/static` | Static copied to wrong path (`.next/static` at image root) |
| `sh: next: not found` | Runner image has no `next` CLI; must use `node apps/web/server.js` |
| `Missing script: "start"` | Compose tried `npm start` at repo root instead of standalone CMD |

## VPS redeploy

```bash
cd /path/to/foodapp
git pull
docker compose -f docker-compose.frontend.yml down
docker compose -f docker-compose.frontend.yml build --no-cache web
docker compose -f docker-compose.frontend.yml up -d
docker compose -f docker-compose.frontend.yml logs -f web
```

Full stack (API + web + nginx):

```bash
docker compose -f docker-compose.prod.yml build --no-cache web
docker compose -f docker-compose.prod.yml up -d
```

Verify:

```bash
docker compose -f docker-compose.frontend.yml ps
curl -sI http://127.0.0.1/   # via nginx
docker exec foodmarket-web node -e "console.log('ok')"
```
