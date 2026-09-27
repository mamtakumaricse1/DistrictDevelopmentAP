# Microservices architecture

Each bounded context is a **separate process with its own database**. The browser talks only to the gateway. We do **not** create one service per table.

```
Browser
  → Gateway :3000        no database; HTTP proxy (stateless, horizontally scalable)
       → Identity :3001  district_identity
       → Organization :3002  district_organization
       → Works :3003     district_works
       → Governance :3004 district_governance
       → Notify :3005    district_notify
Keycloak (one realm per district + system)
```

## What “full” means here

| Concern | Implementation |
| --- | --- |
| Separate deployables | `@ddwmd/gateway`, `@ddwmd/identity`, `@ddwmd/organization`, `@ddwmd/works`, `@ddwmd/governance`, `@ddwmd/notify` |
| Separate data | One PostgreSQL **database per service**. Databases may share a server or run on different hosts. |
| No shared tables | Identity does not read `districts`. Organization does not read `users`. Works/Governance/Notify copy district/department UUIDs. |
| Sync over HTTP | Timeouts, GET/PUT failover across comma-separated URLs, best-effort Notify POST (never retried). |
| Authorization | Each service verifies the Keycloak JWT. The gateway does not authorize. |
| Scale-out | Stateless processes, Prisma `connection_limit` per replica, short TTL caches for `/auth/me` and district issuers, shared volume for Works files. |
| Probes | `/health` = liveness. `/health/ready` = 503 when the service database is down so orchestrators stop sending traffic. |

Shared library `@ddwmd/common` holds JWT verification, guards, internal HTTP, and the error envelope — not business tables.

## Horizontal scale

Services hold no session state. JWT mapping is cached in-process for `AUTH_CACHE_TTL_MS` (default 15s) so Identity is not called on every request.

Docker Compose DNS load-balances a service name across replicas. Example:

```powershell
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d --build --scale identity=2 --scale works=2 --scale gateway=2
```

Works file storage is a shared volume (`works-storage`). Raising Works replicas on more than one node needs ReadWriteMany (NFS) — see `deploy/k8s`.

Kubernetes: `deploy/k8s` (one Deployment per bounded context, HPAs, readiness probes).

## How to run

Default: the full Compose stack (Postgres, Keycloak, APIs, gateway, web).

```powershell
docker compose up --build -d
```

Web is http://localhost:8081. Host processes (optional, Vite hot reload):

```powershell
docker compose up -d postgres keycloak
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:services
npm run dev:web
```

If Postgres was already initialized without later databases, create them before migrate.

```sql
CREATE DATABASE district_identity;
CREATE DATABASE district_organization;
CREATE DATABASE district_works;
CREATE DATABASE district_governance;
CREATE DATABASE district_notify;
```

Container stack is the default Compose file (`docker compose up --build -d`). There are no `idp` / `stack` profiles.
