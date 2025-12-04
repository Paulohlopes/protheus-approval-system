-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "lookupConfig" JSONB,
ADD COLUMN     "tableId" TEXT;

-- AlterTable
ALTER TABLE "form_templates" ADD COLUMN     "isMultiTable" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "tableName" DROP NOT NULL;

-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "tableData" JSONB;

-- CreateTable
CREATE TABLE "template_tables" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tableOrder" INTEGER NOT NULL,
    "relationType" TEXT,
    "parentTableId" TEXT,
    "foreignKeyConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_tables_templateId_idx" ON "template_tables"("templateId");

-- CreateIndex
CREATE INDEX "template_tables_templateId_tableOrder_idx" ON "template_tables"("templateId", "tableOrder");

-- CreateIndex
CREATE UNIQUE INDEX "template_tables_templateId_tableName_key" ON "template_tables"("templateId", "tableName");

-- CreateIndex
CREATE UNIQUE INDEX "template_tables_templateId_alias_key" ON "template_tables"("templateId", "alias");

-- CreateIndex
CREATE INDEX "form_fields_tableId_idx" ON "form_fields"("tableId");

-- AddForeignKey
ALTER TABLE "template_tables" ADD CONSTRAINT "template_tables_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_tables" ADD CONSTRAINT "template_tables_parentTableId_fkey" FOREIGN KEY ("parentTableId") REFERENCES "template_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "template_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
