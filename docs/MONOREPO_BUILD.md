# Monorepo build order

Internal packages compile to **CommonJS** in `dist/` for Node 20 (NestJS API, workers).

## Packages

| Package | Output | Consumed by |
|---------|--------|-------------|
| `@foodmarket/shared-types` | `packages/shared-types/dist` | API, Web (transpile), UI |
| `@foodmarket/database` | `packages/database/dist` + Prisma client | API, workers |

## Commands

```bash
# After git pull — build workspace libraries first
npm run build:packages

# Full monorepo (Turbo respects ^build dependency order)
npm run build

# API only (prebuild runs packages)
npm run build:api
```

## Docker (production)

`Dockerfile.api` runs:

1. `build -w @foodmarket/shared-types`
2. `build -w @foodmarket/database` (includes `prisma generate`)
3. `build -w @foodmarket/api`

The runner image copies `packages/shared-types/dist` and `packages/database/dist` so `require('@foodmarket/shared-types')` resolves at runtime.

## TypeScript resolution (API)

`apps/api/tsconfig.json` maps workspace packages to **source** for compile-time:

```json
"@foodmarket/shared-types": ["../../packages/shared-types/src/index.ts"]
```

Runtime still resolves via `node_modules` → `dist/index.js` after `npm run build:packages`.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `TS2307: Cannot find module '@foodmarket/shared-types'` | Run `npm run build:packages`; ensure `apps/api/tsconfig.json` paths exist |
| `Cannot find module '@foodmarket/shared-types'` (runtime) | Rebuild shared-types; verify `packages/shared-types/dist` in Docker runner |
| `Cannot find module '.../dist/rbac'` | Old ESM build; rebuild shared-types (CJS re-exports via `index.js`) |
| `ERR_REQUIRE_ESM` | Package `main` pointed at ESM; use `dist/index.js` (CommonJS) |
