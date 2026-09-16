CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "district_id" UUID NOT NULL,
    "department_id" UUID,
    "title" VARCHAR(300) NOT NULL,
    "body" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "entity_type" VARCHAR(64),
    "entity_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_reads" (
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_reads_pkey" PRIMARY KEY ("notification_id","user_id")
);

CREATE INDEX "notifications_district_id_created_at_idx" ON "notifications"("district_id", "created_at");

ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
