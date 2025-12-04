-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "attachmentConfig" JSONB,
ADD COLUMN     "dataSourceConfig" JSONB,
ADD COLUMN     "dataSourceType" TEXT;

-- CreateTable
CREATE TABLE "field_attachments" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "field_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_attachments_registrationId_fieldName_idx" ON "field_attachments"("registrationId", "fieldName");

-- CreateIndex
CREATE INDEX "field_attachments_uploadedById_idx" ON "field_attachments"("uploadedById");
