# Phase 8 — Notifications

New service `@ddwmd/notify` on **:3005**, database `district_notify`.

- Internal ingest `POST /internal/notifications`
- User list `GET /notifications` filtered by district (and department when assigned)
- Read receipts per user; unread badge in the shell
