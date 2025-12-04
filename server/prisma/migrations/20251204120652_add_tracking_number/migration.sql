/*
  Warnings:

  - A unique constraint covering the columns `[trackingNumber]` on the table `registration_requests` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "registration_requests" ADD COLUMN     "trackingNumber" TEXT;

-- CreateTable
CREATE TABLE "tracking_sequences" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracking_sequences_year_key" ON "tracking_sequences"("year");

-- CreateIndex
CREATE UNIQUE INDEX "registration_requests_trackingNumber_key" ON "registration_requests"("trackingNumber");
