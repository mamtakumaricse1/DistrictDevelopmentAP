# Authorization (Phase 2)

Application authorization is loaded from PostgreSQL after Keycloak authenticates the token. Realm membership is not enough.

## Roles

| Role | Realm | Data scope |
| --- | --- | --- |
| SUPER_ADMIN | `system` only | All districts |
| DISTRICT_ADMIN | District realm | Assigned `user_roles.district_id` |
| DEPARTMENT_USER | District realm | That district + `user_departments` |
| VIEWER | District realm | Assigned district, read permissions only |

## Enforcement

`AuthzService` is used by every resource service:

- `assertPermission` — e.g. viewer cannot `project:create`
- `assertDistrictAccess` — Changlang token / role cannot read Tirap
- `assertDepartmentAccess` — PWD cannot read Education
- List queries apply the same filters so `GET /districts` never returns foreign rows

`GET /resource/:id` uses the same functions as list.

Frontend navigation hides items the user cannot use. That is UX only.
