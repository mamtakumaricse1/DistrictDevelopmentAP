# Security

- **Keycloak only.** Never store passwords in PostgreSQL.
- **One realm per district** plus `system` for `SUPER_ADMIN`. Validate JWT `iss` against registered issuers.
- **Authorize in the service that owns the data.** Scope every query from `AuthContext`. Never authorize only in React.
- **Gateway is not a PEP.** It proxies and reports health. Forged paths still fail in Identity/Organization.
- **Internal HTTP** uses `INTERNAL_API_KEY`. Do not expose `/internal/*` on the public hostname (Nginx should only reach the gateway).
- **Helmet + CORS** on each Nest process. `WEB_ORIGIN` is an allow-list.
- **No secrets in git.** Copy `.env.example` locally. Rotate `INTERNAL_API_KEY` outside development.

See [authentication.md](authentication.md) and [authorization.md](authorization.md).
