# Auth + RBAC architecture (FoodMarket)

## Overview

Authentication spans three layers:

1. **NestJS API** — JWT access tokens, rotating refresh tokens, role/permission guards, audit logs
2. **Next.js middleware** — route protection, role-based redirects, subdomain rewrites
3. **Client (Zustand)** — session hydration, API calls, UI gates without flicker

## Folder structure (web)

```
apps/web/src/
├── app/
│   ├── login/              # Public login
│   ├── register/           # Public registration
│   ├── profile/            # Guest auth screen OR profile dashboard
│   ├── customer/           # Public storefront
│   ├── admin/              # ADMIN | MANAGER | OPERATOR
│   ├── courier/            # COURIER | ADMIN
│   ├── business/           # BUSINESS_OWNER | ADMIN
│   └── restaurant/         # RESTAURANT_OWNER | ADMIN
├── components/auth/
│   ├── AuthProvider.tsx    # Hydrates session on load
│   ├── AuthGate.tsx        # Client-side panel guard
│   ├── AuthScreen.tsx      # Login/register shell
│   └── LoginForm.tsx
├── components/profile/
│   ├── ProfileDashboard.tsx
│   └── ProfilePageClient.tsx
├── lib/auth/
│   ├── constants.ts        # Cookie names, paths, role homes
│   ├── cookies.ts          # fm_access / fm_refresh cookies
│   ├── middleware-utils.ts # Route classification for middleware
│   └── rbac.ts             # Permission helpers
├── store/auth.ts           # Zustand auth store (persisted)
└── middleware.ts           # JWT cookie check + redirects
```

## Roles & post-login redirects

| Role | Home |
|------|------|
| CUSTOMER | `/profile` |
| ADMIN, MANAGER, OPERATOR | `/admin` |
| BUSINESS_OWNER | `/business` |
| RESTAURANT_OWNER | `/restaurant` |
| COURIER | `/courier` |

## Permissions (JSON on `roles.permissions`)

- `manage_users`, `manage_roles`, `manage_orders`, `manage_products`
- `manage_dispatch`, `manage_businesses`, `manage_restaurants`, `manage_settings`

Admin sidebar items are filtered by permissions (e.g. Users link requires `manage_users`).

## Session flow

1. User logs in → API returns `{ accessToken, refreshToken, user }`
2. Zustand `login()` sets cookies + localStorage + store
3. `AuthProvider` calls `hydrate()` → validates via `GET /auth/me`, refreshes if needed
4. Middleware reads `fm_access` cookie, verifies JWT with `JWT_SECRET`, enforces panel roles

## API endpoints (new)

- `GET /auth/me` — current user + permissions
- `POST /auth/logout` — revoke refresh token(s)
- `POST /auth/refresh` — rotate refresh token (existing, enhanced)
- `GET /admin/users` — list users (`manage_users`)
- `POST /admin/users/staff` — create staff with temp password (ADMIN)
- `PATCH /admin/users/:id/role` — assign role (`manage_roles`)
- `PATCH /admin/users/:id/deactivate` — invalidate sessions

## Migration notes

1. Run Prisma migration after adding `MANAGER` and `OPERATOR` to `UserRole` enum:
   ```bash
   npm run db:migrate -w @foodmarket/database
   npm run db:seed -w @foodmarket/database
   ```
2. Re-seed updates role permissions to `manage_*` slugs.
3. Set **`JWT_SECRET`** in `apps/web` env (same value as API) for middleware JWT verification.
4. Legacy paths redirect:
   - `/customer/account` → `/profile`
   - `/customer/register` → `/register`
5. Existing `localStorage` tokens still work; cookies are set on next login/hydrate.

## Security recommendations

- Move refresh token to **httpOnly** cookie via a Next.js Route Handler BFF (future hardening)
- Shorten access token TTL (15–60m) with silent refresh in `AuthProvider`
- Enable `Secure` cookies in production (already conditional in `cookies.ts`)
- Rate-limit admin user endpoints (already throttled globally)
- Log all role changes and staff creation (audit service wired)
- Never expose temp passwords in API responses in production — use email invite flow
- Rotate `JWT_SECRET` with dual-key validation during maintenance windows

## Backward compatibility

- Existing REST routes unchanged
- `getToken()` reads cookie first, then localStorage
- `setAuthSession()` / `clearAuthSession()` sync store + cookies
- Uzbek i18n keys extended, not replaced
- Subdomain middleware behavior preserved
