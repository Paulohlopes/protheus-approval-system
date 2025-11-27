-- Migration: Add custom fields support
-- This migration adds support for custom fields in form templates

-- Step 1: Add new columns with default values
ALTER TABLE "form_fields" ADD COLUMN "isCustomField" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "form_fields" ADD COLUMN "isSyncField" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "form_fields" ADD COLUMN "placeholder" TEXT;
ALTER TABLE "form_fields" ADD COLUMN "helpText" TEXT;

-- Step 2: Add fieldName column as nullable first
ALTER TABLE "form_fields" ADD COLUMN "fieldName" TEXT;

-- Step 3: Populate fieldName from sx3FieldName for existing records
UPDATE "form_fields" SET "fieldName" = "sx3FieldName" WHERE "fieldName" IS NULL AND "sx3FieldName" IS NOT NULL;

-- Step 4: For any remaining null fieldNames, generate a unique value
UPDATE "form_fields" SET "fieldName" = 'field_' || id WHERE "fieldName" IS NULL;

-- Step 5: Make fieldName required after populating
ALTER TABLE "form_fields" ALTER COLUMN "fieldName" SET NOT NULL;

-- Step 6: Make sx3FieldName optional (nullable)
ALTER TABLE "form_fields" ALTER COLUMN "sx3FieldName" DROP NOT NULL;

-- Step 7: Create index on fieldName
CREATE INDEX "form_fields_fieldName_idx" ON "form_fields"("fieldName");
