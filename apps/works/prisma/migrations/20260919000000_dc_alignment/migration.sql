-- CreateEnum
CREATE TYPE "SchemeFunding" AS ENUM ('CENTRAL', 'STATE', 'DISTRICT', 'CSS');

-- CreateEnum
CREATE TYPE "SchemeDomain" AS ENUM ('INFRASTRUCTURE', 'WATER', 'HOUSING', 'HEALTH', 'EDUCATION', 'SOCIAL_WELFARE', 'EMPLOYMENT', 'AGRICULTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "KpiFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('ROAD', 'BRIDGE', 'CULVERT', 'WATER', 'BUILDING', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('NH', 'PWD', 'RWD', 'PMGSY', 'OTHER');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "scheme_id" UUID;
ALTER TABLE "projects" ADD COLUMN "released_amount" DECIMAL(14,2);
ALTER TABLE "projects" ADD COLUMN "category" "ProjectCategory";
ALTER TABLE "projects" ADD COLUMN "work_type" "WorkType";
ALTER TABLE "projects" ADD COLUMN "contractor" VARCHAR(200);
ALTER TABLE "projects" ADD COLUMN "expected_completion" DATE;
ALTER TABLE "projects" ADD COLUMN "location_id" UUID;

-- CreateTable
CREATE TABLE "schemes" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "funding" "SchemeFunding" NOT NULL DEFAULT 'CENTRAL',
    "domain" "SchemeDomain" NOT NULL DEFAULT 'OTHER',
    "officer_name" VARCHAR(200),
    "remarks" TEXT,
    "target_value" DECIMAL(14,2),
    "target_unit" VARCHAR(40),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_kpis" (
    "id" UUID NOT NULL,
    "scheme_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "unit" VARCHAR(40) NOT NULL,
    "target" DECIMAL(14,2) NOT NULL,
    "frequency" "KpiFrequency" NOT NULL DEFAULT 'MONTHLY',
    "green_threshold" DECIMAL(5,2) NOT NULL DEFAULT 90,
    "amber_threshold" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheme_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheme_progress" (
    "id" UUID NOT NULL,
    "kpi_id" UUID NOT NULL,
    "period_ym" VARCHAR(7) NOT NULL,
    "target" DECIMAL(14,2) NOT NULL,
    "achievement" DECIMAL(14,2) NOT NULL,
    "physical_percent" DECIMAL(5,2) NOT NULL,
    "financial_percent" DECIMAL(5,2),
    "fund_allocated" DECIMAL(14,2),
    "fund_released" DECIMAL(14,2),
    "expenditure" DECIMAL(14,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "scheme_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" UUID NOT NULL,
    "scheme_id" UUID NOT NULL,
    "location_id" UUID,
    "period_ym" VARCHAR(7) NOT NULL,
    "target" DECIMAL(14,2) NOT NULL,
    "beneficiaries" DECIMAL(14,2) NOT NULL,
    "male" DECIMAL(14,2),
    "female" DECIMAL(14,2),
    "others" DECIMAL(14,2),

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schemes_district_id_code_key" ON "schemes"("district_id", "code");

-- CreateIndex
CREATE INDEX "schemes_district_id_department_id_idx" ON "schemes"("district_id", "department_id");

-- CreateIndex
CREATE INDEX "schemes_domain_idx" ON "schemes"("domain");

-- CreateIndex
CREATE INDEX "scheme_kpis_scheme_id_idx" ON "scheme_kpis"("scheme_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheme_progress_kpi_id_period_ym_key" ON "scheme_progress"("kpi_id", "period_ym");

-- CreateIndex
CREATE INDEX "scheme_progress_period_ym_idx" ON "scheme_progress"("period_ym");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_scheme_id_location_id_period_ym_key" ON "beneficiaries"("scheme_id", "location_id", "period_ym");

-- CreateIndex
CREATE INDEX "beneficiaries_scheme_id_period_ym_idx" ON "beneficiaries"("scheme_id", "period_ym");

-- CreateIndex
CREATE INDEX "projects_scheme_id_idx" ON "projects"("scheme_id");

-- CreateIndex
CREATE INDEX "projects_location_id_idx" ON "projects"("location_id");

-- AddForeignKey
ALTER TABLE "scheme_kpis" ADD CONSTRAINT "scheme_kpis_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_progress" ADD CONSTRAINT "scheme_progress_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "scheme_kpis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
