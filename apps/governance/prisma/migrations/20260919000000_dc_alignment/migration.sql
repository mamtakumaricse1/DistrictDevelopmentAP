-- CreateEnum
CREATE TYPE "ActionSeverity" AS ENUM ('IMMEDIATE', 'ATTENTION', 'ROUTINE');

-- AlterTable
ALTER TABLE "review_meetings" ADD COLUMN "next_review_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "action_items" ADD COLUMN "dc_direction" TEXT;
ALTER TABLE "action_items" ADD COLUMN "officer_name" VARCHAR(200);
ALTER TABLE "action_items" ADD COLUMN "location_text" VARCHAR(300);
ALTER TABLE "action_items" ADD COLUMN "severity" "ActionSeverity" NOT NULL DEFAULT 'ROUTINE';
ALTER TABLE "action_items" ADD COLUMN "next_review_at" DATE;

-- CreateIndex
CREATE INDEX "action_items_district_id_severity_idx" ON "action_items"("district_id", "severity");
