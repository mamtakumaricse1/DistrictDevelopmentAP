# Decisions

## Locked (Phase 2)

| ID | Decision | Status |
| --- | --- | --- |
| D1 | **One Keycloak realm per district.** SUPER_ADMIN uses a separate `system` realm. One Keycloak *server* may host many realms (local Compose and typical NIC). Isolation is at realm level: users, clients, MFA, and later LDAP do not mix across districts. | Locked |
| D3 | Document/photo root on NIC: `/var/dashboard/storage` | Locked |
| D5 | Project code: `{DISTRICT}-{DEPT}-{FY}-{seq}` e.g. `CHANGLANG-PWD-2026-00041` | Locked |
| D6 | Operational reporting period is **calendar month** (`YYYY-MM`). Indian FY reports can be derived later. | Locked |
| A1–A9 | Originally a modular monolith. **A1 is superseded by D11** (explicit request for microservices). Remaining items: npm workspaces, full Prisma schema, progress versions, JSONB only for audit, application RBAC, SUPER_ADMIN only default cross-district role, MUI, local FS first | Locked |
| D11 | Bounded-context **packages/processes** with **separate databases**: Gateway, Identity, Organization, Works, Governance, Notify. Sync via HTTP. Not one process per table. No combined monolith. | Locked |
| D12 | **Scale-out:** processes are stateless. Prisma pool limits per replica. Short TTL caches for JWT mapping and issuer lists. Works files on a shared volume (local/NFS). Orchestrators use `/health` (live) and `/health/ready` (ready). | Locked |

## D1 implications (do not weaken)

- JWT `iss` identifies the realm. The API accepts a token only after the issuer is registered (system env or `districts.keycloak_issuer`).
- A Changlang access token cannot be used as a Tirap identity, even if the path UUID is changed.
- Application users are unique on `(keycloak_issuer, keycloak_sub)` and `(keycloak_issuer, email)`.
- The SPA must **not** hardcode a single realm. The user picks a district (or System administration); then OIDC runs against that issuer.
- Adding a district is: Keycloak realm + `districts` row with realm/issuer + users. **No new codebase.**

## Still open (not blocking Phase 2)

| ID | Question |
| --- | --- |
| D2 | Public hostnames for UAT/prod and Keycloak |
| D4 | Who operates SUPER_ADMIN (NIC / State IT) |
| D7 | Changlang location hierarchy seed |
| D8 | Languages (English first) |
| D9 | Email/SMS gateway |
| D10 | Backup target volume |
