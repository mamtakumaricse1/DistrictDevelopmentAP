# District Development Works Monitoring Dashboard

One application for many districts. The first deployment is **Changlang, Arunachal Pradesh**, configured as data — not a separate codebase.

Phase 5–9 add progress/documents (Works), dashboard KPIs (Works), meetings/actions (Governance), in-app notifications (Notify), and CSV reports.

## Documentation

| Document | Contents |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | System and component design |
| [docs/database.md](docs/database.md) | ER model and indexes |
| [docs/authentication.md](docs/authentication.md) | Keycloak / OIDC |
| [docs/authorization.md](docs/authorization.md) | RBAC and district scope |
| [docs/api.md](docs/api.md) | REST conventions |
| [docs/security.md](docs/security.md) | Security controls |
| [docs/deployment.md](docs/deployment.md) | NIC Linux layout |
| [docs/backup-restore.md](docs/backup-restore.md) | Backup runbook |
| [docs/modules.md](docs/modules.md) | Module map |
| [docs/development-phases.md](docs/development-phases.md) | Phase gates |
| [docs/decisions.md](docs/decisions.md) | Locked and open decisions |
| [docs/phase-2.md](docs/phase-2.md) | Phase 2 design |
| [docs/phase-3.md](docs/phase-3.md) | Administration APIs and UI |
| [docs/phase-4.md](docs/phase-4.md) | Projects / Works service |
| [docs/microservices.md](docs/microservices.md) | Gateway / Identity / Organization / Works / Governance / Notify |
| [deploy/k8s/README.md](deploy/k8s/README.md) | Kubernetes deploy and independent scaling |

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker for PostgreSQL)
- npm 10+

## Local development

```bash
docker compose up -d postgres
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:identity
npm run dev:organization
npm run dev:works
npm run dev:governance
npm run dev:notify
npm run dev:gateway
npm run dev:web
```

`npm run dev:services` starts Identity, Organization, Works, Governance, Notify, and Gateway together.

Full containers: `docker compose --profile stack up -d --build` (web at http://localhost:8081).

- Web: http://localhost:5173 (proxies `/api` to the gateway on port 3000)
- Gateway health: http://localhost:3000/api/v1/health
- Identity Swagger: http://localhost:3001/api/v1/docs
- Organization Swagger: http://localhost:3002/api/v1/docs
- Works Swagger: http://localhost:3003/api/v1/docs
- Governance Swagger: http://localhost:3004/api/v1/docs
- Notify Swagger: http://localhost:3005/api/v1/docs

Keycloak (required for interactive login):

```bash
docker compose --profile idp up -d keycloak
```

Admin console: http://localhost:8080 (`admin` / `admin` in local Compose only).  
Local user password for every test account: `ChangeMe!2026`

| Username | Realm to pick on /login | Role |
| --- | --- | --- |
| `sys.admin` | System administration | SUPER_ADMIN |
| `da.changlang` | Changlang | DISTRICT_ADMIN |
| `pwd.changlang` | Changlang | DEPARTMENT_USER (PWD) |
| `viewer.changlang` | Changlang | VIEWER |
| `da.tirap` | Tirap | DISTRICT_ADMIN |
| `pwd.tirap` | Tirap | DEPARTMENT_USER (PWD) |

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint (services + web) |
| `npm run test` | Jest + Vitest |
| `npm run test:e2e` | Identity, Organization, Works, Governance, Notify HTTP tests |
| `npm run build` | Production builds of each service + web |
| `npm run prisma:migrate` | Prisma migrate for every service database |
| `npm run dev:gateway` | Public `/api/v1` on port 3000 |
| `npm run dev:identity` | Auth, users, roles on port 3001 |
| `npm run dev:organization` | Districts and master data on port 3002 |
| `npm run dev:works` | Projects, progress, documents, dashboard on port 3003 |
| `npm run dev:governance` | Meetings and actions on port 3004 |
| `npm run dev:notify` | In-app notifications on port 3005 |
| `npm run dev:services` | Start all API processes |

## Architecture in brief

```
Browser → Gateway /api/v1 → Identity → district_identity
                         → Organization → district_organization
                         → Works → district_works
                         → Governance → district_governance
                         → Notify → district_notify
Browser → Keycloak OIDC (one realm per district)
```

There is no combined monolith process. The browser talks only to the gateway.
