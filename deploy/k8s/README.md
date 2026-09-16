# Kubernetes

Each bounded context is its own Deployment and Service. Scale them independently. Do **not** add a Deployment per table.

## Images

Build from the repo root:

```bash
docker build -f deploy/docker/Dockerfile.service --build-arg SERVICE=identity --build-arg PORT=3001 -t ddwmd/identity:0.1.0 .
docker build -f deploy/docker/Dockerfile.service --build-arg SERVICE=organization --build-arg PORT=3002 -t ddwmd/organization:0.1.0 .
docker build -f deploy/docker/Dockerfile.service --build-arg SERVICE=works --build-arg PORT=3003 -t ddwmd/works:0.1.0 .
docker build -f deploy/docker/Dockerfile.service --build-arg SERVICE=governance --build-arg PORT=3004 -t ddwmd/governance:0.1.0 .
docker build -f deploy/docker/Dockerfile.service --build-arg SERVICE=notify --build-arg PORT=3005 -t ddwmd/notify:0.1.0 .
docker build -f deploy/docker/Dockerfile.service --build-arg SERVICE=gateway --build-arg PORT=3000 -t ddwmd/gateway:0.1.0 .
docker build -f apps/web/Dockerfile -t ddwmd/web:0.1.0 .
```

## Apply

```bash
cp deploy/k8s/secret.example.yaml deploy/k8s/secret.yaml
# edit DATABASE_URL values and INTERNAL_API_KEY
kubectl apply -k deploy/k8s
kubectl apply -f deploy/k8s/secret.yaml
```

Point each `*_DATABASE_URL` at that service’s database. One PostgreSQL server with five databases is valid; five servers is also valid. Gateway has no database.

## Probes

| Probe | Path | Meaning |
| --- | --- | --- |
| Liveness | `/api/v1/health` | Process is up (do not kill on a brief DB blip) |
| Readiness | `/api/v1/health/ready` | Own database is up (HTTP 503 otherwise). Gateway uses `/health` so Works/Notify outages do not drain the edge. |

## Works storage

Files live on disk (`STORAGE_ROOT`). Raise Works replicas above 1 only with a ReadWriteMany volume (NFS or equivalent). Until then keep Works at one replica (see `hpa.yaml`).
