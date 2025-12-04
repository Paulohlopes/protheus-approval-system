-- AlterTable
ALTER TABLE "form_fields" ADD COLUMN     "fieldName" TEXT,
ADD COLUMN     "helpText" TEXT,
ADD COLUMN     "isCustomField" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSyncField" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "placeholder" TEXT,
ALTER COLUMN "sx3FieldName" DROP NOT NULL;
