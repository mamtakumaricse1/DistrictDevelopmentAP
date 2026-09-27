# Module map

| UI | Gateway route | Service |
| --- | --- | --- |
| `/login` | `/auth/login-options`, OIDC | Identity + Organization |
| `/dashboard` | `/dashboard/overview`, `/dashboard/delayed`, `/governance/summary` | Works + Governance |
| `/departments/:id` | `/dashboard/departments/:id` | Works |
| `/schemes`, `/schemes/:id` | `/schemes` | Works |
| `/blocks`, `/blocks/:id` | `/locations`, `/dashboard/blocks/:id` | Organization + Works |
| `/infrastructure` | `/dashboard/infrastructure` | Works |
| `/human-development` | `/dashboard/human-development` | Works |
| `/exceptions` | `/actions`, `/dashboard/delayed` | Governance + Works |
| `/projects` | `/projects`, `/documents` | Works |
| `/meetings` | `/meetings` | Governance |
| `/actions` | `/actions` | Governance |
| `/reports` | `/reports/*.csv`, `/imports/templates/department.csv` | Works + Governance |
| Notifications bell | `/notifications` | Notify |
| `/administration` | `/districts`, `/departments`, `/agencies`, `/users`, `/roles`, `/master-data`, `/settings` | Organization + Identity |
