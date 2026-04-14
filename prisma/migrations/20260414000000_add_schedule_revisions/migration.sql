-- CreateTable
CREATE TABLE "ScheduleRevision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" JSONB NOT NULL,
    "summary" JSONB,

    CONSTRAINT "ScheduleRevision_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add revisionId to ScheduleVersion (nullable FK to ScheduleRevision)
ALTER TABLE "ScheduleVersion" ADD COLUMN "revisionId" TEXT;

-- CreateIndex
CREATE INDEX "ScheduleRevision_projectId_createdAt_idx" ON "ScheduleRevision"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "ScheduleVersion" ADD CONSTRAINT "ScheduleVersion_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "ScheduleRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRevision" ADD CONSTRAINT "ScheduleRevision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRevision" ADD CONSTRAINT "ScheduleRevision_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
