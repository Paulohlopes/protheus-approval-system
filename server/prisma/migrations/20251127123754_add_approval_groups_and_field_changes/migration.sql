-- AlterTable
ALTER TABLE "workflow_levels" ADD COLUMN     "approverGroupIds" TEXT[],
ADD COLUMN     "editableFields" TEXT[];

-- CreateTable
CREATE TABLE "approval_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedById" TEXT,

    CONSTRAINT "approval_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_change_history" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "changedById" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalLevel" INTEGER NOT NULL,

    CONSTRAINT "field_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "approval_groups_name_key" ON "approval_groups"("name");

-- CreateIndex
CREATE INDEX "approval_group_members_groupId_idx" ON "approval_group_members"("groupId");

-- CreateIndex
CREATE INDEX "approval_group_members_userId_idx" ON "approval_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_group_members_groupId_userId_key" ON "approval_group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "field_change_history_requestId_idx" ON "field_change_history"("requestId");

-- CreateIndex
CREATE INDEX "field_change_history_changedById_idx" ON "field_change_history"("changedById");

-- CreateIndex
CREATE INDEX "field_change_history_fieldName_idx" ON "field_change_history"("fieldName");

-- AddForeignKey
ALTER TABLE "approval_group_members" ADD CONSTRAINT "approval_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "approval_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_group_members" ADD CONSTRAINT "approval_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_change_history" ADD CONSTRAINT "field_change_history_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "registration_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_change_history" ADD CONSTRAINT "field_change_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
