This package is retired.

The combined `@ddwmd/api` process was replaced by three deployable services:

- `apps/gateway` (`@ddwmd/gateway`) — public `/api/v1`, no database
- `apps/identity` (`@ddwmd/identity`) — users, roles, registered issuers (`district_identity`)
- `apps/organization` (`@ddwmd/organization`) — districts and master data (`district_organization`)

Shared JWT/guards live in `packages/common`. Each service owns its Prisma schema. See `docs/microservices.md`.
