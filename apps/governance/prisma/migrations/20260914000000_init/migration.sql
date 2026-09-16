-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "review_meetings" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "venue" VARCHAR(200),
    "notes" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "review_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_items" (
    "id" UUID NOT NULL,
    "meeting_id" UUID,
    "district_id" UUID NOT NULL,
    "department_id" UUID,
    "project_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT,
    "assignee_user_id" UUID,
    "due_date" DATE,
    "status" "ActionStatus" NOT NULL DEFAULT 'OPEN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,

    CONSTRAINT "action_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_meetings_district_id_scheduled_at_idx" ON "review_meetings"("district_id", "scheduled_at");
CREATE INDEX "action_items_district_id_status_idx" ON "action_items"("district_id", "status");
CREATE INDEX "action_items_department_id_idx" ON "action_items"("department_id");

ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "review_meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
