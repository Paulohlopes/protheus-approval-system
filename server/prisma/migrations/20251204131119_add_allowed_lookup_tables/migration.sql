-- CreateTable
CREATE TABLE "allowed_lookup_tables" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allowed_lookup_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allowed_lookup_tables_tableName_key" ON "allowed_lookup_tables"("tableName");
