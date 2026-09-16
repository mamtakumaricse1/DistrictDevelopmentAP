# Phase 5 — Progress and documents

Owned by **Works** (`district_works`). No extra microservice for these tables.

- `POST /projects/:id/progress` always inserts a new `version`
- `GET /projects/:id/progress` returns newest first
- `POST /projects/:id/documents` stores the file under `STORAGE_ROOT/{districtId}/{projectId}/`
- `GET /documents/:id/file` streams the file
- DELAYED / STALLED submissions publish to Notify (best-effort)
