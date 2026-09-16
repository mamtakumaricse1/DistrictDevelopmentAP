# Phase 2 — Authentication and authorization

## What is built

- Keycloak OIDC (Authorization Code + PKCE), **one realm per district** plus `system`
- Login / logout / callback in the React app
- API JWT validation against the token’s `iss` JWKS (not a single hardcoded realm)
- Application user mapping; no passwords in PostgreSQL
- `AuthContext` with roles, permissions, district IDs, department IDs
- Global JWT guard; `@Public()` for health and login-options
- Permission + district + department checks on the API
- Read APIs: `GET /auth/me`, `GET /auth/login-options`, scoped `GET /districts`, `GET /departments`
- Protected frontend routes and role-aware navigation
- Authorization unit/e2e tests (cross-district, cross-department, viewer write, unauthenticated)

## Files

**API:** `modules/auth/*`, `modules/districts/*`, `modules/departments/*`, Prisma migration `20260907000000_auth_realms`, seed users, Keycloak realm JSON under `deploy/keycloak/import/`.

**Web:** `modules/auth/*`, `auth/` services, `RequireAuth`, bearer `api` client, AppShell user menu.

## Database

- `districts.keycloak_realm`, `districts.keycloak_issuer`
- `users.keycloak_issuer`; unique `(issuer, sub)` and `(issuer, email)`

## API

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/v1/auth/login-options` | Public |
| GET | `/api/v1/auth/me` | JWT |
| GET | `/api/v1/districts` | JWT + district scope |
| GET | `/api/v1/districts/:id` | JWT + district scope |
| GET | `/api/v1/departments` | JWT + district/dept scope |
| GET | `/api/v1/departments/:id` | JWT + district/dept scope |
| GET | `/api/v1/health` | Public |

## Frontend

`/login` (district picker) → Keycloak → `/auth/callback` → shell. Unauthenticated users cannot open dashboard routes.

## Security

- Unknown issuer → 401
- Unprovisioned identity → 403
- SUPER_ADMIN only from the system issuer + SUPER_ADMIN role
- District and department filters on list **and** get-by-id
- UI hiding is not the control

## Testing

- `AuthzService` matrix (A/B district, A/B department, viewer write, other-district admin)
- E2E: no token → 401; login-options public; scoped district GET 200/403 with stub verifier

## Out of scope (later phases)

Project CRUD, progress, dashboard KPIs, meetings, full admin forms.
