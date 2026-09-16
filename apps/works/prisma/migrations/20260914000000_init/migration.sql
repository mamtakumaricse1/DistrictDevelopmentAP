-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CLOSED');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "district_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "implementing_agency_id" UUID,
    "executing_agency_id" UUID,
    "financial_year" INTEGER NOT NULL,
    "sanctioned_amount" DECIMAL(14,2),
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE,
    "end_date" DATE,
    "location_text" VARCHAR(300),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_sequences" (
    "district_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL,

    CONSTRAINT "project_sequences_pkey" PRIMARY KEY ("district_id","department_id","year")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_district_id_department_id_idx" ON "projects"("district_id", "department_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");
