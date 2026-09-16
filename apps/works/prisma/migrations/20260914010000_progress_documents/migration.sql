-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'STALLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "project_progress" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "period_ym" VARCHAR(7) NOT NULL,
    "physical_percent" DECIMAL(5,2) NOT NULL,
    "financial_amount" DECIMAL(14,2),
    "status" "ProgressStatus" NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" UUID NOT NULL,

    CONSTRAINT "project_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_documents" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "progress_id" UUID,
    "original_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by_id" UUID NOT NULL,

    CONSTRAINT "project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_progress_project_id_version_key" ON "project_progress"("project_id", "version");

-- CreateIndex
CREATE INDEX "project_progress_project_id_period_ym_idx" ON "project_progress"("project_id", "period_ym");

-- CreateIndex
CREATE INDEX "project_documents_project_id_idx" ON "project_documents"("project_id");

-- AddForeignKey
ALTER TABLE "project_progress" ADD CONSTRAINT "project_progress_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_documents" ADD CONSTRAINT "project_documents_progress_id_fkey" FOREIGN KEY ("progress_id") REFERENCES "project_progress"("id") ON DELETE SET NULL ON UPDATE CASCADE;
