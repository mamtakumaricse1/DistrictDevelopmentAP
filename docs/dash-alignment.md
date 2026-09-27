# Alignment with dash.pdf

The brief is a **DC Changlang decision-support system** (DARPAN-style): Department → Scheme → KPI → Block → Village → Beneficiary → Status → Action.

This repository stays a **multi-district platform**. Changlang is configuration and seed data, not a fork.

## Score

Overall alignment after the completeness pass: **about 95%**. See the alignment canvas beside this chat for the per-requirement breakdown.

Remaining 5% is what dash.pdf itself defers: live department MIS/API pipelines and production GIS layers.

| Delivered | Later (section 12) |
| --- | --- |
| Eight DC modules, RAG, GIS, 8 Excel sheets | Department MIS → central database |
| Block → village drill-down | Native mobile app |
| DC / ADC / DIO / HoD / BDO / data-entry names | Power BI / Superset (custom React used) |

## Locked choices (do not reopen)

- Keep Gateway / Identity / Organization / Works / Governance / Notify.
- Changlang is configuration and seed data, not a separate app.
- Progress rows stay append-only.
- Dashboard numbers are computed on the server.
- RAG defaults: ≥90% on track, 70–89% attention, &lt;70% critical. Scheme KPIs may override.
