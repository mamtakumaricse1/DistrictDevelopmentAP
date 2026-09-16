# Briefing for District Administration, Changlang

**System:** District Development Works Monitoring Dashboard  
**Nature:** One application that can serve Changlang now and other districts later, without cloning the software.

---

## 1. What is being built

A secure web dashboard for District Administration to monitor:

- Development works / projects
- Physical and financial progress
- Delayed and stalled works
- Department-wise performance
- Review-meeting action items
- Reports, notifications, and an audit trail

Departments will have controlled access. District Administration will see the consolidated picture.

Changlang is the **first deployment**, not a Changlang-only product. The same software can later be configured for Tirap, Tawang, or another district.

---

## 2. Architecture (in simple terms)

```
Officer's browser (laptop / tablet)
        │  HTTPS
        ▼
     Nginx (on NIC Linux server)
        ├── Website (React)
        └── API (NestJS)
                ├── PostgreSQL database (private; not on the internet)
                ├── Files / photographs (server disk, not inside the database)
                └── Keycloak (login / identity)
```

- Officers never talk to the database directly.
- PostgreSQL and files stay on the private side of the NIC server.
- Only HTTPS (port 443) should be public.

This is a **modular monolith**: one backend, organised in modules (projects, progress, dashboard, actions, etc.). It is not microservices. That is simpler to host on a NIC VM and simpler to operate for a district.

---

## 3. What has been used, and why

| Layer | Choice | Why it is suitable |
| --- | --- | --- |
| Website | React + TypeScript | Standard, maintainable, works on desktop and tablet |
| UI library | Material UI | Government / enterprise look; accessible forms and tables |
| API | NestJS (Node.js + TypeScript) | Clear modules, security guards, OpenAPI documentation |
| Database | PostgreSQL | NIC-familiar RDBMS; constraints, indexes, long-term records |
| Data access | Prisma + migrations | Schema changes are versioned and repeatable |
| Login | Keycloak (OIDC) | Government-grade identity; no passwords in our database |
| Files | Server filesystem now; S3-compatible later | Photos/PDFs must not sit inside PostgreSQL |
| Hosting target | NIC Linux + Nginx | Matches the intended deployment |

Passwords are **not** stored in the application database. Historical monthly progress is **never overwritten**.

---

## 4. Why Keycloak (not application-stored passwords)

District systems typically need:

- Official login, not a homemade password table
- Ability to turn on **MFA** later
- Ability to connect **NIC / State LDAP or Active Directory** later without rewriting the dashboard
- Isolation so Changlang users are not mixed with another district’s users
- Alignment with how many government applications already authenticate

**How it is designed for Changlang and beyond:**

- **One Keycloak realm per district** (Changlang realm, later Tirap realm, …).
- **One extra `system` realm** only for technical SUPER_ADMIN (NIC / State IT), not for district officers.
- Keycloak authenticates the officer. The dashboard API then checks **district, department, and role**. Hiding a menu in the website is not the security control.

If NIC already runs a Keycloak (or equivalent OIDC) service, this application can point at it. The dashboard does not require a separate Keycloak *machine* per district; one Keycloak server can host many realms.

---

## 5. How backup is designed in the application

Hosting the VM is **not automatically a backup**. The architecture assumes three things must be copied, on a schedule, **off the same disk**:

| What | Where it lives | How we intend to back it up |
| --- | --- | --- |
| Databases | PostgreSQL `district_identity`, `district_organization`, `district_works` | Daily `pg_dump` of **all three** (and longer retention weekly/monthly) |
| Photographs and documents | `/var/dashboard/storage` | `rsync` / copy of that folder, **same date** as the DB dump |
| Configuration | `.env` / Keycloak realm export / Nginx config | Encrypted copy after every change |

Scripts are provided as templates under `deploy/scripts/` (`backup-db.sh`, `backup-storage.sh`). They are meant to be scheduled (cron) on the NIC host.

**Restore idea:** stop Gateway, Identity, Organization, and Works → restore files from the same date as the dumps → restore **all three** PostgreSQL databases → start Identity, Organization, and Works, then Gateway → check gateway `/api/v1/health/ready`.

Recommended starting targets (to confirm with NIC): keep 30 daily dumps; aim for about **one day’s** data-loss window if only daily backups exist.

---

## 6. If backup is already managed by the server / NIC

That is **preferred**, not a conflict.

If NIC (or the data-centre) already takes VM snapshots, PostgreSQL backups, or filesystem backups:

1. **Do not run a second unofficial backup policy that nobody owns.** Align with NIC’s existing backup cell.
2. **Confirm these three items are actually included** in the server backup. A VM snapshot does not always include:
   - PostgreSQL data (if it is on another volume)
   - `/var/dashboard/storage` (if it is a separate mount)
   - Keycloak’s own database / realm export
3. If NIC already backs up the **whole VM or the data volume**, the application scripts become optional extras (or can be used only for a portable SQL dump).
4. If NIC only snapshots the OS disk, you still need an explicit database + files backup.
5. Ask NIC for written **RPO / RTO** (how much data can be lost; how long to restore) and a restore drill on UAT before go-live.

**Practical recommendation to tell Changlang / NIC:**

> “The dashboard is designed so that NIC-managed backup can be the primary method. We only require that PostgreSQL, the document folder, and identity configuration are in that backup set. Application-level dump scripts are a fallback if NIC backup does not cover those three.”

---

## 7. What Changlang should not worry about

- The software will not be named or hardcoded as “Changlang-only.” District name, logo, departments, and Keycloak realm are configuration.
- Other districts later do not require a new codebase.
- Officers of one district cannot open another district’s data through the API.

---

## 8. What still needs a decision from administration / NIC

- Public URL (hostname) for UAT and production
- Whether NIC provides Keycloak or the VM runs Keycloak
- Who holds SUPER_ADMIN (NIC / State IT, not DC office day-to-day)
- Confirmation that NIC backup covers database + `/var/dashboard/storage` + Keycloak
