# District Development Works Monitoring Dashboard

One application for many districts. The first deployment is **Changlang, Arunachal Pradesh**, configured as data — not a separate codebase.

Phases 5–9 add progress/documents, dashboard KPIs, meetings/actions, notifications, and CSV reports.

Phases 10–14 align the product with the DC Changlang decision-support brief (`dash.pdf`): locations, schemes/KPIs/beneficiaries, exception review, and the eight DC modules plus GIS.

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

- Docker Desktop (Compose V2)
- Node.js 20+ and npm 10+ only if you run services on the host instead of Compose

## Run with Docker Compose

Start Docker Desktop, then from the repo root:

```bash
docker compose up --build -d
```

That starts PostgreSQL, Keycloak (Changlang + system realms), Identity, Organization, Works, Governance, Notify, the gateway, and the web UI. Each API runs `prisma migrate deploy` and seed on startup.

- Web: http://localhost:8081 (proxies `/api` to the gateway)
- Keycloak: http://localhost:8180 (`admin` / `admin` in local Compose only)
- Gateway health: http://localhost:3000/api/v1/health
- Identity Swagger: http://localhost:3001/api/v1/docs
- Organization Swagger: http://localhost:3002/api/v1/docs
- Works Swagger: http://localhost:3003/api/v1/docs
- Governance Swagger: http://localhost:3004/api/v1/docs
- Notify Swagger: http://localhost:3005/api/v1/docs

Logs: `docker compose logs -f` or `npm run compose:logs`. Stop: `docker compose down` (add `-v` only if you want to wipe Postgres).

Local user password for every test account: `ChangeMe!2026`

| Username | Realm to pick on /login | Role |
| --- | --- | --- |
| `sys.admin` | System administration | SUPER_ADMIN |
| `da.changlang` | Changlang | DC (DISTRICT_ADMIN) |
| `adc.changlang` | Changlang | ADC |
| `dio.changlang` | Changlang | DIO |
| `bdo.changlang` | Changlang | BDO |
| `pwd.changlang` … `pwr.changlang` | Changlang | Department HoD (PWD, RWD, PHED, EDU, HLT, RD, AGR, SW, UD, FCS, TRN, PWR) |
| `data.pwd.changlang` | Changlang | DATA_ENTRY (PWD) |
| `viewer.changlang` | Changlang | VIEWER |
| `citizen.changlang` | Citizen / public view | CITIZEN (read-only) |

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
| `npm run compose:up` | Build and start the full Docker stack |
| `npm run compose:down` | Stop Compose containers |
| `npm run compose:logs` | Follow Compose logs |
| `npm run dev:services` | Start all API processes on the host |

## Host development (optional)

Use this only when you want Vite hot reload. Postgres and Keycloak still come from Compose.

```bash
docker compose up -d postgres keycloak
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:services
npm run dev:web
```

`npm run dev:services` starts Identity, Organization, Works, Governance, Notify, and Gateway together.

- Web (Vite): http://localhost:5173 (proxies `/api` to the gateway on port 3000)

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
