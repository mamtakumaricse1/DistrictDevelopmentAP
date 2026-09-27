# Development phases

Work **one phase at a time** when starting new work. Phases 0–9 below are the current product surface.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Design, decisions, schema | Done |
| 1 | Foundation (API, web shell, health, Prisma) | Done |
| 2 | Authentication and authorization | Done |
| 3 | Administration + three-service split | Done |
| 4 | Projects | Done |
| 5 | Progress, documents, storage | Done |
| 6 | Dashboard | Done |
| 7 | Review meetings and actions | Done |
| 8 | Notifications | Done |
| 9 | Reports and export | Done |
| 10 | Geography, officers, Changlang location seed | Done |
| 11 | Scheme / KPI / beneficiary + CSV ingest | Done |
| 12 | DC review extras + ADC / BDO / DATA_ENTRY | Done |
| 13 | DC decision APIs (home, dept, scheme, block, infra, HD) | Done |
| 14 | DC frontend modules + GIS | Done |

## Phase 5–9 gates

- Progress is **append-only** (`project_progress.version`). Corrections insert a new version.
- Files are stored on disk, not in PostgreSQL. Gateway streams multipart and downloads.
- Dashboard KPIs come from Works (and Governance for actions/meetings), never computed only in the browser.
- Changlang users cannot read Tirap meetings, actions, progress, or notifications.
- CSV export is scoped the same way as list APIs (`report:export`).
