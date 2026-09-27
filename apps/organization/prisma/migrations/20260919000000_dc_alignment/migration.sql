-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('BLOCK', 'CIRCLE', 'GRAM_PANCHAYAT', 'VILLAGE');

-- AlterTable
ALTER TABLE "districts" ADD COLUMN "population" INTEGER;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN "hod_name" VARCHAR(200);
ALTER TABLE "departments" ADD COLUMN "hod_contact" VARCHAR(80);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "parent_id" UUID,
    "type" "LocationType" NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "population" INTEGER,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "locations_district_id_type_code_key" ON "locations"("district_id", "type", "code");

-- CreateIndex
CREATE INDEX "locations_district_id_type_idx" ON "locations"("district_id", "type");

-- CreateIndex
CREATE INDEX "locations_parent_id_idx" ON "locations"("parent_id");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
