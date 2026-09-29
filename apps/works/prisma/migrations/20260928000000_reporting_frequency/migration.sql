-- Reporting cadence for schemes and projects. Existing rows stay monthly.
ALTER TABLE "schemes" ADD COLUMN "reporting_frequency" "KpiFrequency" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "projects" ADD COLUMN "reporting_frequency" "KpiFrequency" NOT NULL DEFAULT 'MONTHLY';
