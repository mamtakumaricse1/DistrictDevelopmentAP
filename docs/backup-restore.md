# Backup and restore

Three things must be copied **off the same disk**, for the **same date**:

| What | Where |
| --- | --- |
| Identity database | `pg_dump` of `district_identity` |
| Organization database | `pg_dump` of `district_organization` |
| Works database | `pg_dump` of `district_works` |
| Documents (Phase 5) | `/var/dashboard/storage` |
| Config | `.env`, Keycloak realm export, Nginx |

Templates: `deploy/scripts/backup-db.sh`, `deploy/scripts/backup-storage.sh`.

If NIC already backs up the VM or PostgreSQL, do not run a second unofficial policy. Confirm **all three** application databases are included.

## Restore (outline)

1. Stop Gateway, Identity, Organization, and Works.
2. Restore the three databases from the same dump date.
3. Restore storage from that date.
4. Start Identity, Organization, and Works, then Gateway.
5. Check `GET /api/v1/health/ready` on the gateway.
