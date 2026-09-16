# Phase 3 — Administration and service split

## What is built

- Organization CRUD: districts, departments, agencies, master-data categories/items, settings
- Identity CRUD: user provisioning (no passwords), role and permission listing
- Administration UI (tabs, scoped by permissions)
- Separate packages: `@ddwmd/gateway`, `@ddwmd/identity`, `@ddwmd/organization`
- Separate databases: `district_identity`, `district_organization`
- HTTP sync for issuers, login realms, and user mapping

## Services

See [microservices.md](microservices.md). Authorization still runs **inside Identity and Organization**. The gateway only routes and reports aggregated health.

## API

| Method | Path | Permission |
| --- | --- | --- |
| GET/POST | `/districts` | `district:read` / `district:manage` |
| PATCH | `/districts/:id` | `district:manage` |
| GET/POST | `/departments` | `district:read` / `department:manage` |
| PATCH | `/departments/:id` | `department:manage` |
| GET/POST | `/agencies` | `district:read` / `agency:manage` |
| PATCH | `/agencies/:id` | `agency:manage` |
| GET/POST | `/users` | `user:manage` |
| PATCH | `/users/:id` | `user:manage` |
| GET | `/roles` | `user:manage` |
| GET | `/permissions` | `role:manage` |
| GET/POST | `/master-data/categories` | `master:manage` |
| GET/POST | `/master-data/items` | `master:manage` |
| PATCH | `/master-data/items/:id` | `master:manage` |
| GET/PUT | `/settings` | `master:manage` (global writes: `config:manage`) |

`POST /users` stores a pending `keycloakSub`. The first successful login binds the real Keycloak subject. Passwords are never written to PostgreSQL.

## Isolation

Every list and mutation is scoped from `AuthContext`. A Changlang DISTRICT_ADMIN cannot read or write Tirap rows even if they guess a UUID.

## Frontend

`/administration` — Districts, Departments, Agencies, Users, Roles, Master data, Settings.

## What is not in this phase

Projects, progress, documents, dashboards, meetings, reports.
