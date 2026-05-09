-- DropForeignKey
ALTER TABLE "ScheduleVersion" DROP CONSTRAINT IF EXISTS "ScheduleVersion_projectId_fkey";
ALTER TABLE "ScheduleVersion" DROP CONSTRAINT IF EXISTS "ScheduleVersion_createdById_fkey";
ALTER TABLE "ScheduleVersion" DROP CONSTRAINT IF EXISTS "ScheduleVersion_revisionId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleRevision" DROP CONSTRAINT IF EXISTS "ScheduleRevision_projectId_fkey";
ALTER TABLE "ScheduleRevision" DROP CONSTRAINT IF EXISTS "ScheduleRevision_createdById_fkey";

-- DropTable
DROP TABLE IF EXISTS "ScheduleVersion";

-- DropTable
DROP TABLE IF EXISTS "ScheduleRevision";
