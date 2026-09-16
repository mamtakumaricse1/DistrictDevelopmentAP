# Architecture

Browser traffic enters one public process. Each bounded context is a separate deployable with its own PostgreSQL database. Keycloak remains the only identity provider. Processes are stateless and can be replicated independently.

```
Browser
  → Gateway :3000              no database; reverse proxy (streams files/CSV) + health
       → Identity :3001        district_identity
       → Organization :3002    district_organization
       → Works :3003           district_works     (projects, progress versions, documents, dashboard, project CSV)
       → Governance :3004      district_governance (meetings, actions, action CSV)
       → Notify :3005          district_notify    (in-app inbox)
Keycloak (one realm per district + system)
```

Do **not** add a Nest application per table. Progress and documents stay in Works (same project aggregate). Meetings and actions share Governance. Notify is a fan-in inbox so Works and Governance never share tables.

## Cross-service HTTP

| From | To | Why |
| --- | --- | --- |
| Identity | Organization `/internal/district-realms` | Login district list |
| Organization | Identity `/internal/issuers` | Issuer allow-list |
| Organization / Works / Governance / Notify | Identity `/auth/me` | Map JWT → AuthContext (cached ~15s per replica) |
| Works | Organization `/internal/departments/:id` | Project codes (cached ~30s) |
| Works / Governance | Notify `/internal/notifications` | Fire-and-forget alerts (DELAYED/STALLED, meetings, actions) |

Internal calls use a timeout (`INTERNAL_HTTP_TIMEOUT_MS`, default 3s). GET/PUT fail over across comma-separated origin lists. Notify POST is not retried (duplicate risk). Each service verifies the Keycloak JWT. The gateway does not authorize. Notify ingest uses `x-internal-key`.

The gateway stays up if Works, Governance, or Notify is down (`/health/ready` is 503 only when Identity or Organization is unreachable). Those routes return 502 until the owning service recovers.

## Storage

Documents live on disk (`STORAGE_ROOT`, default `./storage`, NIC `/var/dashboard/storage`). PostgreSQL stores metadata only. Replicated Works processes must share that volume.
