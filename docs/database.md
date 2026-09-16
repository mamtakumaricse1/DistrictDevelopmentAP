# Database

One PostgreSQL **server** is fine. Each service owns a **database**. There is no shared Prisma schema and no foreign key from Identity into Organization (or the reverse). To scale, point `*_DATABASE_URL` at different hosts; keep `connection_limit` per replica (`PRISMA_CONNECTION_LIMIT`, default 10).

| Service | Database | Schema file |
| --- | --- | --- |
| Identity | `district_identity` | `apps/identity/prisma/schema.prisma` |
| Organization | `district_organization` | `apps/organization/prisma/schema.prisma` |
| Works | `district_works` | `apps/works/prisma/schema.prisma` |
| Governance | `district_governance` | `apps/governance/prisma/schema.prisma` |
| Notify | `district_notify` | `apps/notify/prisma/schema.prisma` |
| Gateway | none | — |

Compose creates the five application databases on first volume init (`deploy/postgres/init.sql`). Existing volumes need `CREATE DATABASE` for any missing name before migrate.

## Identity (`district_identity`)

- `registered_issuers` — JWT `iss` allow-list (synced from Organization)
- `users` — application users, unique on `(keycloak_issuer, keycloak_sub)` and `(keycloak_issuer, email)`
- `roles`, `permissions`, `role_permissions`
- `user_roles`, `user_departments`, `user_agencies` — district / department / agency **ids** copied from Organization as UUIDs, not FK constraints

Passwords are never stored. Keycloak is the IdP.

## Organization (`district_organization`)

- `districts` — includes `keycloak_realm` / `keycloak_issuer`
- `departments`, `agencies`
- `master_data_categories`, `master_data_items`
- `settings`

`created_by_id` / `updated_by_id` are UUID audit fields, not joins to Identity’s `users` table.

## Works (`district_works`)

- `projects`, `project_sequences`
- `project_progress` — append-only versions (`@@unique(projectId, version)`). Never update a past row.
- `project_documents` — metadata only; bytes on disk

## Governance (`district_governance`)

- `review_meetings`
- `action_items` — `project_id` copied from Works (no FK)

## Notify (`district_notify`)

- `notifications` — district (and optional department) scoped
- `notification_reads` — per user

Seed Organization first, then Identity, then Works, Governance, Notify (`npm run prisma:seed`).

## Seed identifiers (local / isolation tests)

These UUIDs are stable in seed data so Identity assignments, Organization rows, and Works projects line up:

| Entity | UUID |
| --- | --- |
| Changlang district | `11111111-1111-1111-1111-111111111111` |
| Tirap district | `22222222-2222-2222-2222-222222222222` |
| Changlang PWD | `33333333-3333-3333-3333-333333333333` |
| Tirap PWD | `55555555-5555-5555-5555-555555555555` |

Seed Organization first, then Identity, then Works, Governance, Notify (`npm run prisma:seed`).
