# Deployment

Public hostname → Nginx → Gateway `:3000` → Identity / Organization / Works / Governance / Notify. PostgreSQL and Keycloak are not published on the internet. Scale each service independently; do not run a combined monolith.

## Local

```bash
docker compose up -d postgres
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:services
npm run dev:web
```

Keycloak: `docker compose --profile idp up -d keycloak`

Full container stack (after images build):

```bash
docker compose --profile stack up -d --build
```

Web in that profile is http://localhost:8081 (proxies `/api` to the gateway).

Scale replicas on one host (removes published 3001–3005 so ports do not collide):

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml --profile stack up -d --build --scale identity=2 --scale organization=2 --scale works=2 --scale governance=2 --scale notify=2 --scale gateway=2
```

## NIC Linux (template)

- Nginx: `deploy/nginx/dashboard.conf` — only `/api/` to gateway (`127.0.0.1:3000`; add extra `server` lines if you run more than one gateway process)
- Processes: one systemd unit or Compose service **per** bounded context
- Postgres: five databases (`district_identity`, `district_organization`, `district_works`, `district_governance`, `district_notify`) — one server or five, via `*_DATABASE_URL`
- Storage: shared `STORAGE_ROOT` (`/var/dashboard/storage`) if Works has more than one replica
- Env: one file per host, not committed
- Probes: liveness `GET /api/v1/health`, readiness `GET /api/v1/health/ready` (HTTP 503 when that service’s database is down)

Replace `server_name` and TLS paths before production. Bind Nest and Postgres to localhost.

## Kubernetes

Manifests live in `deploy/k8s`. Copy `secret.example.yaml` to `secret.yaml`, set database URLs, then `kubectl apply -k deploy/k8s` and `kubectl apply -f deploy/k8s/secret.yaml`. Works defaults to one replica until the PVC is ReadWriteMany.
