# Module map

| UI | Gateway route | Service |
| --- | --- | --- |
| `/login` | `/auth/login-options`, OIDC | Identity + Organization |
| `/dashboard` | `/dashboard/*`, `/governance/summary` | Works + Governance |
| `/projects` | `/projects`, `/documents` | Works |
| `/meetings` | `/meetings` | Governance |
| `/actions` | `/actions` | Governance |
| `/reports` | `/reports/projects.csv`, `/reports/actions.csv` | Works + Governance |
| Notifications bell | `/notifications` | Notify |
| `/administration` | `/districts`, `/departments`, `/agencies`, `/users`, `/roles`, `/master-data`, `/settings` | Organization + Identity |
