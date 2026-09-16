# API conventions

Public clients call **only** the gateway: `http://localhost:3000/api/v1/...`.

Identity (`:3001`), Organization (`:3002`), Works (`:3003`), Governance (`:3004`), and Notify (`:3005`) expose `/api/v1`. The SPA must not point at those ports in production.

## Envelope

Success: JSON body of the resource, or `{ data, meta }` for paginated lists (`page`, `pageSize`, `total`, `totalPages`).

Errors:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "…",
  "requestId": "…"
}
```

`X-Request-Id` is set on every response.

## Auth

- Browser: `Authorization: Bearer <Keycloak access token>`
- Internal: `x-internal-key: $INTERNAL_API_KEY` on `/internal/*` only
- Login options (`GET /auth/login-options`) are public

## Routing (gateway)

| Prefix | Upstream |
| --- | --- |
| `/auth`, `/users`, `/roles`, `/permissions` | Identity |
| `/projects`, `/documents`, `/dashboard`, `/reports/projects.csv` | Works |
| `/meetings`, `/actions`, `/governance`, `/reports/actions.csv` | Governance |
| `/notifications` | Notify |
| `/districts`, `/departments`, `/agencies`, `/master-data`, `/settings` | Organization |
| `/health` | Gateway (liveness). `/health/ready` reports upstreams; HTTP 503 if Identity or Organization is down |

Authorization is enforced in each owning service, not in the gateway. The gateway streams multipart uploads and file/CSV downloads.

## Projects (Phase 4)

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/projects` | `project:read` |
| POST | `/projects` | `project:create` |
| GET | `/projects/:id` | `project:read` |
| PATCH | `/projects/:id` | `project:update` (status `CLOSED` also needs `project:delete`) |

Create body requires `name` and `departmentId`. The service loads the department from Organization and assigns `code` as `{DISTRICT}-{DEPT}-{YEAR}-{seq}`.

## Versioning

All HTTP APIs are under `/api/v1`. Do not introduce `/api/v2` until a breaking public contract requires it.
