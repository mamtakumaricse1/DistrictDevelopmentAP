# Authentication (Phase 2) — one realm per district

Keycloak is the only identity provider. The application never stores passwords.

## Realms

| Realm | Who | Token issuer (local) |
| --- | --- | --- |
| `system` | SUPER_ADMIN only | `{KEYCLOAK_URL}/realms/system` |
| `changlang` | Changlang officers (only live district realm for now) | `{KEYCLOAK_URL}/realms/changlang` |
| *future district* | That district only | `{KEYCLOAK_URL}/realms/{code}` |

A shared Keycloak *process* (Compose or NIC) can host all realms. **Do not** put two districts in one realm.

`KEYCLOAK_URL` is the public issuer the browser and JWT `iss` claim use (`http://localhost:8180` in Compose). API containers cannot reach that host name, so they also set `KEYCLOAK_INTERNAL_URL=http://keycloak:8080` and fetch JWKS from the internal URL while still validating `iss` against the public issuer.

```
User picks district on /login
        │
        ▼
OIDC Authorization Code + PKCE
against that district's realm
        │
        ▼
SPA sends Bearer access token to the gateway
        │
        ▼
Gateway proxies to Identity or Organization
        │
        ▼
That service reads iss → allow-list
→ JWKS verify (sig, exp, iss)
→ map (iss, sub) to users (Identity; Organization calls Identity /auth/me)
→ load roles / districts / departments
→ AuthContext on the request
```

## User mapping

1. Find `users` by `(keycloak_issuer, keycloak_sub)`.
2. Else find provisioned row by `(keycloak_issuer, email)` and bind `sub` (first login).
3. Else `403` — account not provisioned. Self-signup is off.
4. Inactive user → `403`.

## Frontend

- `GET /api/v1/auth/login-options` (public) lists active districts and the system realm.
- Selected issuer is stored in `sessionStorage` for renew/logout.
- Tokens stay in memory via `oidc-client-ts` (plus its user store). Prefer not to invent a second token cache.

## MFA and LDAP

Configured **per realm** in Keycloak. No application change if `iss` and `sub` remain stable.

## Local test users

Password for all local users: `ChangeMe!2026` (never use in production).

| Username | Realm | Application role |
| --- | --- | --- |
| `sys.admin` | system | SUPER_ADMIN |
| `da.changlang` | changlang | DISTRICT_ADMIN (DC) |
| `adc.changlang` | changlang | ADC |
| `dio.changlang` | changlang | DIO |
| `bdo.changlang` | changlang | BDO |
| `pwd.changlang` … `pwr.changlang` | changlang | DEPARTMENT_USER (all 12 departments) |
| `data.pwd.changlang` | changlang | DATA_ENTRY |
| `viewer.changlang` | changlang | VIEWER |
