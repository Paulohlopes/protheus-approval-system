/*
  Warnings:

  - Added the required column `countryId` to the `registration_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "form_templates" ADD COLUMN     "countryId" TEXT;

-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "countryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "registration_workflows" ADD COLUMN     "countryId" TEXT;

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "tableSuffix" TEXT NOT NULL DEFAULT '010',
    "dbHost" TEXT NOT NULL,
    "dbPort" INTEGER NOT NULL DEFAULT 1433,
    "dbDatabase" TEXT NOT NULL,
    "dbUsername" TEXT NOT NULL,
    "dbPassword" TEXT NOT NULL,
    "dbOptions" JSONB,
    "apiBaseUrl" TEXT,
    "apiUsername" TEXT,
    "apiPassword" TEXT,
    "apiTimeout" INTEGER NOT NULL DEFAULT 30000,
    "oauthUrl" TEXT,
    "lastConnectionTest" TIMESTAMP(3),
    "connectionStatus" TEXT,
    "connectionError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE INDEX "countries_code_idx" ON "countries"("code");

-- CreateIndex
CREATE INDEX "countries_isActive_idx" ON "countries"("isActive");

-- CreateIndex
CREATE INDEX "form_templates_countryId_idx" ON "form_templates"("countryId");

-- CreateIndex
CREATE INDEX "registration_requests_countryId_idx" ON "registration_requests"("countryId");

-- CreateIndex
CREATE INDEX "registration_workflows_countryId_idx" ON "registration_workflows"("countryId");

-- AddForeignKey
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_workflows" ADD CONSTRAINT "registration_workflows_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
