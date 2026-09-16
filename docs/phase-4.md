# Phase 4 — Projects (Works service)

## What is built

- New microservice `@ddwmd/works` on port **3003**, database `district_works`
- Project CRUD (no progress history, no files — those are Phase 5)
- Project code `{DISTRICT}-{DEPT}-{YEAR}-{seq}` e.g. `CHANGLANG-PWD-2026-00041`
- Gateway routes `/projects` to Works
- Administration-style Projects UI (list, create, edit)
- Isolation: Changlang users cannot read or mutate Tirap projects

## What is not in this phase

Progress versions, documents/photos, dashboards, meetings, notifications, reports.

## Authorization

| Permission | Who (seed) | Use |
| --- | --- | --- |
| `project:read` | all app roles | List and get |
| `project:create` | DISTRICT_ADMIN, SUPER_ADMIN | Create |
| `project:update` | DISTRICT_ADMIN, DEPARTMENT_USER, SUPER_ADMIN | Patch fields/status |
| `project:delete` | DISTRICT_ADMIN, SUPER_ADMIN | Soft-close (`CLOSED`) |

DEPARTMENT_USER is limited to `user_departments`. District IDs and department IDs are copied UUIDs; Works validates the department against Organization over HTTP.

## How to run (after Phase 3 databases exist)

```powershell
# one-time if district_works is missing
# CREATE DATABASE district_works;
$env:WORKS_DATABASE_URL='postgresql://dashboard:dashboard@localhost:5432/district_works?schema=public'
npm run prisma:generate -w @ddwmd/works
npm run prisma:migrate -w @ddwmd/works
npm run prisma:seed -w @ddwmd/works
npm run dev:works
```

Restart `npm run dev:services` so Gateway, Identity, Organization, and Works start together. Open **Projects** after signing in as `da.changlang`.
