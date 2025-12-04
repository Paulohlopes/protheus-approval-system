-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "operationType" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "originalFormData" JSONB,
ADD COLUMN     "originalRecno" TEXT;
