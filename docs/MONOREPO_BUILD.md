# Monorepo build & Docker deployment

## Workspace packages

| Package | Path | Build output |
|---------|------|----------------|
| `@foodmarket/shared-types` | `packages/shared-types` | `dist/index.js` (CommonJS) |
| `@foodmarket/database` | `packages/database` | `dist/index.js` + Prisma client |
| `@foodmarket/api` | `apps/api` | `dist/main.js` |

Build order: **shared-types → database → api**

```bash
npm run build:packages   # shared-types + database
npm run build:api        # packages + nest build
```

## TypeScript (API)

`apps/api/tsconfig.json` maps workspaces to source for compile-time:

```json
"@foodmarket/shared-types": ["../../packages/shared-types/src/index.ts"]
```

Runtime resolves `node_modules` → `packages/shared-types/dist/index.js`.

## Docker (backend droplet)

```bash
docker compose build --no-cache
docker compose up -d
docker ps
```

- **Context**: repo root (`.`)
- **Dockerfile**: `infrastructure/docker/Dockerfile.api`
- **Ignore file**: `infrastructure/docker/backend.dockerignore` (excludes `apps/web` only)
- **Do not** use a root `.dockerignore` that excludes `apps/api` or `packages/database`

### Runtime layout in API container

```
/app/dist/main.js
/app/node_modules/@foodmarket/shared-types → ../../packages/shared-types
/app/packages/shared-types/dist/
/app/packages/database/dist/
/app/packages/database/prisma/
```

## Troubleshooting

| Error | Cause | Fix |
|-------|--------|-----|
| `TS2307` shared-types | dist missing at compile | Paths in tsconfig; build shared-types first |
| `ERR_MODULE_NOT_FOUND .../dist/rbac` | ESM output or stale cache | Rebuild with `--no-cache`; package `type: commonjs` |
| `packages/db` not found | Wrong path name | Use `packages/database` only |
| API container missing | Build failed / wrong compose file | Use `docker-compose.yml` (includes `api` service) |
| Only postgres + redis running | Old `docker-compose.yml` | Pull latest; `docker compose up -d` |
