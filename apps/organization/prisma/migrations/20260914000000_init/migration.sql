-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AgencyType" AS ENUM ('IMPLEMENTING', 'EXECUTING', 'BOTH');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');

-- CreateTable
CREATE TABLE "districts" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "state_code" VARCHAR(16) NOT NULL,
    "state_name" VARCHAR(120) NOT NULL,
    "headquarters" VARCHAR(200),
    "keycloak_realm" VARCHAR(64),
    "keycloak_issuer" VARCHAR(300),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "short_name" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "department_id" UUID,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "agency_type" "AgencyType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID,
    "updated_by_id" UUID,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_categories" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_data_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data_items" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "district_id" UUID,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_data_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "district_id" UUID,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "value_type" "SettingValueType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "districts_keycloak_realm_key" ON "districts"("keycloak_realm");

-- CreateIndex
CREATE UNIQUE INDEX "districts_keycloak_issuer_key" ON "districts"("keycloak_issuer");

-- CreateIndex
CREATE INDEX "departments_district_id_idx" ON "departments"("district_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_district_id_code_key" ON "departments"("district_id", "code");

-- CreateIndex
CREATE INDEX "agencies_district_id_idx" ON "agencies"("district_id");

-- CreateIndex
CREATE INDEX "agencies_department_id_idx" ON "agencies"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_district_id_code_key" ON "agencies"("district_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_categories_code_key" ON "master_data_categories"("code");

-- CreateIndex
CREATE INDEX "master_data_items_category_id_is_active_idx" ON "master_data_items"("category_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_items_category_id_district_id_code_key" ON "master_data_items"("category_id", "district_id", "code");

-- CreateIndex
CREATE INDEX "system_settings_key_idx" ON "system_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_district_id_key_key" ON "system_settings"("district_id", "key");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_data_items" ADD CONSTRAINT "master_data_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "master_data_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_data_items" ADD CONSTRAINT "master_data_items_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

